export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    const { cepDestino } = req.body;

    if (!cepDestino) {
        return res.status(400).json({
            erro: "CEP de destino não informado"
        });
    }

    try {

        const resposta = await fetch(
            "https://api.superfrete.com/api/v0/calculator",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.SUPERFRETE_TOKEN}`,
                    "User-Agent": "Pelamoda (contato@pelamoda.com.br)",
                    "accept": "application/json",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
    from: {
        postal_code: "53437320"
    },
    to: {
        postal_code: cepDestino.replace(/\D/g, "")
    },
    services: "1,2,17",
    options: {
        own_hand: false,
        receipt: false,
        insurance_value: 0,
        use_insurance_value: false
    },
    package: {
        height: 15,
        width: 17,
        length: 20,
        weight: 0.2
    }
})
            }
        );

        const dados = await resposta.json();

        return res.status(resposta.status).json(dados);

    } catch (erro) {

        console.error("Erro SuperFrete:", erro);

        return res.status(500).json({
            erro: "Erro ao calcular frete"
        });
    }
}