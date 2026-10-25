# 25/10/2026 — Correção do modelo de PDF e pesquisa de riders

## Erro validado pelo PDF enviado
O usuário enviou o PDF de duas páginas "LK Multimídia _ Central Técnica.pdf" apenas como amostra de defeito do SITE. Página 1: capa azul-petróleo alta, grandes distâncias entre o título e o evento, formação da banda muito próxima da quebra de página. Página 2: dados começam perto da borda superior, grande área vazia no restante.

## Correção no template de exportação
Aplicado em brand-lk.css um bloco @media print final com @page A4 portrait e margens recorrentes (11 mm topo; 13 mm lados e rodapé), capa mais baixa, mantendo título principal em 28pt porém com margens verticais menores, campos organizados e regras de não dividir valores. Tabelas podem atravessar folhas com thead repetido e linhas indivisíveis. app.js diferencia seção simples de tabela paginável, esconde Input/Output/Checklist vazios e numera automaticamente as seções. Nenhuma alteração no PDF previamente enviado, apenas no exportador do site. Cache bust frontend v0.8.1.

## Expansão profissional, sem sobrecarregar o formulário básico
Tipos de evento novos: corporativo, seminário, workshop, feira, formatura, casamento, show, festival, concerto, teatro, ensaio, culto, louvor, retiro, transmissão ao vivo, gravação, palestra etc. Mantidos os valores de evento antigos para retrocompatibilidade. Detalhes opcionais fechados por padrão: porte, público estimado, tamanho palco, fornecedor backline, load-in, passagem de som, energia/infraestrutura. FormData captura e restaura os campos sem mudança na API/schema. Campos não preenchidos são omitidos no PDF.

## Fontes públicas verificadas
- https://mollytuttleadvance.com/downloads ; https://mollytuttleadvance.com/docs/stage-plot-2riser.pdf — stage plot e patch grande com 42 entradas e 20 saídas, documentos separados por formação.
- https://llcultural.com.br/artigos/rider-tecnico/ — formação, mapa de palco, input list, monitores, backline, energia, horários e contatos.
- https://bandsmanager.com/pt/blog/technical-rider-template-for-bands — distinguir exigências/preferências, fornecedores e advance.
- https://www.tourassistant.app/en/resources/technical-rider-template — document control, cue de produção, horários, backline, responsabilidades e exceções.
- https://freetools.gigwell.com/tools/technical-rider-builder — exemplo abrangente em grandes produções com FOH/monitoração, luz, palco.

## QA
Caso antigo sem listas, com Input apenas, e com Input/Output/Checklist: HTML escapado corretamente, seções dinâmicas sequenciais. Testes de contrato em tests/print-contract.test.cjs verificam dimensões A4, repetição do thead, paginação de linhas, compatibilidade SOM/LUZ/IMAGEM e novos tipos. Teste real de impressão no Brave/Chrome em páginas múltiplas deve ser confirmado em aparelho após deploy.

Backend/Aiven/LK_ADM não foram alterados.