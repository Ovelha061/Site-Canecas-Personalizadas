# Guia de comandos — CANECA+

Tudo o que você precisa para rodar, manter e publicar o site, e para pedir ajuda ao Claude Code.

---

## 1. Bibliotecas do site (Python)

Ficam na pasta `venv` e estão listadas no `requirements.txt`.

| Biblioteca | Para que serve no seu site |
|---|---|
| **Flask** | O "motor" do site: abre as páginas e recebe os pedidos da prévia com IA. |
| **python-dotenv** | Lê suas chaves secretas do arquivo `.env` (Cloudflare, WhatsApp). |
| **requests** | Faz o site conversar com a IA da Cloudflare. |
| **Pillow** | Abre e reduz a imagem que o cliente envia antes de mandar para a IA. |
| **gunicorn** | Servidor profissional usado quando o site for publicado na internet (Render, Railway). **Não roda no Windows** — no seu PC continue usando `python app.py`. |

### Bibliotecas que vêm pela internet (não precisa instalar)

| Biblioteca | Para que serve |
|---|---|
| **Three.js** | Desenha as canecas 3D que giram. |
| **Lenis** | Deixa a rolagem do mouse suave. |
| **GSAP + ScrollTrigger** | Animações ao rolar: títulos, abas, caneca e formulário surgem subindo suavemente quando aparecem na tela; os textos do topo entram um depois do outro ao abrir o site. |
| **canvas-confetti** | Chuva de confete nas cores do site quando o cliente envia a arte (prévia pronta) e quando clica em "Pedir pelo WhatsApp". |

Todas ficam no final do `templates/index.html` (tags `<script src="...">`). Quem ativou "reduzir animações" no sistema não vê animações nem confete.

### Como ajustar as animações (em `static/script.js`)

| O que mudar | Onde |
|---|---|
| Distância que os blocos sobem | `y: 40` dentro de `gsap.from(itens, ...)` |
| Velocidade | `duration: 0.9` (maior = mais lento) |
| Intervalo entre um bloco e outro | `stagger: 0.08` |
| Quando a animação começa | `start: "top 75%"` (a seção começa a animar ao chegar em 75% da altura da tela) |
| Quantidade de confete | `particleCount: 90` na função `comemorar()` |
| Cores do confete | lista `colors` na função `comemorar()` |
| Usar confete em outro lugar | chame `comemorar();` no código desejado |

### Caneca 3D (em `static/caneca3d.js`)

A caneca é modelada com as medidas reais de uma caneca de 325 ml (82 × 95 mm) e iluminada por um estúdio fotográfico virtual.

| O que mudar | Onde |
|---|---|
| Brilho geral da imagem | `toneMappingExposure` (1.25 hoje; maior = mais claro) |
| Cores da alça colorida | lista `CORES_HEX` no topo do arquivo |
| Folga entre a alça e a arte | `FOLGA_ALCA` (0.45) |
| Distância da câmera (tamanho da caneca na tela) | o `9.8` em `camera.position.set(...)` |
| Velocidade do giro automático | `0.004` em `velocidadeNormal` |
| Intensidade das luzes do estúdio | as linhas `softbox(...)` em `criarEstudio()` (3º número = intensidade) |

### Prensa 3D (em `static/prensa3d.js`) e oficina (em `static/script.js`)

| O que mudar | Onde |
|---|---|
| Medidas da prensa (altura da resistência, comprimento…) | objeto `MEDIDAS_PRENSA` no topo do `prensa3d.js` |
| Quanto a alavanca abre e fecha | `THREE.MathUtils.lerp(-0.55, 0.8, ...)` na função `atualizar()` do `prensa3d.js` |
| Brilho laranja da resistência quente | os números `0.35` / `0.9` em `atualizar()` do `prensa3d.js` |
| Ângulo inicial da mesa | `ANGULO_PADRAO` no `script.js` |
| Duração de cada etapa da prensagem | constantes `prensar` e `abrir` e os `duration` no clique do botão da prensa (`script.js`, seção 11) |
| Quanto a mesa balança parada | `0.22` (amplitude) em `loopAnimacao()` do `script.js` |

### Comandos (rode no terminal do VS Code, dentro da pasta `meu_site`)

| Comando | O que faz |
|---|---|
| `.\venv\Scripts\python.exe app.py` | **Liga o site.** Depois abra http://127.0.0.1:5000. Para desligar: `Ctrl+C`. |
| `.\venv\Scripts\activate` | Ativa a venv. Depois disso pode usar só `python` e `pip`. |
| `pip install nome-da-biblioteca` | Instala uma biblioteca nova (com a venv ativada). |
| `pip freeze > requirements.txt` | Atualiza a lista de bibliotecas. **Rode sempre que instalar algo novo.** |
| `pip install -r requirements.txt` | Instala tudo da lista (num computador novo ou servidor). |

### Ao publicar o site (Render / Railway)

- **Comando de instalação:** `pip install -r requirements.txt`
- **Comando de início:** `gunicorn app:app`
- **Variáveis de ambiente** (copie do seu `.env`, nunca envie o arquivo): `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `WHATSAPP_NUMERO`

---

## 2. Comandos do Claude Code

Digite no chat do Claude Code. Estes já vêm instalados — não precisa adicionar nada.

| Comando | Quando usar |
|---|---|
| `/code-review` | Pede uma revisão procurando **bugs** nas mudanças recentes. Use antes de publicar. |
| `/security-review` | Revisão de **segurança** (chaves expostas, uploads perigosos etc.). Use antes de publicar. |
| `/simplify` | Limpa e simplifica o código sem mudar o que ele faz. |
| `/run` | Pede para eu ligar o site e conferir se está funcionando. |
| `/compact` | Resume a conversa quando ela fica longa — **economiza tokens**. |
| `/clear` | Começa uma conversa do zero (use ao mudar de assunto). |
| `/init` | Cria um arquivo `CLAUDE.md` com um resumo do projeto, para eu entender o site mais rápido em conversas novas. |
| `/plugin` | Abre o gerenciador de plugins, para procurar e instalar plugins extras. |

### Skill instalada

| Skill | O que faz |
|---|---|
| **karpathy-guidelines** | Me faz escrever código mais simples, mexer só no necessário e perguntar quando algo estiver ambíguo. Usada automaticamente em tarefas de código. |

---

## 3. Dicas rápidas

- Mudou o **HTML** (`templates/index.html`) ou o **app.py**? Reinicie o site (`Ctrl+C` e ligue de novo).
- Mudou só **CSS** ou **JavaScript**? Basta atualizar o navegador com `Ctrl+F5`.
- Nunca compartilhe o arquivo `.env` — ele tem suas chaves secretas.
