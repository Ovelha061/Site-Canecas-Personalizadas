/* ==========================================================================
   PRENSA TÉRMICA DE CANECAS 3D (Three.js)
   Prensa "de alavanca": base de chapa branca, suporte em "U", resistência de
   inox com manta de silicone (borda laranja), chapa lateral em "S", trava com
   alavanca de manopla em "D" e caixa de controle digital.
   Mesma escala da caneca (static/caneca3d.js): 1 unidade = 41 mm.
   A resistência fica deitada (eixo X) e a alça da caneca sai pela fenda de cima.
   ========================================================================== */
const MEDIDAS_PRENSA = {
    topoBase: 0.164,   // topo da chapa da base (pés de 0,08 + chapa)
    eixoY: 1.41,       // altura do eixo da resistência
    raioManta: 1.06,   // manta de silicone (a caneca tem raio 1)
    raioInox: 1.12,    // capa de inox
    comprimento: 2.4,  // ao longo do eixo X
    centroX: -0.75,
    meiaFenda: 0.19    // meia-abertura (rad) da fenda de cima, por onde sai a alça
};

function caminhoArredondado(c, x, y, l, a, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + l, y, x + l, y + a, r);
    c.arcTo(x + l, y + a, x, y + a, r);
    c.arcTo(x, y + a, x, y, r);
    c.arcTo(x, y, x + l, y, r);
    c.closePath();
}

// Adesivo do painel da caixa de controle (o número do visor fica num plano à parte).
function desenharPainelControle(c, L, A, indicador) {
    c.clearRect(0, 0, L, A);
    caminhoArredondado(c, 4, 4, L - 8, A - 8, 18);
    c.fillStyle = "#f6f8fb";
    c.fill();

    // Faixa azul curva embaixo, como nos adesivos das prensas
    c.save();
    c.clip();
    const azul = c.createLinearGradient(0, A * 0.55, L, A);
    azul.addColorStop(0, "#a9cbf2");
    azul.addColorStop(0.5, "#3f7fd0");
    azul.addColorStop(1, "#1b4a95");
    c.fillStyle = azul;
    c.beginPath();
    c.moveTo(0, A * 0.74);
    c.bezierCurveTo(L * 0.35, A * 0.6, L * 0.62, A * 0.88, L, A * 0.64);
    c.lineTo(L, A);
    c.lineTo(0, A);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(255, 255, 255, 0.85)";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(0, A * 0.71);
    c.bezierCurveTo(L * 0.35, A * 0.57, L * 0.62, A * 0.85, L, A * 0.61);
    c.stroke();
    c.restore();

    // Janela do visor
    caminhoArredondado(c, 72, 96, 246, 102, 10);
    c.fillStyle = "#1a1012";
    c.fill();
    c.strokeStyle = "#9aa3ad";
    c.lineWidth = 4;
    c.stroke();

    // Indicadores TEMP / SET / TIME
    c.textBaseline = "middle";
    c.textAlign = "left";
    ["TEMP", "SET", "TIME"].forEach((nome, i) => {
        const y = 112 + i * 36;
        const aceso = nome === indicador;
        c.beginPath();
        c.arc(346, y, 9, 0, Math.PI * 2);
        c.fillStyle = aceso ? "#ff3b30" : "#5a6069";
        c.shadowColor = aceso ? "rgba(255, 59, 48, 0.9)" : "transparent";
        c.shadowBlur = aceso ? 14 : 0;
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#2a3340";
        c.font = "600 22px Arial, sans-serif";
        c.fillText(nome, 364, y);
    });

    // Botões
    c.textAlign = "center";
    ["◀", "MODE", "▶", "■"].forEach((rotulo, i) => {
        const x = 72 + i * 66;
        caminhoArredondado(c, x, 236, 54, 54, 10);
        c.fillStyle = "#ffffff";
        c.fill();
        c.strokeStyle = "#9aa3ad";
        c.lineWidth = 3;
        c.stroke();
        c.fillStyle = "#3a4452";
        c.font = rotulo.length > 1 ? "700 14px Arial, sans-serif" : "700 22px Arial, sans-serif";
        c.fillText(rotulo, x + 27, 263);
    });

    c.fillStyle = "#ffffff";
    c.font = "700 20px Arial, sans-serif";
    c.textAlign = "right";
    c.fillText("DIGITAL CONTROL", L - 34, A - 34);
}

// Visor de LED vermelho (7 segmentos): "888" apagado ao fundo e o número aceso.
function desenharLED(c, L, A, texto) {
    c.fillStyle = "#140607";
    c.fillRect(0, 0, L, A);
    c.font = "bold 86px 'Courier New', monospace";
    c.textAlign = "right";
    c.textBaseline = "middle";
    c.fillStyle = "rgba(255, 40, 30, 0.12)";
    c.fillText("888", L - 18, A / 2 + 4);
    c.shadowColor = "rgba(255, 50, 30, 0.9)";
    c.shadowBlur = 16;
    c.fillStyle = "#ff3b2f";
    c.fillText(texto.padStart(3, " "), L - 18, A / 2 + 4);
    c.shadowBlur = 0;
}

function desenharAdesivo(c, L, A) {
    caminhoArredondado(c, 2, 2, L - 4, A - 4, 12);
    c.fillStyle = "#fbfbf6";
    c.fill();

    c.fillStyle = "#e0262b";
    c.fillRect(L * 0.3, 16, L * 0.66, 48);
    c.fillStyle = "#ffffff";
    c.font = "800 32px Arial, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("⚠ WARNING", L * 0.63, 41);

    c.beginPath();
    c.moveTo(78, 26);
    c.lineTo(142, 150);
    c.lineTo(14, 150);
    c.closePath();
    c.fillStyle = "#f6c21c";
    c.fill();
    c.lineWidth = 7;
    c.strokeStyle = "#111111";
    c.stroke();
    c.fillStyle = "#111111";
    c.font = "900 64px Arial, sans-serif";
    c.fillText("!", 78, 112);

    c.fillStyle = "#222222";
    c.font = "700 24px Arial, sans-serif";
    c.fillText("Hot surface inside", L * 0.63, 104);
    c.font = "500 19px Arial, sans-serif";
    c.fillText("Do not touch during operation", L * 0.63, 140);
}

function criarModeloPrensa({ anisotropia = 1 } = {}) {
    const M = MEDIDAS_PRENSA;
    const grupo = new THREE.Group();
    // fechamento: 0 = alavanca para cima (aberta), 1 = baixada (prensando)
    // calor: 0 = fria, 1 = resistência a 200 °C
    const controle = { fechamento: 0, calor: 0 };

    // As cores em hexadecimal são sRGB; a renderização trabalha em linear.
    const cor = (hex) => new THREE.Color(hex).convertSRGBToLinear();

    const pintura = new THREE.MeshPhysicalMaterial({ color: cor(0xf2f3f3), roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.3 });
    const inox = new THREE.MeshStandardMaterial({ color: cor(0xd9dde2), metalness: 1, roughness: 0.28 });
    const cromo = new THREE.MeshStandardMaterial({ color: cor(0xf0f0f0), metalness: 1, roughness: 0.12 });
    const cromoSerrilhado = new THREE.MeshStandardMaterial({ color: cor(0xe6e6e6), metalness: 1, roughness: 0.3, flatShading: true });
    const acoPreto = new THREE.MeshStandardMaterial({ color: cor(0x1d1d20), metalness: 0.5, roughness: 0.45 });
    const plasticoPreto = new THREE.MeshPhysicalMaterial({ color: cor(0x161616), roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4 });
    const borrachaVermelha = new THREE.MeshStandardMaterial({ color: cor(0xd3262b), roughness: 0.6 });
    const borrachaPes = new THREE.MeshStandardMaterial({ color: cor(0x111111), roughness: 0.9 });
    const siliconeBranco = new THREE.MeshStandardMaterial({ color: cor(0xf0ebe3), roughness: 0.85, side: THREE.BackSide });
    const siliconeLaranja = new THREE.MeshStandardMaterial({ color: cor(0xc0512b), roughness: 0.7 });
    const lampada = new THREE.MeshStandardMaterial({ color: cor(0x7a1010), emissive: new THREE.Color(1, 0.08, 0.05), emissiveIntensity: 0, roughness: 0.3 });
    const laranjaCalor = new THREE.Color(1, 0.32, 0.05);

    function extrudar(forma, profundidade, chanfro = 0.012) {
        return new THREE.ExtrudeGeometry(forma, {
            depth: profundidade,
            bevelEnabled: true,
            bevelThickness: chanfro,
            bevelSize: chanfro,
            bevelSegments: 2,
            curveSegments: 32
        });
    }

    function adicionar(geometria, material, x = 0, y = 0, z = 0, pai = grupo) {
        const malha = new THREE.Mesh(geometria, material);
        malha.position.set(x, y, z);
        pai.add(malha);
        return malha;
    }

    // Barra retangular ligando dois pontos.
    function barraEntre(a, b, largura, espessura, material, pai = grupo) {
        const direcao = new THREE.Vector3().subVectors(b, a);
        const malha = new THREE.Mesh(new THREE.BoxGeometry(largura, direcao.length(), espessura), material);
        malha.position.copy(a).addScaledVector(direcao, 0.5);
        malha.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direcao.normalize());
        pai.add(malha);
        return malha;
    }

    // Parafuso de aperto serrilhado, de pé sobre uma superfície inclinada em X.
    function parafusoSerrilhado(pai, posicao, inclinacao) {
        const parafuso = new THREE.Group();
        adicionar(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 24), cromo, 0, 0.01, 0, parafuso);
        adicionar(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 12), cromo, 0, 0.06, 0, parafuso);
        adicionar(new THREE.CylinderGeometry(0.1, 0.1, 0.09, 22), cromoSerrilhado, 0, 0.14, 0, parafuso);
        parafuso.position.copy(posicao);
        parafuso.rotation.x = inclinacao;
        pai.add(parafuso);
    }

    function texturaDeTela(largura, altura, desenhar) {
        const tela = document.createElement("canvas");
        tela.width = largura;
        tela.height = altura;
        const textura = new THREE.CanvasTexture(tela);
        textura.encoding = THREE.sRGBEncoding;
        textura.anisotropy = anisotropia;
        const redesenhar = (...args) => {
            desenhar(tela.getContext("2d"), largura, altura, ...args);
            textura.needsUpdate = true;
        };
        return { textura, redesenhar };
    }

    // ---------- Base de chapa, pés de borracha e adesivo de aviso ----------
    const contornoBase = [[-2.45, -1.75], [1.3, -1.75], [3.75, -0.95], [3.75, 1.95], [-1.95, 1.95], [-2.45, 1.45]];
    const base = adicionar(
        extrudar(new THREE.Shape(contornoBase.map(([x, z]) => new THREE.Vector2(x, -z))), 0.06),
        pintura, 0, 0.092, 0
    );
    base.rotation.x = -Math.PI / 2;

    [[-2.2, -1.5], [1.1, -1.5], [3.5, -0.8], [3.5, 1.7], [-1.75, 1.7], [-2.2, 1.2]].forEach(([x, z]) => {
        adicionar(new THREE.CylinderGeometry(0.1, 0.11, 0.08, 20), borrachaPes, x, 0.04, z);
    });

    const adesivo = texturaDeTela(512, 192, desenharAdesivo);
    adesivo.redesenhar();
    const placaAviso = adicionar(new THREE.PlaneGeometry(1.1, 0.42), new THREE.MeshStandardMaterial({ map: adesivo.textura, roughness: 0.4 }), 0.85, M.topoBase + 0.003, 1.45);
    placaAviso.rotation.x = -Math.PI / 2;

    // ---------- Suporte em "U" (ponta esquerda da resistência) ----------
    // Furo do tamanho da manta + fenda até em cima, para a caneca entrar com a alça para cima.
    const larguraU = 1.5;
    const topoU = M.eixoY + 1.35;
    const meiaFendaU = 0.25;
    const raioFuro = M.raioManta + 0.01;
    const yFenda = M.eixoY + Math.sqrt(raioFuro ** 2 - meiaFendaU ** 2);
    const anguloFenda = Math.atan2(yFenda - M.eixoY, meiaFendaU);

    const formaU = new THREE.Shape();
    formaU.moveTo(-larguraU, M.topoBase);
    formaU.lineTo(larguraU, M.topoBase);
    formaU.lineTo(larguraU, topoU - 0.25);
    formaU.quadraticCurveTo(larguraU, topoU, larguraU - 0.25, topoU);
    formaU.lineTo(meiaFendaU, topoU);
    formaU.lineTo(meiaFendaU, yFenda);
    formaU.absarc(0, M.eixoY, raioFuro, anguloFenda, Math.PI - anguloFenda, true);
    formaU.lineTo(-meiaFendaU, topoU);
    formaU.lineTo(-larguraU + 0.25, topoU);
    formaU.quadraticCurveTo(-larguraU, topoU, -larguraU, topoU - 0.25);
    formaU.lineTo(-larguraU, M.topoBase);

    const pontaEsquerda = M.centroX - M.comprimento / 2;
    const suporteU = adicionar(extrudar(formaU, 0.06), pintura, pontaEsquerda - 0.072, 0, 0);
    suporteU.rotation.y = Math.PI / 2;

    // ---------- Resistência: capa de inox + manta de silicone ----------
    // A fenda fica em cima (ângulo 3π/2 da geometria, depois de deitar o cilindro).
    const inicio = 1.5 * Math.PI + M.meiaFenda;
    const volta = 2 * Math.PI - 2 * M.meiaFenda;

    const capa = adicionar(new THREE.CylinderGeometry(M.raioInox, M.raioInox, M.comprimento, 128, 1, true, inicio, volta), inox, M.centroX, M.eixoY, 0);
    capa.rotation.z = -Math.PI / 2;

    const manta = adicionar(new THREE.CylinderGeometry(M.raioManta, M.raioManta, M.comprimento - 0.04, 128, 1, true, inicio, volta), siliconeBranco, M.centroX, M.eixoY, 0);
    manta.rotation.z = -Math.PI / 2;

    // Borda de silicone laranja nas duas pontas
    function contornoDaManta(x, raio) {
        const pontos = [];
        for (let i = 0; i <= 64; i++) {
            const t = inicio + (volta * i) / 64;
            pontos.push(new THREE.Vector3(x, M.eixoY - raio * Math.sin(t), raio * Math.cos(t)));
        }
        return new THREE.CatmullRomCurve3(pontos);
    }

    [pontaEsquerda + 0.03, M.centroX + M.comprimento / 2 - 0.03].forEach((x) => {
        adicionar(new THREE.TubeGeometry(contornoDaManta(x, 1.09), 128, 0.045, 12, false), siliconeLaranja);
    });

    // ---------- Tiras de aperto nas bordas da fenda (a da frente é móvel) ----------
    const g = M.meiaFenda;

    function tiraDaFenda(lado, pai) { // lado: -1 = trás (fixa), +1 = frente (móvel)
        const normal = new THREE.Vector3(0, Math.cos(g), lado * Math.sin(g));
        const afastando = new THREE.Vector3(0, -Math.sin(g), lado * Math.cos(g));
        const centro = new THREE.Vector3(M.centroX, M.eixoY, 0)
            .addScaledVector(normal, M.raioInox + 0.03)
            .addScaledVector(afastando, 0.12);

        const tira = adicionar(new THREE.BoxGeometry(M.comprimento + 0.08, 0.05, 0.24), inox, centro.x, centro.y, centro.z, pai);
        tira.rotation.x = lado * g;

        const topoDaTira = centro.clone().addScaledVector(normal, 0.025);
        [-0.75, 0.75].forEach((dx) => {
            parafusoSerrilhado(pai, topoDaTira.clone().setX(M.centroX + dx), lado * g);
        });

        return { centro, normal };
    }

    tiraDaFenda(-1, grupo);

    // Trava móvel: tira da frente + braço preto até o mecanismo da alavanca
    const trava = new THREE.Group();
    grupo.add(trava);
    const tiraMovel = tiraDaFenda(1, trava);

    // Furos da tira móvel
    [-1.15, -0.35, 0.15, 0.95].forEach((dx) => {
        const furo = adicionar(
            new THREE.CylinderGeometry(0.035, 0.035, 0.052, 12), acoPreto,
            M.centroX + dx, tiraMovel.centro.y, tiraMovel.centro.z + 0.06, trava
        );
        furo.rotation.x = g;
    });

    const pontaBraco = new THREE.Vector3(M.centroX + M.comprimento / 2 - 0.15, tiraMovel.centro.y + 0.07, tiraMovel.centro.z);
    adicionar(new THREE.BoxGeometry(0.55, 0.07, 0.32), acoPreto, pontaBraco.x, pontaBraco.y, pontaBraco.z, trava).rotation.x = g;
    barraEntre(pontaBraco, new THREE.Vector3(0.95, 3.03, -0.95), 0.26, 0.08, acoPreto, trava);

    // ---------- Chapa lateral em "S" (atrás da resistência) ----------
    const formaS = new THREE.Shape();
    formaS.moveTo(-1.05, M.topoBase);
    formaS.lineTo(1.55, M.topoBase);
    formaS.lineTo(1.55, 2.82);
    formaS.quadraticCurveTo(1.55, 2.97, 1.4, 2.97);
    formaS.lineTo(0.62, 2.97);
    formaS.bezierCurveTo(0.15, 2.97, 0.12, 1.9, -0.45, 1.72);
    formaS.bezierCurveTo(-0.8, 1.62, -1.05, 1.55, -1.05, 1.3);
    formaS.lineTo(-1.05, M.topoBase);
    adicionar(extrudar(formaS, 0.06), pintura, 0, 0, -1.4);

    // Apoio da resistência na chapa
    adicionar(new THREE.BoxGeometry(0.5, 0.35, 0.3), pintura, 0.1, M.eixoY, -1.2);

    // ---------- Mecanismo da alavanca (em cima da chapa em "S") ----------
    adicionar(new THREE.BoxGeometry(1.05, 0.07, 1.0), acoPreto, 1.08, 3.02, -1.37);
    [[0.75, -1.05], [1.45, -1.7]].forEach(([x, z]) => {
        adicionar(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 6), cromo, x, 3.08, z);
    });
    adicionar(new THREE.BoxGeometry(0.36, 0.28, 0.3), acoPreto, 1.25, 3.19, -1.37);

    const eixoAlavanca = adicionar(new THREE.CylinderGeometry(0.055, 0.055, 1.15, 16), cromo, 0.95, 3.22, -1.37);
    eixoAlavanca.rotation.z = Math.PI / 2;
    adicionar(new THREE.CylinderGeometry(0.1, 0.1, 0.32, 20), acoPreto, 0.72, 3.22, -1.37).rotation.z = Math.PI / 2;
    adicionar(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 24), cromoSerrilhado, 0.33, 3.22, -1.37).rotation.z = Math.PI / 2;

    // Alavanca: gira em torno do eixo X (para trás = aberta, para frente = prensando)
    const alavanca = new THREE.Group();
    alavanca.position.set(1.3, 3.22, -1.37);
    grupo.add(alavanca);

    [-0.1, 0.1].forEach((x) => adicionar(new THREE.BoxGeometry(0.035, 0.75, 0.17), cromo, x, 0.3, 0, alavanca));
    adicionar(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), cromo, 0, 0.62, 0, alavanca).rotation.z = Math.PI / 2;
    adicionar(new THREE.BoxGeometry(0.07, 0.6, 0.13), cromo, 0, 0.95, 0, alavanca);
    adicionar(new THREE.CylinderGeometry(0.075, 0.075, 1.0, 20), plasticoPreto, 0, 1.6, 0, alavanca);
    adicionar(new THREE.CylinderGeometry(0.092, 0.092, 0.32, 20), borrachaVermelha, 0, 1.38, 0, alavanca);

    // Manopla em "D" com empunhadura vermelha
    const contornoD = [[0, 2.08], [0.3, 2.2], [0.5, 2.48], [0.48, 2.78], [0.3, 2.86], [-0.3, 2.86], [-0.48, 2.78], [-0.5, 2.48], [-0.3, 2.2]];
    const curvaD = new THREE.CatmullRomCurve3(contornoD.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal");
    adicionar(new THREE.TubeGeometry(curvaD, 120, 0.07, 16, true), plasticoPreto, 0, 0, 0, alavanca);
    adicionar(new THREE.CylinderGeometry(0.105, 0.105, 0.62, 24), borrachaVermelha, 0, 2.86, 0, alavanca).rotation.z = Math.PI / 2;

    // ---------- Caixa de controle digital ----------
    const perfilCaixa = new THREE.Shape(
        [[-0.55, M.topoBase], [1.7, M.topoBase], [1.7, 0.75], [1.15, 2.2], [-0.55, 2.2]].map(([z, y]) => new THREE.Vector2(z, y))
    );
    const caixa = adicionar(extrudar(perfilCaixa, 1.8, 0.04), pintura, 3.55, 0, 0);
    caixa.rotation.y = -Math.PI / 2;

    // Painel inclinado (adesivo) + visor de LED aceso por cima
    const inclinacaoPainel = Math.atan2(1.7 - 1.15, 2.2 - 0.75);
    const painel = new THREE.Group();
    painel.position
        .set(2.65, (0.75 + 2.2) / 2, (1.7 + 1.15) / 2)
        .addScaledVector(new THREE.Vector3(0, Math.sin(inclinacaoPainel), Math.cos(inclinacaoPainel)), 0.046);
    painel.rotation.x = -inclinacaoPainel;
    grupo.add(painel);

    const adesivoPainel = texturaDeTela(512, 485, desenharPainelControle);
    adicionar(new THREE.PlaneGeometry(1.5, 1.42), new THREE.MeshStandardMaterial({ map: adesivoPainel.textura, roughness: 0.35 }), 0, 0, 0, painel);

    const telaLED = texturaDeTela(256, 106, desenharLED);
    adicionar(new THREE.PlaneGeometry(0.72, 0.3), new THREE.MeshBasicMaterial({ map: telaLED.textura, toneMapped: false }), -0.18, 0.28, 0.003, painel);

    // Lateral: lâmpada indicadora e interruptor vermelho
    adicionar(new THREE.BoxGeometry(0.05, 0.34, 0.24), borrachaVermelha, 3.615, 0.62, 1.05);
    adicionar(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 20), lampada, 3.615, 1.1, 1.2).rotation.z = Math.PI / 2;

    // Cabo da caixa até a resistência
    adicionar(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 20), cromo, 1.58, 0.52, 1.25).rotation.z = Math.PI / 2;
    const curvaCabo = new THREE.CatmullRomCurve3(
        [[1.46, 0.52, 1.25], [1.05, 0.3, 1.45], [0.4, 0.24, 1.3], [-0.15, 0.36, 1.0], [-0.45, 0.62, 0.8]].map(([x, y, z]) => new THREE.Vector3(x, y, z))
    );
    adicionar(new THREE.TubeGeometry(curvaCabo, 80, 0.05, 10, false), plasticoPreto);

    // ---------- Sombra de contato da base na bancada ----------
    const telaSombra = document.createElement("canvas");
    telaSombra.width = 512;
    telaSombra.height = 400;
    const ctxSombra = telaSombra.getContext("2d");
    const pontoSombra = ([x, z]) => [(x - 0.65 + 4.5) * (512 / 9), (z - 0.1 + 3.5) * (400 / 7)];
    [[22, 0.35], [7, 0.4]].forEach(([desfoque, alfa]) => {
        ctxSombra.filter = `blur(${desfoque}px)`;
        ctxSombra.fillStyle = `rgba(0, 0, 0, ${alfa})`;
        ctxSombra.beginPath();
        contornoBase.forEach((p, i) => (i ? ctxSombra.lineTo(...pontoSombra(p)) : ctxSombra.moveTo(...pontoSombra(p))));
        ctxSombra.closePath();
        ctxSombra.fill();
    });
    // Fica fora do grupo para não contar no tamanho da prensa (enquadramento da câmera).
    const sombraBase = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 7),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(telaSombra), transparent: true, depthWrite: false, toneMapped: false })
    );
    sombraBase.position.set(0.65, 0.003, 0.1);
    sombraBase.rotation.x = -Math.PI / 2;

    // ---------- Estado: alavanca, trava e calor ----------
    let indicadorAtual = null;

    function mostrarVisor(texto, indicador = "TEMP") {
        telaLED.redesenhar(String(texto));
        if (indicador !== indicadorAtual) {
            adesivoPainel.redesenhar(indicador);
            indicadorAtual = indicador;
        }
    }

    function atualizar() {
        alavanca.rotation.x = THREE.MathUtils.lerp(-0.55, 0.8, controle.fechamento);
        trava.position.z = -0.05 * controle.fechamento;

        siliconeBranco.emissive.copy(laranjaCalor).multiplyScalar(0.35 * controle.calor);
        siliconeLaranja.emissive.copy(laranjaCalor).multiplyScalar(0.9 * controle.calor);
        inox.emissive.copy(laranjaCalor).multiplyScalar(0.06 * controle.calor);
        lampada.emissiveIntensity = 2.5 * controle.calor;
    }

    mostrarVisor("200", "TEMP");
    atualizar();

    return {
        grupo,
        sombra: sombraBase,
        controle,
        atualizar,
        mostrarVisor,
        // Centro da resistência: onde a caneca fica durante a prensagem
        centroResistencia: new THREE.Vector3(M.centroX, M.eixoY, 0)
    };
}
