export default async function handler(req, res) {

    // ======================================================
    // GET
    // ======================================================

    if (req.method === "GET") {

        try {

            const modo = req.query?.modo;


            // ==================================================
            // ADMIN - LISTAR PEDIDOS
            // ==================================================

            if (modo === "admin") {

                const senhaAdmin =
                    req.headers["x-admin-password"];

                if (
                    !senhaAdmin ||
                    senhaAdmin !== process.env.ADMIN_PASSWORD
                ) {
                    return res.status(401).json({
                        erro: "Não autorizado"
                    });
                }


                const limite = Math.min(
                    Math.max(
                        Number(req.query?.limite) || 50,
                        1
                    ),
                    100
                );


                const url =
                    `${process.env.SUPABASE_URL}/rest/v1/pedidos` +
                    `?select=` +
                    `id,` +
                    `numero_pedido,` +
                    `order_nsu,` +
                    `nome_cliente,` +
                    `telefone,` +
                    `email,` +
                    `itens,` +
                    `tipo_entrega,` +
                    `cep,` +
                    `endereco,` +
                    `numero,` +
                    `complemento,` +
                    `bairro,` +
                    `cidade,` +
                    `estado,` +
                    `valor_produtos,` +
                    `valor_frete,` +
                    `valor_total,` +
                    `status,` +
                    `forma_pagamento,` +
                    `parcelas,` +
                    `receipt_url,` +
                    `criado_em,` +
                    `pago_em,` +
                    `cupom,` +
                    `valor_desconto` +
                    `&order=criado_em.desc` +
                    `&limit=${limite}`;


                const resposta =
                    await fetch(url, {
                        headers: {
                            apikey:
                                process.env.SUPABASE_SECRET_KEY,

                            Authorization:
                                `Bearer ${process.env.SUPABASE_SECRET_KEY}`
                        }
                    });


                const dados =
                    await resposta.json();


                if (!resposta.ok) {

                    console.error(
                        "Erro Supabase ao buscar pedidos:",
                        dados
                    );

                    return res.status(500).json({
                        erro: "Erro ao buscar pedidos"
                    });
                }


                return res.status(200).json({
                    sucesso: true,
                    pedidos:
                        Array.isArray(dados)
                            ? dados
                            : []
                });
            }


            // ==================================================
            // CLIENTE - MEUS PEDIDOS
            // ==================================================

            if (modo === "meus-pedidos") {

                const authHeader =
                    req.headers.authorization;


                if (
                    !authHeader ||
                    !authHeader.startsWith("Bearer ")
                ) {
                    return res.status(401).json({
                        erro: "Não autorizado"
                    });
                }


                const accessToken =
                    authHeader.substring(7);


                const respostaUsuario =
                    await fetch(
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
                        erro: "Sessão do usuário inválida"
                    });
                }


                const usuario =
                    await respostaUsuario.json();


                const url =
                    `${process.env.SUPABASE_URL}/rest/v1/pedidos` +
                    `?usuario_id=eq.${encodeURIComponent(usuario.id)}` +
                    `&select=` +
                    `id,` +
                    `numero_pedido,` +
                    `order_nsu,` +
                    `status,` +
                    `valor_total,` +
                    `itens,` +
                    `tipo_entrega,` +
                    `endereco,` +
                    `numero,` +
                    `complemento,` +
                    `bairro,` +
                    `cidade,` +
                    `estado,` +
                    `cep,` +
                    `pagamento_url` +
                    `&order=criado_em.desc`;


                const resposta =
                    await fetch(url, {
                        headers: {

                            apikey:
                                process.env.SUPABASE_SECRET_KEY,

                            Authorization:
                                `Bearer ${process.env.SUPABASE_SECRET_KEY}`
                        }
                    });


                const dados =
                    await resposta.json();


                if (!resposta.ok) {

                    console.error(
                        "Erro Supabase ao buscar pedidos do usuário:",
                        dados
                    );

                    return res.status(500).json({
                        erro: "Erro ao buscar pedidos"
                    });
                }


                return res.status(200).json({
                    sucesso: true,
                    pedidos:
                        Array.isArray(dados)
                            ? dados
                            : []
                });
            }


            // ==================================================
            // BUSCA NORMAL PELO order_nsu
            // ==================================================

            const order_nsu =
                req.query?.order_nsu;


            if (!order_nsu) {

                return res.status(400).json({
                    erro: "Pedido não informado"
                });
            }


            const url =
                `${process.env.SUPABASE_URL}/rest/v1/pedidos` +
                `?order_nsu=eq.${encodeURIComponent(order_nsu)}` +
                `&select=numero_pedido,status,pagamento_url`;


            const resposta =
                await fetch(url, {
                    headers: {

                        apikey:
                            process.env.SUPABASE_SECRET_KEY,

                        Authorization:
                            `Bearer ${process.env.SUPABASE_SECRET_KEY}`
                    }
                });


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
                    dados[0].status,

                pagamento_url:
                    dados[0].pagamento_url || null
            });

        } catch (erro) {

            console.error(
                "Erro ao buscar pedido:",
                erro
            );

            return res.status(500).json({
                erro: "Erro interno ao buscar pedido"
            });
        }
    }


    // ======================================================
    // PATCH - CANCELAR PEDIDO
    // ======================================================

    if (req.method === "PATCH") {

        try {

            const authHeader =
                req.headers.authorization;


            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {
                return res.status(401).json({
                    erro: "Não autorizado"
                });
            }


            const accessToken =
                authHeader.substring(7);


            const respostaUsuario =
                await fetch(
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
                    erro: "Sessão do usuário inválida"
                });
            }


            const usuario =
                await respostaUsuario.json();


            const {
                order_nsu
            } = req.body || {};


            if (!order_nsu) {

                return res.status(400).json({
                    erro: "Pedido não informado"
                });
            }


            const buscaUrl =
                `${process.env.SUPABASE_URL}/rest/v1/pedidos` +
                `?order_nsu=eq.${encodeURIComponent(order_nsu)}` +
                `&usuario_id=eq.${encodeURIComponent(usuario.id)}` +
                `&select=id,status`;


            const respostaBusca =
                await fetch(buscaUrl, {
                    headers: {

                        apikey:
                            process.env.SUPABASE_SECRET_KEY,

                        Authorization:
                            `Bearer ${process.env.SUPABASE_SECRET_KEY}`
                    }
                });


            const pedidos =
                await respostaBusca.json();


            if (
                !respostaBusca.ok ||
                !pedidos.length
            ) {
                return res.status(404).json({
                    erro: "Pedido não encontrado"
                });
            }


            const pedido =
                pedidos[0];


            if (
                pedido.status !==
                "aguardando_pagamento"
            ) {
                return res.status(400).json({
                    erro:
                        "Este pedido não pode mais ser cancelado"
                });
            }


            const respostaCancelamento =
                await fetch(
                    `${process.env.SUPABASE_URL}/rest/v1/pedidos?id=eq.${pedido.id}`,
                    {
                        method: "PATCH",

                        headers: {

                            "Content-Type":
                                "application/json",

                            apikey:
                                process.env.SUPABASE_SECRET_KEY,

                            Authorization:
                                `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

                            Prefer:
                                "return=representation"
                        },

                        body: JSON.stringify({
                            status: "cancelado"
                        })
                    }
                );


            const dadosCancelamento =
                await respostaCancelamento.json();


            if (!respostaCancelamento.ok) {

                return res.status(500).json({
                    erro: "Não foi possível cancelar o pedido"
                });
            }


            return res.status(200).json({
                sucesso: true,
                pedido:
                    dadosCancelamento[0]
            });

        } catch (erro) {

            console.error(
                "Erro ao cancelar pedido:",
                erro
            );

            return res.status(500).json({
                erro: "Erro interno ao cancelar pedido"
            });
        }
    }


    // ======================================================
    // MÉTODO NÃO PERMITIDO
    // ======================================================

    return res.status(405).json({
        erro: "Método não permitido"
    });
}