/* ==========================================================================
   OBJETOS VIVOS DA BANCADA (Three.js)
   - Luminária de arquiteto: base de ferro, braços de latão com molas e
     cúpula de esmalte creme. Clicar apaga as luzes do estúdio e acende o
     facho sobre a prensa ("estúdio noturno").
   - Rádio de fita cassete: clicar toca as playlists lo-fi (static/lofi.js),
     com as bobinas da fita girando e a etiqueta na cor da playlist.
   Mesma escala da caneca e da prensa: 1 unidade = 41 mm.
   ========================================================================== */

// Brilho redondo: centro claro que some nas bordas
function texturaDeBrilho() {
    const tela = document.createElement("canvas");
    tela.width = tela.height = 128;
    const c = tela.getContext("2d");
    const gradiente = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradiente.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradiente.addColorStop(0.35, "rgba(255, 255, 255, 0.45)");
    gradiente.addColorStop(1, "rgba(255, 255, 255, 0)");
    c.fillStyle = gradiente;
    c.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(tela);
}

// Recebe, em coordenadas da bancada, onde fica a base, onde fica a cabeça (a
// junta da cúpula) e para onde a luz aponta; o cotovelo sai por cinemática
// inversa. "grupo" tem as peças (clicáveis e usadas no enquadramento da
// câmera); "efeitos" tem a luz, o facho visível, o brilho e a poça de luz.
function criarLuminaria({ base, cabeca, alvo }) {
    const cor = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    const latao = new THREE.MeshStandardMaterial({ color: cor(0xc8a35a), metalness: 1, roughness: 0.26 });
    const aco = new THREE.MeshStandardMaterial({ color: cor(0xd6d8dc), metalness: 1, roughness: 0.22 });
    const ferro = new THREE.MeshPhysicalMaterial({ color: cor(0x18181b), roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    const esmalte = new THREE.MeshPhysicalMaterial({ color: cor(0xe8e0cc), roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    const forro = new THREE.MeshStandardMaterial({ color: cor(0xf6f2e8), roughness: 0.55, side: THREE.BackSide, emissive: new THREE.Color(1, 0.78, 0.5), emissiveIntensity: 0 });
    const vidro = new THREE.MeshStandardMaterial({ color: cor(0xfff2dc), roughness: 0.1, emissive: new THREE.Color(1, 0.8, 0.52), emissiveIntensity: 0 });
    const tecido = new THREE.MeshStandardMaterial({ color: cor(0x2b2623), roughness: 0.9 });

    const grupo = new THREE.Group();
    const efeitos = new THREE.Group();
    const CIMA = new THREE.Vector3(0, 1, 0);

    function adicionar(geometria, material, posicao, pai = grupo) {
        const malha = new THREE.Mesh(geometria, material);
        if (posicao) malha.position.copy(posicao);
        pai.add(malha);
        return malha;
    }

    // Peça cilíndrica (haste, pino) ligando dois pontos
    function cilindroEntre(de, ate, raio, material, lados = 16) {
        const direcao = new THREE.Vector3().subVectors(ate, de);
        const malha = adicionar(new THREE.CylinderGeometry(raio, raio, direcao.length(), lados), material, de.clone().addScaledVector(direcao, 0.5));
        malha.quaternion.setFromUnitVectors(CIMA, direcao.normalize());
        return malha;
    }

    // Mola helicoidal de aço entre dois pontos
    function mola(de, ate, voltas) {
        const comprimento = de.distanceTo(ate);
        const pontos = [];
        for (let i = 0; i <= voltas * 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            pontos.push(new THREE.Vector3(0.05 * Math.cos(a), (i / (voltas * 10)) * comprimento, 0.05 * Math.sin(a)));
        }
        const malha = adicionar(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos), voltas * 10, 0.011, 5, false), aco, de);
        malha.quaternion.setFromUnitVectors(CIMA, new THREE.Vector3().subVectors(ate, de).normalize());
    }

    // ---------- Braços: o cotovelo por cinemática inversa (cotovelo para cima) ----------
    const frente = new THREE.Vector3(cabeca.x - base.x, 0, cabeca.z - base.z).normalize();
    const atras = frente.clone().negate();
    const lado = new THREE.Vector3(-frente.z, 0, frente.x);
    const ombro = new THREE.Vector3(base.x, 0.55, base.z);
    const BRACO1 = 3.6;
    const BRACO2 = 3.1;
    const horizontal = Math.hypot(cabeca.x - ombro.x, cabeca.z - ombro.z);
    const vertical = cabeca.y - ombro.y;
    const alcance = Math.min(Math.hypot(horizontal, vertical), BRACO1 + BRACO2 - 0.01);
    const anguloOmbro = Math.atan2(vertical, horizontal) + Math.acos((BRACO1 ** 2 + alcance ** 2 - BRACO2 ** 2) / (2 * BRACO1 * alcance));
    const cotovelo = ombro.clone()
        .addScaledVector(frente, BRACO1 * Math.cos(anguloOmbro))
        .addScaledVector(CIMA, BRACO1 * Math.sin(anguloOmbro));

    // Junta: pino de latão atravessando o braço, com botão de aperto preto
    function junta(ponto, raio, largura) {
        const ponta = ponto.clone().addScaledVector(lado, largura / 2);
        cilindroEntre(ponto.clone().addScaledVector(lado, -largura / 2), ponta, raio, latao, 24);
        cilindroEntre(ponta, ponta.clone().addScaledVector(lado, 0.07), raio * 1.35, ferro, 24);
    }

    // ---------- Base de ferro com friso de latão e torre giratória ----------
    const perfilBase = [[0, 0], [0.7, 0], [0.74, 0.03], [0.74, 0.1], [0.66, 0.17], [0.26, 0.21], [0.16, 0.24], [0, 0.24]];
    adicionar(new THREE.LatheGeometry(perfilBase.map(([r, y]) => new THREE.Vector2(r, y)), 56), ferro, base);
    adicionar(new THREE.TorusGeometry(0.72, 0.012, 8, 72), latao, base.clone().setY(0.105)).rotation.x = Math.PI / 2;
    adicionar(new THREE.CylinderGeometry(0.13, 0.15, 0.34, 32), latao, base.clone().setY(0.4));
    junta(ombro, 0.06, 0.34);

    // Duas hastes de latão lado a lado em cada braço
    [-1, 1].forEach((s) => {
        const desvio = lado.clone().multiplyScalar(0.09 * s);
        cilindroEntre(ombro.clone().add(desvio), cotovelo.clone().add(desvio), 0.042, latao);
        cilindroEntre(cotovelo.clone().add(desvio), cabeca.clone().add(desvio), 0.036, latao);
    });
    junta(cotovelo, 0.07, 0.32);
    junta(cabeca, 0.065, 0.28);

    // Molas de equilíbrio: duas no braço de baixo (presas atrás da torre) e uma no de cima
    const ancoraBase = ombro.clone().addScaledVector(atras, 0.24).setY(0.4);
    const ancoraBraco = ombro.clone().lerp(cotovelo, 0.45);
    cilindroEntre(ombro.clone().setY(0.48), ancoraBase, 0.03, latao, 12);
    [ancoraBase, ancoraBraco].forEach((p) => {
        cilindroEntre(p.clone().addScaledVector(lado, -0.2), p.clone().addScaledVector(lado, 0.2), 0.016, aco, 10);
    });
    [-1, 1].forEach((s) => {
        const desvio = lado.clone().multiplyScalar(0.17 * s);
        mola(ancoraBase.clone().add(desvio), ancoraBraco.clone().add(desvio), 16);
    });

    const abaixo = new THREE.Vector3(0, -0.12, 0);
    [0.12, 0.55].forEach((t) => {
        const noBraco = cotovelo.clone().lerp(cabeca, t);
        cilindroEntre(noBraco.clone().addScaledVector(lado, -0.09), noBraco.clone().addScaledVector(lado, 0.09), 0.012, aco, 8);
        cilindroEntre(noBraco, noBraco.clone().add(abaixo), 0.012, aco, 8);
    });
    mola(cotovelo.clone().lerp(cabeca, 0.12).add(abaixo), cotovelo.clone().lerp(cabeca, 0.55).add(abaixo), 12);

    // ---------- Cúpula de esmalte creme, com a lâmpada dentro ----------
    const eixoLuz = new THREE.Vector3().subVectors(alvo, cabeca).normalize();
    const cupula = new THREE.Group();
    cupula.position.copy(cabeca);
    cupula.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), eixoLuz);
    grupo.add(cupula);

    // Perfil da boca (embaixo) até o fundo (em cima)
    const perfilCupula = [[0.66, -1.22], [0.63, -1.12], [0.57, -0.92], [0.46, -0.66], [0.31, -0.44], [0.23, -0.32], [0.23, -0.08], [0.2, 0], [0.13, 0.05], [0, 0.06]]
        .map(([r, y]) => new THREE.Vector2(r, y));
    adicionar(new THREE.LatheGeometry(perfilCupula, 64), esmalte, null, cupula);
    adicionar(new THREE.LatheGeometry(perfilCupula.map((p) => new THREE.Vector2(p.x * 0.96, p.y)), 64), forro, null, cupula);
    adicionar(new THREE.TorusGeometry(0.655, 0.02, 10, 72), latao, new THREE.Vector3(0, -1.22, 0), cupula).rotation.x = Math.PI / 2;
    adicionar(new THREE.TorusGeometry(0.235, 0.016, 8, 48), latao, new THREE.Vector3(0, -0.3, 0), cupula).rotation.x = Math.PI / 2;
    adicionar(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 24), ferro, new THREE.Vector3(0, -0.2, 0), cupula);
    adicionar(new THREE.SphereGeometry(0.2, 32, 20), vidro, new THREE.Vector3(0, -0.5, 0), cupula);
    adicionar(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 16), latao, new THREE.Vector3(0, 0.1, 0), cupula);

    // ---------- Fio de tecido: desce pelos braços até a base e sai por trás ----------
    const pontosFio = [
        cabeca.clone().addScaledVector(eixoLuz, -0.06).add(new THREE.Vector3(0, 0.1, 0)),
        cabeca.clone().lerp(cotovelo, 0.5).add(new THREE.Vector3(0, -0.26, 0)),
        cotovelo.clone().addScaledVector(atras, 0.1).add(new THREE.Vector3(0, -0.2, 0)),
        ombro.clone().lerp(cotovelo, 0.5).addScaledVector(atras, 0.14),
        ombro.clone().addScaledVector(atras, 0.32).setY(0.22),
        base.clone().addScaledVector(atras, 0.9).addScaledVector(lado, -0.3).setY(0.025),
        base.clone().addScaledVector(atras, 1.2).addScaledVector(lado, -1.1).setY(0.025)
    ];
    adicionar(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontosFio), 100, 0.02, 6, false), tecido);

    // ---------- Luz: facho, brilho na boca da cúpula e poça de luz na bancada ----------
    const boca = cabeca.clone().addScaledVector(eixoLuz, 1.22);
    const facho = new THREE.SpotLight(0xffd9a6, 0, 20, 0.5, 0.7, 1);
    facho.position.copy(cabeca).addScaledVector(eixoLuz, 0.5);
    facho.target.position.copy(alvo);
    efeitos.add(facho, facho.target);

    // Facho visível (poeira no ar): névoa quente em forma de cone, mais forte
    // perto da lâmpada e no miolo do que nas bordas. O brilho, o facho e a
    // poça usam mistura normal: o fundo do canvas é transparente (a página
    // aparece atrás), e luz "somada" sobre ele não apareceria.
    const comprimento = boca.distanceTo(alvo);
    const materialFacho = new THREE.ShaderMaterial({
        uniforms: { intensidade: { value: 0 }, cor: { value: new THREE.Color(1, 0.78, 0.5) } },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vVista;
            varying float vPerto;
            void main() {
                vPerto = uv.y;
                vec4 posicao = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalize(normalMatrix * normal);
                vVista = normalize(-posicao.xyz);
                gl_Position = projectionMatrix * posicao;
            }`,
        fragmentShader: `
            uniform float intensidade;
            uniform vec3 cor;
            varying vec3 vNormal;
            varying vec3 vVista;
            varying float vPerto;
            void main() {
                float miolo = abs(dot(normalize(vNormal), normalize(vVista)));
                gl_FragColor = vec4(cor, intensidade * miolo * miolo * mix(0.15, 1.0, vPerto));
            }`,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false
    });
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6 + comprimento * Math.tan(0.45), comprimento, 48, 1, true), materialFacho);
    cone.position.copy(boca).addScaledVector(eixoLuz, comprimento / 2);
    cone.quaternion.setFromUnitVectors(CIMA, eixoLuz.clone().negate()); // a ponta estreita fica na lâmpada
    efeitos.add(cone);

    const textura = texturaDeBrilho();
    const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, color: 0xffd7a0, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    brilho.position.copy(boca).addScaledVector(eixoLuz, 0.05);
    brilho.scale.setScalar(2.4);
    efeitos.add(brilho);

    const noChao = cabeca.clone().addScaledVector(eixoLuz, cabeca.y / -eixoLuz.y);
    const poca = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshBasicMaterial({ map: textura, color: 0xffc78a, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })
    );
    poca.rotation.x = -Math.PI / 2;
    poca.position.set(noChao.x, 0.012, noChao.z);
    efeitos.add(poca);

    const pecas = [];
    grupo.traverse((peca) => {
        if (peca.isMesh) pecas.push(peca);
    });

    // 0 = desligada, 1 = acesa (para animar)
    function definirLuz(t) {
        vidro.emissiveIntensity = 3 * t;
        forro.emissiveIntensity = 0.7 * t;
        facho.intensity = 5 * t;
        materialFacho.uniforms.intensidade.value = 0.2 * t;
        brilho.material.opacity = 0.55 * t;
        poca.material.opacity = 0.22 * t;
        cone.visible = brilho.visible = poca.visible = t > 0.001;
    }
    definirLuz(0);

    return { grupo, efeitos, pecas, definirLuz };
}

function criarRadio() {
    const cor = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    const carcaca = new THREE.MeshPhysicalMaterial({ color: cor(0xc23b2f), roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    const preto = new THREE.MeshStandardMaterial({ color: cor(0x141416), roughness: 0.6 });
    const grade = new THREE.MeshStandardMaterial({ color: cor(0x2b2b2e), roughness: 0.8, metalness: 0.3 });
    const cromo = new THREE.MeshStandardMaterial({ color: cor(0xe8e8e8), metalness: 1, roughness: 0.2 });
    const fita = new THREE.MeshStandardMaterial({ color: cor(0xece7da), roughness: 0.5 });
    const etiqueta = new THREE.MeshStandardMaterial({ color: cor(0xece7da), roughness: 0.5 });
    const led = new THREE.MeshStandardMaterial({ color: cor(0x2a0c0c), emissive: new THREE.Color(1, 0.15, 0.1), emissiveIntensity: 0 });

    const grupo = new THREE.Group();

    const corpo = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.55), carcaca);
    corpo.position.y = 0.45;
    grupo.add(corpo);

    // Dois alto-falantes redondos e a janelinha da fita no meio
    [-0.52, 0.52].forEach((x) => {
        const falante = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 32), grade);
        falante.rotation.x = Math.PI / 2;
        falante.position.set(x, 0.45, 0.28);
        grupo.add(falante);
    });

    const janela = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.02), preto);
    janela.position.set(0, 0.5, 0.28);
    grupo.add(janela);

    const etiquetaFita = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.01), etiqueta);
    etiquetaFita.position.set(0, 0.6, 0.295);
    grupo.add(etiquetaFita);

    const bobinas = [-0.11, 0.11].map((x) => {
        const bobina = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 6), fita);
        bobina.rotation.x = Math.PI / 2;
        bobina.position.set(x, 0.47, 0.295);
        grupo.add(bobina);
        return bobina;
    });

    // Botões de tecla em cima, antena e LED
    [-0.45, -0.25, -0.05].forEach((x, i) => {
        const tecla = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.14), i === 0 ? cromo : preto);
        tecla.position.set(x, 0.93, 0);
        grupo.add(tecla);
    });

    const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 8), cromo);
    antena.position.set(0.55, 1.35, -0.12);
    antena.rotation.z = -0.5;
    grupo.add(antena);

    const luzLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), led);
    luzLed.position.set(0.3, 0.72, 0.28);
    grupo.add(luzLed);

    const pecas = [];
    grupo.traverse((peca) => {
        if (peca.isMesh) pecas.push(peca);
    });

    let tocando = false;

    return {
        grupo,
        pecas,
        definirTocando(sim) {
            tocando = sim;
            led.emissiveIntensity = sim ? 2.5 : 0;
        },
        // A etiqueta da fita fica na cor da playlist (cor CSS, ex.: "#d9a35f")
        definirCorFita(corCss) {
            etiqueta.color.set(corCss).convertSRGBToLinear();
        },
        // Chamado a cada quadro: as bobinas giram enquanto toca
        animar() {
            if (tocando) bobinas.forEach((bobina) => (bobina.rotation.y += 0.05));
        }
    };
}
