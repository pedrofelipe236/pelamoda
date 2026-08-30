export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {
const precosProdutos = {
        pe: 6500,
        oxente: 6500,
        marminino: 6500,
        meupaispernambuco: 6500,
        arretado: 6500,
        mulearretada: 6500,
        nordeste: 6500
    };
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
            valor_produtos,
            valor_frete,
            valor_total
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
                    "apikey": process.env.SUPABASE_SECRET_KEY
                }
            }
        );

        const estoqueAtual = await respostaEstoque.json();

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


            const itemEstoque = estoqueAtual.find(
                estoque =>
                    estoque.produto_id === item.produto_id &&
                    estoque.cor === item.cor &&
                    estoque.tamanho === item.tamanho
            );


            if (!itemEstoque) {

                return res.status(409).json({
                    erro:
                        `${item.nome || "Produto"} - ` +
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
                        `${item.nome || "o produto"} - ` +
                        `${item.cor} - ${item.tamanho}. ` +
                        `Disponível: ${itemEstoque.quantidade}.`
                });
            }
        }
// ======================================================
// CALCULA VALORES REAIS NO BACKEND
// ======================================================

let valorProdutosCalculado = 0;

const itensSeguros = itens.map(item => {

    const precoReal =
        precosProdutos[item.produto_id];

    if (!precoReal) {
        throw new Error(
            `Preço não encontrado para ${item.produto_id}`
        );
    }

    const quantidade =
        Number(item.quantidade);

    valorProdutosCalculado +=
        precoReal * quantidade;

    return {
        ...item,
        preco: precoReal
    };
});

        // ======================================================
        // CRIA O PEDIDO
        // ======================================================

        const resposta = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/pedidos`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.SUPABASE_SECRET_KEY,
                    "Prefer": "return=representation"
                },

                body: JSON.stringify({
                    order_nsu,
                    nome_cliente,
                    telefone,
                    email,
                    itens: itensSeguros,
                    tipo_entrega,
                    cep,
                    endereco,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    valor_produtos: valorProdutosCalculado,
valor_frete: valor_frete || 0,
valor_total:
    valorProdutosCalculado +
    Number(valor_frete || 0),
                    status: "aguardando_pagamento"
                })
            }
        );


        const dados = await resposta.json();


        if (!resposta.ok) {

            console.error(
                "Erro Supabase:",
                dados
            );

            return res.status(resposta.status).json({
                erro: "Erro ao criar pedido"
            });
        }


        const pedido = dados[0];


        return res.status(201).json({
            sucesso: true,
            id: pedido.id,
            numero_pedido: pedido.numero_pedido,
            order_nsu: pedido.order_nsu
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