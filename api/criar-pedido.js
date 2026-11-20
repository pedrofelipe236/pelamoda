function normalizarTexto(texto = "") {

    return String(texto)

        .normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .trim()

        .toLowerCase();

}





const bairrosGratis = {
    "paulista": [
        "janga",
        "pau amarelo"
    ],

    "olinda": [
        "rio doce",
        "casa caiada",
        "jardim atlantico",
        "bairro novo"
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

async function buscarCoordenadasMotoboy(endereco, apiKey) {

    const url = new URL("https://api.heigit.org/pelias/v1/search");

    url.searchParams.set("text", endereco);
    url.searchParams.set("size", "1");
    url.searchParams.set("boundary.country", "BR");

    const resposta = await fetch(url, {
        headers: {
            Authorization: apiKey,
            Accept: "application/json"
        }
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        console.error("Erro ao localizar endereço do motoboy:", dados);
        throw new Error("Não foi possível localizar o endereço para calcular o motoboy.");
    }

    const coordenadas = dados.features?.[0]?.geometry?.coordinates;

    if (
        !Array.isArray(coordenadas) ||
        coordenadas.length !== 2 ||
        !coordenadas.every(Number.isFinite)
    ) {
        throw new Error(`Não encontramos o endereço: ${endereco}`);
    }

    return coordenadas;
}


async function calcularFreteMotoboyBackend(dadosEndereco) {

    const apiKey = process.env.OPENROUTESERVICE_API_KEY;

    if (!apiKey) {
        throw new Error("Chave de cálculo de rota não configurada.");
    }

    const {
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep
    } = dadosEndereco;

    const cepLimpo = String(cep || "").replace(/\D/g, "");

    if (
        !String(endereco || "").trim() ||
        !String(numero || "").trim() ||
        !String(bairro || "").trim() ||
        !String(cidade || "").trim() ||
        !String(estado || "").trim() ||
        cepLimpo.length !== 8
    ) {
        throw new Error("Informe o endereço completo do cliente.");
    }

    const origemTexto =
        "Rua Dom Vital, 106, Santo Amaro, Recife, Pernambuco, Brasil";

    const destinoTexto = [
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cepLimpo,
        "Brasil"
    ].filter(Boolean).join(", ");

    const [origem, destino] = await Promise.all([
        buscarCoordenadasMotoboy(origemTexto, apiKey),
        buscarCoordenadasMotoboy(destinoTexto, apiKey)
    ]);

    const respostaRota = await fetch(
        "https://api.heigit.org/openrouteservice/v2/directions/driving-car",
        {
            method: "POST",
            headers: {
                Authorization: apiKey,
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                coordinates: [origem, destino],
                instructions: false
            })
        }
    );

    const dadosRota = await respostaRota.json().catch(() => ({}));

    if (!respostaRota.ok) {
        console.error("Erro ao calcular rota do motoboy:", dadosRota);
        throw new Error("Não foi possível calcular a rota do motoboy.");
    }

    const distanciaMetros = dadosRota.routes?.[0]?.summary?.distance;

    if (!Number.isFinite(distanciaMetros) || distanciaMetros <= 0) {
        throw new Error("Não foi possível obter a distância da rota do motoboy.");
    }

    // R$ 1,50 por km, somente ida. O valor é armazenado em centavos.
    const valorFreteCentavos = Math.round(distanciaMetros * 0.15);

    return {
        distancia_km: Number((distanciaMetros / 1000).toFixed(2)),
        valor_frete_centavos: valorFreteCentavos
    };
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

           `${process.env.SUPABASE_URL}/rest/v1/produtos?select=id,nome,preco,preco_promocional,categoria,ativo`,

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



        const inicioBlackNovember = Date.parse("2026-11-01T00:00:00-03:00");
        const fimBlackNovember = Date.parse("2026-11-27T23:59:59-03:00");
        const campanhaBlackNovemberAtiva =
            Date.now() >= inicioBlackNovember && Date.now() <= fimBlackNovember;

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



const precoBase =
    precoPromocional &&
    precoPromocional > 0 &&
    precoPromocional < precoNormal
        ? precoPromocional
        : precoNormal;

const categoriaProduto = String(produtoBanco.categoria || "tshirt")
    .trim()
    .toLowerCase();

const precoReal =
    campanhaBlackNovemberAtiva && categoriaProduto === "cropped"
        ? Math.min(precoBase, 3990)
        : precoBase;


                const quantidade =

                    Number(item.quantidade);





                valorProdutosCalculado +=

                    precoReal * quantidade;





                return {

                    ...item,

                    nome: produtoBanco.nome,
                    preco: precoReal,
                    categoria: categoriaProduto

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





        /* MOTOBOY PARCEIRO - RECÁLCULO E VALIDAÇÃO NO SERVIDOR */

        else if (
            tipoEntregaNormalizado === "motouber"
        ) {

            let freteMotoboy;

            try {
                freteMotoboy = await calcularFreteMotoboyBackend({
                    endereco,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    cep
                });
            } catch (erroFreteMotoboy) {
                console.error("Falha ao validar frete do motoboy:", erroFreteMotoboy);

                return res.status(502).json({
                    erro: "Não foi possível calcular o frete do motoboy agora. Confira o endereço e tente novamente."
                });
            }

            const freteEnviado = Number(valor_frete);

            if (
                !Number.isSafeInteger(freteEnviado) ||
                freteEnviado !== freteMotoboy.valor_frete_centavos
            ) {
                return res.status(409).json({
                    erro: "O valor do motoboy foi atualizado. Recalcule o frete antes de finalizar o pedido.",
                    distancia_km: freteMotoboy.distancia_km,
                    valor_frete_centavos: freteMotoboy.valor_frete_centavos
                });
            }

            valorFreteCalculado = freteMotoboy.valor_frete_centavos;

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



        // Black November: 2 T-shirts por R$ 99,90 | 3 por R$ 144,90 | 4 por R$ 189,90.
        // Croppeds custam R$ 39,90 cada durante a campanha.
        const unidadesTshirts = [];

        if (campanhaBlackNovemberAtiva) itensSeguros.forEach(item => {
            if (item.categoria === "cropped") return;

            const quantidade = Number(item.quantidade);
            const precoCentavos = Number(item.preco);

            for (let i = 0; i < quantidade; i++) {
                unidadesTshirts.push(precoCentavos);
            }
        });

        const precosPacoteBlackNovember = {
            2: 9990,
            3: 14490,
            4: 18990
        };

        let descontoBlackNovemberCalculado = 0;

        for (let i = 0; i < unidadesTshirts.length; i += 4) {
            const pacote = unidadesTshirts.slice(i, i + 4);
            const precoPacote = precosPacoteBlackNovember[pacote.length];
            if (!precoPacote) continue;

            const subtotalPacote = pacote.reduce((total, preco) => total + preco, 0);
            descontoBlackNovemberCalculado += Math.max(0, subtotalPacote - precoPacote);
        }

        const temCroppedBlackNovember = campanhaBlackNovemberAtiva &&
            itensSeguros.some(item =>
                String(item.categoria || "").trim().toLowerCase() === "cropped" &&
                Number(item.quantidade) > 0
            );
        const temOfertaBlackNovember =
            descontoBlackNovemberCalculado > 0 || temCroppedBlackNovember;

        let valorDescontoCalculado = descontoBlackNovemberCalculado;
        let cupomAplicado = temOfertaBlackNovember
            ? "BLACKNOVEMBER"
            : null;

        if (cupom && cupom.trim()) {

            if (temOfertaBlackNovember) {
                return res.status(400).json({
                    erro: "A oferta Black November não acumula com outros cupons."
                });
            }



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
