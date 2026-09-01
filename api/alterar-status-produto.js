export default async function handler(req, res) {

    if (req.method !== "PATCH") {
        return res.status(405).json({
            erro: "Método não permitido."
        });
    }

    const senha =
        req.headers["x-admin-password"];

    if (
        !senha ||
        senha !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            erro: "Senha de administrador inválida."
        });
    }

    try {

        const {
            id,
            ativo
        } = req.body;


        if (!id) {
            return res.status(400).json({
                erro: "Produto não informado."
            });
        }


        if (typeof ativo !== "boolean") {
            return res.status(400).json({
                erro: "Status inválido."
            });
        }


        const resposta =
            await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/produtos?id=eq.${encodeURIComponent(id)}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "apikey":
                            process.env.SUPABASE_SECRET_KEY,

                        "Authorization":
                            `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

                        "Prefer":
                            "return=representation"
                    },

                    body: JSON.stringify({
                        ativo
                    })
                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {
            console.error(
                "Erro Supabase:",
                dados
            );

            return res.status(500).json({
                erro:
                    "Erro ao alterar status do produto."
            });
        }


        if (!dados.length) {
            return res.status(404).json({
                erro:
                    "Produto não encontrado."
            });
        }


        return res.status(200).json({
            sucesso: true,
            produto: dados[0]
        });


    } catch (erro) {

        console.error(erro);

        return res.status(500).json({
            erro:
                "Erro interno do servidor."
        });
    }
}