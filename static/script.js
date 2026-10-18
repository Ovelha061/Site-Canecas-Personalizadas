/**
 * CANECA+ | OFICINA DE SUBLIMAÇÃO VIRTUAL 3D
 * Engine de simulação com Three.js, GSAP e Web Audio API
 */

// ============================================================================
// 1. SISTEMA DE ÁUDIO TÁTIL (Web Audio API nativo — Sem arquivos externos)
// ============================================================================
let audioCtx = null;
let somAtivado = true;

function obterAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

const AudioFX = {
    click() {
        if (!somAtivado) return;
        const ctx = obterAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
    },

    beep(freq = 1750, duracao = 0.08) {
        if (!somAtivado) return;
        const ctx = obterAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duracao);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duracao);
    },

    alavancaClack() {
        if (!somAtivado) return;
        const ctx = obterAudioContext();
        if (!ctx) return;
        // Impacto mecânico metálico com ruído
        const bufferSize = ctx.sampleRate * 0.12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.12);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.Q.setValueAtTime(3, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        osc.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        osc.start();
        noise.stop(ctx.currentTime + 0.12);
        osc.stop(ctx.currentTime + 0.12);
    },

    vapor() {
        if (!somAtivado) return;
        const ctx = obterAudioContext();
        if (!ctx) return;
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1600, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(600, ctx.currentTime + 1.5);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noise.stop(ctx.currentTime + 1.5);
    },

    sucesso() {
        if (!somAtivado) return;
        const acordes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        acordes.forEach((nota, i) => {
            setTimeout(() => AudioFX.beep(nota, 0.18), i * 90);
        });
    }
};

// ============================================================================
// 2. MOTOR 3D DA OFICINA (Three.js)
// A prensa vem de static/prensa3d.js e a caneca realista de static/caneca3d.js.
// ============================================================================
const container3D = document.getElementById("canvas-3d");
const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, container3D.clientWidth / container3D.clientHeight, 0.1, 100);

const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
// Em telas pequenas, resolução um pouco menor: alivia celulares fracos.
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 640 ? 1.5 : 2));
renderizador.outputEncoding = THREE.sRGBEncoding;
// Resposta linear: as cores da arte saem fiéis ao arquivo do cliente.
renderizador.toneMapping = THREE.LinearToneMapping;
renderizador.toneMappingExposure = 1.25;
container3D.appendChild(renderizador.domElement);

// Estúdio fotográfico virtual (o mesmo da caneca) para reflexos realistas
const pmrem = new THREE.PMREMGenerator(renderizador);
cena.environment = pmrem.fromScene(criarEstudio(), 0.04).texture;
pmrem.dispose();

const anisotropia = renderizador.capabilities.getMaxAnisotropy();

// ============================================================================
// 3. A BANCADA: PRENSA TÉRMICA + CANECA
// ============================================================================
// A mesa gira com o mouse/dedo; o conteúdo é deslocado para ela girar em
// torno do centro do conjunto (prensa + caneca de pé na bancada).
const ANGULO_PADRAO = -0.55; // vista de frente-direita, como nas fotos de prensa
const grupoMesa = new THREE.Group();
grupoMesa.rotation.y = ANGULO_PADRAO;
cena.add(grupoMesa);

const conteudoMesa = new THREE.Group();
conteudoMesa.position.set(0.65, 0, 0.4);
grupoMesa.add(conteudoMesa);

// Foco de luz suave no tampo da bancada
const telaFoco = document.createElement("canvas");
telaFoco.width = telaFoco.height = 256;
const ctxFoco = telaFoco.getContext("2d");
const gradienteFoco = ctxFoco.createRadialGradient(128, 128, 0, 128, 128, 128);
gradienteFoco.addColorStop(0, "rgba(255, 255, 255, 0.08)");
gradienteFoco.addColorStop(1, "rgba(255, 255, 255, 0)");
ctxFoco.fillStyle = gradienteFoco;
ctxFoco.fillRect(0, 0, 256, 256);

const focoBancada = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(telaFoco), transparent: true, depthWrite: false, toneMapped: false })
);
focoBancada.rotation.x = -Math.PI / 2;
grupoMesa.add(focoBancada);

const prensa = criarModeloPrensa({ anisotropia });
conteudoMesa.add(prensa.grupo, prensa.sombra);

const canecaOficina = criarModeloCaneca({ anisotropia });
canecaOficina.definir({ impressa: false });
conteudoMesa.add(canecaOficina.grupo);

// Objetos vivos da bancada (static/bancada3d.js): luminária e rádio clicáveis.
// A luminária fica atrás da caneca, debruçada sobre a prensa; o rádio, à
// direita da caixa de controle, virado para a câmera.
const luminaria = criarLuminaria({
    base: new THREE.Vector3(-6.2, 0, -0.1),
    cabeca: new THREE.Vector3(-2.3, 4.7, -0.7),
    alvo: prensa.centroResistencia.clone()
});
conteudoMesa.add(luminaria.grupo, luminaria.efeitos);

const radio = criarRadio();
radio.grupo.position.set(4.6, 0, 0.9);
radio.grupo.rotation.y = -ANGULO_PADRAO;
conteudoMesa.add(radio.grupo);

// Playlists lo-fi (static/lofi.js); a aba e o rádio 3D acompanham cada mudança.
const lofi = criarLofi(obterAudioContext, () => atualizarRadio());

// Poses da caneca: de pé na bancada, deitada na entrada do suporte em "U" e
// dentro da resistência (alça para cima, saindo pela fenda).
const DEITADA = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));

const POSES = {
    bancada: {
        posicao: new THREE.Vector3(-4.05, -BASE, 0.75),
        rotacao: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.35)
    },
    entrada: { posicao: new THREE.Vector3(-3.7, prensa.centroResistencia.y, 0), rotacao: DEITADA },
    prensa: { posicao: prensa.centroResistencia.clone(), rotacao: DEITADA }
};

// Sombras da caneca quando ela está de pé na bancada
const sombrasCaneca = new THREE.Group();
sombrasCaneca.position.copy(POSES.bancada.posicao);
sombrasCaneca.quaternion.copy(POSES.bancada.rotacao);
sombrasCaneca.add(canecaOficina.sombraCorpo, canecaOficina.sombraAlca);
conteudoMesa.add(sombrasCaneca);

// Caminho da caneca: 0 = de pé na bancada, 1 = dentro da prensa. Ela sobe,
// deita e entra pelo suporte em "U", deslizando ao longo da resistência.
const voo = { t: 0 };

function posicionarCaneca() {
    const grupo = canecaOficina.grupo;

    if (voo.t < 0.6) {
        const k = THREE.MathUtils.smoothstep(voo.t / 0.6, 0, 1);
        grupo.position.lerpVectors(POSES.bancada.posicao, POSES.entrada.posicao, k);
        grupo.position.y += Math.sin(Math.PI * k) * 1.2;
        grupo.quaternion.copy(POSES.bancada.rotacao).slerp(POSES.entrada.rotacao, k);
    } else {
        const k = THREE.MathUtils.smoothstep((voo.t - 0.6) / 0.4, 0, 1);
        grupo.position.lerpVectors(POSES.entrada.posicao, POSES.prensa.posicao, k);
        grupo.quaternion.copy(POSES.prensa.rotacao);
    }

    // As sombras somem assim que a caneca sai da bancada.
    const opacidade = 1 - THREE.MathUtils.clamp(voo.t / 0.25, 0, 1);
    sombrasCaneca.children.forEach((sombra) => (sombra.material.opacity = opacidade));
}

posicionarCaneca();

// ============================================================================
// 4. ENQUADRAMENTO AUTOMÁTICO DA CÂMERA
// Afasta a câmera até a prensa e a caneca caberem inteiras na tela, em
// qualquer proporção (do celular ao monitor largo).
// ============================================================================
const ELEVACAO_CAMERA = THREE.MathUtils.degToRad(17);

// Cantos das peças (prensa, caneca de pé, luminária e rádio) no espaço da cena.
function pontosDoConjunto() {
    const pontos = [];
    const caixa = new THREE.Box3();
    const canto = new THREE.Vector3();

    // Mede sempre na vista padrão, com a caneca de pé na bancada (mesmo se a
    // mesa estiver girada ou a caneca estiver no meio do voo).
    const tVoo = voo.t;
    const anguloMesa = grupoMesa.rotation.y;
    voo.t = 0;
    posicionarCaneca();

    grupoMesa.rotation.y = ANGULO_PADRAO;
    grupoMesa.updateMatrixWorld(true);

    [prensa.grupo, canecaOficina.grupo, luminaria.grupo, radio.grupo].forEach((objeto) => {
        objeto.traverse((malha) => {
            if (!malha.isMesh) return;
            if (!malha.geometry.boundingBox) malha.geometry.computeBoundingBox();
            caixa.copy(malha.geometry.boundingBox);
            for (let i = 0; i < 8; i++) {
                canto.set(i & 1 ? caixa.max.x : caixa.min.x, i & 2 ? caixa.max.y : caixa.min.y, i & 4 ? caixa.max.z : caixa.min.z);
                pontos.push(canto.clone().applyMatrix4(malha.matrixWorld));
            }
        });
    });

    voo.t = tVoo;
    posicionarCaneca();
    grupoMesa.rotation.y = anguloMesa;
    return pontos;
}

function enquadrarCamera() {
    const largura = container3D.clientWidth;
    const altura = container3D.clientHeight;
    renderizador.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();

    const pontos = pontosDoConjunto();
    const centro = new THREE.Box3().setFromPoints(pontos).getCenter(new THREE.Vector3());
    const direcao = new THREE.Vector3(0, Math.sin(ELEVACAO_CAMERA), Math.cos(ELEVACAO_CAMERA));
    const projetado = new THREE.Vector3();

    // Busca binária da menor distância em que tudo cabe (com margem nas bordas).
    let perto = 2;
    let longe = 80;
    for (let i = 0; i < 28; i++) {
        const distancia = (perto + longe) / 2;
        camera.position.copy(centro).addScaledVector(direcao, distancia);
        camera.lookAt(centro);
        camera.updateMatrixWorld();

        const cabe = pontos.every((p) => {
            projetado.copy(p).project(camera);
            return Math.abs(projetado.x) <= 0.95 && Math.abs(projetado.y) <= 0.86;
        });

        if (cabe) longe = distancia;
        else perto = distancia;
    }

    camera.position.copy(centro).addScaledVector(direcao, longe);
    camera.lookAt(centro);
}

// ============================================================================
// 6. ESTADO DA OFICINA E INTERAÇÕES
// ============================================================================
const Estado = {
    modelo: "tradicional",
    cor: "vermelho",
    arteImg: null,
    arteCarregada: false,
    arteArquivo: null, // arquivo original enviado (null nas artes de teste)
    prensando: false,
    concluido: false,
    som: true
};

// ============================================================================
// 7. AS CANECAS: A DA OFICINA E A DO MODAL DE REVELAÇÃO
// ============================================================================
let canecaModal = null; // criada na primeira vez que o modal abre

function atualizarCoresEMateriais() {
    const visual = { tipo: Estado.modelo, cor: Estado.cor };
    canecaOficina.definir(visual);
    if (canecaModal) canecaModal.definir(visual);
}

// Inicia caneca com visual padrão
atualizarCoresEMateriais();

// ============================================================================
// 8. ROTAÇÃO COM O MOUSE / DEDO (INÉRCIA SUAVE)
// ============================================================================
let arrastando = false;
let ultimoX = 0;

container3D.addEventListener("pointerdown", (e) => {
    arrastando = true;
    ultimoX = e.clientX;
    container3D.setPointerCapture(e.pointerId);
});

container3D.addEventListener("pointermove", (e) => {
    if (!arrastando) return;
    const delta = (e.clientX - ultimoX) * 0.008;
    grupoMesa.rotation.y += delta;
    ultimoX = e.clientX;
});

// O arraste termina também se o navegador cancelar o gesto (rolagem no
// celular), perder a captura do ponteiro ou a janela perder o foco.
["pointerup", "pointercancel", "lostpointercapture"].forEach((evento) => {
    container3D.addEventListener(evento, () => {
        arrastando = false;
    });
});
window.addEventListener("blur", () => {
    arrastando = false;
});

window.addEventListener("resize", enquadrarCamera);
enquadrarCamera();

function loopAnimacao() {
    requestAnimationFrame(loopAnimacao);
    // A mesa fica parada: só gira enquanto a pessoa arrasta.
    radio.animar();
    renderizador.render(cena, camera);
}
loopAnimacao();

// ---------- Cliques nos objetos vivos da bancada ----------
const raioCena = new THREE.Raycaster();
const ponteiroCena = new THREE.Vector2();
let toqueCena = null;
const luzLuminaria = { t: 0 }; // 0 = estúdio aceso, 1 = modo noturno

// Qual objeto clicável está sob o ponteiro ("luminaria", "radio" ou null)
function objetoSobPonteiro(evento) {
    const caixa = container3D.getBoundingClientRect();
    ponteiroCena.set(
        ((evento.clientX - caixa.left) / caixa.width) * 2 - 1,
        -((evento.clientY - caixa.top) / caixa.height) * 2 + 1
    );
    raioCena.setFromCamera(ponteiroCena, camera);
    const acerto = raioCena.intersectObjects([...luminaria.pecas, ...radio.pecas])[0];
    if (!acerto) return null;
    return luminaria.pecas.includes(acerto.object) ? "luminaria" : "radio";
}

// Luminária: apaga as luzes do estúdio e acende o facho sobre a prensa
const palco3D = document.getElementById("viewport-container");

function aplicarLuz() {
    const t = luzLuminaria.t;
    renderizador.toneMappingExposure = 1.25 - 0.93 * t;
    luminaria.definirLuz(t);
    focoBancada.material.opacity = 1 - t;
}

function alternarLuminaria() {
    AudioFX.click();
    const acender = luzLuminaria.t < 0.5;
    palco3D.classList.toggle("noturno", acender);
    gsap.to(luzLuminaria, { t: acender ? 1 : 0, duration: 0.8, ease: "power2.out", onUpdate: aplicarLuz });
}

// Toca uma faixa das playlists (se o som estiver mudo, liga o som antes)
function tocarLofi(playlist, faixa) {
    if (!somAtivado) btnSom.click();
    lofi.tocar(playlist, faixa);
}

// Rádio: liga/desliga a faixa atual
function alternarRadio() {
    if (lofi.tocando()) {
        lofi.parar();
        AudioFX.click();
    } else {
        tocarLofi();
    }
}

container3D.addEventListener("pointerdown", (evento) => {
    toqueCena = { x: evento.clientX, y: evento.clientY };
});

container3D.addEventListener("pointerup", (evento) => {
    if (!toqueCena) return;
    const moveu = Math.hypot(evento.clientX - toqueCena.x, evento.clientY - toqueCena.y);
    toqueCena = null;
    if (moveu >= 6) return; // foi um arraste para girar, não um clique

    const objeto = objetoSobPonteiro(evento);
    if (objeto === "luminaria") alternarLuminaria();
    if (objeto === "radio") alternarRadio();
});

container3D.addEventListener("pointermove", (evento) => {
    if (!arrastando) container3D.style.cursor = objetoSobPonteiro(evento) ? "pointer" : "";
});

// ============================================================================
// 9. ARTES DE DEMONSTRAÇÃO PRONTAS
// ============================================================================
function gerarArteDemo(tipo) {
    const tela = document.createElement("canvas");
    // Quase quadrada, como a frente visível da caneca: o texto não corta.
    tela.width = 1000;
    tela.height = 800;
    const c = tela.getContext("2d");

    if (tipo === "cafe") {
        const grad = c.createLinearGradient(0, 0, tela.width, tela.height);
        grad.addColorStop(0, "#1f2937");
        grad.addColorStop(1, "#111827");
        c.fillStyle = grad;
        c.fillRect(0, 0, tela.width, tela.height);

        c.fillStyle = "#5266eb";
        c.font = "800 88px 'Archivo', sans-serif";
        c.textAlign = "center";
        c.fillText("while (alive) {", tela.width / 2, 280);
        c.fillStyle = "#f3f4f6";
        c.fillText("drink(COFFEE);", tela.width / 2, 420);
        c.fillStyle = "#5266eb";
        c.fillText("}", tela.width / 2, 560);
    } else if (tipo === "universo") {
        const grad = c.createLinearGradient(0, 0, tela.width, tela.height);
        grad.addColorStop(0, "#0f172a");
        grad.addColorStop(0.5, "#4338ca");
        grad.addColorStop(1, "#701a75");
        c.fillStyle = grad;
        c.fillRect(0, 0, tela.width, tela.height);

        for (let i = 0; i < 40; i++) {
            c.beginPath();
            c.arc(Math.random() * tela.width, Math.random() * tela.height, Math.random() * 8 + 2, 0, Math.PI * 2);
            c.fillStyle = "rgba(255,255,255,0.7)";
            c.fill();
        }

        c.fillStyle = "#ffffff";
        c.font = "800 120px 'Archivo', sans-serif";
        c.textAlign = "center";
        c.fillText("EXPLORE", tela.width / 2, 380);
        c.fillText("O INFINITO", tela.width / 2, 510);
    } else {
        const grad = c.createLinearGradient(0, 0, tela.width, tela.height);
        grad.addColorStop(0, "#e11d48");
        grad.addColorStop(1, "#be123c");
        c.fillStyle = grad;
        c.fillRect(0, 0, tela.width, tela.height);

        c.fillStyle = "#ffffff";
        c.font = "800 120px 'Archivo', sans-serif";
        c.textAlign = "center";
        c.fillText("MELHOR", tela.width / 2, 340);
        c.fillText("PRESENTE", tela.width / 2, 470);
        c.font = "500 52px 'Archivo', sans-serif";
        c.fillText("feito com carinho na CANECA+", tela.width / 2, 590);
    }

    return tela;
}

// ============================================================================
// 10. CONTROLES DO HUD (SELETORES DE MODELOS, CORES E UPLOAD)
// ============================================================================
const btnsModelo = document.querySelectorAll(".btn-modelo");
const seletorCores = document.getElementById("seletor-cores");
const bolinhas = document.querySelectorAll(".bolinha");
const dropzoneArte = document.getElementById("dropzone-arte");
const inputArte = document.getElementById("input-arte");
const paperEmpty = document.getElementById("paper-empty");
const paperFilled = document.getElementById("paper-filled");
const paperImgPreview = document.getElementById("paper-img-preview");
const btnTrocarArte = document.getElementById("btn-trocar-arte");
const btnAcionarPrensa = document.getElementById("btn-acionar-prensa");
const chipsDemo = document.querySelectorAll(".chip-demo");

// LED e Display
const ledTemp = document.getElementById("led-temp");
const ledTempo = document.getElementById("led-tempo");
const ledStatus = document.getElementById("led-status");
const labelStatus = document.getElementById("label-status");
const steamFx = document.getElementById("steam-fx");
const heatGlow = document.getElementById("heat-glow");

// Modais
const modalRevelacao = document.getElementById("modal-revelacao");
const btnFecharModal = document.getElementById("btn-fechar-modal");
const btnPedirWhatsApp = document.getElementById("btn-pedir-whatsapp");
const btnBaixarFoto = document.getElementById("btn-baixar-foto");
const btnIAUpgrade = document.getElementById("btn-ia-upgrade");
const btnCriarOutra = document.getElementById("btn-criar-outra");
const btnAquecerModal = document.getElementById("btn-aquecer-modal");
const acoesMagica = document.getElementById("acoes-magica");
const statusIAModal = document.getElementById("status-ia-modal");
const fotoIAModal = document.getElementById("foto-ia-modal");
const modalInfo = document.getElementById("modal-info");
const btnInfo = document.getElementById("btn-info");
const btnFecharInfo = document.getElementById("btn-fechar-info");
const btnSom = document.getElementById("btn-som");

// 10.1 Troca de Modelo
btnsModelo.forEach((btn) => {
    btn.addEventListener("click", () => {
        AudioFX.click();
        btnsModelo.forEach((b) => {
            b.classList.toggle("ativo", b === btn);
            b.setAttribute("aria-pressed", b === btn);
        });

        Estado.modelo = btn.dataset.modelo;
        seletorCores.hidden = Estado.modelo !== "colorida";

        atualizarCoresEMateriais();
    });
});

// 10.2 Troca de Cores
bolinhas.forEach((bolinha) => {
    bolinha.addEventListener("click", () => {
        AudioFX.click();
        bolinhas.forEach((b) => {
            b.classList.toggle("ativa", b === bolinha);
            b.setAttribute("aria-pressed", b === bolinha);
        });

        Estado.cor = bolinha.dataset.cor;
        atualizarCoresEMateriais();
    });
});

// 10.3 Carregamento da Arte (Upload e Demos)
const erroArte = document.getElementById("erro-arte");
const LIMITE_ARTE = 8 * 1024 * 1024;

// Mostra (ou limpa, com texto vazio) o erro do arquivo logo abaixo do papel.
function mostrarErroArte(texto) {
    erroArte.textContent = texto;
    erroArte.hidden = !texto;
}

function aplicarArte(imagem, urlPreview, arquivo = null) {
    Estado.arteImg = imagem;
    Estado.arteArquivo = arquivo;
    Estado.arteCarregada = true;
    mostrarErroArte("");

    paperEmpty.hidden = true;
    paperFilled.hidden = false;
    paperImgPreview.src = urlPreview;

    btnAcionarPrensa.disabled = false;
    btnAcionarPrensa.classList.add("pronto-para-prensar");
    btnAcionarPrensa.querySelector(".alavanca-texto").textContent = "Prensar minha caneca";

    // Caneca nova (sem estampa) com o papel sublimático enrolado nela
    Estado.concluido = false;
    canecaOficina.definir({ arte: imagem, impressa: false, papel: 1, frio: 1 });
    AudioFX.beep(1200, 0.08);
}

inputArte.addEventListener("change", () => {
    const arquivo = inputArte.files[0];
    if (!arquivo) return;

    // Limpa o campo para o mesmo arquivo poder ser escolhido de novo depois de um erro;
    // a arte válida fica guardada em Estado.arteArquivo.
    inputArte.value = "";

    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
        mostrarErroArte("Esse arquivo não é uma imagem aceita. Envie JPG, PNG ou WEBP de até 8 MB.");
        return;
    }

    if (arquivo.size > LIMITE_ARTE) {
        mostrarErroArte("Essa imagem passa de 8 MB. Envie uma versão menor (exporte em JPG, por exemplo).");
        return;
    }

    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => aplicarArte(img, url, arquivo);
    img.onerror = () => {
        URL.revokeObjectURL(url);
        mostrarErroArte("Não foi possível abrir essa imagem. Ela pode estar corrompida; tente outro arquivo.");
    };
    img.src = url;
});

btnTrocarArte.addEventListener("click", (e) => {
    e.stopPropagation();
    inputArte.click();
});

// Suporte para arrastar e soltar (Drag and Drop)
["dragenter", "dragover"].forEach((evento) => {
    dropzoneArte.addEventListener(evento, (e) => {
        e.preventDefault();
        dropzoneArte.style.borderColor = "var(--color-cobalt)";
    });
});

["dragleave", "drop"].forEach((evento) => {
    dropzoneArte.addEventListener(evento, (e) => {
        e.preventDefault();
        dropzoneArte.style.borderColor = "";
    });
});

dropzoneArte.addEventListener("drop", (e) => {
    const arquivo = e.dataTransfer.files[0];
    if (arquivo) {
        inputArte.files = e.dataTransfer.files;
        const eventoChange = new Event("change");
        inputArte.dispatchEvent(eventoChange);
    }
});

// Demos Prontas
chipsDemo.forEach((chip) => {
    chip.addEventListener("click", () => {
        AudioFX.click();
        const demoCanvas = gerarArteDemo(chip.dataset.demo);
        const img = new Image();
        img.onload = () => aplicarArte(img, demoCanvas.toDataURL());
        img.src = demoCanvas.toDataURL();
    });
});

// ============================================================================
// 11. O CICLO DE SUBLIMAÇÃO (A MÁGICA DA PRENSA TÉRMICA)
// ============================================================================
btnAcionarPrensa.addEventListener("click", () => {
    if (Estado.prensando || !Estado.arteCarregada) return;
    Estado.prensando = true;

    btnAcionarPrensa.disabled = true;
    btnAcionarPrensa.querySelector(".alavanca-texto").textContent = "Prensando sua caneca…";

    // No celular, sobe até a prensa para a pessoa ver a caneca sendo prensada.
    if (window.matchMedia("(max-width: 640px)").matches) {
        container3D.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const linha = gsap.timeline();
    const atualizarPrensa = () => prensa.atualizar();

    // 1. Gira a mesa para a vista de frente e leva a caneca para dentro da prensa
    linha.to(grupoMesa.rotation, { y: ANGULO_PADRAO, duration: 0.9, ease: "power2.inOut" }, 0);
    linha.to(voo, { t: 1, duration: 1.6, ease: "power1.inOut", onUpdate: posicionarCaneca }, 0);

    // 2. Abaixa a alavanca (CLACK!) e liga a resistência a 200 °C
    const prensar = 1.6;
    linha.call(() => {
        AudioFX.alavancaClack();
        ledStatus.classList.add("aquecendo");
        labelStatus.textContent = "SUBLIMANDO A 200°C";
        heatGlow.classList.add("aquecendo");
        steamFx.classList.add("ativo");
        AudioFX.vapor();
        prensa.mostrarVisor("180", "TIME");
    }, null, prensar);
    linha.to(prensa.controle, { fechamento: 1, duration: 0.35, ease: "power2.in", onUpdate: atualizarPrensa }, prensar);
    linha.to(prensa.controle, { calor: 1, duration: 0.6, onUpdate: atualizarPrensa }, prensar + 0.2);

    // 3. Contagem regressiva visual (no painel da página e no visor da prensa)
    [135, 90, 45, 0].forEach((segundos, i) => {
        linha.call(() => {
            ledTempo.textContent = segundos + "s";
            prensa.mostrarVisor(String(segundos), "TIME");
            AudioFX.beep(2000, 0.05);
        }, null, prensar + 0.6 * (i + 1));
    });

    // 4. Sobe a alavanca, desliga a resistência e tira a caneca já estampada
    const abrir = prensar + 0.6 * 5;
    linha.call(() => {
        ledTempo.textContent = "180s";
        ledStatus.classList.remove("aquecendo");
        labelStatus.textContent = "CONCLUÍDO";
        heatGlow.classList.remove("aquecendo");
        steamFx.classList.remove("ativo");
        AudioFX.alavancaClack();
        prensa.mostrarVisor("200", "TEMP");
        // A estampa passou para a cerâmica; a caneca mágica sai quente (colorida)
        canecaOficina.definir({ impressa: true, frio: 0 });
    }, null, abrir);
    linha.to(prensa.controle, { fechamento: 0, duration: 0.45, ease: "back.out(1.7)", onUpdate: atualizarPrensa }, abrir);
    linha.to(prensa.controle, { calor: 0, duration: 0.8, onUpdate: atualizarPrensa }, abrir);
    linha.to(voo, { t: 0, duration: 1.6, ease: "power1.inOut", onUpdate: posicionarCaneca }, abrir + 0.3);

    // 5. O papel é retirado e a estampa aparece
    const papel = { opacidade: 1 };
    linha.to(papel, {
        opacidade: 0,
        duration: 0.6,
        onUpdate: () => canecaOficina.definir({ papel: papel.opacidade })
    }, abrir + 1.9);

    // 6. Sucesso: confete e o modal com a caneca pronta
    linha.call(() => {
        AudioFX.sucesso();
        if (window.confetti) {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#5266eb", "#7b5cf0", "#2979ff", "#00e676"]
            });
        }

        btnAcionarPrensa.querySelector(".alavanca-texto").textContent = "✓ Caneca pronta";
        btnAcionarPrensa.classList.remove("pronto-para-prensar");
        Estado.prensando = false;
        Estado.concluido = true;

        // A caneca mágica vai esfriando e a arte some aos poucos
        if (Estado.modelo === "magica") canecaOficina.animarCalor(1, 5000);

        abrirModalResultado();
    }, null, abrir + 2.6);
});

// ============================================================================
// 12. MODAL DE REVELAÇÃO, WHATSAPP & DOWNLOAD
// ============================================================================
function abrirModalResultado() {
    const nomeModelo = {
        tradicional: "Tradicional",
        colorida: "Alça Colorida",
        magica: "Caneca Mágica Termossensível"
    }[Estado.modelo];
    const nomeCor = Estado.cor.charAt(0).toUpperCase() + Estado.cor.slice(1);

    const btnPreco = document.querySelector(`.btn-modelo[data-modelo="${Estado.modelo}"]`);
    const preco = btnPreco ? btnPreco.dataset.preco : "R$ 34,90";

    document.getElementById("resumo-modelo").textContent = nomeModelo;
    document.getElementById("resumo-preco").textContent = preco;

    const itemCor = document.getElementById("resumo-cor-item");
    if (Estado.modelo === "colorida") {
        itemCor.hidden = false;
        document.getElementById("resumo-cor").textContent = nomeCor;
    } else {
        itemCor.hidden = true;
    }

    // Ações para caneca mágica
    acoesMagica.hidden = Estado.modelo !== "magica";

    // Pedido pelo WhatsApp; sem número configurado, um aviso no lugar do botão
    resumoPedido = { nomeModelo, nomeCor, preco };
    const numeroWhatsApp = btnPedirWhatsApp.dataset.whatsapp;
    btnPedirWhatsApp.hidden = !numeroWhatsApp;
    document.getElementById("aviso-sem-canal").hidden = Boolean(numeroWhatsApp);
    if (numeroWhatsApp) {
        // Link reserva (sem código), caso o clique abra o link direto
        btnPedirWhatsApp.href = linkWhatsApp(numeroWhatsApp, null);
    } else {
        console.warn("CANECA+: WHATSAPP_NUMERO não está configurado no .env; o botão de pedido fica escondido.");
    }

    modalRevelacao.hidden = false;

    // A caneca pronta em 3D dentro do modal (gira 360°)
    if (!canecaModal) {
        canecaModal = criarCaneca3D(document.getElementById("revelacao-3d"));
        // Clicar na cafeteira serve café quente (o botão faz o mesmo, para teclado)
        canecaModal.aoClicarCafeteira(() => {
            if (!bebidaQuente) {
                AudioFX.click();
                alternarCafe();
            }
        });
    }

    const magica = Estado.modelo === "magica";
    canecaModal.mostrarCafeteira(magica);
    document.querySelector(".revelacao-sub").textContent = magica
        ? "Clique na cafeteira para servir café quente e ver a arte aparecer."
        : "Arraste para girar e ver cada detalhe.";

    canecaModal.definir({
        nivel: 0,
        tipo: Estado.modelo,
        cor: Estado.cor,
        arte: Estado.arteImg,
        impressa: true,
        papel: 0,
        frio: canecaOficina.estado.frio
    });

    if (Estado.modelo === "magica") {
        canecaModal.animarCalor(1, 5000);
        bebidaQuente = false;
        rotularBotaoCalor(false);
    }
}

// Mensagem do pedido. Com o código, a arte já está salva no servidor e não
// precisa ser reenviada; sem ele (falha no envio), o cliente manda na conversa.
let resumoPedido = null;

function linkWhatsApp(numero, pedido) {
    const { nomeModelo, nomeCor, preco } = resumoPedido;
    const linhas = [
        "Olá! Montei minha caneca na oficina 3D da CANECA+:",
        "",
        pedido ? `*Pedido:* ${pedido.codigo}` : null,
        `*Modelo:* ${nomeModelo}`,
        Estado.modelo === "colorida" ? `*Cor da alça e interior:* ${nomeCor}` : null,
        `*Preço:* ${preco}`,
        pedido ? `*Arte e prévia:* ${pedido.link}` : null,
        // Já pede o CEP: o frete é calculado por ele.
        "*Meu CEP (para o frete):* ",
        "",
        pedido ? null : "Vou enviar o arquivo da minha arte aqui na conversa."
    ].filter((linha) => linha !== null);

    return `https://wa.me/${numero}?text=${encodeURIComponent(linhas.join("\n"))}`;
}

// Arte para o pedido: o arquivo original ou, nas artes de teste, um PNG dela.
function arquivoDaArte() {
    if (Estado.arteArquivo) return Promise.resolve(Estado.arteArquivo);

    const tela = document.createElement("canvas");
    tela.width = Estado.arteImg.naturalWidth;
    tela.height = Estado.arteImg.naturalHeight;
    tela.getContext("2d").drawImage(Estado.arteImg, 0, 0);
    return new Promise((resolve) => tela.toBlob(resolve, "image/png"));
}

let enviandoPedido = false;

btnPedirWhatsApp.addEventListener("click", async (evento) => {
    const numero = btnPedirWhatsApp.dataset.whatsapp;
    if (!numero) return;
    evento.preventDefault();
    if (enviandoPedido) return;
    enviandoPedido = true;

    // A aba precisa abrir já no clique; senão o navegador bloqueia o pop-up.
    const aba = window.open("", "_blank");
    if (aba) aba.opener = null;

    const textoBotao = btnPedirWhatsApp.textContent;
    btnPedirWhatsApp.textContent = "Preparando seu pedido…";
    btnPedirWhatsApp.setAttribute("aria-busy", "true");

    let pedido = null;
    try {
        const dados = new FormData();
        dados.append("arte", await arquivoDaArte(), "arte.png");
        dados.append("modelo", Estado.modelo);
        dados.append("cor", Estado.cor);
        if (canecaModal) dados.append("previa", canecaModal.foto());

        const resposta = await fetch("/pedido", { method: "POST", body: dados });
        if (resposta.ok) pedido = await resposta.json();
    } catch (erro) {
        // Sem internet ou servidor fora: segue sem código, com a mensagem reserva.
    }

    const destino = linkWhatsApp(numero, pedido);
    if (aba) aba.location.href = destino;
    else window.location.href = destino;

    btnPedirWhatsApp.textContent = textoBotao;
    btnPedirWhatsApp.removeAttribute("aria-busy");
    enviandoPedido = false;
});

function fecharTodosModais() {
    AudioFX.click();
    modalRevelacao.hidden = true;
    modalInfo.hidden = true;
}

btnFecharModal.addEventListener("click", fecharTodosModais);
btnFecharInfo.addEventListener("click", fecharTodosModais);

// Fechar ao clicar no fundo escuro fora do cartão
modalRevelacao.addEventListener("click", (e) => {
    if (e.target === modalRevelacao) fecharTodosModais();
});

modalInfo.addEventListener("click", (e) => {
    if (e.target === modalInfo) fecharTodosModais();
});

// Fechar com a tecla ESC do teclado: primeiro o modal aberto, depois a aba do rádio
window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!modalRevelacao.hidden || !modalInfo.hidden) fecharTodosModais();
    else if (gavetaLofi.classList.contains("aberta")) fecharGaveta();
});

// Caneca Mágica: Aquecer/Esfriar dentro do modal
// O botão faz o que diz: "Despejar" esquenta (mesmo se ela ainda estiver
// esfriando depois da prensa) e "Esfriar" esfria.
let bebidaQuente = false;

// Ícone e texto do botão de calor da caneca mágica
function rotularBotaoCalor(quente) {
    btnAquecerModal.querySelector("use").setAttribute("href", quente ? "#i-gelo" : "#i-chama");
    btnAquecerModal.querySelector(".rotulo-calor").textContent = quente ? "Esvaziar caneca" : "Servir café quente";
}

// Serve o café (enche a caneca e a tinta some de baixo para cima) ou esvazia.
function alternarCafe() {
    if (canecaModal.ocupado()) return;
    bebidaQuente = !bebidaQuente;

    if (bebidaQuente) {
        canecaModal.despejar();
        AudioFX.vapor();
    } else {
        canecaModal.esvaziar();
    }

    canecaOficina.animarCalor(bebidaQuente ? 0 : 1);
    rotularBotaoCalor(bebidaQuente);
}

btnAquecerModal.addEventListener("click", () => {
    AudioFX.click();
    alternarCafe();
});

// Baixar a foto da caneca pronta (a do modal, sobre fundo transparente)
btnBaixarFoto.addEventListener("click", () => {
    AudioFX.click();
    const link = document.createElement("a");
    link.download = `minha-caneca-${Estado.modelo}.png`;
    link.href = canecaModal.foto();
    link.click();
});

// Prensar de novo: caneca nova, com o papel da mesma arte enrolado nela
btnCriarOutra.addEventListener("click", () => {
    AudioFX.click();
    modalRevelacao.hidden = true;
    Estado.concluido = false;
    canecaOficina.definir({ impressa: false, papel: 1, frio: 1 });
    btnAcionarPrensa.disabled = false;
    btnAcionarPrensa.classList.add("pronto-para-prensar");
    btnAcionarPrensa.querySelector(".alavanca-texto").textContent = "Prensar minha caneca";
});

// Upgrade opcional com IA (FLUX Cloudflare)
btnIAUpgrade.addEventListener("click", async () => {
    AudioFX.click();
    statusIAModal.hidden = false;

    if (!Estado.arteArquivo) {
        statusIAModal.textContent = "A foto de estúdio com IA usa a sua própria imagem. Envie um arquivo do seu computador ou celular (as artes de teste não servem para isso).";
        return;
    }

    btnIAUpgrade.disabled = true;
    statusIAModal.textContent = "Criando a foto de estúdio da sua caneca… pode levar até um minuto.";
    fotoIAModal.hidden = true;

    const dados = new FormData();
    dados.append("arte", Estado.arteArquivo);
    dados.append("modelo", Estado.modelo);
    dados.append("cor", Estado.cor);

    try {
        let resp;
        try {
            resp = await fetch("/gerar-caneca", { method: "POST", body: dados });
        } catch (erroDeRede) {
            throw new Error("Sem conexão com o servidor. Verifique sua internet e tente de novo.");
        }

        const res = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(res.erro || "Algo deu errado ao criar a foto. Tente de novo em instantes.");

        fotoIAModal.src = res.imagem;
        fotoIAModal.hidden = false;
        statusIAModal.textContent = "✓ Foto de estúdio pronta.";
        AudioFX.sucesso();
    } catch (err) {
        statusIAModal.textContent = err.message;
    } finally {
        btnIAUpgrade.disabled = false;
    }
});

btnInfo.addEventListener("click", () => {
    AudioFX.click();
    modalInfo.hidden = false;
});

btnSom.addEventListener("click", () => {
    somAtivado = !somAtivado;

    // Mudo também desliga o rádio da bancada
    if (!somAtivado) lofi.parar();
    const icone = btnSom.querySelector(".icone-som");
    const label = btnSom.querySelector(".label-som");

    icone.querySelector("use").setAttribute("href", somAtivado ? "#i-som" : "#i-mudo");
    label.textContent = somAtivado ? "Som: Ligado" : "Som: Mudo";
    if (somAtivado) AudioFX.beep(1400, 0.05);
});

// ============================================================================
// 13. RÁDIO LO-FI: A ABA DAS PLAYLISTS
// ============================================================================
const gavetaLofi = document.getElementById("gaveta-lofi");
const abaLofi = document.getElementById("aba-lofi");
const listaPlaylists = document.getElementById("lista-playlists");
const btnLofiTocar = document.getElementById("lofi-tocar");
const volumeLofi = document.getElementById("lofi-volume");

const formatarTempo = (segundos) => `${Math.floor(segundos / 60)}:${String(Math.floor(segundos % 60)).padStart(2, "0")}`;

// Lista das playlists, montada a partir dos dados do rádio (static/lofi.js)
listaPlaylists.innerHTML = lofi.playlists.map((playlist, p) => `
    <li class="playlist" style="--capa: ${playlist.cor}">
        <button type="button" class="playlist-cabeca" data-playlist="${p}">
            <span class="playlist-capa" aria-hidden="true"><svg class="icone"><use href="#i-fita"></use></svg></span>
            <span class="playlist-dados"><strong>${playlist.nome}</strong><small>${playlist.clima}</small></span>
        </button>
        <ol class="playlist-faixas">
            ${playlist.faixas.map((faixa, f) => `
                <li><button type="button" class="faixa" data-playlist="${p}" data-faixa="${f}">
                    <span class="faixa-numero">${f + 1}</span>
                    <span class="faixa-nome">${faixa.nome}</span>
                    <span class="faixa-tempo">${formatarTempo(lofi.duracaoDe(p, f))}</span>
                </button></li>`).join("")}
        </ol>
    </li>`).join("");

function atualizarProgresso() {
    const { decorrido, total } = lofi.progresso();
    document.getElementById("lofi-barra").style.transform = `scaleX(${decorrido / total})`;
    document.getElementById("lofi-decorrido").textContent = formatarTempo(decorrido);
    document.getElementById("lofi-total").textContent = formatarTempo(total);
}

// O rádio 3D, a aba e a lista sempre mostram a mesma faixa
function atualizarRadio() {
    const { playlist, faixa } = lofi.atual();
    const dados = lofi.playlists[playlist];
    const tocando = lofi.tocando();

    radio.definirTocando(tocando);
    radio.definirCorFita(dados.cor);
    gavetaLofi.classList.toggle("tocando", tocando);
    gavetaLofi.style.setProperty("--capa", dados.cor);
    document.getElementById("lofi-faixa").textContent = dados.faixas[faixa].nome;
    document.getElementById("lofi-playlist").textContent = dados.nome;
    btnLofiTocar.setAttribute("aria-label", tocando ? "Pausar" : "Tocar");
    btnLofiTocar.querySelector("use").setAttribute("href", tocando ? "#i-pausar" : "#i-tocar");

    listaPlaylists.querySelectorAll(".playlist").forEach((item, p) => item.classList.toggle("ativa", p === playlist));
    listaPlaylists.querySelectorAll(".faixa").forEach((botao) => {
        const atual = Number(botao.dataset.playlist) === playlist && Number(botao.dataset.faixa) === faixa;
        botao.classList.toggle("atual", atual);
        if (atual) botao.setAttribute("aria-current", "true");
        else botao.removeAttribute("aria-current");
    });
    atualizarProgresso();
}

atualizarRadio();
setInterval(() => {
    if (lofi.tocando()) atualizarProgresso();
}, 500);

function abrirGaveta() {
    gavetaLofi.classList.add("aberta");
    abaLofi.setAttribute("aria-expanded", "true");
    btnLofiTocar.focus({ preventScroll: true });
}

function fecharGaveta() {
    gavetaLofi.classList.remove("aberta");
    abaLofi.setAttribute("aria-expanded", "false");
    abaLofi.focus({ preventScroll: true });
}

abaLofi.addEventListener("click", () => {
    AudioFX.click();
    if (gavetaLofi.classList.contains("aberta")) fecharGaveta();
    else abrirGaveta();
});
document.getElementById("btn-fechar-lofi").addEventListener("click", fecharGaveta);

btnLofiTocar.addEventListener("click", alternarRadio);
document.getElementById("lofi-anterior").addEventListener("click", () => lofi.pular(-1));
document.getElementById("lofi-proxima").addEventListener("click", () => lofi.pular(1));
volumeLofi.addEventListener("input", () => lofi.definirVolume(volumeLofi.value / 100));
lofi.definirVolume(volumeLofi.value / 100);

// Faixa: toca (ou pausa, se for a que está tocando). Playlist: toca a 1ª faixa
// (ou pausa/retoma, se for a playlist atual).
listaPlaylists.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-playlist]");
    if (!botao) return;
    const playlist = Number(botao.dataset.playlist);
    const faixa = botao.classList.contains("faixa") ? Number(botao.dataset.faixa) : null;
    const atual = lofi.atual();

    if (playlist === atual.playlist && (faixa === null || faixa === atual.faixa)) alternarRadio();
    else tocarLofi(playlist, faixa === null ? 0 : faixa);
});
