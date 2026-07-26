# Portal HUMANEXUS — homologação Vercel

Projeto separado: `humanexus-site`. Ambiente: `homologacao`. Região: `gru1`.

O deploy automático por Git está desabilitado. A publicação é manual e deve ocorrer somente depois de:

1. núcleo AWS disponível em HTTPS;
2. domínio técnico autorizado;
3. variáveis configuradas por ambiente na Vercel;
4. `npm test`, `npm run build:vercel` e verificação móvel aprovados;
5. confirmação de que `app.institutohumanexus.com` permanece intocado.

`HUMANEXUS_CORE_API_URL` é variável de servidor e não pode ter prefixo `NEXT_PUBLIC_`. Cookies de sessão permanecem `httpOnly`, `SameSite=Strict` e `Secure` em HTTPS. O ambiente de homologação envia `X-Robots-Tag: noindex`.

Sem credencial Vercel e autorização do subdomínio, não execute `vercel deploy`.
