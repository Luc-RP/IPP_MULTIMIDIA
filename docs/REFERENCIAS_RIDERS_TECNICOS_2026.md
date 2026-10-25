# Pesquisa de referências — riders técnicos profissionais (25/10/2026)

## Escopo
Orientações para o gerador de riders da LK Multimídia, considerando eventos pequenos, eventos corporativos, igrejas, shows e festivais. A pesquisa foi usada para extrair **requisitos e convenções**, sem reproduzir arte, texto ou design de terceiros.

## Evidências reais
1. **Molly Tuttle Advance** — coleção oficial disponibiliza production rider completo, stage plots separados para dois/três praticáveis, além de input lists específicas para formação solo/trio. Mostra por que um template não precisa ter o mesmo tamanho em todos os eventos.
   https://mollytuttleadvance.com/downloads
2. **Radovan Tariška, Technical rider and stage plot (2026)** — exemplo explícito de duas configurações para o mesmo show: club menor (8 canais, 2 mixagens de retorno, 4×3 m de palco) e festival maior (12 canais, 3 mixagens, 6×5 m), com necessidades variáveis de line-check e passagem.
   https://radovantariska.com/stage-plot.html
3. **Yamaha Pro Audio, Seven Ways to Ensure a Smooth Sound Check** — recomenda organizar Input List com fonte, canal, microfone/DI para acelerar passagem de som.
   https://hub.yamaha.com/proaudio/livesound/seven-ways-to-ensure-a-smooth-sound-check/
4. **BandsManager (modelo de rider)** — organiza contatos, versão, formação, necessidades essenciais vs preferenciais, quem fornece backline, monitores/IEM, alimentação elétrica, FOH, horários e contato de produção.
   https://bandsmanager.com/pt/blog/technical-rider-template-for-bands
5. **Stage Plot Forge (modelo com exportação A4)** — exemplo de pacote técnico com mapa de palco, entradas, mixagens de monitoração, equipamentos e observações. Tabelas longas e figuras precisam de diagramação por página.
   https://stageplotforge.app/guides/technical-rider-template
6. **Techrider.live (2026)** — destaca controle de revisão, stage plot consistente com Input List, definições do que é obrigatório/preferencial/fornecido e confirmação das exceções.
   https://techrider.live/learn/tutorials/tech-rider-template
7. **MDN: break-inside e break-after CSS** — regras de fragmentação para manter títulos e seções curtas juntos, sem impedir tabelas longas de fluírem entre páginas.
   https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/break-inside
   https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/break-after

## Decisões executadas na v0.8.1
- PDF A4 gerado pelo site: capa muito mais compacta, menos espaçamento entre elementos do título, margens legíveis, blocos curtos unidos, cabeçalhos de tabela repetíveis e linhas indivisíveis.
- Input List / Output List: só entram no documento exportado se houver linhas.
- O número das seções passa a ser sequencial independentemente de quantas tabelas foram preenchidas.
- Formulário: mais tipos de evento; porte de produção, público estimado, dimensões do palco e tempo de passagem de som (opcionais). Campos não preenchidos não ocupam espaço no PDF.
- Mantido o fluxo de dados JSON no backend: dados do FormData são salvos como antes, sem migrações.

## Próximas melhorias, sem implementação prematura
- **Mapa de palco editável** e integrado ao patch.
- **Responsabilidade por equipamento**: artista, organização, casa/local ou locadora.
- **Checklist de avanço/confirmado**: requisitos obrigatórios, substituições aprovadas, versão/data e responsável pela confirmação.
- **Operação de festival**: horários de load-in, changeover, line-check, RF e energia, praticáveis, técnicos por palco.
- **Templates guiados**: pequeno (essencial) e grande/festival (detalhado) sem cadastrar dezenas de campos para um evento simples.
- **Visualizador/impressão A4**: ensaios reais em Chromium/Firefox, retrato e 1–N páginas, documentos com 0/16/60 canais, e com texto extenso. CSS é uma melhoria sistemática mas não substitui revisão visual em todas as combinações.

## Segurança e operação
Não mover o banco ou expor credenciais. Não copiar riders completos de artistas. Nenhuma modificação da API nem da Aiven foi necessária.


## Revisão adicional da impressão A4 — 25/10/2026

Arquivo enviado pelo responsável: Vigília do Jubileu, PDF A4 em duas páginas; o cabeçalho de fundo escuro toma altura desproporcional, a seção Formação da banda começa na folha 1 e a continuação aparece no começo da folha 2, com muito espaço vazio.

A revisão v0.8.2 mantém tamanho do título principal em 22pt e subtítulo 10pt, mas compacta padding da faixa para 6mm 14mm 5.5mm, margens verticais do título, separador, nome do evento e corpo. Reduz margens e gaps de seções, campos e formação da banda. A margem inline entre instrumentos e vozes é sobrescrita para 2.4mm. A largura do print-root passa a 100% evitando overflow de 210mm.

Preserva break-inside avoid em seções compactas e linhas de tabela, thead como cabeçalho repetível; tabelas longas continuam pagináveis. Simulação do documento enviado renderizada em WeasyPrint 68 com A4 em 1 página. Este teste não valida com fidelidade o motor Chrome/Brave usado na plataforma: saída real precisa de conferência pelo responsável.

## Referências externas pesquisadas

MusicNSW por Astrid Holz: modelo de input list com canal, fonte, microfone, posição e pedestal, stage plot e backline. https://pub-f64c2caae5db46d3aa29fd2161a9ed5c.r2.dev/tech-rider-stage-plot-template.pdf

Molly Tuttle Advance 2025/2026: production rider e listas específicas para banda completa, trio e solo. https://mollytuttleadvance.com/downloads

BMAD Technical Rider 2025: channel list com voz, teclados L/R, guitarra e percussão, conectores e observações. https://sounds.lu/bmad/technical-rider/

LiveEPK: exemplos compactos de riders de duas páginas, com palco, canais e mixes em página própria. https://liveepk.com/tech-rider-examples

BandsManager 2026: contatos, resumo, stage plot, patch, backline, monitoramento, FOH/energia e horários. https://bandsmanager.com/pt/blog/technical-rider-template-for-bands

Improvised Music Company: trio essencial de stage plot, input list e backline. https://www.improvisedmusic.ie/supporting-musicians/resources-opportunities/what-is-a-technical-rider-and-why-do-i-need-one

Recomendações de produto para decidir depois: modo de impressão resumido versus completo, mapa de palco, backline com responsável pelo fornecimento, documento de patch focado em FOH/monitores e quadro de logística/horários. Não copiar identidades visuais de terceiros.
