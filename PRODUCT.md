# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Três públicos confirmados, todos com o mesmo trabalho a fazer: transformar uma arte ou foto numa caneca personalizada e ter confiança no resultado antes de pagar.

- **Quem compra presente:** aniversários, Dia das Mães, Dia dos Namorados, amigo secreto. Quer algo pessoal e bonito, que chegue a tempo.
- **Quem compra para si:** fãs e nichos (geek, café, pets, frases). Quer uma caneca "com a sua cara".
- **Empresas e eventos:** brindes, kits corporativos e lembrancinhas em quantidade.

## Product Purpose

A CANECA+ vende canecas de cerâmica personalizadas por sublimação, com envio para todo o Brasil. O site permite escolher o modelo, enviar a arte e ver a caneca pronta antes de pedir. Sucesso é o cliente fechar o pedido confiante de que vai receber exatamente o que viu.

## Positioning

**Ver antes de comprar.** A oficina virtual 3D simula a prensa de sublimação e mostra a caneca pronta, com a arte do próprio cliente, girável em 360°, antes do pedido.

## Operating Context

- Fluxo atual do site: escolher o modelo → enviar a arte (ou usar uma arte de teste) → acionar a prensa térmica 3D → revelação da caneca pronta → pedido.
- Canais de pedido: segundo a dona do produto, os pedidos são fechados **pelo site e pelo WhatsApp**. No código atual, o site ainda não tem checkout nem pagamento; o pedido sai pelo botão do WhatsApp com o resumo (modelo, cor, preço). **Checkout no site: em aberto.**
- Foto de estúdio por IA (Cloudflare FLUX) como extra opcional, limitada a 2 por pessoa por dia.

## Capabilities and Constraints

- Modelos e preços atuais: **Tradicional** R$ 34,90 · **Alça Colorida** R$ 39,90 (alça e interior em vermelho, azul, preto, amarelo, verde ou rosa) · **Mágica** R$ 49,90 (termossensível: preta quando fria, revela a arte com bebida quente).
- Arte do cliente: JPG, PNG ou WEBP, até 8 MB.
- Envio para todo o Brasil, com **frete calculado pelo CEP** (Correios ou transportadora).
- **Produção: 5 a 7 dias úteis** depois do pedido confirmado; a entrega depende da região.
- **Pagamento: Pix e cartão de crédito.**
- **Pedidos em quantidade: desconto progressivo a partir de 20 canecas**, combinado pelo WhatsApp (canal assumido; não contestado).
- Fatos confirmados pela dona do produto: cerâmica de alta qualidade ("Classe AAA"); sublimação a 200 °C; a estampa não descasca; Tradicional e Alça Colorida vão ao micro-ondas e à lava-louças; a Mágica pede lavagem suave, sem esponja de aço.
- Site em português do Brasil; Flask (Python) com Three.js no navegador.

## Brand Commitments

- Nome: **CANECA+** (em uso).
- A logo atual (monograma "AP") é **provisória**: não construir a identidade em torno dela; pode ser substituída.

## Evidence on Hand

- **Ainda não há clientes.** Não existem depoimentos, avaliações, números de vendas nem fotos de clientes. Nenhuma prova social deve ser inventada.
- Fotos de produto em `static/` (`caneca-tradicional.jpg`, `caneca-colorida.jpg`, `caneca-magica.jpg`); origem (foto real ou gerada) não confirmada.
- Modelos 3D próprios da caneca e da prensa (`static/caneca3d.js`, `static/prensa3d.js`) e três artes de demonstração no `static/script.js`.

## Product Principles

1. **Mostrar antes de vender:** toda escolha que muda o produto (modelo, cor, arte) precisa ser vista na caneca 3D antes do pedido.
2. **O que aparece é o que chega:** a prévia deve ser fiel ao produto físico (cores, área de impressão, modelos). Efeito visual nunca pode prometer algo que a caneca real não entrega.
3. **Um caminho, três públicos:** presente, uso próprio e empresas usam o mesmo fluxo; pedidos em quantidade não podem ficar escondidos.
4. **Confiança sem prova social inventada:** enquanto não houver clientes, a confiança vem de transparência sobre processo, materiais, preços e prazos.
