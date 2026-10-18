---
target: templates/index.html (oficina virtual 3D)
total_score: 22
max_score: 36
na_heuristics: 7
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\iagom\\OneDrive\\Documentos\\meu_site\\templates\\index.html"
target_fingerprint: "sha256:31aed92ccad60a1714f5c7aedd0cc7de4576b781deb1ad121589af7c3eb18834"
target_path: "C:\\Users\\iagom\\OneDrive\\Documentos\\meu_site\\templates\\index.html"
timestamp: 2026-10-18T05-28-11Z
slug: templates-index-html
closed: true
---
⚠️ DEGRADED: single-context (subagentes não usados: só os crio quando o usuário pede, e eles custariam mais tokens)

## Crítica de design: Oficina Virtual 3D (`templates/index.html`)

Modo da página: **Persuadir** (o visitante decide e compra). Avaliação sobre o site renderizado no desktop (início, arte enviada, prensando, revelação, caneca mágica e "Como Funciona") e o código.

### Nota de saúde do design

| # | Heurística | Nota | Principal problema |
|---|---|---|---|
| 1 | Visibilidade do status | 3 | LEDs, status e a própria prensa mostram cada etapa, mas o botão final do WhatsApp falha em silêncio |
| 2 | Correspondência com o mundo real | 3 | A metáfora da prensa é imediata; "papel sublimático" e "prensar" não são explicados no fluxo |
| 3 | Controle e liberdade | 3 | Modais fecham por X, Esc e clique fora; existem "Trocar Imagem" e "Prensá-la Novamente" |
| 4 | Consistência e padrões | 2 | Seis estilos de botão diferentes, ícones em emoji, brilhos de várias cores |
| 5 | Prevenção de erros | 2 | A prensa fica travada até ter arte (bom), mas não há checagem de 8 MB e o botão de IA aceita arte de teste e só depois avisa com alert() |
| 6 | Reconhecer em vez de lembrar | 3 | Passos numerados e preços à vista, mas o pedido pede para o cliente reenviar a arte no WhatsApp |
| 7 | Flexibilidade e eficiência | n/a | Página de venda (Persuadir); os chips de arte pronta já servem de atalho |
| 8 | Estética e minimalismo | 2 | A prensa é forte, mas disputa com brilhos neon, animações que nunca param e um vazio no 3º cartão |
| 9 | Recuperação de erros | 2 | alert() nativo para arquivo inválido e nenhuma orientação quando não há como pedir |
| 10 | Ajuda e documentação | 2 | "Como Funciona" existe, mas não responde frete, prazo, pagamento nem pedidos em quantidade |
| **Total** | | **22/36** | **Aceitável (61%)** |

### Veredito de especificidade

**Avaliação de design:** dividido em duas partes. A prensa e a caneca em 3D são autorais: esse palco não serviria para outro produto, e o ciclo papel → prensa → revelação conta exatamente o que a CANECA+ faz. A moldura em volta é genérica: cartões de vidro fosco, botões em degradê azul-roxo, cabeçalho em pílula e ícones em emoji formam o visual padrão de "app escuro feito por IA". O painel de LED (VT323) é a exceção que liga a interface à máquina, mas hoje duplica o visor da caixa 3D em vez de conversar com ele.

**Detector:** 13 achados no index.html renderizado: 7 brilhos coloridos (anel azul da logo, botão de modelo ativo, botão de prensar pronto, sombra verde do WhatsApp, LEDs âmbar e verde), 2 textos funcionais de 10 px ("TEMPERATURA", "TEMPO"), 1 card dentro de card, 1 título pulado (h2 → h4 no "Como Funciona") e 2 imagens sem src. Em rodada anterior, apontou o easing elástico (--ease-spring) como datado. Falsos positivos: as 2 imagens sem src (preenchidas por JavaScript) e os brilhos dos LEDs (imitam LED real).

**Sobreposição no navegador:** não disponível nesta sessão; foram usadas capturas de tela.

### Impressão geral

A oficina é memorável e entrega o diferencial "ver antes de comprar". O problema é o final: depois da revelação, o cliente esbarra num botão que não faz nada, sem saber frete nem prazo. A maior oportunidade é deixar o pedido tão bem resolvido quanto a prensa.

### O que está funcionando

1. A prensa conta a história do produto: papel com fitas térmicas, entrada na resistência, contagem no visor e revelação explicam a sublimação sem texto.
2. Sequência guiada: passos 1-2-3 numerados e prensa travada até haver arte.
3. A revelação acontece na hora da decisão: caneca final em 3D girável com resumo de modelo e preço.

### Problemas prioritários

**[P0] Não há como fechar o pedido.** WHATSAPP_NUMERO ausente no .env: o botão "Pedir Esta Caneca no WhatsApp" não tem destino e o do cabeçalho some; não existe checkout no site (o PRODUCT.md diz que pedidos fecham por lá também). Correção: configurar o número; sem canal, mostrar mensagem clara em vez de botão morto; decidir o checkout. Comando: /impeccable harden

**[P1] A arte não vai junto com o pedido.** A mensagem diz "Vou enviar minha arte aqui": o cliente reenvia o arquivo e nada garante que é a mesma arte da prévia. Correção: enviar arte e prévia ao servidor no pedido e incluir um código na mensagem. Comando: /impeccable harden

**[P1] Faltam as respostas que decidem a compra.** Sem frete, prazo, pagamento ou caminho para pedidos em quantidade (só uma linha no FAQ). Correção: faixa curta junto ao pedido com prazo, frete e pagamento (valores reais a definir) e um caminho visível de "pedido para empresa". Comando: /impeccable clarify

**[P1] Afirmações não confirmadas aparecem como fato.** "Cerâmica Classe AAA", "Produção Express", "nunca descasca", micro-ondas e descontos progressivos, sem confirmação e sem clientes ainda. Correção: confirmar ou remover cada uma; trocar por fatos verificáveis do processo. Comando: /impeccable clarify

**[P2] Moldura genérica e excesso de movimento competem com a prensa.** Brilhos neon, degradês, emojis e quatro animações contínuas; sem prefers-reduced-motion; rótulos de 10–12 px. Correção: brilhos só nos LEDs, ícones consistentes, no máximo uma animação contínua, respeitar reduced motion, rótulos de pelo menos 13 px. Comandos: /impeccable quieter, /impeccable typeset

### Alertas por persona

- Jordan (primeira vez): não sabe o que é "papel sublimático" nem "prensar"; recebe alert() com arquivo errado; no fim, "Pedir no WhatsApp" não faz nada.
- Casey (celular): 3D de 380 px e três cartões empilhados deixam o botão de prensar no fim da página; Three.js com dois modelos e cálculo de sombras pesa em celular fraco.
- Sam (teclado/leitor de tela): o input de arquivo tem hidden e não recebe foco, então não dá para enviar a própria arte só com teclado; falta aria-pressed em modelos e cores; título pulado.
- Ana, presente de última hora (PRODUCT.md): procura prazo e frete, não acha, compra pronta em outro lugar.
- Carlos, compras de empresa (PRODUCT.md): fluxo de uma caneca só; descontos escondidos no FAQ, sem botão.

### Observações menores

- Vazio grande no 3º cartão entre o visor e o botão.
- Easing elástico (--ease-spring) nos modais e na logo.
- "Prensá-la Novamente" soa estranho; "Prensar outra caneca" é mais natural.
- Rótulos longos em caixa-alta leem mais devagar.
- O heat-glow tinge a cena de salmão durante a prensagem.
- O navegador não checa os 8 MB.
- Logo "AP" provisória no lugar mais visível do cabeçalho.
- Card dentro de card confunde as camadas.

### Perguntas para considerar

- E se o painel da caixa de controle 3D fosse o botão de prensar?
- Como a arte do cliente chega sem ele precisar mandá-la de novo?
- O que quem compra presente precisa ler antes do botão de pedir?
- A oficina precisa dos três cartões ao mesmo tempo, ou pode guiar um passo por vez no celular?

Notas de método: parte da saída do detector foi vista antes da avaliação A (na instalação); teste de celular limitado (janela mínima de ~490 px no navegador de teste).
