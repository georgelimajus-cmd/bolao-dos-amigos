# Colocar o Bolao dos Amigos no ar com PIX Mercado Pago

## 1. O que precisa estar pronto

- Conta Mercado Pago ativa.
- Aplicacao criada no painel de desenvolvedores do Mercado Pago.
- Access Token de producao.
- Chave secreta do webhook.
- Dominio com HTTPS, por exemplo `https://seudominio.com.br`.
- Hospedagem para Node.js, como Render, Railway, VPS ou similar.

## 2. Variaveis de ambiente em producao

Configure estas variaveis na hospedagem:

```env
PORT=3000
BASE_URL=https://seudominio.com.br
ADMIN_PIN=a20b30c40d@
APP_FEE_PERCENT=25
BET_VALUE=10
NODE_ENV=production
DATA_DIR=/var/data
MERCADO_PAGO_ENABLED=true
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_COLE_SEU_ACCESS_TOKEN_DE_PRODUCAO
MERCADO_PAGO_WEBHOOK_SECRET=COLE_A_CHAVE_SECRETA_DO_WEBHOOK
RESULTS_SOURCE_URL=
RESULTS_SYNC_MINUTES=10
```

Nunca coloque `MERCADO_PAGO_ACCESS_TOKEN` ou `MERCADO_PAGO_WEBHOOK_SECRET` no frontend.

## 3. URL do webhook no Mercado Pago

No painel da sua aplicacao Mercado Pago, configure:

```txt
https://seudominio.com.br/api/webhook/mercadopago
```

Evento:

```txt
payment
```

O sistema valida a assinatura do webhook quando `MERCADO_PAGO_WEBHOOK_SECRET` esta configurado.

## 4. Comando para iniciar

Na hospedagem, use:

```bash
npm start
```

A rota de saude para testar se o sistema esta online e:

```txt
https://seudominio.com.br/api/health
```

## 5. Fluxo do pagamento automatico

1. Participante faz cadastro.
2. Sistema cria o PIX no Mercado Pago.
3. Participante paga o PIX.
4. Mercado Pago chama o webhook do sistema.
5. Sistema consulta o pagamento no Mercado Pago.
6. Se o status for `approved`, a aposta fica como paga.
7. A tela libera o palpite automaticamente.

## 6. Teste antes de divulgar

1. Publique em um dominio de teste com HTTPS.
2. Configure `MERCADO_PAGO_ENABLED=true`.
3. Configure o webhook no Mercado Pago.
4. Faca um cadastro real de teste.
5. Gere o PIX.
6. Pague um valor pequeno.
7. Aguarde a tela liberar o palpite automaticamente.
8. Confira no menu Admin se a aposta aparece como paga.

## 7. Observacao sobre banco de dados

Este prototipo grava dados em um arquivo `db.json`. Em producao, configure um disco/volume persistente na hospedagem e aponte `DATA_DIR` para o caminho montado.

No Render, crie um Disk para o servico e use:

```env
DATA_DIR=/var/data
```

Sem disco persistente, cadastros e apostas podem desaparecer em deploys, reinicios ou troca de instancia.

Antes de fazer deploy, use o botao **Baixar backup** no Admin para guardar uma copia JSON dos dados.

Para uso publico com muitos participantes, o proximo passo recomendado e migrar para PostgreSQL, MySQL ou outro banco gerenciado.
