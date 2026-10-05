    // ======================================================
    // PÊLAMODA - SCRIPT PRINCIPAL
    // ======================================================
let estoqueAPI = [];

async function carregarEstoqueAPI() {
    try {
        const resposta = await fetch("/api/estoque");

        if (!resposta.ok) {
            throw new Error("Erro ao carregar estoque");
        }

        estoqueAPI = await resposta.json();

    } catch (erro) {
        console.error("Erro ao carregar estoque:", erro);
        estoqueAPI = [];
    }
}
    const WHATSAPP_PELAMODA = "5581989672042";

    let corSelecionada = "";
    let tamanhoSelecionado = "";
    let quantidadeProduto = 1;
    let estoqueDisponivel = Infinity;
    let produtoAtualDados = null;

    let carrinho =
        JSON.parse(localStorage.getItem("pelamodaCarrinho")) || [];


    // ======================================================
    // UTILITÁRIOS
    // ======================================================

    function formatarPreco(valor) {
        return `R$ ${Number(valor)
            .toFixed(2)
            .replace(".", ",")}`;
    }

    function obterIdProdutoAtual() {
        const parametros =
            new URLSearchParams(window.location.search);

        return parametros.get("id");
    }

   async function obterProdutoPorId(id) {

    if (!id) {
        return null;
    }

    try {

        const resposta =
            await fetch("/api/produtos");

        const catalogo =
            await resposta.json();

        if (!resposta.ok) {
            return null;
        }

       const produto =
    catalogo.find(
        item =>
            item.id === id &&
            item.ativo === true
    );

        if (!produto) {
            return null;
        }

        return {
           ...produto,

    preco:
        Number(produto.preco) / 100,

    preco_promocional:
        produto.preco_promocional
            ? Number(produto.preco_promocional) / 100
            : null
};

    } catch (erro) {

        console.error(
            "Erro ao carregar produto:",
            erro
        );

        return null;
    }
}

    function obterProdutoPorNome(nome) {
        if (typeof produtos === "undefined") {
            return null;
        }

        return (
            Object.values(produtos).find(
                produto => produto.nome === nome
            ) || null
        );
    }

    function obterEstoque(produto, cor, tamanho) {

    let produtoId = null;

    if (
        produto &&
        typeof produtos !== "undefined"
    ) {
        const produtoEncontrado =
            Object.entries(produtos).find(
                ([id, dados]) => dados === produto
            );

        if (produtoEncontrado) {
            produtoId = produtoEncontrado[0];
        }
    }

    if (!produtoId) {
        produtoId = obterIdProdutoAtual();
    }

    const itemEstoque = estoqueAPI.find(item =>
        item.produto_id === produtoId &&
        item.cor === cor &&
        item.tamanho === tamanho
    );

    if (itemEstoque) {
        return Number(itemEstoque.quantidade);
    }

    if (!produto?.estoque) {
        return Infinity;
    }

    return produto.estoque?.[cor]?.[tamanho] ?? 0;
}


    // ======================================================
    // WHATSAPP
    // ======================================================

    
    function comprarProdutoWhatsApp() {

        if (!tamanhoSelecionado) {
            alert("Escolha o tamanho antes de continuar.");
            return;
        }

        const produtoAtual =
            document.getElementById("produtoAtual");

        const nomeProduto =
            produtoAtual?.dataset.nome ||
            produtoAtualDados?.nome ||
            "Produto";

        const mensagem =
            encodeURIComponent(
                `Oxe! Vim pelo site da PêlaModa e quero a camisa ${nomeProduto}.

    Cor: ${corSelecionada}
    Tamanho: ${tamanhoSelecionado}
    Quantidade: ${quantidadeProduto}

    Pode me ajudar a finalizar o pedido?`
            );

        window.open(
            `https://wa.me/${WHATSAPP_PELAMODA}?text=${mensagem}`,
            "_blank"
        );
    }

    
    // ======================================================
    // GALERIA / COR / TAMANHO
    // ======================================================

    function trocarImagem(imagem, botao) {

        const imagemPrincipal =
            document.getElementById("imagemPrincipal");

        if (!imagemPrincipal) return;

        imagemPrincipal.src = imagem;

        document
            .querySelectorAll(".thumbnail")
            .forEach(
                item => item.classList.remove("active")
            );

        if (botao) {
            botao.classList.add("active");
        }
    }

    function selecionarCor(botao, imagem) {

        corSelecionada =
            botao?.dataset.cor || corSelecionada;

        document
            .querySelectorAll(".color-option")
            .forEach(
                item => item.classList.remove("active")
            );

        if (botao) {
            botao.classList.add("active");
        }

        const imagemPrincipal =
            document.getElementById("imagemPrincipal");

        if (imagemPrincipal && imagem) {
            imagemPrincipal.src = imagem;
        }

        // Ao trocar a cor, o tamanho precisa ser escolhido novamente.
        if (produtoAtualDados) {
            atualizarTamanhos(corSelecionada);
        }
    }

    function selecionarTamanho(botao, tamanho) {

        tamanhoSelecionado = tamanho;

        document
            .querySelectorAll(".size-option")
            .forEach(
                item => item.classList.remove("active")
            );

        if (botao) {
            botao.classList.add("active");
        }

        estoqueDisponivel =
            obterEstoque(
                produtoAtualDados,
                corSelecionada,
                tamanhoSelecionado
            );

        quantidadeProduto = 1;

        const quantidade =
    document.getElementById("quantidade");
        if (quantidade) {
            quantidade.textContent = "1";
        }
    }

    function alterarQuantidade(valor) {

        if (!tamanhoSelecionado) {
            alert("Escolha um tamanho primeiro.");
            return;
        }

        const novaQuantidade =
            quantidadeProduto + valor;

        if (novaQuantidade < 1) {

            quantidadeProduto = 1;

        } else if (
            Number.isFinite(estoqueDisponivel) &&
            novaQuantidade > estoqueDisponivel
        ) {

            alert(
                `Só temos ${estoqueDisponivel} unidade(s) disponível(is) nessa cor e tamanho.`
            );

            quantidadeProduto =
                Math.max(1, estoqueDisponivel);

        } else {

            quantidadeProduto =
                novaQuantidade;
        }

        const quantidade =
            document.getElementById("quantidade");

        if (quantidade) {
            quantidade.textContent =
                quantidadeProduto;
        }
    }

    function atualizarTamanhos(cor) {

        const opcoesTamanhos =
            document.getElementById("opcoesTamanhos");

        if (!opcoesTamanhos) return;

        opcoesTamanhos.innerHTML = "";

        tamanhoSelecionado = "";
        quantidadeProduto = 1;
        estoqueDisponivel = Infinity;

        const quantidadeElemento =
            document.getElementById("quantidade");

        if (quantidadeElemento) {
            quantidadeElemento.textContent = "1";
        }

        const tamanhos =
            ["PP", "P", "M", "G", "GG"];

        tamanhos.forEach(tamanho => {

            const botao =
                document.createElement("button");

            botao.className =
                "option-btn size-option";

            botao.textContent = tamanho;

            const estoque =
                obterEstoque(
                    produtoAtualDados,
                    cor,
                    tamanho
                );

            if (
                Number.isFinite(estoque) &&
                estoque <= 0
            ) {

                botao.disabled = true;
                botao.classList.add("esgotado");
                botao.title = "Tamanho esgotado";

            } else {

                botao.addEventListener(
                    "click",
                    () => {
                        selecionarTamanho(
                            botao,
                            tamanho
                        );
                    }
                );
            }

            opcoesTamanhos.appendChild(botao);
        });
    }


    // ======================================================
    // PRODUTO DINÂMICO
    // ======================================================

    async function carregarProdutoDinamico() {

        const paginaProduto =
            document.getElementById("produtoAtual");

        if (!paginaProduto) return;

        const idProduto =
            obterIdProdutoAtual();

        const produto =
    await obterProdutoPorId(idProduto);

        if (!produto) {

            console.error(
                "Produto não encontrado:",
                idProduto
            );

            return;
        }

        produtoAtualDados = produto;

        paginaProduto.dataset.nome =
            produto.nome;

       const temPromocao =
    produto.preco_promocional &&
    produto.preco_promocional < produto.preco;

const precoVenda =
    temPromocao
        ? produto.preco_promocional
        : produto.preco;

paginaProduto.dataset.preco =
    precoVenda;

        const titulo =
            document.querySelector(
                ".product-details h1"
            );

       if (titulo) {
    titulo.textContent =
        produto.nome.toUpperCase();
}
// SEO DINÂMICO DA PÁGINA DO PRODUTO

let tituloSeo =
    `${produto.nome} | PêlaModa`;

let descricaoSeo =
    produto.descricao ||
    `Confira ${produto.nome} na PêlaModa. Camisa com identidade nordestina, produzida em Pernambuco.`;


// TERMOS MAIS FORTES PARA ALGUNS PRODUTOS

if (idProduto === "pe") {

    tituloSeo =
        "Camisa de Pernambuco - Mapa de PE | PêlaModa";

    descricaoSeo =
        "Camisa de Pernambuco com estampa Mapa de PE. Design autoral nordestino, produzida em Pernambuco. Confira cores e tamanhos na PêlaModa.";
}

if (idProduto === "oxente") {

    tituloSeo =
        "Camisa Oxente | PêlaModa";

    descricaoSeo =
        "Camisa Oxente com identidade nordestina e design autoral. Confira cores e tamanhos disponíveis na PêlaModa.";
}

if (idProduto === "nordeste") {

    tituloSeo =
        "Camisa Nordestina - Nordeste | PêlaModa";

    descricaoSeo =
        "Camisa nordestina com estampa Nordeste. Design autoral inspirado na cultura do Nordeste. Confira na PêlaModa.";
}


// MUDA O TITLE

document.title =
    tituloSeo;


// CRIA OU ATUALIZA META DESCRIPTION

let metaDescricao =
    document.querySelector(
        'meta[name="description"]'
    );

if (!metaDescricao) {

    metaDescricao =
        document.createElement("meta");

    metaDescricao.setAttribute(
        "name",
        "description"
    );

    document.head.appendChild(
        metaDescricao
    );
}

metaDescricao.setAttribute(
    "content",
    descricaoSeo
);

        const preco =
            document.querySelector(
                ".product-price"
            );

        if (preco) {

    if (temPromocao) {

       preco.innerHTML = `
    <div class="linha-precos">
        <span class="preco-antigo">
            ${formatarPreco(produto.preco)}
        </span>

        <span class="preco-promocional">
            ${formatarPreco(produto.preco_promocional)}
        </span>
    </div>

    <span class="selo-promocao">
        PROMOÇÃO
    </span>
`;

    } else {

        preco.textContent =
            formatarPreco(produto.preco);
    }
}

        const descricao =
            document.querySelector(
                ".product-description"
            );

        if (descricao) {
            descricao.textContent =
                produto.descricao || "";
        }

        const imagemPrincipal =
            document.getElementById(
                "imagemPrincipal"
            );

        if (
            imagemPrincipal &&
            produto.imagens?.length
        ) {

            imagemPrincipal.src =
                produto.imagens[0];

            imagemPrincipal.alt =
                `Camisa ${produto.nome}`;
        }
  
        // Miniaturas
        const miniaturas =
            document.querySelector(
                ".product-thumbnails"
            );

        if (miniaturas) {

            miniaturas.innerHTML = "";

            (produto.imagens || []).forEach(
                (imagem, index) => {

                    const botao =
                        document.createElement(
                            "button"
                        );

                    botao.className =
                        index === 0
                            ? "thumbnail active"
                            : "thumbnail";

                    const img =
                        document.createElement("img");

                    img.src = imagem;

                    img.alt =
                        `Camisa ${produto.nome}`;

                    botao.appendChild(img);

                    botao.addEventListener(
                        "click",
                        () => {
                            trocarImagem(
                                imagem,
                                botao
                            );
                        }
                    );

                    miniaturas.appendChild(botao);
                }
            );
        }

        // Cores
        const opcoesCores =
            document.getElementById(
                "opcoesCores"
            );

        if (opcoesCores) {

            opcoesCores.innerHTML = "";

            const cores =
                produto.cores || [];

            cores.forEach(
                (cor, index) => {

                    const botao =
                        document.createElement(
                            "button"
                        );

                    botao.className =
                        index === 0
                            ? "option-btn color-option active"
                            : "option-btn color-option";

                    botao.dataset.cor =
                        cor.nome;

                    botao.textContent =
                        cor.nome;

                    botao.addEventListener(
                        "click",
                        () => {
                            selecionarCor(
                                botao,
                                cor.imagem
                            );
                        }
                    );

                    opcoesCores.appendChild(botao);
                }
            );

            if (cores.length > 0) {

                corSelecionada =
                    cores[0].nome;

                atualizarTamanhos(
                    corSelecionada
                );

            } else {

                corSelecionada = "";

                atualizarTamanhos(
                    corSelecionada
                );
            }
        }

        document.title =
            `Camisa ${produto.nome} | PêlaModa`;
    }


    // ======================================================
    // CARRINHO
    // ======================================================

    function salvarCarrinho() {

        localStorage.setItem(
            "pelamodaCarrinho",
            JSON.stringify(carrinho)
        );
    }

    function adicionarCarrinho() {

        if (!tamanhoSelecionado) {

            alert(
                "Escolha o tamanho antes de adicionar ao carrinho."
            );

            return;
        }

        const produtoAtual =
            document.getElementById("produtoAtual");

        if (!produtoAtual) {

            console.error(
                "Produto atual não encontrado na página."
            );

            return;
        }

        const nomeProduto =
            produtoAtual.dataset.nome;

        const precoProduto =
            Number(produtoAtual.dataset.preco);

        const produtoExistente =
            carrinho.find(
                item =>
                    item.nome === nomeProduto &&
                    item.cor === corSelecionada &&
                    item.tamanho === tamanhoSelecionado
            );

        const quantidadeJaNoCarrinho =
            produtoExistente
                ? produtoExistente.quantidade
                : 0;

        const estoqueAtual =
            obterEstoque(
                produtoAtualDados,
                corSelecionada,
                tamanhoSelecionado
            );

        const quantidadeTotal =
            quantidadeJaNoCarrinho +
            quantidadeProduto;

        if (
            Number.isFinite(estoqueAtual) &&
            quantidadeTotal > estoqueAtual
        ) {

            const restante =
                estoqueAtual -
                quantidadeJaNoCarrinho;

            if (restante <= 0) {

                alert(
                    "Você já adicionou ao carrinho todo o estoque disponível dessa cor e tamanho."
                );

            } else {

                alert(
                    `Você pode adicionar apenas mais ${restante} unidade(s) dessa cor e tamanho.`
                );
            }

            return;
        }

        if (produtoExistente) {

            produtoExistente.quantidade +=
                quantidadeProduto;

            // Atualiza a foto para a cor atual.
            produtoExistente.imagem =
                document
                    .getElementById("imagemPrincipal")
                    ?.src ||
                produtoExistente.imagem;

        } else {

            carrinho.push({
                id: Date.now(),
                produtoId:
                    obterIdProdutoAtual(),
                nome: nomeProduto,
                preco: precoProduto,
                cor: corSelecionada,
                tamanho: tamanhoSelecionado,
                quantidade: quantidadeProduto,
                imagem:
                    document
                        .getElementById("imagemPrincipal")
                        ?.src || ""
            });
        }

        salvarCarrinho();
        renderizarCarrinho();
        abrirCarrinho();
    }

    function abrirCarrinho() {

        document
            .getElementById("cartDrawer")
            ?.classList.add("active");

        document
            .getElementById("cartOverlay")
            ?.classList.add("active");

        document.body.style.overflow =
            "hidden";
    }

    function fecharCarrinho() {

        document
            .getElementById("cartDrawer")
            ?.classList.remove("active");

        document
            .getElementById("cartOverlay")
            ?.classList.remove("active");

        document.body.style.overflow = "";
    }

    function removerDoCarrinho(id) {

        carrinho =
            carrinho.filter(
                produto => produto.id !== id
            );

        salvarCarrinho();
        renderizarCarrinho();
    }

    function alterarQuantidadeCarrinho(
        id,
        valor
    ) {

        const item =
            carrinho.find(
                produto => produto.id === id
            );

        if (!item) return;

        const novaQuantidade =
            item.quantidade + valor;

        if (novaQuantidade <= 0) {

            removerDoCarrinho(id);
            return;
        }

        let produtoCadastro = null;

        if (
            item.produtoId &&
            typeof produtos !== "undefined"
        ) {
            produtoCadastro =
                produtos[item.produtoId] || null;
        }

        if (!produtoCadastro) {
            produtoCadastro =
                obterProdutoPorNome(item.nome);
        }

        const estoque =
            obterEstoque(
                produtoCadastro,
                item.cor,
                item.tamanho
            );

        if (
            Number.isFinite(estoque) &&
            novaQuantidade > estoque
        ) {

            alert(
                `Só temos ${estoque} unidade(s) disponível(is) dessa cor e tamanho.`
            );

            return;
        }

        item.quantidade =
            novaQuantidade;

        salvarCarrinho();
        renderizarCarrinho();
    }

    function renderizarCarrinho() {

        const contador =
            document.getElementById("cartCount");

        const totalItens =
            carrinho.reduce(
                (total, produto) =>
                    total + produto.quantidade,
                0
            );

        if (contador) {
            contador.textContent =
                totalItens;
        }

        const container =
            document.getElementById("cartItems");

        const vazio =
            document.getElementById("cartEmpty");

        const subtotalElemento =
            document.getElementById(
                "cartSubtotal"
            );

        // Algumas páginas podem ter só o contador.
        if (
            !container ||
            !subtotalElemento
        ) {
            return;
        }

        container.innerHTML = "";

        if (carrinho.length === 0) {

            vazio?.classList.add("active");

            subtotalElemento.textContent =
                "R$ 0,00";

            return;
        }

        vazio?.classList.remove("active");

        let subtotal = 0;

        carrinho.forEach(produto => {

            const valorItem =
                produto.preco *
                produto.quantidade;

            subtotal += valorItem;

            const item =
                document.createElement("div");

            item.className = "cart-item";

            item.innerHTML = `
                <img
                    src="${produto.imagem}"
                    alt="${produto.nome}"
                >

                <div class="cart-item-info">

                    <h3>${produto.nome}</h3>

                    <p>Cor: ${produto.cor}</p>

                    <p>Tamanho: ${produto.tamanho}</p>

                    <div class="cart-quantity">

                        <button
                            onclick="alterarQuantidadeCarrinho(${produto.id}, -1)"
                            aria-label="Diminuir quantidade"
                        >
                            −
                        </button>

                        <span>
                            ${produto.quantidade}
                        </span>

                        <button
                            onclick="alterarQuantidadeCarrinho(${produto.id}, 1)"
                            aria-label="Aumentar quantidade"
                        >
                            +
                        </button>

                    </div>

                    <div class="cart-item-price">
                        ${formatarPreco(valorItem)}
                    </div>

                </div>

                <button
                    class="cart-remove"
                    onclick="removerDoCarrinho(${produto.id})"
                    aria-label="Remover produto"
                >
                    ×
                </button>
            `;

            container.appendChild(item);
        });

        subtotalElemento.textContent =
            formatarPreco(subtotal);
    }

    function finalizarCarrinhoWhatsApp() {

        if (carrinho.length === 0) {
            alert("Seu carrinho está vazio.");
            return;
        }

        let mensagem =
            "Oxe! Vim pelo site da PêlaModa e quero finalizar este pedido:\n\n";

        let total = 0;

        carrinho.forEach(
            (produto, index) => {

                const valor =
                    produto.preco *
                    produto.quantidade;

                total += valor;

                mensagem +=
                    `${index + 1}. ${produto.nome}\n` +
                    `Cor: ${produto.cor}\n` +
                    `Tamanho: ${produto.tamanho}\n` +
                    `Quantidade: ${produto.quantidade}\n` +
                    `Valor: ${formatarPreco(valor)}\n\n`;
            }
        );

        mensagem +=
            `Total: ${formatarPreco(total)}`;

        window.open(
            `https://wa.me/${81989672042}?text=${encodeURIComponent(mensagem)}`,
            "_blank"
        );
    }


    // ======================================================
    // HOME / CATÁLOGO
    // ======================================================

   async function carregarProdutosHome() {

    const lista =
        document.getElementById(
            "listaProdutos"
        );

    if (!lista) return;

    try {

        const resposta =
            await fetch("/api/produtos");

        const catalogo =
            await resposta.json();
const produtosAtivos =
    catalogo.filter(
        produto => produto.ativo
    );

        if (!resposta.ok) {

            console.error(
                "Erro ao carregar catálogo:",
                catalogo
            );

            return;
        }

        lista.innerHTML = "";

        lista.classList.remove(
            "products-grid"
        );

        lista.classList.add(
            "categorias-produtos"
        );

        const tshirts =
    produtosAtivos
        .filter(
            produto =>
                produto.categoria !== "cropped"
        )
                .map(
                    produto => [
                        produto.id,
                        {
                            ...produto,

    preco:
        Number(produto.preco) / 100,

    preco_promocional:
        produto.preco_promocional
            ? Number(produto.preco_promocional) / 100
            : null
                        }
                    ]
                );

        const croppeds =
    catalogo
        .filter(
            produto =>
                produto.categoria === "cropped"
        )
                .map(
                    produto => [
                        produto.id,
                        {
                            ...produto,

    preco:
        Number(produto.preco) / 100,

    preco_promocional:
        produto.preco_promocional
            ? Number(produto.preco_promocional) / 100
            : null
                        }
                    ]
                );


        function corParaCSS(nome) {
            const nomeNormalizado = String(nome || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .trim();

            const cores = {
                "preto": "#111111",
                "preta": "#111111",
                "branco": "#ffffff",
                "branca": "#ffffff",
                "off white": "#f4f0e8",
                "offwhite": "#f4f0e8",
                "azul": "#4d82b8",
                "azul marinho": "#18345a",
                "azul claro": "#8db7d9",
                "vermelho": "#c84b4b",
                "vinho": "#722333",
                "verde": "#5f8b62",
                "verde claro": "#9bbd8f",
                "amarelo": "#e7c84a",
                "rosa": "#d98aa8",
                "roxo": "#8064a2",
                "lilas": "#b7a0d0",
                "laranja": "#dc8b45",
                "marrom": "#795548",
                "bege": "#d7c3a5",
                "cinza": "#8d8d8d",
                "cinza claro": "#c8c8c8",
                "grafite": "#3d4146"
            };

            return cores[nomeNormalizado] || "#d8d2ca";
        }

        function criarSecao(
            titulo,
            listaProdutos
        ) {

            if (
                listaProdutos.length === 0
            ) {
                return;
            }

            const secao =
                document.createElement(
                    "div"
                );

            secao.className =
                "categoria-produtos";

            if (
                titulo === "T-SHIRTS"
            ) {
                secao.id = "tshirts";
            }

            if (
                titulo === "CROPPEDS"
            ) {
                secao.id = "croppeds";
            }

            secao.innerHTML = `
                <h2 class="titulo-categoria">
                    ${titulo}
                </h2>

                <div class="products-grid categoria-grid">
                </div>
            `;

            const grid =
                secao.querySelector(
                    ".categoria-grid"
                );

            listaProdutos.forEach(
                ([id, produto]) => {

                    const card =
                        document.createElement(
                            "article"
                        );

                    card.className =
                        "product";
                        const temPromocao =
    produto.preco_promocional &&
    produto.preco_promocional < produto.preco;
    

                    const coresProduto =
                        Array.isArray(produto.cores)
                            ? produto.cores
                            : [];

                    const seloMaisVendido =
                        produto.mais_vendido === true
                            ? `
                                <span class="product-bestseller">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <path d="M12 3l2.2 5.1 5.5.5-4.2 3.6 1.3 5.3L12 14.6 7.2 17.5l1.3-5.3-4.2-3.6 5.5-.5L12 3z"/>
                                    </svg>
                                    MAIS VENDIDO
                                </span>
                            `
                            : "";

                    const coresHTML =
                        coresProduto.length > 0
                            ? `
                                <div class="product-colors" aria-label="Cores disponíveis">
                                    ${coresProduto
                                        .slice(0, 6)
                                        .map(cor => `
                                            <span
                                                class="product-color"
                                                title="${cor.nome || "Cor"}"
                                                aria-label="${cor.nome || "Cor"}"
                                                style="background:${corParaCSS(cor.nome)}"
                                            ></span>
                                        `)
                                        .join("")}
                                </div>
                            `
                            : "";

                    card.innerHTML = `
                        <a
                            href="produto.html?id=${id}"
                            class="product-link"
                        >
                            <div class="product-image">

    ${seloMaisVendido}

    ${
        temPromocao
            ? `<span class="selo-promocao">PROMOÇÃO</span>`
            : ""
    }

    <img
        src="${produto.imagens?.[0] || ""}"
        alt="${produto.nome}"
    >
</div>

                            <div class="product-info">

                                <h3>
                                    ${produto.nome}
                                </h3>

                                <p>
                                    ${
                                        produto.categoria === "cropped"
                                            ? "Cropped feminino"
                                            : "Unissex • PP ao GG"
                                    }
                                </p>

                                ${coresHTML}

                               <div class="price">

    ${
        temPromocao
            ? `
                <div class="linha-precos">
                    <span class="preco-antigo">
                        ${formatarPreco(produto.preco)}
                    </span>

                    <span class="preco-promocional">
                        ${formatarPreco(produto.preco_promocional)}
                    </span>
                </div>
              `
            : `
                <span class="preco-atual">
                    ${formatarPreco(produto.preco)}
                </span>
              `
    }
</div>

                                <span class="installment">
                                    ou 2x de ${formatarPreco((temPromocao ? produto.preco_promocional : produto.preco) / 2)} sem juros
                                </span>

                            </div>
                        </a>

                        <div class="product-actions">
                            <button
                                class="buy"
                                type="button"
                                aria-label="Comprar ${produto.nome}"
                                onclick="window.location.href='produto.html?id=${id}'"
                            >
                                <svg class="buy-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <circle cx="9" cy="20" r="1"/>
                                    <circle cx="18" cy="20" r="1"/>
                                    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.5L21 8H6"/>
                                </svg>
                                <span>COMPRAR</span>
                            </button>
                        </div>
                    `;

                    grid.appendChild(
                        card
                    );
                }
            );

            lista.appendChild(
                secao
            );
        }

        criarSecao(
            "T-SHIRTS",
            tshirts
        );

        criarSecao(
            "CROPPEDS",
            croppeds
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar produtos da home:",
            erro
        );
    }
}

    // ======================================================
    // INICIALIZAÇÃO
    // ======================================================
async function atualizarLinkMeusPedidos() {
    const linkDesktop =
        document.getElementById("linkMeusPedidos");

    const linkMobile =
        document.getElementById("linkMeusPedidosMobile");

    if (!linkDesktop && !linkMobile) {
        return;
    }

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    const links = [
        linkDesktop,
        linkMobile
    ];

    links.forEach(link => {
        if (!link) return;

        link.href = "login.html";
        link.textContent = "Meus pedidos";

        if (!user) {
            link.onclick = function (event) {
                event.preventDefault();

                const confirmar = confirm(
                    "Para acompanhar seus pedidos, você precisa entrar com sua conta. Deseja ir para o login?"
                );

                if (confirmar) {
                    window.location.href = "login.html";
                }
            };
        } else {
            link.onclick = null;
        }
    });
}
    document.addEventListener(
        "DOMContentLoaded",
        async () => {
            await atualizarLinkMeusPedidos();
            
            await carregarEstoqueAPI();

            carregarProdutoDinamico();
            carregarProdutosHome();
            renderizarCarrinho();
        }
    );
const botaoMenu = document.querySelector(".menu-btn");
const menuDropdown = document.querySelector(".menu-dropdown");

if (botaoMenu && menuDropdown) {

    botaoMenu.addEventListener("click", () => {
        menuDropdown.classList.toggle("ativo");
    });

    menuDropdown.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menuDropdown.classList.remove("ativo");
        });
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".menu-mobile")) {
            menuDropdown.classList.remove("ativo");
        }
    });
    async function atualizarLinkMeusPedidos() {

    const link =
        document.getElementById("linkMeusPedidos");

    if (!link) return;

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (user) {

        link.textContent =
            "Meus pedidos";

        link.href =
            "login.html";

        link.onclick = null;

    } else {

        link.textContent =
            "Como comprar";

        link.href =
            "#como-comprar";

        link.onclick = null;
    }
}
}
const campoBusca = document.getElementById("buscaProdutos");

if (campoBusca) {
    campoBusca.addEventListener("change", function () {
        const btnBuscarProdutos = document.getElementById("btnBuscarProdutos");

if (btnBuscarProdutos && campoBusca) {
    btnBuscarProdutos.addEventListener("click", function () {
        campoBusca.dispatchEvent(new Event("change"));

        document.getElementById("listaProdutos")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

        const termo = this.value
            .toLowerCase()
            .trim();

        const produtos =
            document.querySelectorAll(".product");

        produtos.forEach(produto => {

            const nome =
                produto.textContent.toLowerCase();

            produto.style.display =
                nome.includes(termo)
                    ? ""
                    : "none";
        });
    
    });
}
console.log("CAMPO BUSCA:", document.getElementById("buscaProdutos"));

/* =========================================
   PÊLAMODA — PASSARINHO NO SCROLL
========================================= */

const pmPassaro = document.getElementById("pmPassaro");

if (pmPassaro) {

    let ultimoScroll = window.scrollY;
    let voando = false;

    window.addEventListener("scroll", () => {

        const scrollAtual = window.scrollY;

        // Só dispara quando o usuário estiver descendo
        if (scrollAtual > ultimoScroll && !voando) {

            voando = true;

            // Reinicia a animação
            pmPassaro.style.animation = "none";

            void pmPassaro.offsetWidth;

            pmPassaro.style.animation =
                "pmPassaroVoo 4s ease-in-out forwards";

            // Quando terminar o voo, libera para o próximo
            setTimeout(() => {
                voando = false;
            }, 4200);
        }

        ultimoScroll = scrollAtual;
    });
}
