export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido"
        });
    }


    // PROTEÇÃO DO ADMIN
    const senhaAdmin =
        req.headers["x-admin-password"];

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


        // -------------------------
        // VALIDAÇÕES
        // -------------------------

        if (!nome || !preco || !categoria) {

            return res.status(400).json({
                erro:
                    "Preencha nome, preço e categoria."
            });

        }


        if (
            !Array.isArray(cores) ||
            cores.length === 0
        ) {

            return res.status(400).json({
                erro:
                    "Cadastre pelo menos uma cor."
            });

        }


        const precoNumero =
            Number(preco);


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


        // -------------------------
        // ID DO PRODUTO
        // -------------------------

        const id = nome
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");


        if (!id) {

            return res.status(400).json({
                erro:
                    "Não foi possível gerar o ID do produto."
            });

        }


        const precoCentavos =
            Math.round(precoNumero * 100);


        // -------------------------
        // MONTA CORES + ESTOQUE
        // -------------------------

        const coresProduto = [];

        const registrosEstoque = [];


        for (const cor of cores) {

            const nomeCor =
                String(cor.nome || "").trim();


            if (!nomeCor) {

                return res.status(400).json({
                    erro:
                        "Existe uma cor sem nome."
                });

            }

const urlImagem =
    String(cor.imagem || "").trim();

coresProduto.push({
    nome: nomeCor,
    imagem: urlImagem
});
       const tamanhos =
    cor.estoque || {};

for (
    const tamanho of
    ["PP", "P", "M", "G", "GG"]
) {

    const quantidade =
        Number(
            tamanhos[tamanho] ?? 0
        );

    if (
        !Number.isInteger(quantidade) ||
        quantidade < 0
    ) {

        return res.status(400).json({
            erro:
                `Quantidade inválida em ${nomeCor} / ${tamanho}.`
        });

    }

    registrosEstoque.push({
        produto_id: id,
        nome_produto: nome.trim(),
        cor: nomeCor,
        tamanho,
        quantidade
    });

}

}

        // -------------------------
        // CRIA PRODUTO
        // -------------------------
const imagensProduto =
    coresProduto
        .map(cor => cor.imagem)
        .filter(Boolean);

        const respostaProduto =
            await fetch(
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

                    body:
                        JSON.stringify({

                            id,

                            nome:
                                nome.trim(),

                            preco:
                                precoCentavos,

                            categoria,

                            descricao:
                                descricao?.trim() || "",

                            imagens: imagensProduto,

                            cores:
                                coresProduto,

                            ativo: true

                        })

                }
            );


        const dadosProduto =
            await respostaProduto.json();


        if (
            respostaProduto.status === 409
        ) {

            return res.status(409).json({
                erro:
                    "Já existe um produto com esse nome/ID."
            });

        }


        if (!respostaProduto.ok) {

            console.error(
                "Erro produto:",
                dadosProduto
            );

            return res.status(500).json({
                erro:
                    "Erro ao cadastrar produto."
            });

        }


        // -------------------------
        // CRIA ESTOQUE
        // -------------------------

        const respostaEstoque =
            await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/estoque`,
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
                            "return=minimal"

                    },

                    body:
                        JSON.stringify(
                            registrosEstoque
                        )

                }
            );


        if (!respostaEstoque.ok) {

            const erroEstoque =
                await respostaEstoque.text();

            console.error(
                "Erro estoque:",
                erroEstoque
            );


            // REMOVE O PRODUTO CASO
            // O ESTOQUE NÃO SEJA CRIADO

            await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/produtos?id=eq.${encodeURIComponent(id)}`,
                {

                    method: "DELETE",

                    headers: {

                        apikey:
                            process.env.SUPABASE_SECRET_KEY,

                        Authorization:
                            `Bearer ${process.env.SUPABASE_SECRET_KEY}`

                    }

                }
            );


            return res.status(500).json({
                erro:
                    "Não foi possível criar o estoque do produto."
            });

        }


        // -------------------------
        // SUCESSO
        // -------------------------

        return res.status(201).json({

            sucesso: true,

            produto:
                dadosProduto[0]

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