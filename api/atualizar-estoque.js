export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    try {

        const {
            produto_id,
            cor,
            tamanho,
            quantidade
        } = req.body;


        if (
            !produto_id ||
            !cor ||
            !tamanho ||
            quantidade === undefined
        ) {
            return res.status(400).json({
                erro: "Dados incompletos"
            });
        }


        const qtd = Number(quantidade);

        if (
            !Number.isInteger(qtd) ||
            qtd < 0
        ) {
            return res.status(400).json({
                erro: "Quantidade inválida"
            });
        }


        const url =
            `${process.env.SUPABASE_URL}/rest/v1/estoque` +
            `?produto_id=eq.${encodeURIComponent(produto_id)}` +
            `&cor=eq.${encodeURIComponent(cor)}` +
            `&tamanho=eq.${encodeURIComponent(tamanho)}`;


        const resposta = await fetch(url, {

            method: "PATCH",

            headers: {
                "apikey":
                    process.env.SUPABASE_SECRET_KEY,

                "Authorization":
                    `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

                "Content-Type":
                    "application/json",

                "Prefer":
                    "return=representation"
            },

            body: JSON.stringify({
                quantidade: qtd
            })

        });


        const dados = await resposta.json();


        if (!resposta.ok) {

            console.error(dados);

            return res.status(500).json({
                erro: "Erro ao atualizar estoque"
            });

        }


        if (!dados.length) {

            return res.status(404).json({
                erro: "Item de estoque não encontrado"
            });

        }


        return res.status(200).json({
            sucesso: true,
            estoque: dados[0]
        });

    }

    catch (erro) {

        console.error(erro);

        return res.status(500).json({
            erro: "Erro interno"
        });

    }

}