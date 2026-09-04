export default async function handler(req, res) {

 if (!["POST", "GET", "PATCH"].includes(req.method)) {
    return res.status(405).json({
        erro: "Método não permitido"
    });
}

    try {
// =====================================
// ADMIN - LISTAR CUPONS
// =====================================

if (req.method === "GET") {

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

    const resposta =
        await fetch(
            `${process.env.SUPABASE_URL}/rest/v1/cupons?select=*&order=codigo.asc`,
            {
                headers: {
                    apikey:
                        process.env.SUPABASE_SECRET_KEY
                }
            }
        );

    const cupons =
        await resposta.json();

    if (!resposta.ok) {
        return res.status(500).json({
            erro: "Erro ao listar cupons"
        });
    }

    return res.status(200).json(
        cupons
    );
}


// =====================================
// ADMIN - CRIAR / EDITAR CUPOM
// =====================================

if (
    req.method === "PATCH" &&
    req.body?.acao === "salvar-cupom"
) {

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


    const {
        codigo,
        tipo,
        valor,
        valor_minimo = 0,
        valido_ate = null,
        ativo = true
    } = req.body;


    const codigoFinal =
        String(codigo || "")
            .trim()
            .toUpperCase();


    if (!codigoFinal) {
        return res.status(400).json({
            erro: "Informe o código do cupom"
        });
    }


    if (
        !["percentual", "fixo"].includes(tipo)
    ) {
        return res.status(400).json({
            erro: "Tipo de cupom inválido"
        });
    }


    const valorNumero =
        Number(valor);


    if (
        !Number.isFinite(valorNumero) ||
        valorNumero <= 0
    ) {
        return res.status(400).json({
            erro: "Valor do desconto inválido"
        });
    }


    // verifica se já existe
const respostaBusca =
    await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/cupons?codigo=eq.${encodeURIComponent(codigoFinal)}&select=codigo`,
        {
            headers: {
                apikey:
                    process.env.SUPABASE_SECRET_KEY,

                Authorization:
                    `Bearer ${process.env.SUPABASE_SECRET_KEY}`
            }
        }
    );

const cuponsExistentes =
    await respostaBusca.json();

const cupomExiste =
    Array.isArray(cuponsExistentes) &&
    cuponsExistentes.length > 0;


const dadosCupom = {
    codigo: codigoFinal,
    tipo,
    valor: valorNumero,
    valor_minimo:
        Number(valor_minimo || 0),
    valido_ate:
        valido_ate || null,
    ativo:
        Boolean(ativo)
};


const resposta =
    await fetch(
        cupomExiste
            ? `${process.env.SUPABASE_URL}/rest/v1/cupons?codigo=eq.${encodeURIComponent(codigoFinal)}`
            : `${process.env.SUPABASE_URL}/rest/v1/cupons`,
        {
            method:
                cupomExiste
                    ? "PATCH"
                    : "POST",

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
                JSON.stringify(dadosCupom)
        }
    );

    const dados =
        await resposta.json();


    if (!resposta.ok) {

        console.error(
            "Erro ao salvar cupom:",
            dados
        );

        return res.status(500).json({
            erro:
                "Não foi possível salvar o cupom"
        });
    }


    return res.status(200).json({
        sucesso: true,
        cupom: dados[0]
    });
}
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
    Math.round(
        Number(
            cupomEncontrado.valor_minimo || 0
        ) * 100
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