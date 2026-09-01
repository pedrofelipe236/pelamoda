export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }

    // PROTEÇÃO DO ADMIN
    const senhaAdmin = req.headers["x-admin-password"];

    if (
        !senhaAdmin ||
        senhaAdmin !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            erro: "Não autorizado"
        });
    }

    try {

        const {
    nome,
    preco,
    categoria,
    descricao,
    cores
} = req.body;


        // VALIDAÇÕES
        if (
    !Array.isArray(cores) ||
    cores.length === 0
) {
    return res.status(400).json({
        erro: "Cadastre pelo menos uma cor."
    });
}
        if (!nome || !preco || !categoria) {

            return res.status(400).json({
                erro: "Preencha nome, preço e categoria."
            });

        }


        const precoNumero = Number(preco);

        if (
            !Number.isFinite(precoNumero) ||
            precoNumero <= 0
        ) {

            return res.status(400).json({
                erro: "Preço inválido."
            });

        }


        if (
            categoria !== "tshirt" &&
            categoria !== "cropped"
        ) {

            return res.status(400).json({
                erro: "Categoria inválida."
            });

        }


        // CRIA ID AUTOMATICAMENTE
        const id = nome
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");


        if (!id) {

            return res.status(400).json({
                erro: "Não foi possível gerar o ID do produto."
            });

        }


        // CONVERTE R$ 65,00 PARA 6500
        const precoCentavos =
            Math.round(precoNumero * 100);


        const resposta = await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/produtos`,
            {
                method: "POST",

                headers: {

                    apikey:
                        process.env.SUPABASE_SECRET_KEY,

                    Authorization:
                        `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

                    "Content-Type":
                        "application/json",

                    Prefer:
                        "return=representation"
                },

                body: JSON.stringify({

                    id: id,

                    nome:
                        nome.trim(),

                    preco:
                        precoCentavos,

                    categoria,

                    descricao:
                        descricao?.trim() || "",

                    imagens: [],

                    cores: [],

                    ativo: true

                })

            }
        );


        const dados =
            await resposta.json();


        // ID JÁ EXISTE
        if (resposta.status === 409) {

            return res.status(409).json({
                erro: "Já existe um produto com esse nome/ID."
            });

        }


        if (!resposta.ok) {

            console.error(
                "Erro Supabase:",
                dados
            );

            return res.status(500).json({
                erro: "Erro ao cadastrar produto."
            });

        }


        return res.status(201).json({

            sucesso: true,

            produto:
                dados[0]

        });


    }

    catch (erro) {

        console.error(
            "Erro criar produto:",
            erro
        );

        return res.status(500).json({
            erro: "Erro interno."
        });

    }

}