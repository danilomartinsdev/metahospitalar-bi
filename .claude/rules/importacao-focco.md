---
paths:
  - "apps/api/src/modules/import/**"
  - "packages/shared/src/schemas/import*"
---
# Importação Focco
Antes de alterar, leia docs/dados/importacao-focco.md.
- Detecte o formato real (xls binário, xlsx, csv, ou HTML/texto salvo como .xls).
- Números pt-BR ("83575,74920002") → Decimal arredondado a 2 casas.
- Datas dd/mm/aa → interpretar como 20aa, fuso America/Sao_Paulo.
- Upsert pela coluna ID; tudo dentro de transação; cada import é um lote reversível.
