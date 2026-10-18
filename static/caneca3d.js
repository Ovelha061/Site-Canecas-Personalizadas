/* ==========================================================================
   CANECA 3D REALISTA (Three.js)
   Modelada com as medidas de uma caneca de sublimação de 325 ml (11 oz):
   82 mm de diâmetro x 95 mm de altura. 1 unidade = 41 mm (o raio).
   Toda a luz vem de um estúdio fotográfico virtual (softboxes), e as sombras
   de contato e a oclusão são pré-calculadas, como numa foto de produto.
   ========================================================================== */
const CORES_HEX = {
    vermelho: 0xd62828,
    azul: 0x1f4fd1,
    preto: 0x1a1a1a,
    amarelo: 0xf2c230,
    verde: 0x2a9d4b,
    rosa: 0xec6fa8
};

const BRANCO = 0xf4f4f1;
const PRETO_MAGICA = 0x161616;

const RAIO = 1;
const ALTURA = 2.33;
const TOPO = ALTURA / 2;
const BASE = -ALTURA / 2;
const PAREDE = 0.095;                  // espessura da cerâmica (~4 mm)
const CANTO_BASE = 0.06;               // quina arredondada de baixo
const TOPO_PAREDE = TOPO - PAREDE / 2; // onde começa a borda arredondada
const BASE_PAREDE = BASE + CANTO_BASE;
const RAIO_INTERNO = RAIO - PAREDE;
const FUNDO_INTERNO = BASE + 0.2;      // o fundo da cerâmica tem ~8 mm

// Folga entre a alça e a arte, em radianos de cada lado.
const FOLGA_ALCA = 0.45;

// Linha central da alça (vista de lado), com as pontas entrando no corpo.
const PONTOS_ALCA = [
    [0.9, 0.8], [1.25, 0.84], [1.55, 0.74], [1.74, 0.45], [1.79, 0.05],
    [1.69, -0.36], [1.46, -0.63], [1.18, -0.75], [0.9, -0.74]
];
const ESPESSURA_ALCA = 0.115; // metade da espessura vista de lado (~9 mm)
const LARGURA_ALCA = 0.155;   // metade da largura vista de frente (~13 mm)

// Pontos de um arco, para os perfis de torno.
function arco(cx, cy, r, de, ate, passos = 8) {
    const pontos = [];
    for (let i = 0; i <= passos; i++) {
        const a = de + ((ate - de) * i) / passos;
        pontos.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
    return pontos;
}

// Estúdio fotográfico virtual: fundo infinito (chão claro, paredes escuras,
// com uma "bandeira preta" à direita para dar volume) e softboxes que geram
// os reflexos verticais típicos de foto de caneca.
function criarEstudio() {
    const estudio = new THREE.Scene();

    const esfera = new THREE.SphereGeometry(40, 48, 24);
    const posicoes = esfera.attributes.position;
    const cores = [];

    for (let i = 0; i < posicoes.count; i++) {
        const x = posicoes.getX(i) / 40;
        const y = posicoes.getY(i) / 40;
        const chao = THREE.MathUtils.smoothstep(y, -0.25, 0.02);
        const lado = THREE.MathUtils.lerp(0.14, 0.04, (x + 1) / 2);
        const parede = THREE.MathUtils.lerp(lado, 0.06, THREE.MathUtils.clamp(y / 0.9, 0, 1));
        const tom = THREE.MathUtils.lerp(0.5, parede, chao);
        cores.push(tom, tom, tom * 1.03);
    }

    esfera.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
    estudio.add(new THREE.Mesh(esfera, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

    function softbox(largura, altura, intensidade, x, y, z) {
        const painel = new THREE.Mesh(
            new THREE.PlaneGeometry(largura, altura),
            new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
        );
        painel.material.color.setScalar(intensidade);
        painel.position.set(x, y, z);
        painel.lookAt(0, 0, 0);
        estudio.add(painel);
    }

    softbox(3.5, 9, 8, -9, 2.5, 4);   // principal: esquerda
    softbox(0.9, 9, 7, -4.5, 1.5, 9.5); // faixa estreita: frente-esquerda
    softbox(1, 9, 7, 9, 1, 1.5);      // faixa de recorte: direita
    softbox(8, 8, 3, 0, 12, 2);       // de cima
    softbox(6, 6, 1.2, 6, 0, 9);      // preenchimento suave: frente-direita
    softbox(2, 8, 1.5, -4, 1, -9);    // contraluz

    return estudio;
}

// Degradê preto → branco usado como aoMap: cada vértice aponta (via uv2.x)
// para o tom de sombra que deve ter. Assim a oclusão escurece tanto a luz
// difusa quanto os reflexos, como acontece de verdade.
function criarTexturaOclusao() {
    const dados = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) dados.set([i, i, i, 255], i * 4);

    const textura = new THREE.DataTexture(dados, 256, 1, THREE.RGBAFormat);
    textura.magFilter = THREE.LinearFilter;
    textura.minFilter = THREE.LinearFilter;
    textura.needsUpdate = true;
    return textura;
}

function aplicarOclusao(geometria, calcular) {
    const posicoes = geometria.attributes.position;
    const uv2 = new Float32Array(posicoes.count * 2);
    const v = new THREE.Vector3();

    for (let i = 0; i < posicoes.count; i++) {
        v.fromBufferAttribute(posicoes, i);
        uv2[i * 2] = THREE.MathUtils.clamp(calcular(v), 0, 1);
        uv2[i * 2 + 1] = 0.5;
    }

    geometria.setAttribute("uv2", new THREE.BufferAttribute(uv2, 2));
}

// Microondulações do esmalte (ruído suave) para os reflexos não ficarem
// perfeitos demais, como numa cerâmica de verdade.
function criarTexturaEsmalte() {
    const L = 512;
    const A = 256;
    let semente = 7;
    const aleatorio = () => (semente = (semente * 16807) % 2147483647) / 2147483647;

    const altura = new Float32Array(L * A);

    [[6, 3, 1], [12, 6, 0.45]].forEach(([gx, gy, peso]) => {
        const grade = Array.from({ length: gx * gy }, aleatorio);
        const valor = (x, y) => grade[(y % gy) * gx + (x % gx)];

        for (let y = 0; y < A; y++) {
            for (let x = 0; x < L; x++) {
                const fx = (x / L) * gx;
                const fy = (y / A) * gy;
                const x0 = Math.floor(fx);
                const y0 = Math.floor(fy);
                const tx = THREE.MathUtils.smootherstep(fx - x0, 0, 1);
                const ty = THREE.MathUtils.smootherstep(fy - y0, 0, 1);
                const cima = THREE.MathUtils.lerp(valor(x0, y0), valor(x0 + 1, y0), tx);
                const baixo = THREE.MathUtils.lerp(valor(x0, y0 + 1), valor(x0 + 1, y0 + 1), tx);
                altura[y * L + x] += THREE.MathUtils.lerp(cima, baixo, ty) * peso;
            }
        }
    });

    const tela = document.createElement("canvas");
    tela.width = L;
    tela.height = A;
    const c = tela.getContext("2d");
    const imagem = c.createImageData(L, A);
    const h = (x, y) => altura[((y + A) % A) * L + ((x + L) % L)];

    for (let y = 0; y < A; y++) {
        for (let x = 0; x < L; x++) {
            const dx = (h(x + 1, y) - h(x - 1, y)) * 6;
            const dy = (h(x, y + 1) - h(x, y - 1)) * 6;
            const n = new THREE.Vector3(-dx, -dy, 1).normalize();
            imagem.data.set([(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255, 255], (y * L + x) * 4);
        }
    }

    c.putImageData(imagem, 0, 0);
    return new THREE.CanvasTexture(tela);
}

// Alça com seção oval (mais larga de frente que de lado) que engrossa nas
// pontas, imitando a "solda" da alça no corpo da caneca.
function criarGeometriaAlca(curva) {
    const segmentos = 140;
    const lados = 40;
    const posicoes = [];
    const normais = [];
    const uvs = [];
    const indices = [];
    const largura = new THREE.Vector3(0, 0, 1);

    for (let i = 0; i <= segmentos; i++) {
        const t = i / segmentos;
        const centro = curva.getPointAt(t);
        const tangente = curva.getTangentAt(t);
        const lado = new THREE.Vector3(-tangente.y, tangente.x, 0).normalize();

        const ponta = Math.max(0, 1 - Math.min(t, 1 - t) / 0.08);
        const alarga = 1 + 0.2 * ponta * ponta;
        const a = ESPESSURA_ALCA * alarga;
        const b = LARGURA_ALCA * alarga;

        for (let j = 0; j <= lados; j++) {
            const angulo = (j / lados) * Math.PI * 2;
            const cos = Math.cos(angulo);
            const sen = Math.sin(angulo);

            const p = centro.clone().addScaledVector(lado, cos * a).addScaledVector(largura, sen * b);
            const n = lado.clone().multiplyScalar(cos / a).addScaledVector(largura, sen / b).normalize();

            posicoes.push(p.x, p.y, p.z);
            normais.push(n.x, n.y, n.z);
            uvs.push(t, j / lados);
        }
    }

    for (let i = 0; i < segmentos; i++) {
        for (let j = 0; j < lados; j++) {
            const a = i * (lados + 1) + j;
            const b = a + lados + 1;
            indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
    }

    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));
    geometria.setAttribute("normal", new THREE.Float32BufferAttribute(normais, 3));
    geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometria.setIndex(indices);
    return geometria;
}

// Sombra pré-desenhada num plano de 6x6 unidades (centro = eixo da caneca).
function criarPlanoSombra(desenhar) {
    const tela = document.createElement("canvas");
    tela.width = tela.height = 512;
    const c = tela.getContext("2d");
    const escala = 512 / 6;

    desenhar(c, escala, (x, z) => [256 + x * escala, 256 + z * escala]);

    const plano = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(tela),
            transparent: true,
            depthWrite: false,
            toneMapped: false
        })
    );
    plano.rotation.x = -Math.PI / 2;
    return plano;
}

function sombraRedonda(c, escala, ponto, x, z, de, ate, alfa) {
    const [px, pz] = ponto(x, z);
    const gradiente = c.createRadialGradient(px, pz, de * escala, px, pz, ate * escala);
    gradiente.addColorStop(0, `rgba(0, 0, 0, ${alfa})`);
    gradiente.addColorStop(1, "rgba(0, 0, 0, 0)");
    c.fillStyle = gradiente;
    c.fillRect(0, 0, 512, 512);
}

// Posição e tamanho da arte na textura que dá a volta na caneca: redimensionada
// inteira, sem cortes, entre os dois lados da alça, com até 86% da altura da
// parede, centralizada na face que fica de frente com a alça à direita (como
// nas fotos de catálogo); artes largas deslizam para trás até caberem.
function medidasArte(L, A, arte) {
    const alturaParede = TOPO_PAREDE - BASE_PAREDE;
    const folga = (FOLGA_ALCA / (2 * Math.PI)) * L;
    const areaL = L - 2 * folga;
    const areaA = A * 0.86;
    const unidadesL = (areaL / L) * 2 * Math.PI * RAIO;
    const unidadesA = (areaA / A) * alturaParede;

    const escala = Math.min(unidadesL / arte.width, unidadesA / arte.height);
    const l = (arte.width * escala * areaL) / unidadesL;
    const a = (arte.height * escala * areaA) / unidadesA;
    const centro = THREE.MathUtils.clamp(L * 0.75, folga + l / 2, L - folga - l / 2);

    return { x: centro - l / 2, y: (A - a) / 2, l, a, folga };
}

// Monta a caneca (geometria, materiais, estampa e papel sublimático) como um
// grupo que pode entrar em qualquer cena. As sombras de chão vêm separadas,
// para quem usa decidir onde ficam.
function criarModeloCaneca({ anisotropia = 1 } = {}) {
    // impressa: a arte já foi sublimada na cerâmica
    // papel: opacidade do papel sublimático enrolado (0 = sem papel)
    // nivel: altura do café dentro da caneca (0 = vazia, 1 = cheia)
    const estado = { tipo: "tradicional", cor: "vermelho", arte: null, frio: 1, impressa: true, papel: 0, nivel: 0 };
    const grupo = new THREE.Group();

    // Textura da parede externa: um "papel" que dá a volta na caneca.
    // A emenda (começo e fim da textura) fica embaixo da alça.
    const telaEstampa = document.createElement("canvas");
    telaEstampa.width = 2048;
    telaEstampa.height = 1024;
    const ctxEstampa = telaEstampa.getContext("2d");

    const texturaEstampa = new THREE.CanvasTexture(telaEstampa);
    texturaEstampa.encoding = THREE.sRGBEncoding;
    texturaEstampa.anisotropy = anisotropia;

    // Cerâmica: base fosca (sem reflexo próprio) com uma camada de esmalte
    // brilhante por cima — na cerâmica real, quem reflete é só o esmalte.
    const ceramica = {
        roughness: 0.6,
        reflectivity: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        clearcoatNormalMap: criarTexturaEsmalte(),
        clearcoatNormalScale: new THREE.Vector2(0.12, 0.12),
        aoMap: criarTexturaOclusao(),
        side: THREE.DoubleSide
    };
    const materialParede = new THREE.MeshPhysicalMaterial({ ...ceramica, map: texturaEstampa });
    const materialBase = new THREE.MeshPhysicalMaterial({ ...ceramica, color: BRANCO });
    const materialDetalhe = new THREE.MeshPhysicalMaterial({ ...ceramica, color: BRANCO });
    const materiais = [materialParede, materialBase, materialDetalhe];

    const curvaAlca = new THREE.CatmullRomCurve3(
        PONTOS_ALCA.map(([x, y]) => new THREE.Vector3(x, y, 0)),
        false,
        "centripetal"
    );
    const amostrasAlca = Array.from({ length: 90 }, (_, i) => curvaAlca.getPointAt(i / 89));

    // Parede onde vai a estampa (thetaStart PI/2 = emenda do lado da alça).
    const alturaParede = TOPO_PAREDE - BASE_PAREDE;
    const geometriaParede = new THREE.CylinderGeometry(RAIO, RAIO, alturaParede, 160, 48, true, Math.PI / 2);
    geometriaParede.translate(0, (TOPO_PAREDE + BASE_PAREDE) / 2, 0);

    // Escurece perto da alça (que bloqueia a luz) e bem rente ao chão.
    aplicarOclusao(geometriaParede, (v) => {
        let distancia = Infinity;
        amostrasAlca.forEach((p) => {
            distancia = Math.min(distancia, v.distanceTo(p) - LARGURA_ALCA);
        });
        const alca = 1 - 0.5 * Math.exp(-Math.max(distancia, 0) / 0.08);
        const chao = 1 - 0.18 * Math.exp(-(v.y - BASE) / 0.1);
        return alca * chao;
    });
    grupo.add(new THREE.Mesh(geometriaParede, materialParede));

    // Borda arredondada + parede interna + fundo interno (cor do interior).
    const raioCanto = 0.2;
    const yCanto = FUNDO_INTERNO + raioCanto;
    const perfilInterior = arco(RAIO - PAREDE / 2, TOPO_PAREDE, PAREDE / 2, 0, Math.PI, 12);

    for (let i = 1; i <= 24; i++) {
        perfilInterior.push(new THREE.Vector2(RAIO_INTERNO, TOPO_PAREDE - (TOPO_PAREDE - yCanto) * (i / 24)));
    }
    perfilInterior.push(...arco(RAIO_INTERNO - raioCanto, yCanto, raioCanto, 0, -Math.PI / 2, 10).slice(1));
    for (let i = 1; i <= 8; i++) {
        perfilInterior.push(new THREE.Vector2((RAIO_INTERNO - raioCanto) * (1 - i / 8), FUNDO_INTERNO));
    }

    const geometriaInterior = new THREE.LatheGeometry(perfilInterior, 160);

    // Quanto mais fundo, menos luz chega (o interior de uma caneca real escurece).
    aplicarOclusao(geometriaInterior, (v) => {
        const r = Math.hypot(v.x, v.z);
        if (v.y > TOPO_PAREDE - 0.001 && r > RAIO_INTERNO + 0.01) return 1;

        const profundidade = Math.max(0, TOPO_PAREDE - v.y);
        let oclusao = 0.42 + 0.58 * Math.exp(-profundidade / 0.75);
        if (v.y < yCanto) oclusao *= 1 - 0.12 * Math.exp(-(RAIO_INTERNO - r) / 0.12);
        return oclusao;
    });
    grupo.add(new THREE.Mesh(geometriaInterior, materialDetalhe));

    // Fundo externo com a quina arredondada e o rebaixo embaixo.
    const perfilBase = [
        ...arco(RAIO - CANTO_BASE, BASE_PAREDE, CANTO_BASE, 0, -Math.PI / 2, 8),
        new THREE.Vector2(0.84, BASE),
        new THREE.Vector2(0.82, BASE + 0.025),
        new THREE.Vector2(0, BASE + 0.025)
    ];
    const geometriaBase = new THREE.LatheGeometry(perfilBase, 160);
    aplicarOclusao(geometriaBase, (v) => 0.55 + 0.25 * THREE.MathUtils.clamp((v.y - BASE) / CANTO_BASE, 0, 1));
    grupo.add(new THREE.Mesh(geometriaBase, materialBase));

    // Alça: escurece onde encosta no corpo.
    const geometriaAlca = criarGeometriaAlca(curvaAlca);
    aplicarOclusao(geometriaAlca, (v) => {
        const foraDoCorpo = Math.hypot(v.x, v.z) - RAIO;
        return 1 - 0.55 * Math.exp(-Math.max(foraDoCorpo, 0) / 0.09);
    });
    grupo.add(new THREE.Mesh(geometriaAlca, materialDetalhe));

    // Papel sublimático enrolado na caneca (com a arte impressa e fitas térmicas),
    // usado antes de prensar.
    const telaPapel = document.createElement("canvas");
    telaPapel.width = 2048;
    telaPapel.height = 1024;
    const ctxPapel = telaPapel.getContext("2d");

    const texturaPapel = new THREE.CanvasTexture(telaPapel);
    texturaPapel.encoding = THREE.sRGBEncoding;
    texturaPapel.anisotropy = anisotropia;

    const materialPapel = new THREE.MeshStandardMaterial({
        map: texturaPapel,
        transparent: true,
        roughness: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const geometriaPapel = new THREE.CylinderGeometry(RAIO + 0.008, RAIO + 0.008, alturaParede, 160, 1, true, Math.PI / 2);
    geometriaPapel.translate(0, (TOPO_PAREDE + BASE_PAREDE) / 2, 0);
    const papel = new THREE.Mesh(geometriaPapel, materialPapel);
    papel.visible = false;
    grupo.add(papel);

    // Café dentro da caneca (superfície do líquido), usado na caneca mágica.
    const cafe = new THREE.Mesh(
        new THREE.CircleGeometry(1, 64),
        new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(0x3a2214).convertSRGBToLinear(),
            roughness: 0.12,
            clearcoat: 1,
            clearcoatRoughness: 0.05
        })
    );
    cafe.rotation.x = -Math.PI / 2;
    cafe.visible = false;
    grupo.add(cafe);

    // Altura (no eixo da caneca) da superfície do café para um nível de 0 a 1.
    function alturaDoCafe(nivel) {
        return FUNDO_INTERNO + nivel * (TOPO_PAREDE - 0.14 - FUNDO_INTERNO);
    }

    function atualizarCafe() {
        const y = alturaDoCafe(estado.nivel);
        // No fundo a parede interna é curva: o raio do líquido acompanha a curva.
        const raioCanto = 0.2;
        const yCanto = FUNDO_INTERNO + raioCanto;
        const raio = y >= yCanto
            ? RAIO_INTERNO - 0.004
            : RAIO_INTERNO - raioCanto + Math.sqrt(Math.max(0, raioCanto ** 2 - (yCanto - y) ** 2)) - 0.004;

        cafe.visible = estado.nivel > 0.001;
        cafe.position.y = y;
        cafe.scale.setScalar(Math.max(raio, 0.01));
    }
    let arteNoPapel = null;

    // Sombras no chão: a do corpo pode ficar parada (a luz não gira); a da alça
    // deve girar junto com a caneca.
    const sombraCorpo = criarPlanoSombra((c, escala, ponto) => {
        sombraRedonda(c, escala, ponto, 0.5, -0.4, 0.8, 1.9, 0.16);   // luz principal
        sombraRedonda(c, escala, ponto, 0, 0, 1, 1.35, 0.22);         // penumbra
        sombraRedonda(c, escala, ponto, 0, 0, 0.99, 1.06, 0.5);       // contato
    });
    sombraCorpo.position.y = BASE - 0.002;

    const sombraAlca = criarPlanoSombra((c, escala, ponto) => {
        const [px, pz] = ponto(1.42, 0);
        c.translate(px, pz);
        c.scale(0.5 * escala, 0.24 * escala);
        const gradiente = c.createRadialGradient(0, 0, 0, 0, 0, 1);
        gradiente.addColorStop(0, "rgba(0, 0, 0, 0.2)");
        gradiente.addColorStop(1, "rgba(0, 0, 0, 0)");
        c.fillStyle = gradiente;
        c.fillRect(-1, -1, 2, 2);
    });
    sombraAlca.position.y = BASE - 0.001;

    function desenharEstampa() {
        const { width: L, height: A } = telaEstampa;

        ctxEstampa.fillStyle = "#f4f4f1";
        ctxEstampa.fillRect(0, 0, L, A);

        if (estado.arte && estado.impressa) {
            const m = medidasArte(L, A, estado.arte);
            ctxEstampa.drawImage(estado.arte, m.x, m.y, m.l, m.a);
        }

        if (estado.tipo === "magica" && estado.frio > 0) {
            ctxEstampa.globalAlpha = estado.frio;
            ctxEstampa.fillStyle = "#161616";

            if (estado.nivel <= 0.001) {
                ctxEstampa.fillRect(0, 0, L, A);
            } else {
                // A tinta só some onde o café quente encosta: do fundo até o
                // nível da bebida, com uma faixa de transição suave.
                const alturaParede = TOPO_PAREDE - BASE_PAREDE;
                const linha = (A * (TOPO_PAREDE - alturaDoCafe(estado.nivel))) / alturaParede;
                const faixa = 70;
                ctxEstampa.fillRect(0, 0, L, Math.max(0, linha - faixa));
                const transicao = ctxEstampa.createLinearGradient(0, linha - faixa, 0, linha);
                transicao.addColorStop(0, "rgba(22, 22, 22, 1)");
                transicao.addColorStop(1, "rgba(22, 22, 22, 0)");
                ctxEstampa.fillStyle = transicao;
                ctxEstampa.fillRect(0, linha - faixa, L, faixa);
            }

            ctxEstampa.globalAlpha = 1;
        }

        texturaEstampa.needsUpdate = true;
    }

    function desenharPapel() {
        const { width: L, height: A } = telaPapel;
        ctxPapel.clearRect(0, 0, L, A);

        if (estado.arte) {
            const m = medidasArte(L, A, estado.arte);
            const x0 = Math.max(m.folga * 0.5, m.x - 40);
            const x1 = Math.min(L - m.folga * 0.5, m.x + m.l + 40);
            const y0 = A * 0.035;
            const y1 = A * 0.965;

            ctxPapel.fillStyle = "#fbfbf8";
            ctxPapel.fillRect(x0, y0, x1 - x0, y1 - y0);
            ctxPapel.drawImage(estado.arte, m.x, m.y, m.l, m.a);

            // A impressão no papel fica um pouco mais "apagada" que na cerâmica.
            ctxPapel.fillStyle = "rgba(255, 255, 255, 0.18)";
            ctxPapel.fillRect(x0, y0, x1 - x0, y1 - y0);

            // Fitas térmicas azuis prendendo as pontas do papel.
            ctxPapel.fillStyle = "rgba(41, 121, 255, 0.62)";
            [x0, x1].forEach((x) => {
                [0.26, 0.74].forEach((v) => ctxPapel.fillRect(x - 46, A * v - 34, 92, 68));
            });
        }

        texturaPapel.needsUpdate = true;
        arteNoPapel = estado.arte;
    }

    function atualizarPapel() {
        papel.visible = Boolean(estado.arte) && estado.papel > 0.001;
        materialPapel.opacity = estado.papel;
    }

    function atualizar() {
        const magica = estado.tipo === "magica";
        let corDetalhe = BRANCO;

        if (estado.tipo === "colorida") corDetalhe = CORES_HEX[estado.cor];
        if (magica) corDetalhe = PRETO_MAGICA;

        // As cores em hexadecimal são sRGB; a renderização trabalha em linear.
        materialDetalhe.color.setHex(corDetalhe).convertSRGBToLinear();
        materialBase.color.setHex(magica ? PRETO_MAGICA : BRANCO).convertSRGBToLinear();

        // A caneca mágica tem acabamento acetinado: reflexos mais suaves.
        materiais.forEach((material) => {
            material.roughness = 0.6;
            material.clearcoat = magica ? 0.6 : 1;
            material.clearcoatRoughness = magica ? 0.22 : 0.06;
        });

        desenharEstampa();
        if (estado.arte !== arteNoPapel) desenharPapel();
        atualizarPapel();
        atualizarCafe();
    }

    // Uma animação de calor por vez: começar outra cancela a anterior.
    let animacaoCalor = 0;

    atualizar();

    return {
        grupo,
        estado,
        sombraCorpo,
        sombraAlca,

        definir(novo) {
            Object.assign(estado, novo);

            // Animações: só papel, ou só café/calor, não precisam refazer os materiais.
            const chaves = Object.keys(novo);
            if (chaves.every((chave) => chave === "papel")) {
                atualizarPapel();
            } else if (chaves.every((chave) => chave === "nivel" || chave === "frio")) {
                desenharEstampa();
                atualizarCafe();
            } else {
                atualizar();
            }
        },

        animarCalor(destino, duracao = 1200) {
            const id = ++animacaoCalor;
            const inicio = estado.frio;
            const comeco = performance.now();

            // Usa o relógio atual (e não o horário do quadro, que pode ser
            // anterior ao clique) para o progresso nunca ficar negativo.
            function passo() {
                if (id !== animacaoCalor) return;
                const t = Math.min(1, (performance.now() - comeco) / duracao);
                estado.frio = inicio + (destino - inicio) * t;
                desenharEstampa();
                if (t < 1) requestAnimationFrame(passo);
            }

            requestAnimationFrame(passo);
        }
    };
}

// Sólido de torno com faces planas (8 lados, como uma cafeteira italiana).
// Os cantos ficam nos múltiplos de 2π/lados, então um deles aponta para -X.
// Um ponto repetido no perfil vira uma quina viva.
function tornoFacetado(perfil, lados) {
    const posicoes = [];
    const normais = [];
    const indices = [];
    const meio = Math.PI / lados;

    for (let k = 0; k < lados; k++) {
        const a0 = 2 * meio * k;
        const centro = a0 + meio;
        const primeiro = posicoes.length / 3;

        perfil.forEach((p, i) => {
            // Normal da face: inclinação do perfil (no meio da face) e direção da face
            const antes = perfil[Math.max(i - 1, 0)];
            const depois = perfil[Math.min(i + 1, perfil.length - 1)];
            const dr = (depois.x - antes.x) * Math.cos(meio);
            const dy = depois.y - antes.y;
            const tamanho = Math.hypot(dr, dy) || 1;
            [a0, a0 + 2 * meio].forEach((a) => {
                posicoes.push(p.x * Math.cos(a), p.y, p.x * Math.sin(a));
                normais.push((dy / tamanho) * Math.cos(centro), -dr / tamanho, (dy / tamanho) * Math.sin(centro));
            });
        });

        for (let i = 0; i < perfil.length - 1; i++) {
            const v = primeiro + i * 2;
            indices.push(v + 1, v, v + 2, v + 1, v + 2, v + 3);
        }
    }

    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));
    geometria.setAttribute("normal", new THREE.Float32BufferAttribute(normais, 3));
    geometria.setIndex(indices);
    return geometria;
}

// Visualizador avulso: uma caneca girando sobre fundo de estúdio, dentro do
// elemento indicado (usado no modal de revelação).
function criarCaneca3D(container, { girarSozinha = true, angulo = -0.25 } = {}) {
    const cena = new THREE.Scene();

    // Lente "longa" como em foto de produto: pouca distorção de perspectiva.
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
    const elevacao = THREE.MathUtils.degToRad(12);

    const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 640 ? 1.5 : 2));
    renderizador.outputEncoding = THREE.sRGBEncoding;
    // Resposta linear: as cores da arte saem fiéis ao arquivo do cliente.
    renderizador.toneMapping = THREE.LinearToneMapping;
    renderizador.toneMappingExposure = 1.25;
    container.appendChild(renderizador.domElement);

    const pmrem = new THREE.PMREMGenerator(renderizador);
    cena.environment = pmrem.fromScene(criarEstudio(), 0.04).texture;
    pmrem.dispose();

    const modelo = criarModeloCaneca({ anisotropia: renderizador.capabilities.getMaxAnisotropy() });
    const caneca = modelo.grupo;
    caneca.rotation.y = angulo; // 0 = alça apontando para a direita
    cena.add(caneca);
    cena.add(modelo.sombraCorpo);
    caneca.add(modelo.sombraAlca);

    // ---------- Cafeteira italiana (caneca mágica): clicar nela serve café quente ----------
    // Alumínio de 8 faces, alça e pegador de baquelite, válvula de latão. Fica
    // de pé ao lado da caneca; para servir, levanta, inclina e despeja.
    const cor = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    const aluminio = new THREE.MeshPhysicalMaterial({ color: cor(0xbfc2c7), metalness: 1, roughness: 0.32 });
    const baquelite = new THREE.MeshPhysicalMaterial({ color: cor(0x151515), roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 });
    const latao = new THREE.MeshStandardMaterial({ color: cor(0xc9a55a), metalness: 1, roughness: 0.3 });
    const cafeLiquido = new THREE.MeshPhysicalMaterial({ color: cor(0x3a2214), roughness: 0.12, clearcoat: 1 });
    const cafeNoBico = new THREE.MeshStandardMaterial({ color: cor(0x1e120a), roughness: 0.3 });

    // Ponta do bico, medida a partir do centro do fundo da cafeteira
    const PONTA_BICO = new THREE.Vector3(-1.12, 2.87, 0);

    // O grupo de fora fica na ponta do bico: a cafeteira inclina em torno dela
    // e o café sai sempre do mesmo ponto.
    const cafeteira = new THREE.Group();
    cafeteira.visible = false;
    cena.add(cafeteira);
    const corpo = new THREE.Group();
    corpo.position.copy(PONTA_BICO).negate();
    cafeteira.add(corpo);

    function peca(geometria, material) {
        const malha = new THREE.Mesh(geometria, material);
        corpo.add(malha);
        return malha;
    }
    const perfil = (pontos) => pontos.map(([r, y]) => new THREE.Vector2(r, y));

    // Caldeira embaixo, anel da rosca na cintura e jarra em cima
    peca(tornoFacetado(perfil([
        [0, 0], [0.8, 0], [0.85, 0.035], [0.865, 0.09],
        [0.69, 1.28], [0.69, 1.28], [0.715, 1.3], [0.715, 1.37], [0.715, 1.37], [0.69, 1.4], [0.69, 1.4],
        [0.865, 2.79], [0.895, 2.83], [0.895, 2.87], [0.895, 2.87], [0.8, 2.87]
    ]), 8), aluminio);
    peca(tornoFacetado(perfil([[0.91, 2.87], [0.91, 2.91], [0.86, 2.95], [0.6, 3.04], [0.3, 3.08], [0, 3.09]]), 8), aluminio);
    peca(new THREE.LatheGeometry(perfil([[0, 3.08], [0.14, 3.08], [0.17, 3.12], [0.17, 3.2], [0.12, 3.27], [0, 3.29]]), 32), baquelite);

    // Bico em "V" na quina da frente (-X): duas faces de alumínio e a boca escura
    function triangulos(pontos) {
        const geometria = new THREE.BufferGeometry().setFromPoints(pontos);
        geometria.computeVertexNormals();
        return geometria;
    }
    const ladoBico1 = new THREE.Vector3(-0.758, 2.87, 0.33);
    const ladoBico2 = new THREE.Vector3(-0.758, 2.87, -0.33);
    const baseBico = new THREE.Vector3(-0.822, 2.45, 0);
    peca(triangulos([PONTA_BICO, baseBico, ladoBico1, PONTA_BICO, ladoBico2, baseBico]), aluminio);
    peca(triangulos([PONTA_BICO, ladoBico1, ladoBico2]), cafeNoBico);

    // Alça de baquelite atrás (+X), presa embaixo da tampa e na jarra, e a dobradiça da tampa
    const formaAlca = new THREE.Shape();
    formaAlca.moveTo(0.82, 2.86);
    formaAlca.lineTo(1.38, 2.9);
    formaAlca.quadraticCurveTo(1.66, 2.9, 1.66, 2.62);
    formaAlca.lineTo(1.5, 1.82);
    formaAlca.quadraticCurveTo(1.45, 1.62, 1.25, 1.62);
    formaAlca.lineTo(0.66, 1.62);
    formaAlca.lineTo(0.66, 1.84);
    formaAlca.lineTo(1.16, 1.84);
    formaAlca.quadraticCurveTo(1.27, 1.86, 1.29, 1.98);
    formaAlca.lineTo(1.42, 2.56);
    formaAlca.quadraticCurveTo(1.44, 2.66, 1.32, 2.66);
    formaAlca.lineTo(0.82, 2.64);
    formaAlca.closePath();
    const geometriaAlca = new THREE.ExtrudeGeometry(formaAlca, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 3, curveSegments: 12 });
    geometriaAlca.translate(0, 0, -0.1);
    peca(geometriaAlca, baquelite);

    const dobradica = peca(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16), aluminio);
    dobradica.position.set(0.93, 2.93, 0);
    dobradica.rotation.x = Math.PI / 2;

    // Válvula de segurança de latão na face da caldeira virada para a frente
    const anguloValvula = (5 * Math.PI) / 8;
    const normalValvula = new THREE.Vector3(0.991 * Math.cos(anguloValvula), 0.135, 0.991 * Math.sin(anguloValvula));
    const pontoValvula = new THREE.Vector3(0.727 * Math.cos(anguloValvula), 0.62, 0.727 * Math.sin(anguloValvula));
    [[0.075, 0.06, 6, 0.03], [0.05, 0.05, 20, 0.08], [0.014, 0.06, 8, 0.13]].forEach(([raioPeca, altura, lados, distancia]) => {
        const parte = peca(new THREE.CylinderGeometry(raioPeca, raioPeca, altura, lados), latao);
        parte.position.copy(pontoValvula).addScaledVector(normalValvula, distancia);
        parte.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalValvula);
    });

    const pecasCafeteira = [];
    cafeteira.traverse((parte) => {
        if (parte.isMesh) pecasCafeteira.push(parte);
    });

    // Sombra de contato da cafeteira de pé (some quando ela levanta)
    function texturaRedonda(paradas) {
        const tela = document.createElement("canvas");
        tela.width = tela.height = 128;
        const c = tela.getContext("2d");
        const gradiente = c.createRadialGradient(64, 64, 0, 64, 64, 64);
        paradas.forEach(([posicao, corCss]) => gradiente.addColorStop(posicao, corCss));
        c.fillStyle = gradiente;
        c.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(tela);
    }

    const BASE_CAFETEIRA = new THREE.Vector3(2.85, BASE, -0.85);
    const sombraCafeteira = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        new THREE.MeshBasicMaterial({
            map: texturaRedonda([[0, "rgba(0, 0, 0, 0.55)"], [0.55, "rgba(0, 0, 0, 0.3)"], [1, "rgba(0, 0, 0, 0)"]]),
            transparent: true,
            depthWrite: false,
            toneMapped: false
        })
    );
    sombraCafeteira.rotation.x = -Math.PI / 2;
    sombraCafeteira.position.set(BASE_CAFETEIRA.x, BASE + 0.003, BASE_CAFETEIRA.z);
    sombraCafeteira.visible = false;
    cena.add(sombraCafeteira);

    // Poses: de pé ao lado da caneca, ou com a ponta do bico logo acima da borda
    const REPOUSO = BASE_CAFETEIRA.clone().add(PONTA_BICO);
    const SERVINDO = new THREE.Vector3(0.62, 1.9, 0);
    const INCLINACAO = 0.92;

    // k: 0 = de pé, 1 = com o bico sobre a caneca
    function posarCafeteira(k, inclinacao) {
        cafeteira.position.lerpVectors(REPOUSO, SERVINDO, k);
        cafeteira.position.y += Math.sin(Math.PI * k) * 0.5; // sobe em arco para não bater na caneca
        cafeteira.rotation.z = inclinacao;
        sombraCafeteira.material.opacity = 1 - Math.min(1, k * 4);
    }

    // Altura da superfície do café dentro da caneca
    const alturaDoCafe = () => BASE + 0.2 + modelo.estado.nivel * (TOPO_PAREDE - 0.14 - BASE - 0.2);

    // Filete de café: tubo que segue a queda do bico até a caneca, mais
    // grosso perto do bico e com uma ondulação leve.
    const ANEIS = 28;
    const LADOS = 10;
    const posicoesFilete = new Float32Array(ANEIS * LADOS * 3);
    const geometriaFilete = new THREE.BufferGeometry();
    geometriaFilete.setAttribute("position", new THREE.BufferAttribute(posicoesFilete, 3));
    const indicesFilete = [];
    for (let i = 0; i < ANEIS - 1; i++) {
        for (let j = 0; j < LADOS; j++) {
            const a = i * LADOS + j;
            const b = i * LADOS + ((j + 1) % LADOS);
            indicesFilete.push(a, b, a + LADOS, b, b + LADOS, a + LADOS);
        }
    }
    geometriaFilete.setIndex(indicesFilete);
    const filete = new THREE.Mesh(geometriaFilete, cafeLiquido);
    filete.visible = false;
    filete.frustumCulled = false;
    cena.add(filete);

    const inicioQueda = new THREE.Vector3();
    const curvaQueda = new THREE.Vector3();
    const fimQueda = new THREE.Vector3();
    const pontoQueda = new THREE.Vector3();
    const direcaoQueda = new THREE.Vector3();
    const transversal = new THREE.Vector3();
    const PROFUNDIDADE = new THREE.Vector3(0, 0, 1);

    // Desenha o trecho do filete entre "cauda" e "frente" (0 = bico, 1 = café)
    function desenharFilete(cauda, frente, tempo) {
        inicioQueda.copy(cafeteira.position);
        curvaQueda.set(inicioQueda.x - 0.12, inicioQueda.y - 0.1, 0);
        fimQueda.set(inicioQueda.x - 0.14, alturaDoCafe(), 0);

        for (let i = 0; i < ANEIS; i++) {
            const t = cauda + (frente - cauda) * (i / (ANEIS - 1));
            const u = 1 - t;
            pontoQueda.set(0, 0, 0)
                .addScaledVector(inicioQueda, u * u)
                .addScaledVector(curvaQueda, 2 * u * t)
                .addScaledVector(fimQueda, t * t);
            direcaoQueda.subVectors(curvaQueda, inicioQueda).multiplyScalar(2 * u)
                .addScaledVector(transversal.subVectors(fimQueda, curvaQueda), 2 * t)
                .normalize();
            transversal.crossVectors(direcaoQueda, PROFUNDIDADE);
            const raioFilete = (0.05 - 0.022 * t) * (1 + 0.1 * Math.sin(t * 30 - tempo * 0.02));

            for (let j = 0; j < LADOS; j++) {
                const a = (j / LADOS) * Math.PI * 2;
                const k = (i * LADOS + j) * 3;
                posicoesFilete[k] = pontoQueda.x + raioFilete * Math.sin(a) * transversal.x;
                posicoesFilete[k + 1] = pontoQueda.y + raioFilete * Math.sin(a) * transversal.y;
                posicoesFilete[k + 2] = pontoQueda.z + raioFilete * Math.cos(a);
            }
        }
        geometriaFilete.attributes.position.needsUpdate = true;
        geometriaFilete.computeVertexNormals();
    }

    // Ondinhas onde o filete bate no café
    const texturaOnda = texturaRedonda([[0.55, "rgba(255, 255, 255, 0)"], [0.8, "rgba(255, 255, 255, 0.9)"], [1, "rgba(255, 255, 255, 0)"]]);
    const ondas = [0, 0.5].map((fase) => {
        const onda = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: texturaOnda, color: cor(0xc49a6c), transparent: true, opacity: 0, depthWrite: false })
        );
        onda.rotation.x = -Math.PI / 2;
        onda.visible = false;
        onda.userData.fase = fase;
        cena.add(onda);
        return onda;
    });

    function animarOndas(tempo, visiveis) {
        ondas.forEach((onda) => {
            const fase = (tempo / 650 + onda.userData.fase) % 1;
            onda.visible = visiveis;
            onda.position.set(fimQueda.x, alturaDoCafe() + 0.004, 0);
            onda.scale.setScalar(0.12 + fase * 0.45);
            onda.material.opacity = 0.7 * (1 - fase);
        });
    }

    // Caixa com a caneca e a cafeteira em todo o caminho (levantando,
    // inclinando, servindo e de pé), para o enquadramento
    const caixaComCafeteira = new THREE.Box3(new THREE.Vector3(-1.85, BASE - 0.1, -1.2), new THREE.Vector3(1.85, TOPO + 0.05, 1.2));
    [[0.25, 0.075], [0.5, 0.15], [0.75, 0.225], [1, 0.3], [1, 0.6], [1, INCLINACAO], [0, 0]].forEach(([k, inclinacao]) => {
        posarCafeteira(k, inclinacao);
        cafeteira.updateMatrixWorld(true);
        caixaComCafeteira.expandByObject(cafeteira);
    });

    let despejando = false;

    // Anima de 0 a 1 em "duracao" ms chamando "passo(t)"; devolve uma promessa.
    function animar01(duracao, passo) {
        return new Promise((resolve) => {
            const comeco = performance.now();
            function quadro() {
                const t = Math.min(1, (performance.now() - comeco) / duracao);
                passo(t);
                if (t < 1) requestAnimationFrame(quadro);
                else resolve();
            }
            requestAnimationFrame(quadro);
        });
    }

    const suave = (t) => t * t * (3 - 2 * t);

    async function despejar() {
        if (despejando) return;
        despejando = true;
        modelo.animarCalor(1, 1); // cancela o esfriamento em andamento: começa toda preta

        // Levanta em arco até a caneca (já começando a inclinar) e inclina até o café sair
        await animar01(700, (t) => posarCafeteira(suave(t), 0.3 * suave(t)));
        await animar01(380, (t) => posarCafeteira(1, 0.3 + (INCLINACAO - 0.3) * suave(t)));

        // O filete desce até o fundo e a caneca enche de baixo para cima
        filete.visible = true;
        const comeco = performance.now();
        await animar01(2600, (t) => {
            const tempo = performance.now() - comeco;
            cafeteira.rotation.z = INCLINACAO + 0.025 * Math.sin(tempo / 260); // a mão balança de leve
            modelo.definir({ nivel: suave(t) });
            desenharFilete(0, Math.min(1, tempo / 180), tempo);
            animarOndas(tempo, true);
        });
        animarOndas(0, false);

        // Desinclina (o fim do filete cai na caneca) e põe a cafeteira de volta no lugar
        await animar01(380, (t) => {
            posarCafeteira(1, INCLINACAO - (INCLINACAO - 0.3) * suave(t));
            desenharFilete(Math.min(1, t * 1.6), 1, performance.now() - comeco);
        });
        filete.visible = false;
        await animar01(700, (t) => posarCafeteira(1 - suave(t), 0.3 * (1 - suave(t))));
        despejando = false;
    }

    async function esvaziar() {
        if (despejando) return;
        despejando = true;
        const inicio = modelo.estado.nivel;
        await animar01(1200, (t) => modelo.definir({ nivel: inicio * (1 - suave(t)) }));
        despejando = false;
    }

    // Clique na cafeteira (sem confundir com arrastar para girar a caneca)
    const raio = new THREE.Raycaster();
    const ponteiro = new THREE.Vector2();
    let inicioToque = null;
    let aoClicarCafeteira = null;

    function tocouNaCafeteira(evento) {
        const caixa = container.getBoundingClientRect();
        ponteiro.set(
            ((evento.clientX - caixa.left) / caixa.width) * 2 - 1,
            -((evento.clientY - caixa.top) / caixa.height) * 2 + 1
        );
        raio.setFromCamera(ponteiro, camera);
        return cafeteira.visible && raio.intersectObjects(pecasCafeteira).length > 0;
    }

    container.addEventListener("pointerdown", (evento) => {
        inicioToque = { x: evento.clientX, y: evento.clientY };
    });

    container.addEventListener("pointerup", (evento) => {
        if (!inicioToque) return;
        const moveu = Math.hypot(evento.clientX - inicioToque.x, evento.clientY - inicioToque.y);
        inicioToque = null;
        if (moveu < 6 && tocouNaCafeteira(evento) && aoClicarCafeteira) aoClicarCafeteira();
    });

    container.addEventListener("pointermove", (evento) => {
        if (!arrastando) container.style.cursor = tocouNaCafeteira(evento) ? "pointer" : "";
    });

    // Girar arrastando, com inércia; sozinha ela gira devagar.
    let arrastando = false;
    let ultimoX = 0;
    // Quem pediu "reduzir movimento" no sistema não vê o giro automático.
    const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const velocidadeNormal = girarSozinha && !parado ? 0.004 : 0;
    let velocidade = velocidadeNormal;

    container.addEventListener("pointerdown", (evento) => {
        arrastando = true;
        ultimoX = evento.clientX;
        container.setPointerCapture(evento.pointerId);
    });

    container.addEventListener("pointermove", (evento) => {
        if (!arrastando) return;

        const delta = (evento.clientX - ultimoX) * 0.01;
        caneca.rotation.y += delta;
        velocidade = delta;
        ultimoX = evento.clientX;
    });

    // O arraste termina também se o navegador cancelar o gesto (rolagem no
    // celular), perder a captura do ponteiro ou a janela perder o foco.
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((evento) => {
        container.addEventListener(evento, () => {
            arrastando = false;
        });
    });
    window.addEventListener("blur", () => {
        arrastando = false;
    });

    // Afasta a câmera o suficiente para a caneca (com a alça) caber na largura e na altura.
    function ajustarTamanho() {
        const largura = container.clientWidth;
        const altura = container.clientHeight || largura;
        renderizador.setSize(largura, altura, false);

        camera.aspect = largura / Math.max(altura, 1);
        const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

        // Com a cafeteira à vista, o enquadramento abre para caber as duas
        // (inclusive com ela levantada, servindo).
        const comCafeteira = cafeteira.visible;
        const alvo = comCafeteira ? caixaComCafeteira.getCenter(new THREE.Vector3()) : new THREE.Vector3(0, -0.15, 0);
        const meiaAltura = comCafeteira ? (caixaComCafeteira.max.y - caixaComCafeteira.min.y) / 2 + 0.1 : 2.05;
        const meiaLargura = comCafeteira ? (caixaComCafeteira.max.x - caixaComCafeteira.min.x) / 2 + 0.1 : 2.1;

        const distancia = Math.max(meiaAltura / tanV, meiaLargura / (tanV * camera.aspect));
        camera.position.set(alvo.x, alvo.y + distancia * Math.sin(elevacao), alvo.z + distancia * Math.cos(elevacao));
        camera.lookAt(alvo);
        camera.updateProjectionMatrix();
    }

    new ResizeObserver(ajustarTamanho).observe(container);

    // Só desenha quando a caneca está visível na tela (economiza bateria).
    let visivel = false;
    new IntersectionObserver(([entrada]) => {
        visivel = entrada.isIntersecting;
    }).observe(container);

    function animar() {
        if (visivel) {
            if (!arrastando) {
                caneca.rotation.y += velocidade;
                // A inércia vai diminuindo até voltar à rotação lenta automática.
                velocidade += (velocidadeNormal - velocidade) * 0.03;
            }

            renderizador.render(cena, camera);
        }

        requestAnimationFrame(animar);
    }

    ajustarTamanho();
    animar();

    return {
        estado: modelo.estado,
        definir: modelo.definir,
        animarCalor: modelo.animarCalor,
        despejar,
        esvaziar,
        ocupado: () => despejando,

        // Mostra ou esconde a cafeteira (só na caneca mágica) e reenquadra a câmera.
        mostrarCafeteira(visivel) {
            cafeteira.visible = visivel;
            sombraCafeteira.visible = visivel;
            posarCafeteira(0, 0);
            filete.visible = false;
            animarOndas(0, false);
            ajustarTamanho();
        },

        aoClicarCafeteira(funcao) {
            aoClicarCafeteira = funcao;
        },

        // Foto da caneca como está na tela (PNG em data URL), para o pedido.
        foto() {
            renderizador.render(cena, camera);
            return renderizador.domElement.toDataURL("image/png");
        }
    };
}
