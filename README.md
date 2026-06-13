# Bolao dos Amigos - PIX Mercado Pago

Este projeto agora tem:

- Frontend em `outputs/`
- Backend Node.js em `server/`
- Banco local JSON em `data/db.json`
- Rotas para cadastro, aposta, PIX e admin
- Webhook do Mercado Pago

## 1. Configurar ambiente

Copie `.env.example` para `.env` e preencha:

```env
PORT=3000
BASE_URL=http://localhost:3000
ADMIN_PIN=a20b30c40d@
APP_FEE_PERCENT=25
BET_VALUE=10
MERCADO_PAGO_ACCESS_TOKEN=TEST-SEU-ACCESS-TOKEN
MERCADO_PAGO_WEBHOOK_SECRET=
MERCADO_PAGO_ENABLED=false
```

Use `MERCADO_PAGO_ENABLED=false` enquanto estiver testando sem API real.

Quando for usar Mercado Pago de verdade:

```env
MERCADO_PAGO_ENABLED=true
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_OU_TEST_...
MERCADO_PAGO_WEBHOOK_SECRET=CHAVE_SECRETA_DO_WEBHOOK
```

## 2. Rodar localmente

```bash
npm start
```

Abra:

```txt
http://localhost:3000
```

## 3. Rotas principais

```txt
GET  /api/jogos
POST /api/usuarios
POST /api/apostas
GET  /api/apostas/:id
GET  /api/admin?pin=a20b30c40d@
POST /api/webhook/mercadopago
GET  /api/admin/backup?pin=a20b30c40d@
POST /api/admin/restaurar
```

## 4. Configurar webhook no Mercado Pago

No painel da sua aplicacao Mercado Pago, configure:

```txt
https://seudominio.com/api/webhook/mercadopago
```

Evento:

```txt
payment
```

Em localhost, o Mercado Pago nao consegue chamar seu computador diretamente. Para testar webhook local, use uma URL publica temporaria, como ngrok ou Cloudflare Tunnel.

## 5. Observacoes importantes

- Nunca coloque o `Access Token` no frontend.
- O backend consulta o pagamento no Mercado Pago antes de marcar a aposta como paga.
- O botao "Confirmar pagamento" simula pagamento somente quando `MERCADO_PAGO_ENABLED=false`.
- Quando `MERCADO_PAGO_ENABLED=true`, o botao de simulacao fica oculto e a confirmacao depende do webhook.
- Em producao, publique em HTTPS.
- Veja o passo a passo completo em `DEPLOY.md`.
