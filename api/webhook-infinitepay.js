async function enviarTelegram(mensagem) {

    const token =
        process.env.TELEGRAM_BOT_TOKEN;

    const chatId =
        process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {

        console.error(
            "Telegram não configurado."
        );

        return;
    }

    try {

        const resposta =
            await fetch(
                `https://api.telegram.org/bot${token}/sendMessage`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        chat_id: chatId,
                        text: mensagem
                    })
                }
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            console.error(
                "Erro ao enviar Telegram:",
                dados
            );

            return;
        }

        console.log(
            "Notificação enviada para o Telegram."
        );

    } catch (erro) {

        console.error(
            "Erro Telegram:",
            erro
        );
    }
}


export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            erro: "Método não permitido"
        });
    }


    try {

        const {
            order_nsu,
            transaction_nsu,
            invoice_slug,
            receipt_url
        } = req.body;


        if (
            !order_nsu ||
            !transaction_nsu ||
            !invoice_slug
        ) {

            return res.status(400).json({
                erro:
                    "Dados do pagamento incompletos"
            });
        }


        // ======================================================
        // CONFERE O PAGAMENTO DIRETAMENTE NA INFINITEPAY
        // ======================================================

        const respostaVerificacao =
            await fetch(
                "https://api.checkout.infinitepay.io/payment_check",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        handle:
                            "pedrofelipe236",

                        order_nsu,

                        transaction_nsu,

                        slug:
                            invoice_slug
                    })
                }
            );


        const verificacao =
            await respostaVerificacao.json();


        if (
            !respostaVerificacao.ok ||
            !verificacao.success ||
            !verificacao.paid
        ) {

            return res.status(400).json({

                erro:
                    "Pagamento não confirmado"
            });
        }


        // ======================================================
        // CONFIRMA PAGAMENTO + BAIXA ESTOQUE
        // ======================================================

        const respostaConfirmacao =
            await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/rpc/confirmar_pagamento`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        apikey:
                            process.env.SUPABASE_SECRET_KEY,

                        Authorization:
                            `Bearer ${process.env.SUPABASE_SECRET_KEY}`
                    },

                    body: JSON.stringify({

                        p_order_nsu:
                            order_nsu,

                        p_transaction_nsu:
                            transaction_nsu,

                        p_forma_pagamento:
                            verificacao.capture_method ||
                            null,

                        p_parcelas:
                            verificacao.installments ||
                            null,

                        p_receipt_url:
                            receipt_url ||
                            null
                    })
                }
            );


        const confirmacao =
            await respostaConfirmacao.json();


        if (
            !respostaConfirmacao.ok ||
            confirmacao?.success !== true
        ) {

            console.error(
                "Erro ao confirmar pagamento:",
                confirmacao
            );

            return res.status(409).json({
                erro:
                    "Pagamento confirmado, mas houve erro ao processar o pedido."
            });
        }


        // ======================================================
        // BUSCA DADOS DO PEDIDO
        // ======================================================

        const respostaPedido =
            await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/pedidos?order_nsu=eq.${encodeURIComponent(order_nsu)}&select=numero_pedido,nome_cliente,valor_total,forma_pagamento,parcelas`,
                {
                    headers: {

                        apikey:
                            process.env.SUPABASE_SECRET_KEY,

                        Authorization:
                            `Bearer ${process.env.SUPABASE_SECRET_KEY}`
                    }
                }
            );


        const pedidos =
            await respostaPedido.json();


        const pedido =
            Array.isArray(pedidos)
                ? pedidos[0]
                : null;


        // ======================================================
        // ENVIA AVISO PARA O TELEGRAM
        // ======================================================

        if (pedido) {

            const valor =
                (
                    Number(
                        pedido.valor_total || 0
                    ) / 100
                ).toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL"
                    }
                );


            const mensagem =

                `🛒 NOVA VENDA PÊLAMODA\n\n` +

                `Pedido: #${pedido.numero_pedido}\n` +

                `Cliente: ${pedido.nome_cliente || "Não informado"}\n` +

                `Valor: ${valor}\n` +

                `Pagamento: ${pedido.forma_pagamento || "Não informado"}\n` +

                `Parcelas: ${pedido.parcelas || 1}x\n\n` +

                `✅ Pagamento confirmado`;


            await enviarTelegram(
                mensagem
            );
        }


        console.log(
            "PAGAMENTO + ESTOQUE CONFIRMADOS"
        );


        return res.status(200).json({

            success: true,

            numero_pedido:
                confirmacao.numero_pedido ||
                pedido?.numero_pedido ||
                null
        });


    } catch (erro) {

        console.error(
            "Erro no webhook:",
            erro
        );

        return res.status(500).json({
            erro:
                "Erro interno no webhook"
        });
    }
}