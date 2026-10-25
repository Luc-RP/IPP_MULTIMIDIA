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

## Limite de tamanho e sanitização
O backend API histórico (schema em src/security.js v0.6.3) limita o `content` JSON a 64 KiB e a requisição a 80 KiB. Pré-validação no frontend rejeita um rider acima de 64 KiB com mensagem compreensível, sem enviar dados excessivos. Impressão usa escapeHTML para todos os campos listados; arrays de legado têm verificação Array.isArray e itens null são tolerados.

## Diagnóstico e correção mobile (captura real 25/10/2026)
Captura do Brave no Android mostra login cortado à direita, marca no fundo parcialmente sobreposta e botão principal fora da largura. Causa: brand-lk.css reaplicava .auth-shell com grid-template-columns: minmax(0,1.12fr) minmax(360px,.88fr) depois do breakpoint de uma coluna em styles.css; a regra mobile final do brand não redefinia grid-template-columns. Corrigido explicitamente após os estilos do brand com @media screen (max-width:760px) + regra 420px: grid de uma coluna, max-width seguro, branding compacta, card 100% e campos acessíveis (font-size 16px), sem rolagem horizontal. Revisado editor autenticado: tabs horizontais com scroll, conteúdo de largura controlada, botões refluem e formulário reduz colunas. Cache bust de assets versão v0.8.0. Print não afetado por escopo @media screen. **Ainda não validado em dispositivo Android nem publicado em main/Vercel.**
