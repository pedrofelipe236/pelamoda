export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const {
            items,
            order_nsu,
            customer,
            address
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                erro: "Pedido sem produtos"
            });
        }

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

                    customer,

                    address,

                    items
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error("Erro InfinitePay:", dados);

            return res.status(resposta.status).json(dados);
        }

        return res.status(200).json(dados);

    } catch (erro) {

        console.error("Erro ao criar pagamento:", erro);

        return res.status(500).json({
            erro: "Erro ao criar pagamento"
        });
    }
}