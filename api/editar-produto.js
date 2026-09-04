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
// ALTERAR PREÇOS EM MASSA
// =====================================

if (req.body.acao === "alterar-precos-lote") {

    const {
        produtos,
        alterar_preco_normal,
        preco,
        alterar_preco_promocional,
        preco_promocional
    } = req.body;


    if (
        !Array.isArray(produtos) ||
        produtos.length === 0
    ) {
        return res.status(400).json({
            erro: "Nenhum produto selecionado."
        });
    }


    if (
        !alterar_preco_normal &&
        !alterar_preco_promocional
    ) {
        return res.status(400).json({
            erro: "Nenhum preço informado para alteração."
        });
    }


    let precoCentavos = null;

    if (alterar_preco_normal) {

        const precoNumero =
            Number(preco);

        if (
            !Number.isFinite(precoNumero) ||
            precoNumero <= 0
        ) {
            return res.status(400).json({
                erro: "Preço normal inválido."
            });
        }

        precoCentavos =
            Math.round(precoNumero * 100);
    }


    let precoPromocionalCentavos = null;

    if (
        alterar_preco_promocional &&
        preco_promocional !== null
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

        precoPromocionalCentavos =
            Math.round(
                precoPromocionalNumero * 100
            );
    }


    // Busca os preços atuais dos produtos selecionados
    const idsFiltro =
        produtos
            .map(id => `"${String(id).replace(/"/g, "")}"`)
            .join(",");


    const respostaProdutosAtuais =
        await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/produtos?id=in.(${encodeURIComponent(idsFiltro)})&select=id,preco,preco_promocional`,
            {
                headers: {
                    apikey:
                        process.env.SUPABASE_SECRET_KEY,

                    Authorization:
                        `Bearer ${process.env.SUPABASE_SECRET_KEY}`
                }
            }
        );


    const produtosAtuais =
        await respostaProdutosAtuais.json();


    if (!respostaProdutosAtuais.ok) {

        console.error(
            "Erro ao buscar produtos para lote:",
            produtosAtuais
        );

        return res.status(500).json({
            erro:
                "Não foi possível consultar os produtos."
        });
    }


    // Valida se o promocional fica abaixo do normal
    if (
        alterar_preco_promocional &&
        precoPromocionalCentavos !== null
    ) {

        for (const produto of produtosAtuais) {

            const precoNormalFinal =
                alterar_preco_normal
                    ? precoCentavos
                    : Number(produto.preco);


            if (
                precoPromocionalCentavos >=
                precoNormalFinal
            ) {
                return res.status(400).json({
                    erro:
                        "O preço promocional precisa ser menor que o preço normal."
                });
            }
        }
    }


    const dadosAtualizacao = {};


    if (alterar_preco_normal) {
        dadosAtualizacao.preco =
            precoCentavos;
    }


    if (alterar_preco_promocional) {
        dadosAtualizacao.preco_promocional =
            precoPromocionalCentavos;
    }


    // Atualiza um por um para evitar alterar produto fora da seleção
    for (const produtoId of produtos) {

        const respostaAtualizacao =
            await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/produtos?id=eq.${encodeURIComponent(produtoId)}`,
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
                            "return=minimal"
                    },

                    body:
                        JSON.stringify(
                            dadosAtualizacao
                        )
                }
            );


        if (!respostaAtualizacao.ok) {

            const detalhe =
                await respostaAtualizacao.text();

            console.error(
                "Erro ao atualizar preço em massa:",
                produtoId,
                detalhe
            );

            return res.status(500).json({
                erro:
                    "Houve um erro ao atualizar os preços."
            });
        }
    }


    return res.status(200).json({
        sucesso: true,
        quantidade: produtos.length
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