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
        first_name: payer.name || "Participante",
        identification: payer.cpf ? { type: "CPF", number: payer.cpf } : undefined
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
  if (!transaction.qr_code) {
    throw new Error("Mercado Pago nao retornou um codigo PIX valido para este pagamento.");
  }

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
  const pixKey = env("PIX_KEY");
  const qrCode = pixKey
    ? buildStaticPixPayload({ pixKey, amount, txid: externalReference, description })
    : "";

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

function buildStaticPixPayload({ pixKey, amount, txid, description }) {
  const merchantName = normalizePixText(env("PIX_MERCHANT_NAME", "BOLAO DOS AMIGOS")).slice(0, 25);
  const merchantCity = normalizePixText(env("PIX_MERCHANT_CITY", "GRAJAU")).slice(0, 15);
  const cleanTxid = normalizePixText(txid).replace(/[^A-Z0-9]/g, "").slice(0, 25) || "***";
  const merchantAccount =
    emv("00", "br.gov.bcb.pix") +
    emv("01", pixKey) +
    emv("02", normalizePixText(description).slice(0, 72));
  const payload =
    emv("00", "01") +
    emv("01", "12") +
    emv("26", merchantAccount) +
    emv("52", "0000") +
    emv("53", "986") +
    emv("54", Number(amount).toFixed(2)) +
    emv("58", "BR") +
    emv("59", merchantName) +
    emv("60", merchantCity) +
    emv("62", emv("05", cleanTxid)) +
    "6304";
  return payload + crc16(payload);
}

function emv(id, value) {
  const clean = String(value || "");
  return id + String(clean.length).padStart(2, "0") + clean;
}

function crc16(payload) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function normalizePixText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

module.exports = { createPixPayment, getPayment, mercadoPagoEnabled, validateWebhookSignature };
