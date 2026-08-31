const produtos = {

    pe: {
        nome: "Mapa de Pernambuco",
        preco: 65,
        estoque: {
    Verde: {
        PP: 1,
        P: 1,
        M: 0,
        G: 0,
        GG: 1
    },

    Azul: {
        PP: 1,
        P: 0,
        M: 1,
        G: 1,
        GG: 0
    }
},

        descricao: "Nossa terra estampada no peito. Uma camisa inspirada em Pernambuco, feita para quem carrega orgulho de onde veio.",

        imagens: [
            "imagens/produto-pe.jpg",
            "imagens/produto-pe-azul.jpg",
            "imagens/produto-pe-verde.jpg"
        ],

        cores: [
            {
                nome: "Azul",
                imagem: "imagens/produto-pe-azul.jpg"
            },
            {
                nome: "Verde",
                imagem: "imagens/produto-pe-verde.jpg"
            }
        ]
    },


    oxente: {
        nome: "Oxente",
        preco: 65,
        estoque: {
    Preta: {
        PP: 1,
        P: 1,
        M: 0,
        G: 1,
        GG: 0
    },

    Bege: {
        PP: 0,
        P: 1,
        M: 0,
        G: 1,
        GG: 1
    },

    Rosa: {
        PP: 0,
        P: 0,
        M: 1,
        G: 0,
        GG: 0
    }
},

        descricao: "Tem coisa que só precisa de uma palavra: Oxente! Uma estampa com a identidade e o jeito arretado de falar do nosso Nordeste.",

        imagens: [
            "imagens/produto-oxente.jpg",
            "imagens/produto-oxente-areia.jpg",
            "imagens/produto-oxente-preta.jpg",
            "imagens/produto-oxente-rosa.jpg"
        ],

        cores: [
                      {
                nome: "Bege",
                imagem: "imagens/produto-oxente-areia.jpg"
            },
            {
                nome: "Preta",
                imagem: "imagens/produto-oxente-preta.jpg"
            },
            {
                nome: "Rosa",
                imagem: "imagens/produto-oxente-rosa.jpg"
            }
        ]
    },

    marminino: {
        nome: "Marminino",
        preco: 65,
estoque: {
    Azul: {
        PP: 0,
        P: 0,
        M: 1,
        G: 0,
        GG: 0
    },

    Preta: {
        PP: 1,
        P: 1,
        M: 1,
        G: 1,
        GG: 1
    },

    Vinho: {
        PP: 0,
        P: 0,
        M: 1,
        G: 0,
        GG: 0
    }
},
        descricao: "Marminino! Uma expressão que é a cara do nosso jeito de falar. Uma estampa nordestina, descontraída e cheia de identidade.",

       imagens: [
    "imagens/produto-marminino.jpg",
    "imagens/produto-marminino2.jpg",
    "imagens/produto-marminino-vinho.jpg"
],

        cores: [
    {
        nome: "Azul",
        imagem: "imagens/produto-marminino.jpg"
    },
    {
        nome: "Preta",
        imagem: "imagens/produto-marminino2.jpg"
    },
    {
        nome: "Vinho",
        imagem: "imagens/produto-marminino-vinho.jpg"
    }
]
    },
meupaispernambuco: {
    nome: "Meu País Pernambuco",
    preco: 65,

    estoque: {
        Azul: {
            PP: 0,
            P: 0,
            M: 1,
            G: 1,
            GG: 1
        }
    },

    descricao: "Meu país Pernambuco. Uma estampa para quem carrega no peito o orgulho e o amor pela nossa terra.",

    imagens: [
        "imagens/produto-meu-pais-pernambuco.jpg"
    ],

    cores: [
        {
            nome: "Azul",
            imagem: "imagens/produto-meu-pais-pernambuco.jpg"
        }
    ]
},
arretado: {
    nome: "Cabra Arretado",
    preco: 65,

    estoque: {
        Preta: {
            PP: 0,
            P: 0,
            M: 1,
            G: 0,
            GG: 0
        }
    },

    descricao: "Cabra Arretado! Uma estampa com identidade nordestina para quem carrega no peito o orgulho de ser arretado.",

    imagens: [
        "imagens/produto-arretado.jpg",
        "imagens/produto-arretado2.jpg"
    ],

    cores: [
        {
            nome: "Preta",
            imagem: "imagens/produto-arretado.jpg"
        }
    ]
},
mulearretada: {
    nome: "Mulé Arretada",
    preco: 65,

    estoque: {
        Rosa: {
            PP: 0,
            P: 0,
            M: 1,
            G: 0,
            GG: 0
        }
    },

    descricao: "Mule Arretada! Uma estampa cheia de personalidade e identidade nordestina.",

    imagens: [
        "imagens/produto-mule-arretada.jpg",
        "imagens/produto-mule-arretada2.jpg"
    ],

    cores: [
        {
            nome: "Rosa",
            imagem: "imagens/produto-mule-arretada.jpg"
        }
    ]
},
nordeste: {
    nome: "Nordeste",
    preco: 65,

    estoque: {
        Preta: {
            PP: 0,
            P: 1,
            M: 0,
            G: 0,
            GG: 0
        },

        Branca: {
            PP: 0,
            P: 2,
            M: 0,
            G: 0,
            GG: 0
        },

        Cinza: {
            PP: 0,
            P: 1,
            M: 0,
            G: 0,
            GG: 0
        }
    },

    descricao: "Camisa Nordeste. Uma estampa para quem carrega a identidade e o orgulho nordestino no peito.",

    imagens: [
        "imagens/produto-nordeste-preta.jpg",
        "imagens/produto-nordeste-branca.jpg",
        "imagens/produto-nordeste-cinza.jpg"
    ],

    cores: [
        {
            nome: "Preta",
            imagem: "imagens/produto-nordeste-preta.jpg"
        },
        {
            nome: "Branca",
            imagem: "imagens/produto-nordeste-branca.jpg"
        },
        {
            nome: "Cinza",
            imagem: "imagens/produto-nordeste-cinza.jpg"
        }
    ]
},
mulearretadaCropped: {
    nome: "Mulé Arretada Cropped",
    preco: 50,
    categoria: "cropped",

    estoque: {
        Preta: {
            PP: 2,
            P: 0,
            M: 0,
            G: 0,
            GG: 0
        },

        "Rosa Clara": {
            PP: 2,
            P: 0,
            M: 0,
            G: 0,
            GG: 0
        },

        Rosa: {
            PP: 0,
            P: 0,
            M: 2,
            G: 1,
            GG: 0
        }
    },

    descricao: "Nosso cropped Mulé Arretada, feito para quem carrega a força e o jeito arretado do Nordeste.",

    imagens: [
        "imagens/arretada-cropped-preta.jpg",
        "imagens/arretada-cropped-rosa.jpg",
        "imagens/arretada-cropped-rosa-clara.jpg",
        "imagens/mule-arretada.jpg"
    ],

    cores: [
        {
            nome: "Preta",
            imagem: "imagens/arretada-cropped-preta.jpg"
        },
        {
            nome: "Rosa",
            imagem: "imagens/arretada-cropped-rosa.jpg"
        },
        {
            nome: "Rosa Clara",
            imagem: "imagens/arretada-cropped-rosa-clara.jpg"
        }
    ]
},

oxenteCropped: {
    nome: "Oxente Cropped",
    preco: 50,
    categoria: "cropped",

    estoque: {
        Marrom: {
            PP: 0,
            P: 0,
            M: 1,
            G: 1,
            GG: 0
        },

        Rosa: {
            PP: 0,
            P: 0,
            M: 0,
            G: 1,
            GG: 0
        },

        Laranja: {
            PP: 0,
            P: 0,
            M: 0,
            G: 1,
            GG: 0
        }
    },

    descricao: "Oxente em versão cropped. Uma peça com identidade nordestina para vestir nosso jeito de falar e de ser.",

    imagens: [
        "imagens/oxente-cropped-marrom.jpg",
        "imagens/oxente-cropped-rosa.jpg",
        "imagens/Oxente-cropped-laranja.jpg"
    ],

    cores: [
        {
            nome: "Marrom",
            imagem: "imagens/oxente-cropped-marrom.jpg"
        },
        {
            nome: "Rosa",
            imagem: "imagens/oxente-cropped-rosa.jpg"
        },
        {
            nome: "Laranja",
            imagem: "imagens/Oxente-cropped-laranja.jpg"
        }
    ]
}
};
