# Segurança
- Nunca ler, imprimir ou commitar .env ou segredos; use .env.example.
- Toda entrada externa (body, query, planilha) é validada com Zod.
- Senhas com argon2; tokens nunca em localStorage.
- Ao criar endpoint, pergunte-se: "um representante consegue ver dados de outro por aqui?"
- Planilhas reais do Focco contêm dados de clientes: não versione nada em fixtures/focco/ fora de amostras/ (anonimizadas).
