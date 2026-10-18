# Como publicar a CANECA+ na internet (PythonAnywhere)

Escolhido porque roda Flask sem complicação, tem plano gratuito e **guarda os arquivos para sempre** — importante para a pasta `pedidos/` (arte e prévia de cada pedido). Em hospedagens que apagam o disco a cada reinício, os pedidos sumiriam.

O endereço gratuito fica assim: `https://SEUUSUARIO.pythonanywhere.com`

---

## 1. Criar a conta

1. Acesse **pythonanywhere.com** → *Pricing & signup* → **Create a Beginner account** (grátis).
2. Escolha o nome de usuário com cuidado: ele vira o endereço do site.

## 2. Enviar os arquivos

1. No seu computador, compacte em um `.zip` **só estes itens** da pasta `meu_site`:
   `app.py`, `requirements.txt`, `.env`, `templates/`, `static/`
   (não envie `venv/`, `backup_*`, `.claude/`, `.impeccable/` nem `pedidos/`).
2. No PythonAnywhere: aba **Files** → crie a pasta `meu_site` → entre nela → **Upload a file** → envie o `.zip`.
3. Aba **Consoles** → **Bash** e rode:
   ```bash
   cd ~/meu_site
   unzip *.zip
   ```

## 3. Instalar as bibliotecas

No mesmo console Bash:
```bash
cd ~/meu_site
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
(A instalação demora alguns minutos.)

## 4. Criar o site

1. Aba **Web** → **Add a new web app** → *Next* → **Manual configuration** → **Python 3.12**.
2. Na mesma página:
   - **Source code:** `/home/SEUUSUARIO/meu_site`
   - **Virtualenv:** `/home/SEUUSUARIO/meu_site/venv`
3. Clique no link do **WSGI configuration file**, apague tudo e cole:
   ```python
   import sys
   sys.path.insert(0, "/home/SEUUSUARIO/meu_site")
   from app import app as application
   ```
   Troque `SEUUSUARIO` pelo seu usuário e salve.
4. Volte na aba **Web** e clique no botão verde **Reload**.

Pronto: abra `https://SEUUSUARIO.pythonanywhere.com`.

---

## Depois de publicado

- **Teste um pedido de ponta a ponta**: monte uma caneca, peça pelo WhatsApp e abra o link que chega na mensagem — agora ele funciona de qualquer celular.
- **Os pedidos ficam em** `~/meu_site/pedidos/` (aba Files). O link de cada pedido mostra a arte para baixar.
- **Para atualizar o site** depois de mudanças: envie os arquivos alterados pela aba Files e clique em **Reload** na aba Web.

## Limitações do plano gratuito (importante)

- **Foto de estúdio com IA:** o plano gratuito só deixa o servidor acessar uma lista de sites liberados. Se a IA da Cloudflare não estiver na lista, o botão "Foto de estúdio com IA" mostrará erro. O resto do site (3D, prensa, pedidos) funciona normalmente. O plano pago mais barato remove essa restrição.
- O site gratuito precisa ser "renovado" com um clique a cada 3 meses (o PythonAnywhere avisa por e-mail).
- Domínio próprio (ex.: `canecamais.com.br`) só nos planos pagos.

## Segurança

- O arquivo `.env` tem suas chaves da Cloudflare e o número do WhatsApp. Ele fica protegido no servidor (não aparece no site), mas **nunca compartilhe** o `.zip` com ninguém.
