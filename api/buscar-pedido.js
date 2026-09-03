export default async function handler(req, res) {

    if (
    req.method !== "GET" &&
    req.method !== "PATCH"
) {
    return res.status(405).json({
        erro: "Método não permitido"
    });
}

    try {
// ==========================================
// CANCELAR PEDIDO
// ==========================================

if (req.method === "PATCH") {

    const authHeader =
        req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            erro: "Usuário não autenticado"
        });
    }

    const accessToken =
        authHeader.substring(7);

    const {
        pedido_id,
        acao
    } = req.body || {};

    if (
        acao !== "cancelar" ||
        !pedido_id
    ) {
        return res.status(400).json({
            erro: "Solicitação inválida"
        });
    }


    // DESCOBRE O USUÁRIO LOGADO

    const respostaUsuario = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/user`,
        {
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
            erro: "Sessão inválida"
        });
    }

    const usuario =
        await respostaUsuario.json();

    if (!usuario?.id) {
        return res.status(401).json({
            erro: "Usuário não encontrado"
        });
    }


    // CANCELA SOMENTE:
    // - pedido do próprio usuário
    // - que ainda esteja aguardando pagamento

    const respostaCancelar = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/pedidos?id=eq.${encodeURIComponent(pedido_id)}&usuario_id=eq.${encodeURIComponent(usuario.id)}&status=eq.aguardando_pagamento`,
        {
            method: "PATCH",

            headers: {
                "Content-Type":
                    "application/json",

                apikey:
                    process.env.SUPABASE_SECRET_KEY,

                Prefer:
                    "return=representation"
            },

            body: JSON.stringify({
                status: "cancelado"
            })
        }
    );

    const pedidosAtualizados =
        await respostaCancelar.json();

    if (!respostaCancelar.ok) {

        console.error(
            "Erro ao cancelar pedido:",
            pedidosAtualizados
        );

        return res.status(500).json({
            erro:
                "Não foi possível cancelar o pedido"
        });
    }


    if (
        !Array.isArray(pedidosAtualizados) ||
        pedidosAtualizados.length === 0
    ) {
        return res.status(409).json({
            erro:
                "Este pedido não pode mais ser cancelado"
        });
    }


    return res.status(200).json({
        sucesso: true,
        status: "cancelado"
    });
}
        const {
            order_nsu,
            modo
        } = req.query;


        // ==========================================
        // MEUS PEDIDOS
        // ==========================================

        if (modo === "meus-pedidos") {

            const authHeader =
                req.headers.authorization;

            if (!authHeader?.startsWith("Bearer ")) {
                return res.status(401).json({
                    erro: "Usuário não autenticado"
                });
            }


            const accessToken =
                authHeader.substring(7);


            // Descobre quem é o usuário pelo token

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
                    erro: "Sessão inválida"
                });
            }


            const usuario =
                await respostaUsuario.json();


            if (!usuario?.id) {
                return res.status(401).json({
                    erro: "Usuário não encontrado"
                });
            }


            // Busca somente os pedidos desse usuário

            const respostaPedidos = await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/pedidos?usuario_id=eq.${encodeURIComponent(usuario.id)}&select=id,numero_pedido,order_nsu,status,valor_total,itens,tipo_entrega,endereco,numero,complemento,bairro,cidade,estado,cep,pagamento_url`,
                {
                    headers: {
                        apikey:
                            process.env.SUPABASE_SECRET_KEY
                    }
                }
            );


            const pedidos =
                await respostaPedidos.json();


            if (!respostaPedidos.ok) {

                console.error(
                    "Erro Supabase:",
                    pedidos
                );

                return res.status(500).json({
                    erro: "Erro ao buscar pedidos"
                });
            }


            return res.status(200).json({
                pedidos
            });
        }



        // ==========================================
        // BUSCA ANTIGA POR ORDER_NSU
        // ==========================================

        if (!order_nsu) {
            return res.status(400).json({
                erro: "Pedido não informado"
            });
        }


        const resposta = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/pedidos?order_nsu=eq.${encodeURIComponent(order_nsu)}&select=numero_pedido,status`,
            {
                headers: {
                    apikey:
                        process.env.SUPABASE_SECRET_KEY
                }
            }
        );


        const dados =
            await resposta.json();


        if (!resposta.ok) {
            return res.status(500).json({
                erro: "Erro ao buscar pedido"
            });
        }


        if (!dados.length) {
            return res.status(404).json({
                erro: "Pedido não encontrado"
            });
        }


        return res.status(200).json({
            numero_pedido:
                dados[0].numero_pedido,

            status:
                dados[0].status
        });


    } catch (erro) {

        console.error(
            "Erro ao buscar pedido:",
            erro
        );

        return res.status(500).json({
            erro: "Erro interno"
        });
    }
}