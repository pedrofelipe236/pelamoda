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
            invoice_slug,
            receipt_url,
            items
        } = pagamento;

        if (!order_nsu || !transaction_nsu || !invoice_slug) {
            return res.status(400).json({
                success: false,
                message: "Dados do pagamento incompletos"
            });
        }

        /* CONFIRMA O PAGAMENTO DIRETAMENTE NA INFINITEPAY */

        const respostaVerificacao = await fetch(
            "https://api.checkout.infinitepay.io/payment_check",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    handle: "pedrofelipe236",
                    order_nsu,
                    transaction_nsu,
                    slug: invoice_slug
                })
            }
        );

        const verificacao = await respostaVerificacao.json();

        console.log(
            "Verificação InfinitePay:",
            verificacao
        );

        if (
            !respostaVerificacao.ok ||
            !verificacao.success ||
            !verificacao.paid
        ) {
            return res.status(400).json({
                success: false,
                message: "Pagamento não confirmado"
            });
        }

        /* ATUALIZA O PEDIDO */

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

                    transaction_nsu:
                        transaction_nsu,

                    forma_pagamento:
                        verificacao.capture_method || null,

                    parcelas:
                        verificacao.installments || null,

                    receipt_url:
                        receipt_url || null,

                    pago_em:
                        new Date().toISOString()
                })
            }
        );

        const pedidoAtualizado =
            await respostaSupabase.json();

        if (!respostaSupabase.ok) {

            console.error(
                "Erro Supabase:",
                pedidoAtualizado
            );

            return res.status(500).json({
                success: false,
                message: "Erro ao atualizar pedido"
            });
        }

        if (!pedidoAtualizado.length) {

            return res.status(404).json({
                success: false,
                message: "Pedido não encontrado"
            });
        }

        console.log(
            "PAGAMENTO CONFIRMADO:",
            pedidoAtualizado[0].numero_pedido
        );

        console.log(
            "Itens:",
            items
        );

        return res.status(200).json({
            success: true,
            message: null
        });

    } catch (erro) {

        console.error(
            "Erro no webhook:",
            erro
        );

        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
}