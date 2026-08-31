export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const resposta = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/produtos?ativo=eq.true&select=id,nome,preco,categoria,descricao,imagens,cores,ativo`,
            {
                headers: {
                    apikey:
                        process.env.SUPABASE_SECRET_KEY
                }
            }
        );

        const produtos =
            await resposta.json();

        if (!resposta.ok) {

            console.error(
                "Erro Supabase:",
                produtos
            );

            return res.status(500).json({
                erro: "Erro ao buscar produtos"
            });
        }

        return res.status(200).json(
            produtos
        );

    } catch (erro) {

        console.error(
            "Erro ao buscar catálogo:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao buscar catálogo"
        });
    }
}