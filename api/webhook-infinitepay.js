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
            amount,
            paid_amount,
            installments,
            capture_method,
            receipt_url,
            items
        } = pagamento;

        console.log("==================================");
        console.log("NOVA VENDA PÊLA MODA");
        console.log("Pedido:", order_nsu);
        console.log("Transação:", transaction_nsu);
        console.log("Valor:", paid_amount || amount);
        console.log("Parcelas:", installments);
        console.log("Forma:", capture_method);
        console.log("Comprovante:", receipt_url);
        console.log("Itens:", items);
        console.log("==================================");

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