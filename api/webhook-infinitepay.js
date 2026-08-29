export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Método não permitido"
        });
    }

    try {

        const pagamento = req.body;

        const {
            order_nsu,
            transaction_nsu,
            amount,
            paid_amount,
            installments,
            capture_method,
            receipt_url,
            items
        } = pagamento;

        console.log("==================================");
        console.log("NOVA VENDA PÊLA MODA");
        console.log("Pedido:", order_nsu);
        console.log("Transação:", transaction_nsu);
        console.log("Valor:", paid_amount || amount);
        console.log("Parcelas:", installments);
        console.log("Forma:", capture_method);
        console.log("Comprovante:", receipt_url);
        console.log("Itens:", items);
        console.log("==================================");

        if (!order_nsu) {
            return res.status(400).json({
                success: false,
                message: "Pedido não informado"
            });
        }

        const respostaSupabase = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/pedidos?order_nsu=eq.${encodeURIComponent(order_nsu)}`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.SUPABASE_SECRET_KEY,
                    "Prefer": "return=representation"
                },

                body: JSON.stringify({
                    status: "pago",
                    transaction_nsu: transaction_nsu || null,
                    forma_pagamento: capture_method || null,
                    parcelas: installments || null,
                    receipt_url: receipt_url || null,
                    pago_em: new Date().toISOString()
                })
            }
        );

        const pedidoAtualizado =
            await respostaSupabase.json();

        if (!respostaSupabase.ok) {

            console.error(
                "Erro ao atualizar pedido no Supabase:",
                pedidoAtualizado
            );

            return res.status(500).json({
                success: false,
                message: "Erro ao atualizar pedido"
            });
        }

        if (!pedidoAtualizado.length) {

            console.error(
                "Pedido não encontrado:",
                order_nsu
            );

            return res.status(404).json({
                success: false,
                message: "Pedido não encontrado"
            });
        }

        console.log(
            "Pedido atualizado:",
            pedidoAtualizado[0].numero_pedido
        );

        return res.status(200).json({
            success: true,
            message: null
        });

    } catch (erro) {

        console.error("Erro no webhook:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
}