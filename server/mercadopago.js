const { env } = require("./env");

function mercadoPagoEnabled() {
  return env("MERCADO_PAGO_ENABLED", "false").toLowerCase() === "true";
}

function validateWebhookSignature(headers, body) {
  const secret = env("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!secret) return true;

  const signatureHeader = headers["x-signature"] || "";
  const requestId = headers["x-request-id"] || "";
  const paymentId = body?.data?.id || body?.id;
  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((part) => part.split("=").map((value) => value.trim()))
      .filter(([key, value]) => key && value)
  );

  if (!parts.ts || !parts.v1 || !requestId || !paymentId) return false;

  const manifest = `id:${paymentId};request-id:${requestId};ts:${parts.ts};`;
  const expected = require("node:crypto")
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return timingSafeEqual(expected, parts.v1);
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left), "hex");
  const rightBuffer = Buffer.from(String(right), "hex");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return require("node:crypto").timingSafeEqual(leftBuffer, rightBuffer);
}

async function createPixPayment({ amount, description, payer, externalReference }) {
  if (!mercadoPagoEnabled()) {
    return createFakePixPayment({ amount, description, externalReference });
  }

  const accessToken = env("MERCADO_PAGO_ACCESS_TOKEN");
  if (!accessToken || accessToken.includes("COLE-SEU-ACCESS-TOKEN")) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  }

  const baseUrl = env("BASE_URL", "http://localhost:3000").replace(/\/$/, "");
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": externalReference
    },
    body: JSON.stringify({
      transaction_amount: Number(amount),
      description,
      payment_method_id: "pix",
      payer: {
        email: payer.email || "participante@bolao.local",
        first_name: payer.name || "Participante"
      },
      external_reference: externalReference,
      notification_url: `${baseUrl}/api/webhook/mercadopago`
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao criar PIX no Mercado Pago.");
  }

  const transaction = data.point_of_interaction?.transaction_data || {};
  return {
    provider: "mercadopago",
    providerPaymentId: String(data.id),
    status: data.status,
    qrCode: transaction.qr_code || "",
    qrCodeBase64: transaction.qr_code_base64 || "",
    ticketUrl: transaction.ticket_url || ""
  };
}

async function getPayment(paymentId) {
  const accessToken = env("MERCADO_PAGO_ACCESS_TOKEN");
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao consultar pagamento no Mercado Pago.");
  }
  return data;
}

function createFakePixPayment({ amount, description, externalReference }) {
  const qrCode = [
    "000201",
    "010212",
    `26580014br.gov.bcb.pix0136${externalReference}`,
    "52040000",
    "5303986",
    `5405${Number(amount).toFixed(2)}`,
    "5802BR",
    "5916BOLAO DOS AMIGOS",
    "6009SAO PAULO",
    `62180514${externalReference}`,
    "6304FAKE"
  ].join("");

  return {
    provider: "simulado",
    providerPaymentId: `fake_${externalReference}`,
    status: "pending",
    qrCode,
    qrCodeBase64: "",
    ticketUrl: "",
    description
  };
}

module.exports = { createPixPayment, getPayment, mercadoPagoEnabled, validateWebhookSignature };
