Para instalar e executar o projeto, é necessário ter **Python 3.10–3.12**, **pip** e um navegador web (VS Code é recomendado). Garanta que o Python está no PATH e funciona com `python --version`.

Entre na pasta da API com `cd Frontend/api` e instale as dependências necessárias executando:
`pip install flask flask-cors pandas numpy scikit-learn joblib openpyxl deepl`.

Crie uma chave de API na **DeepL** (https://www.deepl.com/pro-api) ou em outro serviço de tradução. Para não expor a chave no código, configure-a como variável de ambiente: no PowerShell use `$env:DEEPL_AUTH_KEY="CHAVE_AQUI"`, no CMD use `set DEEPL_AUTH_KEY=CHAVE_AQUI`, e no Linux/Mac use `export DEEPL_AUTH_KEY="CHAVE_AQUI"`.

Depois de configurar a chave, ainda dentro da pasta `Frontend/api`, inicie o servidor executando `python app.py`. A API será iniciada em `http://127.0.0.1:5000`.

Para abrir a página inicial da aplicação, abra o arquivo `Frontend/Vanilla/html/testeModelo.html` diretamente no navegador ou execute pelo VS Code usando a extensão **Live Server**.

Para testes com upload de dados, utilize arquivos **.csv** ou **.xlsx** contendo obrigatoriamente a coluna `text` com as frases a serem avaliadas e opcionalmente a coluna `label` com valores 0 (Negativa), 1 (Neutra) ou 2 (Positiva) de forma a obter métricas do modelo.