export default async function handler(req, res) {

    if (req.method !== "PATCH") {
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

        // =====================================
        // ATIVAR / DESATIVAR PRODUTO
        // =====================================

        if (req.body.acao === "alterar-status") {

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


            const respostaStatus =
                await fetch(
                    `${process.env.SUPABASE_URL}/rest/v1/produtos?id=eq.${encodeURIComponent(id)}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            apikey:
                                process.env.SUPABASE_SECRET_KEY,

                            Authorization:
                                `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

                            Prefer:
                                "return=representation"
                        },

                        body: JSON.stringify({
                            ativo
                        })
                    }
                );


            const dadosStatus =
                await respostaStatus.json();


            if (!respostaStatus.ok) {

                console.error(
                    "Erro ao alterar status:",
                    dadosStatus
                );

                return res.status(500).json({
                    erro:
                        "Erro ao alterar status do produto."
                });
            }


            return res.status(200).json({
                sucesso: true,
                produto: dadosStatus[0]
            });
        }


        // =====================================
        // EDIÇÃO NORMAL DO PRODUTO
        // =====================================

        const {
    id,
    nome,
    preco,
    preco_promocional,
    categoria,
    descricao,
    cores,
    imagensExtras = []
} = req.body;


        if (!id || !nome || !preco || !categoria) {
            return res.status(400).json({
                erro: "Dados do produto incompletos."
            });
        }


        if (!Array.isArray(cores) || cores.length === 0) {
            return res.status(400).json({
                erro:
                    "O produto precisa ter pelo menos uma cor."
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


        const precoCentavos =
            Math.round(precoNumero * 100);
let precoPromocionalCentavos = null;

if (
    preco_promocional !== null &&
    preco_promocional !== undefined &&
    preco_promocional !== ""
) {

    const precoPromocionalNumero =
        Number(preco_promocional);

    if (
        !Number.isFinite(precoPromocionalNumero) ||
        precoPromocionalNumero <= 0
    ) {
        return res.status(400).json({
            erro: "Preço promocional inválido."
        });
    }

    if (precoPromocionalNumero >= precoNumero) {
        return res.status(400).json({
            erro:
                "O preço promocional deve ser menor que o preço normal."
        });
    }

    precoPromocionalCentavos =
        Math.round(precoPromocionalNumero * 100);
}

        // =====================================
        // CORES + ESTOQUE
        // =====================================

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


            const imagem =
                String(cor.imagem || "").trim();


            coresProduto.push({
                nome: nomeCor,
                imagem
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
                    nome_produto:
                        nome.trim(),
                    cor: nomeCor,
                    tamanho,
                    quantidade
                });
            }
        }


        // =====================================
        // IMAGENS
        // =====================================

        const imagensProduto = [
            ...imagensExtras
                .map(
                    imagem =>
                        String(
                            imagem || ""
                        ).trim()
                )
                .filter(Boolean),
            ...coresProduto
                .map(cor => cor.imagem)
                .filter(Boolean),

            
        ];


        // =====================================
        // ATUALIZA PRODUTO
        // =====================================

        const respostaProduto =
            await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/produtos?id=eq.${encodeURIComponent(id)}`,
                {
                    method: "PATCH",

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
                        nome:
                            nome.trim(),

                        preco:
                            precoCentavos,
                            
                         preco_promocional:
                            precoPromocionalCentavos,    

                        categoria,

                        descricao:
                            descricao?.trim() || "",

                        cores:
                            coresProduto,

                        imagens:
                            imagensProduto
                    })
                }
            );


        const dadosProduto =
            await respostaProduto.json();


        if (!respostaProduto.ok) {

            console.error(
                "Erro ao editar produto:",
                dadosProduto
            );

            return res.status(500).json({
                erro:
                    "Não foi possível atualizar o produto."
            });
        }


        // =====================================
        // RECRIA ESTOQUE
        // =====================================

        const respostaExcluir =
            await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/estoque?produto_id=eq.${encodeURIComponent(id)}`,
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


        if (!respostaExcluir.ok) {
            throw new Error(
                "Não foi possível atualizar o estoque."
            );
        }


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

            const detalhe =
                await respostaEstoque.text();


            console.error(
                "Erro estoque:",
                detalhe
            );


            return res.status(500).json({
                erro:
                    "Produto atualizado, mas houve erro ao atualizar o estoque."
            });
        }


        return res.status(200).json({
            sucesso: true,
            produto: dadosProduto[0]
        });


    } catch (erro) {

        console.error(
            "Erro editar produto:",
            erro
        );


        return res.status(500).json({
            erro: "Erro interno."
        });
    }
}