export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const {
            cupom,
            valor_produtos
        } = req.body;

        if (!cupom || !cupom.trim()) {
            return res.status(400).json({
                erro: "Informe um cupom"
            });
        }

        const codigoCupom =
            cupom.trim().toUpperCase();

        const respostaCupom = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/cupons?codigo=eq.${encodeURIComponent(codigoCupom)}&ativo=eq.true&select=*`,
            {
                headers: {
                    apikey:
                        process.env.SUPABASE_SECRET_KEY
                }
            }
        );

        const cupons =
            await respostaCupom.json();

        if (
            !respostaCupom.ok ||
            !Array.isArray(cupons) ||
            cupons.length === 0
        ) {
            return res.status(400).json({
                erro: "Cupom inválido ou inativo"
            });
        }

        const cupomEncontrado =
            cupons[0];

        if (
            cupomEncontrado.valido_ate &&
            new Date(
                cupomEncontrado.valido_ate
            ) < new Date()
        ) {
            return res.status(400).json({
                erro: "Este cupom expirou"
            });
        }

        const valorProdutos =
            Number(valor_produtos || 0);

        if (
            valorProdutos <
            Number(
                cupomEncontrado.valor_minimo || 0
            )
        ) {
            return res.status(400).json({
                erro:
                    "Valor mínimo do cupom não atingido"
            });
        }

        let valorDesconto = 0;

        if (
            cupomEncontrado.tipo ===
            "percentual"
        ) {
            valorDesconto =
                Math.round(
                    valorProdutos *
                    Number(
                        cupomEncontrado.valor
                    ) /
                    100
                );
        }

        if (
            cupomEncontrado.tipo ===
            "fixo"
        ) {
            valorDesconto =
                Number(
                    cupomEncontrado.valor
                );
        }

        valorDesconto =
            Math.min(
                valorDesconto,
                valorProdutos
            );

        return res.status(200).json({
            valido: true,
            codigo: codigoCupom,
            tipo: cupomEncontrado.tipo,
            valor: Number(
                cupomEncontrado.valor
            ),
            valor_desconto:
                valorDesconto
        });

    } catch (erro) {

        console.error(
            "Erro ao validar cupom:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao validar cupom"
        });
    }
}