export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const {
            order_nsu,
            customer,
            address
        } = req.body;

        if (!order_nsu) {
            return res.status(400).json({
                erro: "Pedido inválido"
            });
        }


        // ======================================================
        // BUSCA O PEDIDO REAL NO SUPABASE
        // ======================================================

        const respostaPedido = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/pedidos?order_nsu=eq.${encodeURIComponent(order_nsu)}&select=order_nsu,itens,valor_frete,status`,
            {
                headers: {
                    "apikey": process.env.SUPABASE_SECRET_KEY
                }
            }
        );

        const pedidos = await respostaPedido.json();

        if (!respostaPedido.ok) {

            console.error(
                "Erro ao buscar pedido:",
                pedidos
            );

            return res.status(500).json({
                erro: "Erro ao consultar pedido"
            });
        }


        if (
            !Array.isArray(pedidos) ||
            pedidos.length === 0
        ) {
            return res.status(404).json({
                erro: "Pedido não encontrado"
            });
        }


        const pedido = pedidos[0];


        // ======================================================
        // MONTA OS ITENS COM OS PREÇOS SALVOS NO BACKEND
        // ======================================================

        const itemsPagamento =
            pedido.itens.map(item => ({
                quantity: Number(item.quantidade),
                price: Number(item.preco),
                description:
                    `${item.nome} - ${item.cor} - ${item.tamanho}`
            }));


        // ======================================================
        // ADICIONA FRETE SALVO NO PEDIDO
        // ======================================================

        const valorFrete =
            Number(pedido.valor_frete || 0);

        if (valorFrete > 0) {

            itemsPagamento.push({
                quantity: 1,
                price: valorFrete,
                description: "Frete"
            });
        }


        // ======================================================
        // CRIA CHECKOUT NA INFINITEPAY
        // ======================================================
console.log("PEDIDO SUPABASE:", pedido);
console.log("ITEMS PAGAMENTO:", itemsPagamento);
console.log("CUSTOMER:", customer);
console.log("ADDRESS:", address);
        const resposta = await fetch(
            "https://api.checkout.infinitepay.io/links",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    handle: "pedrofelipe236",

                    order_nsu,

                    redirect_url:
                        "https://pelamoda.vercel.app/pagamento-concluido.html",

                    webhook_url:
                        "https://pelamoda.vercel.app/api/webhook-infinitepay",

                    customer,

                    address,

                    items: itemsPagamento
                })
            }
        );


        const dados = await resposta.json();


        if (!resposta.ok) {

            console.error(
                "Erro InfinitePay:",
                dados
            );

            return res.status(
                resposta.status
            ).json(dados);
        }


        return res.status(200).json(dados);


    } catch (erro) {

        console.error(
            "Erro ao criar pagamento:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao criar pagamento"
        });
    }
}