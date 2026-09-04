function normalizarTexto(texto = "") {
    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}


const bairrosGratis = {

    paulista: [
        "janga",
        "pau amarelo"
    ],

    olinda: [
        "rio doce",
        "casa caiada",
        "jardim atlantico",
        "bairro novo"
    ],

    recife: [
        "espinheiro",
        "gracas",
        "boa vista",
        "santo amaro"
    ]

};


function temEntregaGratis(cidade, bairro) {

    const cidadeNormalizada =
        normalizarTexto(cidade);

    const bairroNormalizado =
        normalizarTexto(bairro);

    return (
        bairrosGratis[cidadeNormalizada] &&
        bairrosGratis[cidadeNormalizada]
            .includes(bairroNormalizado)
    );
}


async function calcularFretesReais(cepDestino) {

    const resposta = await fetch(
        "https://api.superfrete.com/api/v0/calculator",
        {
            method: "POST",
            headers: {
                "Authorization":
                    `Bearer ${process.env.SUPERFRETE_TOKEN}`,

                "User-Agent":
                    "Pelamoda (contato@pelamoda.com.br)",

                "accept":
                    "application/json",

                "content-type":
                    "application/json"
            },

            body: JSON.stringify({

                from: {
                    postal_code: "53437320"
                },

                to: {
                    postal_code:
                        String(cepDestino)
                            .replace(/\D/g, "")
                },

                services: "1,2,17",

                options: {
                    own_hand: false,
                    receipt: false,
                    insurance_value: 0,
                    use_insurance_value: false
                },

                package: {
                    height: 15,
                    width: 17,
                    length: 20,
                    weight: 0.2
                }

            })
        }
    );


    const dados =
        await resposta.json();


    if (!resposta.ok) {

        console.error(
            "Erro SuperFrete:",
            dados
        );

        throw new Error(
            "Não foi possível validar o frete"
        );
    }


    return dados
        .filter(frete =>
            !frete.has_error &&
            frete.price
        )
        .map(frete =>
            Math.round(
                Number(
                    String(frete.price)
                        .replace(",", ".")
                ) * 100
            )
        );
}
export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {
        let usuarioId = null;

        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith("Bearer ")) {

            const accessToken =
                authHeader.substring(7);

            const respostaUsuario = await fetch(
                `${process.env.SUPABASE_URL}/auth/v1/user`,
                {
                    method: "GET",
                    headers: {
                        apikey:
                            process.env.SUPABASE_SECRET_KEY,

                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

            if (!respostaUsuario.ok) {

                return res.status(401).json({
                    erro: "Sessão do usuário inválida"
                });
            }

            const usuario =
                await respostaUsuario.json();

            usuarioId =
                usuario.id || null;
        }
        const {
            order_nsu,
            nome_cliente,
            telefone,
            email,
            itens,
            tipo_entrega,
            cep,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            valor_frete,
            valor_total,
            cupom

        } = req.body;


        // ======================================================
        // VALIDA DADOS BÁSICOS
        // ======================================================

        if (
            !order_nsu ||
            !Array.isArray(itens) ||
            itens.length === 0 ||
            !valor_total
        ) {
            return res.status(400).json({
                erro: "Dados do pedido incompletos"
            });
        }


        // ======================================================
        // CONSULTA ESTOQUE REAL NO SUPABASE
        // ======================================================

        const respostaEstoque = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/estoque?select=produto_id,cor,tamanho,quantidade`,
            {
                headers: {
                    apikey: process.env.SUPABASE_SECRET_KEY
                }
            }
        );

        const estoqueAtual =
            await respostaEstoque.json();

        if (!respostaEstoque.ok) {

            console.error(
                "Erro ao consultar estoque:",
                estoqueAtual
            );

            return res.status(500).json({
                erro: "Não foi possível verificar o estoque"
            });
        }


        // ======================================================
        // CONSULTA PRODUTOS E PREÇOS REAIS NO SUPABASE
        // ======================================================

        const respostaProdutos = await fetch(
           `${process.env.SUPABASE_URL}/rest/v1/produtos?select=id,nome,preco,preco_promocional,ativo`,
            {
                headers: {
                    apikey: process.env.SUPABASE_SECRET_KEY
                }
            }
        );

        const produtosBanco =
            await respostaProdutos.json();

        if (!respostaProdutos.ok) {

            console.error(
                "Erro ao consultar produtos:",
                produtosBanco
            );

            return res.status(500).json({
                erro: "Não foi possível verificar os produtos"
            });
        }


        // ======================================================
        // CONFERE CADA ITEM DO CARRINHO
        // ======================================================

        for (const item of itens) {

            const quantidadeDesejada =
                Number(item.quantidade);

            if (
                !item.produto_id ||
                !item.cor ||
                !item.tamanho ||
                !Number.isInteger(quantidadeDesejada) ||
                quantidadeDesejada <= 0
            ) {
                return res.status(400).json({
                    erro: "Existe um item inválido no pedido"
                });
            }


            const produtoBanco =
                produtosBanco.find(
                    produto =>
                        produto.id === item.produto_id &&
                        produto.ativo === true
                );


            if (!produtoBanco) {
                return res.status(400).json({
                    erro:
                        `Produto inválido ou inativo: ` +
                        `${item.produto_id}`
                });
            }


            const itemEstoque =
                estoqueAtual.find(
                    estoque =>
                        estoque.produto_id === item.produto_id &&
                        estoque.cor === item.cor &&
                        estoque.tamanho === item.tamanho
                );


            if (!itemEstoque) {

                return res.status(409).json({
                    erro:
                        `${produtoBanco.nome} - ` +
                        `${item.cor} - ${item.tamanho} ` +
                        `não está disponível.`
                });
            }


            if (
                Number(itemEstoque.quantidade) <
                quantidadeDesejada
            ) {

                return res.status(409).json({
                    erro:
                        `Estoque insuficiente para ` +
                        `${produtoBanco.nome} - ` +
                        `${item.cor} - ${item.tamanho}. ` +
                        `Disponível: ${itemEstoque.quantidade}.`
                });
            }
        }


        // ======================================================
        // CALCULA VALORES REAIS NO BACKEND
        // ======================================================

        let valorProdutosCalculado = 0;

        const itensSeguros =
            itens.map(item => {

                const produtoBanco =
                    produtosBanco.find(
                        produto =>
                            produto.id === item.produto_id &&
                            produto.ativo === true
                    );

                if (!produtoBanco) {
                    throw new Error(
                        `Produto inválido ou inativo: ${item.produto_id}`
                    );
                }


                const precoNormal =
    Number(produtoBanco.preco);

const precoPromocional =
    produtoBanco.preco_promocional !== null &&
    produtoBanco.preco_promocional !== undefined
        ? Number(produtoBanco.preco_promocional)
        : null;

const precoReal =
    precoPromocional &&
    precoPromocional > 0 &&
    precoPromocional < precoNormal
        ? precoPromocional
        : precoNormal;

                const quantidade =
                    Number(item.quantidade);


                valorProdutosCalculado +=
                    precoReal * quantidade;


                return {
                    ...item,
                    nome: produtoBanco.nome,
                    preco: precoReal
                };
            });


        // ======================================================
        // CALCULA TOTAL
        // ======================================================


        let valorFreteCalculado = 0;

        const tipoEntregaNormalizado =
            normalizarTexto(tipo_entrega);


        /* RETIRADA */

        if (
            tipoEntregaNormalizado === "retirada"
        ) {

            valorFreteCalculado = 0;

        }


        /* MOTO UBER */

        else if (
            tipoEntregaNormalizado === "motouber"
        ) {

            valorFreteCalculado = 0;

        }


        /* ENTREGA GRÁTIS */

        else if (
            temEntregaGratis(
                cidade,
                bairro
            )
        ) {

            valorFreteCalculado = 0;

        }


        /* SUPERFRETE */

        else {

            const cepLimpo =
                String(cep || "")
                    .replace(/\D/g, "");


            if (cepLimpo.length !== 8) {

                return res.status(400).json({
                    erro:
                        "CEP inválido para cálculo do frete"
                });

            }


            const fretesReais =
                await calcularFretesReais(
                    cepLimpo
                );


            if (fretesReais.length === 0) {

                return res.status(400).json({
                    erro:
                        "Nenhuma opção de frete disponível"
                });

            }


            const freteEnviado =
                Number(valor_frete || 0);


            const freteValido =
                fretesReais.includes(
                    freteEnviado
                );


            if (!freteValido) {

                console.warn(
                    "Tentativa de alterar frete:",
                    {
                        recebido: freteEnviado,
                        permitidos: fretesReais,
                        cep: cepLimpo
                    }
                );


                return res.status(400).json({
                    erro:
                        "Valor de frete inválido. Recalcule o frete."
                });

            }


            valorFreteCalculado =
                freteEnviado;

        }

        let valorDescontoCalculado = 0;
        let cupomAplicado = null;

        if (cupom && cupom.trim()) {

            const codigoCupom =
                cupom.trim().toUpperCase();

            const respostaCupom = await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/cupons?codigo=eq.${encodeURIComponent(codigoCupom)}&ativo=eq.true&select=*`,
                {
                    headers: {
                        apikey: process.env.SUPABASE_SECRET_KEY
                    }
                }
            );

            const cupons =
                await respostaCupom.json();

            if (
                !respostaCupom.ok ||
                !Array.isArray(cupons) ||
                cupons.length === 0
            ) {
                return res.status(400).json({
                    erro: "Cupom inválido ou inativo"
                });
            }

            const cupomEncontrado =
                cupons[0];
const telefoneLimpo =
    String(telefone || "")
        .replace(/\D/g, "");

const respostaUsoCupom = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/pedidos?telefone=eq.${encodeURIComponent(telefone)}&cupom=eq.${encodeURIComponent(codigoCupom)}&select=id&limit=1`,
    {
        headers: {
            apikey: process.env.SUPABASE_SECRET_KEY
        }
    }
);

const usosCupom =
    await respostaUsoCupom.json();

if (
    respostaUsoCupom.ok &&
    Array.isArray(usosCupom) &&
    usosCupom.length > 0
) {
    return res.status(400).json({
        erro: "Este cupom já foi utilizado por esta conta."
    });
}
            if (
                cupomEncontrado.valido_ate &&
                new Date(cupomEncontrado.valido_ate) <
                new Date()
            ) {
                return res.status(400).json({
                    erro: "Este cupom expirou"
                });
            }

            if (
                valorProdutosCalculado <
                Number(cupomEncontrado.valor_minimo || 0)
            ) {
                return res.status(400).json({
                    erro: "Valor mínimo do cupom não atingido"
                });
            }

            if (
                cupomEncontrado.tipo ===
                "percentual"
            ) {
                valorDescontoCalculado =
                    Math.round(
                        valorProdutosCalculado *
                        Number(cupomEncontrado.valor) /
                        100
                    );
            }

            if (
                cupomEncontrado.tipo ===
                "fixo"
            ) {
                valorDescontoCalculado =
                    Number(cupomEncontrado.valor);
            }

            valorDescontoCalculado =
                Math.min(
                    valorDescontoCalculado,
                    valorProdutosCalculado
                );

            cupomAplicado =
                codigoCupom;
        }
        const valorTotalCalculado =
            valorProdutosCalculado -
            valorDescontoCalculado +
            valorFreteCalculado;
        // ======================================================
        // CRIA O PEDIDO
        // ======================================================

        const resposta = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/pedidos`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    apikey: process.env.SUPABASE_SECRET_KEY,
                    Prefer: "return=representation"
                },

                body: JSON.stringify({
                    order_nsu,
                    nome_cliente,
                    telefone,
                    email,
                    usuario_id: usuarioId,
                    itens: itensSeguros,
                    tipo_entrega,
                    cep,
                    endereco,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    valor_produtos:
                        valorProdutosCalculado,
                    cupom: cupomAplicado,
                    valor_desconto:
                        valorDescontoCalculado,
                    valor_frete:
                        valorFreteCalculado,
                    valor_total:
                        valorTotalCalculado,
                    status:
                        "aguardando_pagamento"
                })
            }
        );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            console.error(
                "Erro Supabase:",
                dados
            );

            return res.status(
                resposta.status
            ).json({
                erro: "Erro ao criar pedido"
            });
        }


        const pedido =
            dados[0];


        return res.status(201).json({
            sucesso: true,
            id: pedido.id,
            numero_pedido:
                pedido.numero_pedido,
            order_nsu:
                pedido.order_nsu
        });


    } catch (erro) {

        console.error(
            "Erro ao criar pedido:",
            erro
        );

        return res.status(500).json({
            erro: "Erro interno ao criar pedido"
        });
    }
}
