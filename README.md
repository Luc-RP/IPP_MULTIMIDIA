# LK Multimídia — protótipo v0.4.0

Primeira versão de demonstração de um site de formulários técnicos para a Igreja Príncipe Poderoso. Identidade visual inspirada no Rider Técnico Banda IPP aprovado em 23/10/2026.

## Linguagem e arquitetura

- JavaScript puro (ES2022), HTML5 e CSS3. Sem framework, CDN, bundler ou bibliotecas externas.
- Módulos: Rider de **Som**, **Luz** e **Imagem/Vídeo**.
- Projeto estático: abra `index.html` num navegador moderno. Não exige servidor para essa demonstração.
- A interface é responsiva e preparada para impressão A4 com `window.print()`; para PDF escolha **Salvar como PDF** na caixa de impressão.

## Cadastro visual (v0.2.0)\n\n- Tela de cadastro com nome, e-mail, telefone, senha e confirmação de senha; validações apenas no navegador.\n- Prévia de escolha do código de confirmação por e-mail ou SMS (campo de código desabilitado).\n- **Nenhuma conta é criada.** Nenhuma senha, telefone ou e-mail é persistido ou enviado. Campos apagados ao avançar. Não utilizar dados reais nesta prévia pública.\n- Para abrir cadastros reais é necessário conectar autenticação gerenciada, provedor SMTP, e para SMS um provedor que normalmente cobra pelo envio, com proteção contra abuso e regras de banco.\n\n## Acesso demo (público e intencional)

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
- O projeto é servido pelo GitHub Pages, no endereço https://luc-rp.github.io/IPP_MULTIMIDIA/. Não foi implantado no Vercel. A página é pública, portanto o login demonstrativo não oferece isolamento ou proteção.
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

Documentação central: Notion LK Multimídia e Google Drive/ObsD LK Multimídia. Este protótipo é uma base para revisão, não um produto pronto para operação.

## Plano Free e direção do produto (v0.3.0)

- Produto passa a se chamar **LK Multimídia**; marca final e identidade visual aguardam imagens oficiais.
- Telefone no formulário demonstrativo fica **opcional**. E-mail continua obrigatório.
- Após confirmação **real** de e-mail, a conta terá acesso ao plano Free sem aprovação manual adicional. Isso ainda não funciona no protótipo.
- Catálogo de caixas de som é selecionável no Free; opção de modelo personalizado está bloqueada no cliente como prévia. A autorização real será verificada no backend, nunca somente no HTML/JS.
- Compra ou solicitação de Premium será implementada sem Pix ou cobrança automática por enquanto; ativação administrativa posteriormente.
- Painel ADM multiplataforma é desenvolvido separadamente da hospedagem pública, com arquitetura alvo Tauri 2 (Windows + Android). No protótipo, qualquer dado exibido no painel é fictício.
- Banco MySQL local e API ainda não instalados nem conectados.

## Identidade visual LK — v0.4.0 (23/10/2026)

- Referência autorizada: pasta Google Drive LK MULTIMIDIA / identidade visual LK, especialmente LKSTUDIO.png, Back.png, Front.png e Logo1.png.
- Visual: monocromia grafite/preto/branco, marca angular "K", retículas, diagonais e elementos de áudio, conforme material da LK Studio.
- Títulos: Montserrat 800/900 (aproximação visual; família exata da arte não está identificada nos arquivos). Carrega pelo Google Fonts quando disponível; fallback Arial. Não distribuir nem embutir arquivos de fontes.
- Estilos novos isolados em `brand-lk.css`; símbolo vetorial provisório em `assets/lk-brand-studio.svg` inspirado na marca, sem substituir originais.
- Marca do site, login e capa impressa alterados para LK Multimídia, removendo vestígios institucionais da IPP de textos visíveis do rider.
- Preservados comportamentos de formulário, rascunhos e exportação; chave antiga `ipp.multimidia.v0.1.drafts` permanece para não perder rascunhos de teste existentes.
- O painel ADM Tauri na pasta privada do Drive NÃO foi reestilizado.
- Backend, conta real, OTP, MySQL e pagamento ainda não foram implementados; credenciais de demonstração continuam públicas.
