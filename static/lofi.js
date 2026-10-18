/* ==========================================================================
   RÁDIO LO-FI DA OFICINA (Web Audio)
   Playlists geradas na hora pelo navegador, sem arquivo de música: cada
   faixa tem seus acordes, andamento e melodia (sorteada a partir de uma
   semente, então a faixa toca sempre igual). Os instrumentos são
   sintetizados (piano elétrico, piano abafado, pad, baixo e bateria) sem chiado
   nem ruído de fundo: só a música.
   ========================================================================== */

// Acordes em notas MIDI (60 = dó central). O primeiro número de cada acorde
// é a nota do baixo; os outros, as notas do teclado.
const PLAYLISTS_LOFI = [
    {
        nome: "Café na Bancada",
        clima: "Manhã tranquila e piano elétrico",
        cor: "#d9a35f",
        bpm: 80,
        timbre: "rhodes",
        bateria: "boombap",
        balanco: 0.12,
        brilho: 2600,
        faixas: [
            { nome: "Primeiro Gole", semente: 11, acordes: [[41, 53, 57, 60, 64], [40, 52, 55, 59, 62], [38, 50, 53, 57, 60], [36, 48, 52, 55, 59]] },
            { nome: "Caneca Quentinha", semente: 23, acordes: [[36, 52, 55, 59, 62], [45, 55, 59, 60, 64], [38, 53, 57, 60, 64], [43, 53, 57, 59, 64]] },
            { nome: "Pão de Queijo", semente: 37, acordes: [[38, 50, 54, 57, 61], [42, 52, 57, 61, 66], [47, 50, 54, 57, 59], [43, 50, 54, 55, 59]] },
            { nome: "Vapor da Prensa", semente: 41, acordes: [[45, 55, 57, 60, 64], [38, 54, 57, 60, 64], [43, 54, 55, 59, 62], [36, 52, 55, 59, 62]] }
        ]
    },
    {
        nome: "Chuva na Oficina",
        clima: "Piano abafado para um dia cinza",
        cor: "#6f9fc9",
        bpm: 72,
        timbre: "piano",
        bateria: "suave",
        balanco: 0.08,
        brilho: 2000,
        faixas: [
            { nome: "Telhado de Zinco", semente: 53, acordes: [[45, 55, 59, 60, 64], [41, 57, 60, 64, 65], [36, 55, 59, 60, 64], [43, 55, 59, 62, 64]] },
            { nome: "Janela Embaçada", semente: 61, acordes: [[38, 53, 57, 60, 64], [43, 53, 57, 59, 64], [36, 52, 55, 59, 62], [45, 55, 58, 61, 64]] },
            { nome: "Goteira", semente: 73, acordes: [[46, 53, 57, 58, 62], [45, 55, 57, 60, 64], [43, 53, 57, 58, 62], [36, 55, 58, 62, 65]] },
            { nome: "Cheiro de Terra", semente: 89, acordes: [[39, 55, 58, 62, 65], [36, 51, 55, 58, 62], [44, 55, 56, 60, 63], [46, 53, 55, 58, 62]] }
        ]
    },
    {
        nome: "Madrugada no Estúdio",
        clima: "Pads lentos para criar de noite",
        cor: "#8b7fd6",
        bpm: 66,
        timbre: "pad",
        bateria: "esparsa",
        balanco: 0.06,
        brilho: 1700,
        faixas: [
            { nome: "Luz da Luminária", semente: 97, acordes: [[36, 51, 55, 58, 62], [44, 51, 55, 56, 60], [39, 50, 55, 58, 63], [46, 50, 53, 58, 60]] },
            { nome: "Três da Manhã", semente: 101, acordes: [[41, 56, 60, 63, 67], [46, 56, 60, 61, 65], [39, 55, 60, 61, 65], [44, 55, 58, 60, 63]] },
            { nome: "Tinta Secando", semente: 113, acordes: [[45, 55, 59, 60, 64], [40, 50, 54, 55, 59], [41, 52, 57, 59, 60], [40, 50, 57, 59, 64]] },
            { nome: "Cidade Dormindo", semente: 127, acordes: [[37, 53, 56, 60, 61], [36, 51, 55, 58, 60], [46, 49, 53, 56, 60], [39, 49, 53, 56, 58]] }
        ]
    },
    {
        nome: "Jazz de Domingo",
        clima: "Acordes de jazz e bateria de vassourinha",
        cor: "#c9705a",
        bpm: 86,
        timbre: "rhodes",
        bateria: "jazz",
        balanco: 0.18,
        brilho: 3000,
        faixas: [
            { nome: "Bossa de Caneca", semente: 131, acordes: [[38, 53, 57, 60, 64], [43, 53, 57, 59, 64], [36, 52, 55, 59, 62], [45, 52, 55, 61, 65]] },
            { nome: "Domingo Lento", semente: 137, acordes: [[41, 57, 60, 64, 67], [46, 56, 60, 62, 65], [45, 55, 57, 60, 64], [38, 54, 57, 60, 63]] },
            { nome: "Feira da Esquina", semente: 149, acordes: [[39, 50, 55, 58, 63], [41, 51, 53, 56, 60], [43, 53, 55, 58, 62], [44, 55, 56, 60, 63]] },
            { nome: "Café com Leite", semente: 157, acordes: [[43, 54, 55, 59, 62], [40, 55, 59, 62, 66], [45, 55, 59, 60, 64], [38, 54, 59, 60, 64]] }
        ]
    }
];

// "aoMudar" é chamado sempre que a faixa muda ou o rádio liga/desliga.
function criarLofi(obterContexto, aoMudar = () => {}) {
    const COMPASSOS = 32;      // cada faixa: de 1min30 a 2min
    const ANTECEDENCIA = 0.25; // segundos de notas agendadas à frente

    let ctx = null;
    let mestre = null;   // volume geral (controle da aba)
    let quente = null;   // filtro que abafa os instrumentos, como numa fita velha
    let teclas = null;   // acordes: "respiram" a cada bumbo
    let voz = null;      // melodia
    let eco = null;      // atraso do eco da melodia
    let bateria = null;
    let ruido = null;
    let relogio = null;

    let playlist = 0;
    let faixa = 0;
    let volume = 0.8;
    let passo = 0;
    let proximaNota = 0;
    let inicioFaixa = 0;
    let melodia = new Map();

    const frequencia = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
    const dadosPlaylist = () => PLAYLISTS_LOFI[playlist];
    const dadosFaixa = () => dadosPlaylist().faixas[faixa];
    const bpmDe = (p, f) => PLAYLISTS_LOFI[p].faixas[f].bpm || PLAYLISTS_LOFI[p].bpm;
    const duracaoDe = (p, f) => (COMPASSOS * 4 * 60) / bpmDe(p, f);

    function montarSom() {
        mestre = ctx.createGain();
        mestre.gain.value = 0;
        mestre.connect(ctx.destination);

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.ratio.value = 3;
        compressor.connect(mestre);

        quente = ctx.createBiquadFilter();
        quente.type = "lowpass";
        quente.Q.value = 0.5;
        quente.connect(compressor);

        teclas = ctx.createGain();
        teclas.connect(quente);

        // Eco da melodia: cada repetição volta mais baixa e mais abafada
        voz = ctx.createGain();
        voz.connect(quente);
        eco = ctx.createDelay(1);
        const abafaEco = ctx.createBiquadFilter();
        abafaEco.type = "lowpass";
        abafaEco.frequency.value = 1600;
        const retorno = ctx.createGain();
        retorno.gain.value = 0.3;
        voz.connect(eco);
        eco.connect(abafaEco).connect(retorno).connect(eco);
        retorno.connect(quente);

        // A bateria passa por fora do filtro principal: o chimbal precisa dos agudos
        const brilhoBateria = ctx.createBiquadFilter();
        brilhoBateria.type = "lowpass";
        brilhoBateria.frequency.value = 7000;
        bateria = ctx.createGain();
        bateria.connect(brilhoBateria).connect(compressor);

        ruido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const dados = ruido.getChannelData(0);
        for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
    }

    // ---------- Instrumentos ----------
    // Volume que sobe rápido e cai devagar até sumir em "fim"
    function envelope(ganho, quando, pico, ataque, fim) {
        ganho.gain.setValueAtTime(0.0001, quando);
        ganho.gain.linearRampToValueAtTime(pico, quando + ataque);
        ganho.gain.exponentialRampToValueAtTime(0.0001, fim);
    }

    function ligar(osciladores, quando, fim) {
        osciladores.forEach((osc) => {
            osc.start(quando);
            osc.stop(fim + 0.05);
        });
    }

    // Piano elétrico (síntese FM): o "sino" do ataque vem da modulação forte no começo
    function pianoEletrico(midi, quando, duracao, forca, destino) {
        const f = frequencia(midi);
        const portadora = ctx.createOscillator();
        const moduladora = ctx.createOscillator();
        const indice = ctx.createGain();
        const ganho = ctx.createGain();
        portadora.frequency.value = f;
        portadora.detune.value = (Math.random() - 0.5) * 10;
        moduladora.frequency.value = f;
        indice.gain.setValueAtTime(f * 1.6, quando);
        indice.gain.exponentialRampToValueAtTime(f * 0.12, quando + 0.6);
        moduladora.connect(indice).connect(portadora.frequency);
        const fim = quando + duracao + 0.6;
        envelope(ganho, quando, 0.085 * forca, 0.008, fim);
        portadora.connect(ganho).connect(destino);
        ligar([portadora, moduladora], quando, fim);
    }

    // Piano de feltro: corpo em onda triangular e um brilho que se apaga
    function pianoAbafado(midi, quando, duracao, forca, destino) {
        const f = frequencia(midi);
        const corpo = ctx.createOscillator();
        const harmonico = ctx.createOscillator();
        const misturaHarmonico = ctx.createGain();
        const filtro = ctx.createBiquadFilter();
        const ganho = ctx.createGain();
        corpo.type = "triangle";
        corpo.frequency.value = f;
        harmonico.frequency.value = f * 2;
        misturaHarmonico.gain.value = 0.25;
        filtro.type = "lowpass";
        filtro.frequency.setValueAtTime(2200, quando);
        filtro.frequency.exponentialRampToValueAtTime(450, quando + 1.4);
        const fim = quando + duracao + 1.2;
        envelope(ganho, quando, 0.1 * forca, 0.004, fim);
        harmonico.connect(misturaHarmonico).connect(filtro);
        corpo.connect(filtro);
        filtro.connect(ganho).connect(destino);
        ligar([corpo, harmonico], quando, fim);
    }

    // Pad: duas ondas serrote desafinadas, entrando e saindo devagar
    function pad(midi, quando, duracao, forca, destino) {
        const filtro = ctx.createBiquadFilter();
        const ganho = ctx.createGain();
        filtro.type = "lowpass";
        filtro.frequency.value = 850;
        const fim = quando + duracao + 1;
        ganho.gain.setValueAtTime(0.0001, quando);
        ganho.gain.linearRampToValueAtTime(0.03 * forca, quando + Math.min(1.2, duracao / 2));
        ganho.gain.linearRampToValueAtTime(0.0001, fim);
        filtro.connect(ganho).connect(destino);
        const osciladores = [-8, 8].map((desafino) => {
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.value = frequencia(midi);
            osc.detune.value = desafino;
            osc.connect(filtro);
            return osc;
        });
        ligar(osciladores, quando, fim);
    }

    // Sininho suave (melodia da playlist de pads)
    function sino(midi, quando, duracao, forca, destino) {
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();
        osc.frequency.value = frequencia(midi);
        const fim = quando + duracao + 0.9;
        envelope(ganho, quando, 0.06 * forca, 0.005, fim);
        osc.connect(ganho).connect(destino);
        ligar([osc], quando, fim);
    }

    const TECLADO = { rhodes: pianoEletrico, piano: pianoAbafado, pad };
    const MELODIA = { rhodes: pianoEletrico, piano: pianoAbafado, pad: sino };

    function baixo(midi, quando, duracao) {
        const osc = ctx.createOscillator();
        const filtro = ctx.createBiquadFilter();
        const ganho = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = frequencia(midi);
        filtro.type = "lowpass";
        filtro.frequency.value = 400;
        const fim = quando + duracao;
        ganho.gain.setValueAtTime(0.0001, quando);
        ganho.gain.linearRampToValueAtTime(0.26, quando + 0.012);
        ganho.gain.setTargetAtTime(0.12, quando + 0.05, 0.25);
        ganho.gain.setTargetAtTime(0.0001, fim, 0.06);
        osc.connect(filtro).connect(ganho).connect(quente);
        osc.start(quando);
        osc.stop(fim + 0.4);
    }

    // ---------- Bateria ----------
    function ruidoCurto(quando, tipo, freq, volumeRuido, duracao, destino = bateria, q = 0.8) {
        const fonte = ctx.createBufferSource();
        fonte.buffer = ruido;
        const filtro = ctx.createBiquadFilter();
        filtro.type = tipo;
        filtro.frequency.value = freq;
        filtro.Q.value = q;
        const ganho = ctx.createGain();
        ganho.gain.setValueAtTime(volumeRuido, quando);
        ganho.gain.exponentialRampToValueAtTime(0.0005, quando + duracao);
        fonte.connect(filtro).connect(ganho).connect(destino);
        fonte.start(quando, Math.random() * 1.5);
        fonte.stop(quando + duracao + 0.02);
    }

    function bumbo(quando, forca) {
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();
        osc.frequency.setValueAtTime(125, quando);
        osc.frequency.exponentialRampToValueAtTime(44, quando + 0.15);
        ganho.gain.setValueAtTime(0.6 * forca, quando);
        ganho.gain.exponentialRampToValueAtTime(0.001, quando + 0.35);
        osc.connect(ganho).connect(bateria);
        osc.start(quando);
        osc.stop(quando + 0.37);

        // Os acordes abaixam um instante a cada bumbo (a "respiração" do lo-fi)
        teclas.gain.setValueAtTime(1, quando);
        teclas.gain.linearRampToValueAtTime(0.6, quando + 0.025);
        teclas.gain.linearRampToValueAtTime(1, quando + 0.3);
    }

    function caixa(quando, forca) {
        ruidoCurto(quando, "bandpass", 1800, 0.22 * forca, 0.17);
        const corpo = ctx.createOscillator();
        const ganho = ctx.createGain();
        corpo.frequency.setValueAtTime(200, quando);
        corpo.frequency.exponentialRampToValueAtTime(140, quando + 0.08);
        ganho.gain.setValueAtTime(0.12 * forca, quando);
        ganho.gain.exponentialRampToValueAtTime(0.001, quando + 0.1);
        corpo.connect(ganho).connect(bateria);
        corpo.start(quando);
        corpo.stop(quando + 0.12);
    }

    const chimbal = (quando, forca) => ruidoCurto(quando, "highpass", 7000, 0.07 * forca, 0.045);
    const vassourinha = (quando, forca) => ruidoCurto(quando, "bandpass", 3000, 0.09 * forca, 0.24, bateria, 0.6);
    const prato = (quando, forca) => ruidoCurto(quando, "bandpass", 6200, 0.06 * forca, 0.4, bateria, 2.5);

    // [passo do compasso (0 a 15), instrumento, força]
    const BATERIAS = {
        boombap: [[0, bumbo, 1], [10, bumbo, 0.85], [4, caixa, 1], [12, caixa, 1]],
        suave: [[0, bumbo, 0.75], [8, bumbo, 0.6], [12, caixa, 0.55]],
        esparsa: [[0, bumbo, 0.6], [12, caixa, 0.4]],
        jazz: [[0, bumbo, 0.45], [10, bumbo, 0.35], [4, vassourinha, 1], [12, vassourinha, 1]]
    };

    // Chimbal ou prato em cada passo: [instrumento, força] ou nada
    const PRATOS = {
        boombap: (b) => (b % 2 === 0 ? [chimbal, b % 4 === 2 ? 1 : 0.6] : null),
        suave: (b) => (b % 4 === 2 ? [chimbal, 0.6] : null),
        esparsa: (b) => (b % 2 === 0 ? [chimbal, 0.3] : null),
        jazz: (b) => ([0, 4, 6, 8, 12, 14].includes(b) ? [prato, b % 8 === 0 ? 1 : 0.7] : null)
    };

    // Quando o teclado toca no compasso: [passo, força, duração em passos]
    const RITMO_TECLADO = {
        rhodes: [[0, 1, 7], [10, 0.6, 5]],
        piano: [[0, 0.9, 14], [8, 0.45, 7]],
        pad: [[0, 1, 16]]
    };
    const RITMO_JAZZ = [[0, 0.9, 5], [6, 0.75, 9]]; // o "Charleston" do jazz

    function linhaDeBaixo(batida, compasso, acorde, proximo, quando, semicolcheia) {
        const raiz = acorde[0];
        const estilo = dadosPlaylist().bateria;

        if (estilo === "jazz") {
            // Baixo andando: tônica, nota do acorde, quinta e uma nota que leva ao próximo acorde
            if (batida % 4 !== 0) return;
            const notaDoAcorde = raiz + ((((acorde[1] - raiz) % 12) + 12) % 12);
            const caminho = [raiz, notaDoAcorde, raiz + 7, proximo[0] - 1];
            baixo(caminho[batida / 4], quando, semicolcheia * 3.6);
        } else if (estilo === "esparsa") {
            if (batida === 0) baixo(raiz, quando, semicolcheia * 14);
        } else {
            if (batida === 0) baixo(raiz, quando, semicolcheia * 6);
            if (batida === 10) baixo(raiz, quando, semicolcheia * 3);
            if (batida === 14 && compasso % 2 === 1) baixo(raiz + 7, quando, semicolcheia * 2);
        }
    }

    // Melodia da faixa: frase de 4 compassos sorteada com a semente da faixa.
    // Cada nota é um "grau" que vira uma nota do acorde do momento, uma oitava
    // acima, então ela nunca destoa da harmonia.
    function comporMelodia(semente) {
        let s = semente;
        const sorteio = () => (s = (s * 16807) % 2147483647) / 2147483647;
        const RITMOS = [[0, 3, 6, 10], [0, 2, 4, 7, 12], [2, 6, 8, 11, 14], [0, 6, 10, 12, 14], [4, 7, 10, 14], [0, 8, 11]];
        const ritmos = [0, 1, 2, 3].map(() => RITMOS[Math.floor(sorteio() * RITMOS.length)]);
        ritmos[2] = ritmos[0]; // pergunta e resposta: o 3º compasso repete o ritmo do 1º

        const notas = new Map();
        let grau = 2;
        ritmos.forEach((ritmo, compasso) => {
            ritmo.forEach((batida, i) => {
                grau = Math.max(0, Math.min(5, grau + Math.round((sorteio() - 0.5) * 3.2)));
                const seguinte = i + 1 < ritmo.length ? ritmo[i + 1] : 16;
                notas.set(compasso * 16 + batida, { grau, duracao: Math.min(seguinte - batida, 6) });
            });
        });

        // A frase termina repousando na nota mais firme do acorde
        notas.get(Math.max(...notas.keys())).grau = 0;
        return notas;
    }

    // ---------- Arranjo e relógio ----------
    function prepararFaixa(inicio) {
        const brilho = dadosPlaylist().brilho;
        const semicolcheia = 60 / bpmDe(playlist, faixa) / 4;
        const compasso = semicolcheia * 16;
        passo = 0;
        proximaNota = inicio;
        inicioFaixa = inicio;
        melodia = comporMelodia(dadosFaixa().semente);
        eco.delayTime.setValueAtTime(semicolcheia * 3, inicio);

        // Começa abafado e vai abrindo; na pausa (compassos 20 a 23) abafa de novo
        const filtro = quente.frequency;
        filtro.cancelScheduledValues(inicio);
        filtro.setValueAtTime(500, inicio);
        filtro.exponentialRampToValueAtTime(brilho, inicio + compasso * 4);
        filtro.setValueAtTime(brilho, inicio + compasso * 20);
        filtro.exponentialRampToValueAtTime(brilho * 0.45, inicio + compasso * 20.5);
        filtro.setValueAtTime(brilho * 0.45, inicio + compasso * 23.5);
        filtro.exponentialRampToValueAtTime(brilho, inicio + compasso * 24);
    }

    function tocarPasso(quando, semicolcheia) {
        const dados = dadosPlaylist();
        const acordes = dadosFaixa().acordes;
        const compasso = Math.floor(passo / 16);
        const batida = passo % 16;
        const acorde = acordes[compasso % acordes.length];
        const proximo = acordes[(compasso + 1) % acordes.length];
        const notas = acorde.slice(1);
        const final = compasso === COMPASSOS - 1;
        const pausa = compasso >= 20 && compasso < 24;

        // Teclado (no último compasso, um acorde longo que vai sumindo)
        const ritmo = final ? [[0, 0.9, 28]] : dados.bateria === "jazz" ? RITMO_JAZZ : RITMO_TECLADO[dados.timbre];
        ritmo.forEach(([b, forca, duracao]) => {
            if (b !== batida) return;
            notas.forEach((midi, i) => {
                const dedilhado = dados.timbre === "piano" ? i * 0.03 : 0;
                TECLADO[dados.timbre](midi, quando + dedilhado, duracao * semicolcheia, forca, teclas);
            });
        });

        // Baixo: entra no 3º compasso
        if (compasso >= 2 && !(final && batida > 0)) linhaDeBaixo(batida, compasso, acorde, proximo, quando, semicolcheia);

        // Bateria: entra no 5º compasso; na pausa ficam só os pratos
        if (compasso >= 4 && !final) {
            if (!pausa) BATERIAS[dados.bateria].forEach(([b, instrumento, forca]) => b === batida && instrumento(quando, forca));
            const pratoDoPasso = PRATOS[dados.bateria](batida);
            if (pratoDoPasso) pratoDoPasso[0](quando, pratoDoPasso[1] * (0.85 + Math.random() * 0.3));
        }

        // Melodia: no meio e no fim da faixa; na pausa, compasso sim, compasso não
        const comMelodia = (compasso >= 12 && compasso < 20) || (compasso >= 24 && !final) || (pausa && compasso % 2 === 1);
        const nota = comMelodia && melodia.get(passo % 64);
        if (nota) {
            const tons = notas.map((midi) => midi + 12).sort((a, b) => a - b);
            tons.push(tons[0] + 12, tons[1] + 12);
            MELODIA[dados.timbre](tons[nota.grau], quando, nota.duracao * semicolcheia, 1.1, voz);
        }
    }

    function agendar() {
        // Se o navegador atrasou o relógio (aba em segundo plano), pula as notas perdidas
        if (proximaNota < ctx.currentTime - 0.2) {
            const perdido = ctx.currentTime + 0.05 - proximaNota;
            proximaNota += perdido;
            inicioFaixa += perdido;
        }

        while (proximaNota < ctx.currentTime + ANTECEDENCIA) {
            if (passo >= COMPASSOS * 16) {
                // Fim da faixa: uma batida de silêncio e começa a próxima da playlist
                faixa = (faixa + 1) % dadosPlaylist().faixas.length;
                prepararFaixa(proximaNota + 60 / bpmDe(playlist, faixa));
                aoMudar();
                continue;
            }
            const semicolcheia = 60 / bpmDe(playlist, faixa) / 4;
            tocarPasso(proximaNota, semicolcheia);
            // Balanço (swing): as semicolcheias pares duram um pouco mais
            const balanco = dadosPlaylist().balanco;
            proximaNota += semicolcheia * (passo % 2 === 0 ? 1 + balanco : 1 - balanco);
            passo += 1;
        }
    }

    return {
        playlists: PLAYLISTS_LOFI,
        duracaoDe,
        tocando: () => relogio !== null,
        atual: () => ({ playlist, faixa }),

        // Toca a faixa indicada (por padrão, a atual) desde o começo
        tocar(p = playlist, f = faixa) {
            ctx = obterContexto();
            if (!ctx) return;
            if (!mestre || mestre.context !== ctx) montarSom();

            playlist = p;
            faixa = f;

            mestre.gain.cancelScheduledValues(ctx.currentTime);
            mestre.gain.setTargetAtTime(volume, ctx.currentTime, 0.06);
            prepararFaixa(ctx.currentTime + 0.1);
            if (!relogio) relogio = setInterval(agendar, 50);
            agendar();
            aoMudar();
        },

        parar() {
            if (!relogio) return;
            clearInterval(relogio);
            relogio = null;
            // Diminui o volume em vez de cortar seco
            mestre.gain.cancelScheduledValues(ctx.currentTime);
            mestre.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
            aoMudar();
        },

        // Próxima (1) ou anterior (-1): tocando, já toca; parado, só escolhe
        pular(direcao) {
            const total = dadosPlaylist().faixas.length;
            const nova = (faixa + direcao + total) % total;
            if (relogio) {
                this.tocar(playlist, nova);
            } else {
                faixa = nova;
                aoMudar();
            }
        },

        progresso() {
            const total = duracaoDe(playlist, faixa);
            const decorrido = relogio ? Math.min(total, Math.max(0, ctx.currentTime - inicioFaixa)) : 0;
            return { decorrido, total };
        },

        definirVolume(valor) {
            volume = valor;
            if (relogio) mestre.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
        }
    };
}
