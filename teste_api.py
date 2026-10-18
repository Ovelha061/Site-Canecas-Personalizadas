
import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)

account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
api_token = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()

url = (
    f"https://api.cloudflare.com/client/v4/accounts/"
    f"{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct"
)

try:
    resposta = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        },
        json={"prompt": "Responda apenas: CANECA+ funcionando!"},
        timeout=60
    )

    print("Status HTTP:", resposta.status_code)
    print("Resposta:", resposta.text[:1500])

except requests.RequestException as erro:
    print("Erro de conexão:", erro)
