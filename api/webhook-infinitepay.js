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

        const verificacao =
            await respostaVerificacao.json();

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

        /* CONFIRMA PEDIDO E BAIXA O ESTOQUE */

        const respostaSupabase = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/rpc/confirmar_pagamento`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.SUPABASE_SECRET_KEY
                },

                body: JSON.stringify({
                    p_order_nsu:
                        order_nsu,

                    p_transaction_nsu:
                        transaction_nsu,

                    p_forma_pagamento:
                        verificacao.capture_method || null,

                    p_parcelas:
                        verificacao.installments || null,

                    p_receipt_url:
                        receipt_url || null
                })
            }
        );

        const resultadoPedido =
            await respostaSupabase.json();

        if (!respostaSupabase.ok) {

            console.error(
                "Erro ao confirmar pedido:",
                resultadoPedido
            );

            return res.status(500).json({
                success: false,
                message: "Erro ao confirmar pedido"
            });
        }

        console.log(
            "Resultado do pedido:",
            resultadoPedido
        );

        if (!resultadoPedido.success) {

            console.error(
                "Problema no estoque:",
                resultadoPedido
            );

            return res.status(409).json({
                success: false,
                message:
                    resultadoPedido.erro ||
                    "Problema ao processar estoque"
            });
        }

        console.log(
            "PAGAMENTO + ESTOQUE CONFIRMADOS:",
            resultadoPedido.numero_pedido
        );

        console.log(
            "Itens recebidos:",
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