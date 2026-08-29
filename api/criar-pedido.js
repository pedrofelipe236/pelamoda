export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {
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

        if (!order_nsu || !itens || !valor_total) {
            return res.status(400).json({
                erro: "Dados do pedido incompletos"
            });
        }

        const resposta = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/pedidos`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.SUPABASE_SECRET_KEY,

                    // Faz o Supabase devolver o pedido criado
                    "Prefer": "return=representation"
                },

                body: JSON.stringify({
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
                    valor_frete: valor_frete || 0,
                    valor_total,
                    status: "aguardando_pagamento"
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error("Erro Supabase:", dados);

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

        console.error("Erro ao criar pedido:", erro);

        return res.status(500).json({
            erro: "Erro interno ao criar pedido"
        });
    }
}