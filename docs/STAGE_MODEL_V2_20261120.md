# LK Multimídia | Arquitetura do mapa de palco v2 e PDF neutro
Checkpoint: 20/11/2026 · Etapa 1 · GitHub Pages somente

## Objetivos autorizados
- Evoluir o Rider de Som existente, sem criar outro site nem alterar a identidade visual do sistema.
- Unificar as vistas em um modelo espacial: X/Y/Z, dimensões e rotação.
- Adotar o nível de documentação técnica observado na referência TR Áudio / cbc_traudio_v007.pdf, páginas 2–18.
- PDF técnico em A4 com FUNDO BRANCO e SEM marca, logo ou cabeçalho institucional da LK.
- Futuramente disponibilizar o logotipo da empresa do usuário por meio de um plano pago com permissão validada no backend. A prévia não libera upload nem cobra por esse recurso.

## Entrega inicial
- stage-core.js: modelo espacial v2 independente de DOM e de API, normalização/migração de mapas v1, dimensões-padrão genéricas (não certificadas), projeções ortográficas e resumo por tipo/lado.
- stage-plot.js: captura e restauração usando o núcleo v2, modos Simples/Avançado preservados, campos de altura do ambiente e Z/dimensões de objetos, vistas superior/frontal/laterais com coordenadas compartilhadas.
- app.js: mantém capture()/restore() e JSON stagePlot do rider, mas gera cabeçalho impresso neutro, sem aceitar arte de evento como logotipo.
- pdf-clean.css: neutraliza cores e capa escura do layout antigo somente durante impressão, sem alterar a identidade do site em tela.
- index.html: carrega stage-core antes do editor; indica personalização da marca como funcionalidade paga FUTURA, ainda indisponível.
- Tests: contratos de migração v1→v2, projeção espacial, sanitização, geração SVG e ausência de marca no conteúdo impresso.

## Convenção espacial
- Unidade: METRO, com valores decimais.
- X: eixo horizontal do palco/ambiente, crescente à direita na vista da plateia.
- Y: eixo longitudinal crescente do fundo para a frente do palco na planta.
- Z: cota de elevação da BASE do objeto sobre o piso.
- width/depth/height: dimensões do ambiente.
- widthM/depthM/heightM: envelope do objeto ou grupo. Grupos continuam contendo qty unidades, mas o envelope não substitui o posicionamento individual de cada caixa quando a disposição física importar.
- angle: rotação em graus na planta superior; não implica cálculo estrutural ou acústico.
- view='top': X horizontal, Y vertical; 'front': X horizontal, Z vertical; 'left'/'right': Y horizontal, Z vertical, com inversão da direita.

## Compatibilidade
- Dados v1 com X/Y/qty/side são aceitos na mesma propriedade stagePlot e normalizados para v2 com altura ambiente padrão 7m e dimensões genéricas por tipo. Nenhum dado do banco foi migrado nesta etapa.
- O formato JSON permanece compacto e sem imagens base64, respeitando o limite atual de 64 KiB para riders.
- O backend real e os planos pagos não foram alterados.
- No GitHub Pages, a prévia continua SEM login e SEM salvamento na API. A produção da Vercel e branch main permanecem intocadas.

## Limitações e próximos gates
- As dimensões da biblioteca são apenas referências ilustrativas, não cotas garantidas de fabricantes.
- Ainda NÃO há 3D navegável, paredes/portas/setores em CAD, cálculo estrutural/rigging, simulação acústica/luminotécnica, planilha de potência certificada nem renderização fotorrealista.
- Vistas ortográficas são geométricas, mas o símbolo 2D da planta ainda é ilustrativo: o contorno tracejado representa a área física editada.
- PDF preserva paginação automática: documentos extensos podem ocupar mais de uma folha A4, mas todas com fundo branco e sem marca da LK. Não sacrificar informações técnicas para forçar uma página.
- Implementar teste visual em Brave/Chrome e PDF exportado real, mais regressão de login e dos riders antigos em ambiente apropriado antes de promover à produção.
- Próximo gate sugerido: catálogo de paredes, portas, cadeiras, cotas e setores, depois visualização 3D real do MESMO modelo espacial.

## Isolamento e rollback
- Fonte de testes: branch gh-pages no GitHub.
- Backup pré-mudança: backup-lk-stage-v091-20261120, SHA 46787686c7ba6ab19856b0aab1df0ef465ef5a95.
- Nunca aplicar alterações na main / Vercel / MySQL Aiven sem aprovação.
