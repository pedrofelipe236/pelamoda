export const config = {
    api: {
        bodyParser: {
            sizeLimit: "8mb"
        }
    }
};


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
            produtoId,
            cor,
            arquivo,
            tipo
        } = req.body;


        if (
            !produtoId ||
            !cor ||
            !arquivo ||
            !tipo
        ) {
            return res.status(400).json({
                erro: "Dados da imagem incompletos."
            });
        }


        // TIPOS PERMITIDOS
        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (!tiposPermitidos.includes(tipo)) {
            return res.status(400).json({
                erro:
                    "Formato inválido. Use JPG, PNG ou WEBP."
            });
        }


        // REMOVE O CABEÇALHO DO BASE64
        const base64 =
            arquivo.replace(
                /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
                ""
            );


        const buffer =
            Buffer.from(base64, "base64");


        // LIMITE DE 5 MB
        if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({
                erro:
                    "A imagem deve ter no máximo 5 MB."
            });
        }


        const extensao =
            tipo === "image/png"
                ? "png"
                : tipo === "image/webp"
                    ? "webp"
                    : "jpg";


        const corArquivo = cor
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");


        const caminho =
            `${produtoId}/${corArquivo}-${Date.now()}.${extensao}`;


        // ENVIA PARA O SUPABASE STORAGE
        const resposta =
            await fetch(
                `${process.env.SUPABASE_URL}/storage/v1/object/produtos/${caminho}`,
                {
                    method: "POST",

                    headers: {
                        apikey:
                            process.env.SUPABASE_SECRET_KEY,

                        Authorization:
                            `Bearer ${process.env.SUPABASE_SECRET_KEY}`,

                        "Content-Type":
                            tipo,

                        "x-upsert":
                            "false"
                    },

                    body:
                        buffer
                }
            );


        if (!resposta.ok) {

            const erroStorage =
                await resposta.text();

            console.error(
                "Erro Storage:",
                erroStorage
            );

            return res.status(500).json({
                erro:
                    "Não foi possível enviar a imagem."
            });
        }


        const urlPublica =
            `${process.env.SUPABASE_URL}` +
            `/storage/v1/object/public/produtos/${caminho}`;


        return res.status(200).json({

            sucesso: true,

            url: urlPublica

        });

    }

    catch (erro) {

        console.error(
            "Erro upload:",
            erro
        );

        return res.status(500).json({
            erro: "Erro interno no upload."
        });

    }

}