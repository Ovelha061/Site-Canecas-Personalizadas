
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
    resposta = requests.post(
        url,
        headers={"Authorization": f"Bearer {api_token}"},
        data={
            "prompt": (
                "A simple red ceramic coffee mug on a white table, "
                "plain white background, professional product photo"
            ),
            "width": "512",
            "height": "512"
        },
        timeout=180
    )

    print("Status HTTP:", resposta.status_code)

    dados = resposta.json()

    if resposta.ok and dados.get("success") and dados.get("result", {}).get("image"):
        imagem_base64 = dados["result"]["image"]
        imagem_bytes = base64.b64decode(imagem_base64)

        os.makedirs("static", exist_ok=True)

        with open("static/teste-gerada.jpg", "wb") as arquivo:
            arquivo.write(imagem_bytes)

        print("Imagem salva em static/teste-gerada.jpg")

    else:
        print("Erro da API:", resposta.text[:1000])

except Exception as erro:
    print("Erro:", erro)
