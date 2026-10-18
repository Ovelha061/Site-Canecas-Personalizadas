
import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv(override=True)

account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
api_token = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()

url = (
    f"https://api.cloudflare.com/client/v4/accounts/"
    f"{account_id}/ai/run/@cf/black-forest-labs/flux-2-klein-4b"
)

try:
    with open("static/logo.png", "rb") as arquivo:
        logo = arquivo.read()

    resposta = requests.post(
        url,
        headers={"Authorization": f"Bearer {api_token}"},
        data={
            "prompt": (
                "A realistic white ceramic coffee mug product photo. "
                "The mug has a simple colorful graphic printed on its front. "
                "Clean white background, soft studio lighting."
            ),
            "width": "512",
            "height": "512"
        },
        files={
            "input_image_0": ("logo.png", logo, "image/png")
        },
        timeout=180
    )

    print("Status HTTP:", resposta.status_code)

    dados = resposta.json()
    imagem = dados.get("result", {}).get("image")

    if resposta.ok and imagem:
        with open("static/caneca-com-logo.jpg", "wb") as arquivo:
            arquivo.write(base64.b64decode(imagem))

        print("Imagem salva em static/caneca-com-logo.jpg")
    else:
        print("Resposta:", resposta.text[:1200])

except Exception as erro:
    print("Erro:", erro)
