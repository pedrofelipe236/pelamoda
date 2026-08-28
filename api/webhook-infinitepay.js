export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Método não permitido"
        });
    }

    try {
        const pagamento = req.body;

        console.log("PAGAMENTO RECEBIDO:", pagamento);

        return res.status(200).json({
            success: true,
            message: null
        });

    } catch (erro) {
        console.error("Erro no webhook:", erro);

        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
}