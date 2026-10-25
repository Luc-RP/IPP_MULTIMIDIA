# LK Multimídia — Input List, Output List e Checklist (branch de desenvolvimento)

**Branch:** feat/input-output-checklists
**Base:** main do frontend em 25/10/2026, commit 1cfee94e77bd944bd3ec2e15a8c66fb5d67c3ffc.
**Status:** v0.8.1 já publicada na Vercel; ajustes seguintes são incrementais.

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

## 25/10/2026 — PDF oficial e opções de evento v0.8.1
Exemplo real enviado pelo responsável: PDF A4 com cabeçalho 78 mm e seção 03 dividida entre folhas; segunda folha com enorme espaço vazio. CSS original tinha `.print-section{break-inside:avoid}` indiscriminado e `print-cover` alto, sem estilos separados para tabelas longas. Ajustado modelo de exportação navegador em brand-lk.css (print) com capa ~compacta (padding 10/9 mm), menor distância vertical de títulos sem prejudicar leitura, margens laterais de 14 mm, blocos compactos sem quebra, tabelas longas podem continuar com thead repetido, tr sem corte. Não gera PDF manual.
Adicionadas categorias de evento (shows, festival, cultos, encontros, teatro, social, corporativo, esporte, online); campos opcionais porte, público, dimensões do palco e passagem de som, exibidos no PDF só quando preenchidos. Input/Output List vazias não criam páginas sem conteúdo; numeração de seções do PDF adaptativa. Arquivos carregados com cache bust v0.8.1. Fontes de pesquisa: Yamaha Pro Audio (soundcheck/input list), Molly Tuttle Advance (riders distintos por tamanho), Radovan Tariska club/festival, BandsManager, Stage Plot Forge. NÃO copiar design nem trechos de terceiros.

## 25/10/2026 — QA da geração automática de canais (incremental)
O gerador anterior ignorava a quantidade configurada de cantores principais/backing vocals e gerava overheads condensadores de bateria com +48V desmarcado por padrão. O botão Adicionar canal também usava total de linhas+1, podendo repetir um número se o técnico removesse uma linha intermediária. A nova lógica considera os campos de vocalistas, sinaliza overheads condensadores como phantom sugerido (+48V; confirmar modelo na observação) e encontra o menor canal positivo não utilizado ao adicionar manualmente. Gerar sugestão continua sem sobrescrever patch manual. Testes executados sobre os builders, serialização/restauração e IDs reais do HTML; teste manual da produção permanece responsabilidade do responsável.
