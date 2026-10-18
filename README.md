# CANECA+ | Oficina Virtual de Sublimação 3D

Site de personalização de canecas por sublimação com uma **prensa térmica 3D interativa no navegador**. O cliente escolhe o modelo, envia a arte, aciona a prensa e vê a caneca pronta girando em 360° antes de pedir.

> Projeto real, feito para uma loja de canecas personalizadas. Ver antes de comprar.

## Funcionalidades

- **Três modelos** (Tradicional, Alça Colorida e Mágica termossensível) com preços e opções de cor.
- **Prensa térmica 3D** feita com Three.js: a arte do cliente é aplicada na caneca e a sublimação acontece em tempo real.
- **Prévia 360°** da caneca pronta antes do pedido.
- **Foto de estúdio por IA** como extra opcional, com limite de uso por pessoa por dia.
- **Pedido pelo WhatsApp** com o resumo (modelo, cor, preço) já preenchido.
- **Página de pedido** (`/pedidos/<código>`) com a arte enviada e a prévia.
- **Rádio lo-fi** gerada no navegador com a Web Audio API.
- Efeitos sonoros e confete ao concluir a prensagem.

## Tecnologias

| Camada | Stack |
|---|---|
| Backend | Python, Flask |
| 3D | Three.js r128 |
| Animações | GSAP |
| Interface | HTML, CSS puro (Vanilla CSS) |
| Áudio | Web Audio API |
| Integrações | API de geração de imagem (Cloudflare FLUX) e WhatsApp |

## Estrutura

```
├── app.py              # Servidor Flask, rotas, pedidos e geração de imagem
├── templates/
│   ├── index.html      # Oficina virtual (página principal)
│   └── pedido.html     # Página de consulta de pedido
├── static/
│   ├── caneca3d.js     # Modelo 3D da caneca
│   ├── prensa3d.js     # Prensa térmica 3D
│   ├── bancada3d.js    # Cena da bancada
│   ├── lofi.js         # Rádio lo-fi (Web Audio API)
│   ├── script.js       # Fluxo da oficina
│   └── style.css       # Estilos
└── requirements.txt
```

## Como rodar localmente

1. Clone o repositório e crie um ambiente virtual:
   ```bash
   python -m venv venv
   venv\Scripts\activate        # Windows
   pip install -r requirements.txt
   ```
2. Crie um arquivo `.env` na raiz com as variáveis necessárias:
   ```env
   WHATSAPP_NUMERO=5511999999999
   # chaves de API da geração de imagem (ver app.py)
   ```
3. Rode o servidor:
   ```bash
   python app.py
   ```
4. Acesse `http://localhost:5000`.

## Decisões técnicas

- **3D no navegador, sem servidor pesado:** a prensa e a caneca são renderizadas com Three.js, então o backend só cuida de rotas, pedidos e da chamada à API de imagem.
- **Prévia antes da compra:** a proposta do produto é reduzir a insegurança de quem compra personalização online. Por isso a visualização 3D vem antes do pedido.
- **Limite de uso por IP:** a geração de foto por IA tem cota diária por pessoa para controlar custo.
- **Pedidos salvos em pasta:** cada pedido gera uma pasta com a arte, a prévia e um `pedido.json`, o que dispensa banco de dados nesta fase.

## Próximos passos

- Checkout e pagamento direto no site (Pix e cartão), hoje o pedido sai pelo WhatsApp.
- Cálculo de frete por CEP.

## Autor

Iago Lucas Maniglia · [GitHub](https://github.com/iagomaniglia) · [LinkedIn](https://linkedin.com/in/iagomaniglia)
