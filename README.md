# LK Multimídia | Plataforma técnica

Frontend LK em HTML, CSS e JavaScript, com login e cadastro reais exclusivamente via API Node.js local v0.6.0 servida no mesmo endereço http://127.0.0.1:8787. Banco MySQL da LK na porta 3308. O envio de código requer SMTP configurado. Sem SMTP, cadastro desativado. Nenhuma senha de teste está embutida na página.

O GitHub Pages é público e serve apenas para visualizar a identidade da plataforma; campos de login e cadastro ficam indisponíveis nele. Não conectar navegador público a localhost, nem expor 3308 na internet.

Após iniciar a API, copie os arquivos deste repositório para o diretório definido por LK_SITE_ROOT, preservando assets/. A API serve esses arquivos e protege cookies de sessão. Riders são salvos na API. Anexos de imagens estão indisponíveis até existir armazenamento privado. Compartilhamentos, organizações pagas e apps ADM permanecem pendentes.

O backend está documentado e versionado na pasta privada LK MULTIMIDIA do Drive, sem chaves, senhas nem arquivo .env.
