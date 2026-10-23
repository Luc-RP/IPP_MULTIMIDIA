# IPP Multimídia — protótipo v0.1.0

Primeira versão de demonstração de um site de formulários técnicos para a Igreja Príncipe Poderoso. Identidade visual inspirada no Rider Técnico Banda IPP aprovado em 23/10/2026.

## Linguagem e arquitetura

- JavaScript puro (ES2022), HTML5 e CSS3. Sem framework, CDN, bundler ou bibliotecas externas.
- Módulos: Rider de **Som**, **Luz** e **Imagem/Vídeo**.
- Projeto estático: abra `index.html` num navegador moderno. Não exige servidor para essa demonstração.
- A interface é responsiva e preparada para impressão A4 com `window.print()`; para PDF escolha **Salvar como PDF** na caixa de impressão.

## Acesso demo (público e intencional)

- E-mail: `demo@ipp.local`
- Senha: `IPPdemo2026!`

**ATENÇÃO:** Não é autenticação real. A senha está no código-fonte e na própria tela. A tela de login apenas demonstra o fluxo visual e **não protege arquivos, dados ou páginas**. NÃO use essas credenciais em produção e NÃO insira dados pessoais ou confidenciais. Não foi ativado Supabase, servidor, banco online, redefinição de senha ou política de acesso.

## Recursos implementados

1. Login de demonstração com acesso à interface.
2. Seleção de área: Rider de Som, Rider de Luz e Rider de Imagem.
3. Campos gerais de evento, ano, vigília com intervalo `2026 → 2027`, local e data.
4. Anexo local de arte (imagem <= 2 MB), armazenado no navegador quando o rascunho é salvo.
5. Formulário de som: consoles, P.A., caixas ativas/passivas, quantidades, monitores, instrumentos ilimitados e cantores/backings entre 1 e 10.
6. Formulários introdutórios de luz e imagem/vídeo.
7. Rascunhos salvos/recuperados com `localStorage`, apenas no mesmo navegador/perfil/origem. O armazenamento pode acabar e a limpeza do navegador apaga os dados.
8. Cancelar edição e restaurar rascunho salvo, novo documento.
9. Exportação por impressão A4 do navegador (normalmente Salvar como PDF).
10. Rodapé com campos públicos de contato ainda a definir.

## Modelos ilustrativos (não são especificação aprovada para IPP)

- Mesas: Behringer X32 / X32 Compact, Allen & Heath SQ-5 e Yamaha DM3.
- Caixas: JBL PRX915 e QSC K12.2.
- Fontes oficiais: https://behringer.com/en/products/0603-ACE ; https://behringer.com/en/products/0603-AAB ; https://www.allen-heath.com/hardware/sq/sq-5/ ; https://usa.yamaha.com/products/proaudio/mixers/dm3/index.html ; https://jblpro.com/en-US/products/prx915 ; https://in.qsc.com/resource-files/productresources/spk/k.2/q_spk_k2_specs.pdf .
- Confirmação de requisitos de campo e capacidade de entradas/saídas ainda pendente.

## Avisos sobre segurança e publicação

- O repositório é **público**: todos os arquivos versionados ficam públicos. Nunca commitar senhas reais, tokens, documentos privados ou dados de membros.
- Conteúdo do formulário é armazenado apenas na máquina local via navegador, não há sincronização nem isolamento entre usuários do mesmo navegador.
- O projeto **não foi implantado no Vercel nem publicado via GitHub Pages**. GitHub permite ver o código, mas não hospeda a aplicação executável sem habilitar Pages ou outro serviço. Para visualizar a interface, baixe o ZIP e abra `index.html`.
- A diretiva CSP local desabilita conexões externas e scripts remotos, porém isso **não equivale a segurança de produção**.
- Futuras etapas: autenticação real, verificação de e-mail, MFA opcional, controle de acesso por usuário e papel, backend e banco de dados, armazenamento de anexos, políticas de retenção, logs, versionamento e compartilhamento entre responsáveis.

## Estrutura

```
index.html          Estrutura semântica da interface
styles.css          Aparência, responsividade e impressão A4
app.js              Estado, formulários, rascunhos e impressão
assets/ipp-mark.svg Logomarca vetorial provisória
README.md           Instruções e limitações
```

## Desenvolvimento e continuidade

Documentação central: Notion IPP Multimídia e Google Drive/ObsD IPP Multimídia. Este protótipo é uma base para revisão, não um produto pronto para operação.
