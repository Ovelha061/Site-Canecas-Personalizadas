---
target: templates/index.html (oficina virtual 3D)
total_score: 29
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\iagom\\OneDrive\\Documentos\\meu_site\\templates\\index.html"
target_fingerprint: "sha256:d37c5349e66e9acbbc2aa51e42370dc41e2b9d0d044f6ac5a7f2a0e3f30c1632"
target_path: "C:\\Users\\iagom\\OneDrive\\Documentos\\meu_site\\templates\\index.html"
timestamp: 2026-10-18T06-33-57Z
slug: templates-index-html
---
⚠️ DEGRADED: single-context (subagentes não usados: só os crio quando o usuário pede)

## Crítica de design, 2ª rodada: Oficina Virtual 3D

| # | Heurística | Nota | Ponto |
|---|---|---|---|
| 1 | Status | 4 | Prensa, LEDs, botão e "Preparando seu pedido…" |
| 2 | Mundo real | 3 | "Sublimação" ainda técnico no título do FAQ |
| 3 | Controle | 3 | Não dá para cancelar a prensagem (7 s) |
| 4 | Consistência | 3 | Ícones e botões unificados; cobalto sobra no "+" do logo |
| 5 | Prevenção de erros | 3 | Checagem de 8 MB/tipo; IA sem arte de teste |
| 6 | Reconhecimento | 4 | Arte vai sozinha com o pedido |
| 7 | Flexibilidade | n/a | Página de venda |
| 8 | Estética | 3 | Bancada coesa; visor duplica o da prensa 3D |
| 9 | Recuperação | 3 | Erros na tela; mensagem reserva no pedido |
| 10 | Ajuda | 3 | FAQ completo; sem política de troca |
| Total | | 29/36 | Bom (81%) |

Especificidade: a moldura pertence à máquina (painéis de chapa, plaquinhas creme, botão vermelho da manopla). Detector: 7 avisos explicados (4 brilhos de LED e 1 visor embutido intencionais; 2 imagens via JS, falso positivo).

Problemas prioritários:
- [P1] Link do pedido só funciona após publicar (127.0.0.1). Hospedagem, fora do escopo de design.
- [P2] Artes de teste largas cortam o texto na frente da caneca ("EO INFINITO"). /impeccable polish
- [P2] Celular sem verificação real; 3D pesado em aparelhos fracos. /impeccable adapt, /impeccable optimize
- [P3] Painel de LED da página duplica o visor da prensa 3D. /impeccable distill

Menores: logo "AP" provisória em destaque; sem cancelar a prensagem; som ligado por padrão.
Perguntas: garantia de troca daria confiança? O LED da página ainda é necessário?
