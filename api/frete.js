
async function buscarCoordenadas(endereco, apiKey) {
    const url = new URL("https://api.heigit.org/pelias/v1/search");

    url.searchParams.set("text", endereco);
    url.searchParams.set("size", "1");
    url.searchParams.set("boundary.country", "BR");

    const resposta = await fetch(url, {
        headers: {
            Authorization: apiKey,
            Accept: "application/json"
        }
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        console.error("Erro ao localizar endereço:", dados);
        throw new Error("Não foi possível localizar o endereço.");
    }

    const coordenadas = dados.features?.[0]?.geometry?.coordinates;

    if (
        !Array.isArray(coordenadas) ||
        coordenadas.length !== 2 ||
        !coordenadas.every(Number.isFinite)
    ) {
        throw new Error(
            `Não encontramos o endereço: ${endereco}`
        );
    }

    return coordenadas;
}


async function calcularFreteMotoboy(dadosEndereco) {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;

    if (!apiKey) {
        throw new Error("Chave de cálculo de rota não configurada.");
    }

    const {
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep
    } = dadosEndereco;

    const cepLimpo = String(cep || "").replace(/\D/g, "");

    if (
        !rua ||
        !numero ||
        !bairro ||
        !cidade ||
        !estado ||
        cepLimpo.length !== 8
    ) {
        throw new Error("Informe o endereço completo do cliente.");
    }

    const origemTexto =
        "Rua Dom Vital, 106, Santo Amaro, Recife, Pernambuco, Brasil";

    const destinoTexto = [
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cepLimpo,
        "Brasil"
    ].filter(Boolean).join(", ");

    const [origem, destino] = await Promise.all([
        buscarCoordenadas(origemTexto, apiKey),
        buscarCoordenadas(destinoTexto, apiKey)
    ]);

    const respostaRota = await fetch(
        "https://api.heigit.org/openrouteservice/v2/directions/driving-car",
        {
            method: "POST",
            headers: {
                Authorization: apiKey,
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                coordinates: [origem, destino],
                instructions: false
            })
        }
    );

    const dadosRota = await respostaRota.json().catch(() => ({}));

    if (!respostaRota.ok) {
        console.error("Erro ao calcular rota:", dadosRota);
        throw new Error("Não foi possível calcular a rota.");
    }

    const distanciaMetros =
        dadosRota.routes?.[0]?.summary?.distance;

    if (!Number.isFinite(distanciaMetros) || distanciaMetros <= 0) {
        throw new Error("Não foi possível obter a distância.");
    }

    // R$ 1,50 por km, somente ida.
    const valorFreteCentavos = Math.round(distanciaMetros * 0.15);

    return {
        distancia_km: Number((distanciaMetros / 1000).toFixed(2)),
        valor_frete_centavos: valorFreteCentavos,
        valor_frete: valorFreteCentavos / 100
    };
}


export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const corpo = req.body || {};

        // NOVO: CÁLCULO DO MOTOBOY
        if (corpo.modo === "motoboy") {

            const resultado = await calcularFreteMotoboy(corpo);

            return res.status(200).json({
                sucesso: true,
                ...resultado
            });
        }

        // EXISTENTE: SUPERFRETE
        const { cepDestino } = corpo;

        if (!cepDestino) {
            return res.status(400).json({
                erro: "CEP de destino não informado"
            });
        }

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

        console.error("Erro ao calcular frete:", erro);

        return res.status(500).json({
            erro: erro.message || "Erro ao calcular frete"
        });
    }
}
