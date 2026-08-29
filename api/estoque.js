export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const resposta = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/estoque?select=produto_id,cor,tamanho,quantidade`,
            {
                headers: {
                    "apikey": process.env.SUPABASE_SECRET_KEY
                }
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error("Erro Supabase:", dados);

            return res.status(500).json({
                erro: "Erro ao consultar estoque"
            });
        }

        return res.status(200).json(dados);

    } catch (erro) {

        console.error(
            "Erro ao consultar estoque:",
            erro
        );

        return res.status(500).json({
            erro: "Erro interno"
        });
    }
}