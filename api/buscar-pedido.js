export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const { order_nsu } = req.query;

        if (!order_nsu) {
            return res.status(400).json({
                erro: "Pedido não informado"
            });
        }

        const resposta = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/pedidos?order_nsu=eq.${encodeURIComponent(order_nsu)}&select=numero_pedido,status`,
            {
                headers: {
                    "apikey": process.env.SUPABASE_SECRET_KEY
                }
            }
        );

        const dados = await resposta.json();

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
            numero_pedido: dados[0].numero_pedido,
            status: dados[0].status
        });

    } catch (erro) {

        console.error("Erro ao buscar pedido:", erro);

        return res.status(500).json({
            erro: "Erro interno"
        });
    }
}