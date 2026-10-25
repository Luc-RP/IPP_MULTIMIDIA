# LK Multimídia — Input List, Output List e Checklist (branch de desenvolvimento)

**Branch:** feat/input-output-checklists
**Base:** main do frontend em 25/10/2026, commit 1cfee94e77bd944bd3ec2e15a8c66fb5d67c3ffc.
**Status:** em desenvolvimento; não publicado em produção.

## Objetivo
Substituir a descrição livre do patch por listas estruturadas, editáveis e imprimíveis. Recursos adicionados apenas ao Rider de SOM, sem mudar a lógica das telas de luz/imagem nem das contas.

- Input List: CH, grupo/família, fonte, microfone/DI, pedestal, phantom +48V, observações. Até 96 linhas.
- Output List: via/saída, destino, tipo de retorno, conexão e observações. Até 64 linhas.
- Checklist técnico: pré-produção, montagem, passagem de som e desmontagem com concluído/pendente; personalizável, até 80 tarefas.
- A sugestão “Gerar da banda” mapeia a formação existente para fontes, incluindo splits L/R de teclado e exemplo de bateria; nunca substitui uma lista manual existente.
- Salvamento/restauração: arrays inputList/outputList/technicalChecklist dentro do content JSON existente de riders, sem novas tabelas ou backend.
- Impressão: tabelas de patch e checklist com conteúdo escapado via escapeHTML, sem injetar texto de terceiros.
- Riders antigos sem essas listas continuam carregando, com checklist inicial padrão.
- Mobile: controles são responsivos nas larguras reduzidas, mas o layout global móvel será revisado após receber a captura do usuário.

## Gates para publicação
1. npm run check de sintaxe + verificações de capture/restore e XSS em impressão.
2. Teste visual em telas desktop e mobile reais.
3. Ensaiar troca entre SOM/LUZ/IMAGEM e salvar/carregar riders antigos e novos.
4. Não fazer deploy na Vercel antes de concluir os gates e revisar o impacto no bundle frontend.

**Sem modificações** em produção Vercel, API, Aiven, autenticação, LK_ADM ou banco.
