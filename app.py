
import os
import io
import re
import json
import base64
import secrets
import requests
from datetime import date, datetime
from pathlib import Path

from flask import Flask, render_template, request, jsonify, url_for, abort, send_from_directory
from dotenv import load_dotenv
from PIL import Image, UnidentifiedImageError

load_dotenv()

app = Flask(__name__)
# 10 MB por envio: a arte (até 8 MB, conferida abaixo) + a foto da prévia.
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
LIMITE_ARTE = 8 * 1024 * 1024
# Relê o HTML quando ele muda (sem isso, o servidor precisa ser reiniciado).
app.config["TEMPLATES_AUTO_RELOAD"] = True

ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()

# Número com DDI e DDD, só dígitos. Ex.: 5511999998888
WHATSAPP = "".join(filter(str.isdigit, os.getenv("WHATSAPP_NUMERO", "")))

# Quantas fotos de estúdio com IA cada pessoa (IP) pode gerar por dia.
LIMITE_IA_POR_DIA = 2
usos_ia = {}  # {ip: (data, quantidade)} — zera quando o servidor reinicia

# Pedidos: a arte e a prévia de cada pedido ficam em pedidos/<código>/.
PASTA_PEDIDOS = Path(app.root_path) / "pedidos"
LIMITE_PEDIDOS_POR_DIA = 20  # por pessoa (IP), contra abuso de armazenamento
pedidos_feitos = {}  # {ip: (data, quantidade)}

MODELO_IA = "@cf/black-forest-labs/flux-2-klein-4b"

PRECOS = {
    "tradicional": "R$ 34,90",
    "colorida": "R$ 39,90",
    "magica": "R$ 49,90",
}

CORES = {
    "vermelho": "red",
    "azul": "blue",
    "preto": "black",
    "amarelo": "yellow",
    "verde": "green",
    "rosa": "pink",
}


def preparar_imagem(arquivo):
    imagem = Image.open(arquivo).convert("RGB")
    imagem.thumbnail((512, 512))

    buffer = io.BytesIO()
    imagem.save(buffer, format="JPEG", quality=90)

    return buffer.getvalue()


def gerar_imagem(prompt, arquivos=None):
    url = (
        f"https://api.cloudflare.com/client/v4/accounts/"
        f"{ACCOUNT_ID}/ai/run/{MODELO_IA}"
    )

    resposta = requests.post(
        url,
        headers={"Authorization": f"Bearer {API_TOKEN}"},
        data={
            "prompt": prompt,
            "width": "512",
            "height": "512",
        },
        files=arquivos,
        timeout=180,
    )

    if not resposta.ok:
        print(
            "Erro Cloudflare:",
            resposta.status_code,
            resposta.text[:1000],
        )
        raise RuntimeError(
            "A IA não conseguiu gerar a imagem. Tente novamente."
        )

    dados = resposta.json()
    imagem = dados.get("result", {}).get("image")

    if not imagem:
        raise RuntimeError("A IA não retornou uma imagem.")

    return "data:image/jpeg;base64," + imagem


def usos_hoje(registro, ip):
    dia, quantidade = registro.get(ip, (date.today(), 0))
    return quantidade if dia == date.today() else 0


def grande_demais(arquivo):
    arquivo.seek(0, os.SEEK_END)
    tamanho = arquivo.tell()
    arquivo.seek(0)
    return tamanho > LIMITE_ARTE


@app.route("/")
def inicio():
    return render_template("index.html", precos=PRECOS, whatsapp=WHATSAPP)


@app.route("/gerar-caneca", methods=["POST"])
def gerar_caneca():
    if not ACCOUNT_ID or not API_TOKEN:
        return jsonify({
            "erro": "Configure as credenciais da Cloudflare no arquivo .env."
        }), 500

    arte = request.files.get("arte")
    modelo = request.form.get("modelo", "tradicional")
    cor = request.form.get("cor", "vermelho")

    if modelo not in PRECOS:
        return jsonify({"erro": "Modelo de caneca inválido."}), 400

    if not arte or not arte.filename:
        return jsonify({"erro": "Envie sua arte primeiro."}), 400

    if modelo == "colorida" and cor not in CORES:
        return jsonify({"erro": "Selecione uma cor válida."}), 400

    if grande_demais(arte):
        return jsonify({"erro": "A imagem deve ter no máximo 8 MB."}), 413

    ip = request.remote_addr
    usados = usos_hoje(usos_ia, ip)

    if usados >= LIMITE_IA_POR_DIA:
        return jsonify({
            "erro": "Você já usou suas fotos com IA de hoje. A prévia acima continua funcionando!"
        }), 429

    try:
        arte_bytes = preparar_imagem(arte)

        arquivos = {
            "input_image_0": (
                "arte.jpg",
                arte_bytes,
                "image/jpeg",
            )
        }

        resultado = {
            "modelo": modelo,
            "preco": PRECOS[modelo],
        }

        if modelo == "tradicional":
            prompt = (
                "Create a realistic product photograph of a white "
                "ceramic mug. Use the provided reference image as the "
                "artwork printed on the front. Preserve its colors, "
                "details and composition as closely as possible. "
                "Show the entire mug, centered on a clean white "
                "background, with soft studio lighting."
            )

            resultado["imagem"] = gerar_imagem(prompt, arquivos)

        elif modelo == "colorida":
            cor_ingles = CORES[cor]

            prompt = (
                f"Create a realistic white ceramic mug with a "
                f"{cor_ingles} handle and matching {cor_ingles} "
                "inner rim. Print the exact artwork from the "
                "provided reference image on the front. Preserve "
                "its colors, details and composition. Show the "
                "entire mug centered on a clean white background, "
                "with professional studio lighting."
            )

            resultado["imagem"] = gerar_imagem(prompt, arquivos)

        else:
            # Só a versão quente: o efeito frio/quente é feito no navegador.
            prompt_quente = (
                "Photorealistic studio product photo of a black magic mug. "
                "The ceramic has a MATTE BLACK finish, with soft diffuse "
                "reflections and absolutely no glossy or shiny highlights. "
                "The handle and inner rim are matte black. On the front, the "
                "heat-sensitive coating has become transparent, revealing a "
                "white ceramic surface with the exact artwork from the provided "
                "reference image printed clearly. Preserve the artwork colors "
                "and composition. Straight-on front view, mug centered, pure "
                "white background, soft diffused studio lighting."
            )

            resultado["imagem"] = gerar_imagem(prompt_quente, arquivos)

        usos_ia[ip] = (date.today(), usados + 1)
        resultado["restantes"] = LIMITE_IA_POR_DIA - usados - 1

        return jsonify(resultado)

    except (UnidentifiedImageError, OSError, ValueError):
        return jsonify({
            "erro": "Não foi possível ler essa imagem. Envie um JPG, PNG ou WEBP."
        }), 400

    except RuntimeError as erro:
        return jsonify({"erro": str(erro)}), 502

    except requests.RequestException:
        return jsonify({
            "erro": "Falha ao conectar com a IA. Tente novamente."
        }), 502


@app.route("/pedido", methods=["POST"])
def criar_pedido():
    """Guarda a arte e a prévia do pedido e devolve um código para a mensagem
    do WhatsApp, assim o cliente não precisa reenviar o arquivo."""
    arte = request.files.get("arte")
    modelo = request.form.get("modelo", "")
    cor = request.form.get("cor", "")
    previa = request.form.get("previa", "")  # foto da caneca pronta (data URL PNG), opcional

    if modelo not in PRECOS:
        return jsonify({"erro": "Modelo de caneca inválido."}), 400

    if modelo == "colorida" and cor not in CORES:
        return jsonify({"erro": "Selecione uma cor válida."}), 400

    if not arte:
        return jsonify({"erro": "Envie sua arte primeiro."}), 400

    if grande_demais(arte):
        return jsonify({"erro": "A imagem deve ter no máximo 8 MB."}), 413

    ip = request.remote_addr
    feitos = usos_hoje(pedidos_feitos, ip)
    if feitos >= LIMITE_PEDIDOS_POR_DIA:
        return jsonify({"erro": "Muitos pedidos seguidos. Chame a gente direto no WhatsApp."}), 429

    try:
        imagem_arte = Image.open(arte)
        imagem_arte.load()
    except (UnidentifiedImageError, OSError, ValueError):
        return jsonify({"erro": "Não foi possível ler essa imagem. Envie um JPG, PNG ou WEBP."}), 400

    if imagem_arte.mode not in ("RGB", "RGBA", "L", "P"):
        imagem_arte = imagem_arte.convert("RGB")

    codigo = secrets.token_hex(5).upper()
    pasta = PASTA_PEDIDOS / codigo
    pasta.mkdir(parents=True)
    imagem_arte.save(pasta / "arte.png")

    # A prévia é opcional: se vier quebrada, o pedido segue só com a arte.
    if previa.startswith("data:image/png;base64,"):
        try:
            dados = base64.b64decode(previa.split(",", 1)[1], validate=True)
            imagem_previa = Image.open(io.BytesIO(dados))
            imagem_previa.load()
            imagem_previa.save(pasta / "previa.png")
        except (ValueError, UnidentifiedImageError, OSError):
            pass

    pedido = {
        "codigo": codigo,
        "modelo": modelo,
        "cor": cor if modelo == "colorida" else None,
        "preco": PRECOS[modelo],
        "data": datetime.now().isoformat(timespec="seconds"),
    }
    (pasta / "pedido.json").write_text(json.dumps(pedido, ensure_ascii=False, indent=2), encoding="utf-8")
    pedidos_feitos[ip] = (date.today(), feitos + 1)

    return jsonify({"codigo": codigo, "link": url_for("ver_pedido", codigo=codigo, _external=True)})


def pasta_do_pedido(codigo):
    if not re.fullmatch(r"[0-9A-F]{10}", codigo):
        abort(404)
    pasta = PASTA_PEDIDOS / codigo
    if not (pasta / "pedido.json").exists():
        abort(404)
    return pasta


@app.route("/pedidos/<codigo>")
def ver_pedido(codigo):
    """Página para a loja abrir o pedido pelo link que chega no WhatsApp."""
    pasta = pasta_do_pedido(codigo)
    pedido = json.loads((pasta / "pedido.json").read_text(encoding="utf-8"))
    return render_template(
        "pedido.html",
        pedido=pedido,
        tem_previa=(pasta / "previa.png").exists(),
    )


@app.route("/pedidos/<codigo>/<arquivo>")
def arquivo_do_pedido(codigo, arquivo):
    if arquivo not in ("arte.png", "previa.png"):
        abort(404)
    return send_from_directory(pasta_do_pedido(codigo), arquivo)


@app.errorhandler(413)
def arquivo_muito_grande(_erro):
    return jsonify({
        "erro": "A imagem deve ter no máximo 8 MB."
    }), 413


if __name__ == "__main__":
    # A hospedagem informa a porta pela variável PORT; no seu computador é 5000.
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=False)
