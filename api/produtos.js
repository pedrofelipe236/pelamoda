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

      const respostaEstoque = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/estoque?select=produto_id,cor,tamanho,quantidade`,
    {
        headers: {
            apikey:
                process.env.SUPABASE_SECRET_KEY
        }
    }
);

const estoque =
    await respostaEstoque.json();

if (!respostaEstoque.ok) {
    console.error(
        "Erro ao buscar estoque:",
        estoque
    );

    return res.status(500).json({
        erro: "Erro ao buscar estoque"
    });
}

const catalogoCompleto =
    produtos.map(produto => {

        const estoqueProduto =
            estoque.filter(
                item =>
                    item.produto_id === produto.id
            );

        const estoqueFormatado = {};

        estoqueProduto.forEach(item => {

            if (!estoqueFormatado[item.cor]) {
                estoqueFormatado[item.cor] = {};
            }

            estoqueFormatado[item.cor][item.tamanho] =
                Number(item.quantidade);
        });

        return {
            ...produto,
            estoque: estoqueFormatado
        };
    });

return res.status(200).json(
    catalogoCompleto
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