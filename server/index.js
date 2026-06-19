const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { loadEnv, env } = require("./env");
const { readDb, updateDb } = require("./db");
const { games } = require("./games");
const { createPixPayment, getPayment, mercadoPagoEnabled, validateWebhookSignature } = require("./mercadopago");

loadEnv();

const publicDir = path.join(__dirname, "..", "outputs");
const port = Number(env("PORT", "3000"));
const betValue = Number(env("BET_VALUE", "10"));
const appFeePercent = Number(env("APP_FEE_PERCENT", "25"));
const betCloseMinutes = Number(env("BET_CLOSE_MINUTES", "5"));
const resultsSyncMinutes = Number(env("RESULTS_SYNC_MINUTES", "10"));
const pendingPaymentTtlMinutes = Number(env("PENDING_PAYMENT_TTL_MINUTES", "60"));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erro interno." });
  }
});

server.listen(port, () => {
  console.log(`Bolao dos Amigos rodando em http://localhost:${port}`);
  console.log(`Mercado Pago: ${mercadoPagoEnabled() ? "ativo" : "simulado"}`);
});

if (env("RESULTS_SOURCE_URL")) {
  setInterval(() => {
    syncResultsFromSource().catch((error) => console.error(`Erro ao sincronizar resultados: ${error.message}`));
  }, Math.max(1, resultsSyncMinutes) * 60 * 1000);
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  cleanupExpiredPendingRecords();

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      app: "Bolao dos Amigos",
      mercadoPagoEnabled: mercadoPagoEnabled(),
      time: new Date().toISOString()
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    sendJson(res, 200, {
      betValue,
      appFeePercent,
      mercadoPagoEnabled: mercadoPagoEnabled()
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/jogos") {
    sendJson(res, 200, { games });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/resumo") {
    sendJson(res, 200, buildPublicSummary());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/usuarios") {
    const body = await readBody(req);
    const result = saveUser(body);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/apostas") {
    const body = await readBody(req);
    const result = await createBet(body);
    sendJson(res, 201, result);
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/apostas/")) {
    const id = url.pathname.split("/").pop();
    const db = readDb();
    const bet = db.bets.find((item) => item.id === id);
    if (!bet) return sendJson(res, 404, { error: "Aposta nao encontrada." });
    sendJson(res, 200, { bet });
    return;
  }

  if (req.method === "POST" && url.pathname.endsWith("/palpite") && !url.pathname.startsWith("/api/admin/")) {
    const parts = url.pathname.split("/");
    const id = parts[3];
    const body = await readBody(req);
    const bet = saveGuess(id, body);
    if (!bet) return sendJson(res, 404, { error: "Aposta nao encontrada." });
    sendJson(res, 200, { bet });
    return;
  }

  if (req.method === "POST" && url.pathname.endsWith("/simular-pagamento")) {
    const parts = url.pathname.split("/");
    const id = parts[3];
    if (mercadoPagoEnabled()) {
      return sendJson(res, 400, { error: "Simulacao desativada com Mercado Pago real." });
    }
    const bet = updateDb((db) => {
      const item = db.bets.find((candidate) => candidate.id === id);
      if (!item) return null;
      item.status = "paga";
      item.paidAt = new Date().toISOString();
      activateUserForPaidBet(db, item);
      return item;
    });
    if (!bet) return sendJson(res, 404, { error: "Aposta nao encontrada." });
    sendJson(res, 200, { bet });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin") {
    const pin = url.searchParams.get("pin");
    if (pin !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    sendJson(res, 200, buildAdminData());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/backup") {
    const pin = url.searchParams.get("pin");
    if (pin !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    sendJson(res, 200, {
      exportedAt: new Date().toISOString(),
      data: readDb()
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/restaurar") {
    const body = await readBody(req);
    if (String(body.pin || "") !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const result = restoreBackup(body);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/alterar-palpite") {
    const body = await readBody(req);
    if (String(body.pin || "") !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const bet = updateGuessByAdmin(String(body.betId || ""), body);
    if (!bet) return sendJson(res, 404, { error: "Aposta nao encontrada." });
    sendJson(res, 200, { bet });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/encerrar-apostas") {
    const body = await readBody(req);
    if (String(body.pin || "") !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const result = setManualBettingClosed(String(body.matchId || ""), true);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/reabrir-apostas") {
    const body = await readBody(req);
    if (String(body.pin || "") !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const result = setManualBettingClosed(String(body.matchId || ""), false);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/bonus") {
    const body = await readBody(req);
    if (String(body.pin || "") !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const result = addAdminBonus(body);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/admin/apostas/") && url.pathname.endsWith("/palpite")) {
    const body = await readBody(req);
    if (String(body.pin || "") !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const parts = url.pathname.split("/");
    const betId = decodeURIComponent(parts[4]);
    const bet = updateGuessByAdmin(betId, body);
    if (!bet) return sendJson(res, 404, { error: "Aposta nao encontrada." });
    sendJson(res, 200, { bet });
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/usuarios/")) {
    const pin = url.searchParams.get("pin");
    if (pin !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const userId = decodeURIComponent(url.pathname.split("/").pop());
    const result = deleteUser(userId);
    if (!result.deleted) return sendJson(res, 404, { error: "Cadastro nao encontrado." });
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/apostas/")) {
    const pin = url.searchParams.get("pin");
    if (pin !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const betId = decodeURIComponent(url.pathname.split("/").pop());
    const result = deleteBet(betId);
    if (!result.deleted) return sendJson(res, 404, { error: "Aposta nao encontrada." });
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/sincronizar-resultados") {
    const body = await readBody(req);
    if (String(body.pin || "") !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const result = await syncResultsFromSource();
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/resultado-manual") {
    const body = await readBody(req);
    if (String(body.pin || "") !== env("ADMIN_PIN", "a20b30c40d@")) {
      return sendJson(res, 401, { error: "PIN incorreto." });
    }
    const result = saveManualResult(body);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/resultados") {
    const body = await readBody(req);
    const result = findResults(body);
    if (!result) return sendJson(res, 404, { error: "Participante nao encontrado." });
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/webhook/mercadopago") {
    const body = await readBody(req);
    if (!validateWebhookSignature(req.headers, body)) {
      return sendJson(res, 401, { error: "Assinatura do webhook invalida." });
    }
    await handleMercadoPagoWebhook(body);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "Rota nao encontrada." });
}

function saveUser(body) {
  const name = String(body.name || body.nome || "").trim();
  const phone = String(body.phone || body.celular || "").trim();
  const cpf = String(body.cpf || "").trim();
  if (!name || !phone || !cpf) throw new Error("Nome, celular e CPF sao obrigatorios.");
  if (normalizeName(name).split(" ").length < 2) throw new Error("Informe o nome completo.");
  if (!isValidCpf(cpf)) throw new Error("CPF invalido.");
  if (!isValidPhone(phone)) throw new Error("Celular invalido.");

  return updateDb((db) => {
    const cpfDigits = onlyDigits(cpf);
    const phoneDigits = onlyDigits(phone);
    const userByCpf = db.users.find((item) => onlyDigits(item.cpf) === cpfDigits);
    const userByPhone = db.users.find((item) => onlyDigits(item.phone) === phoneDigits);

    if (userByCpf && userByPhone && userByCpf.id !== userByPhone.id) {
      throw new Error("CPF e celular ja pertencem a cadastros diferentes.");
    }
    if (userByCpf && onlyDigits(userByCpf.phone) !== phoneDigits) {
      throw new Error("Este CPF ja esta cadastrado com outro celular.");
    }
    if (userByPhone && onlyDigits(userByPhone.cpf) !== cpfDigits) {
      throw new Error("Este celular ja esta cadastrado com outro CPF.");
    }

    let user = userByCpf || userByPhone;
    if (user) {
      user.name = name;
      user.phone = phone;
      user.cpf = cpf;
      return { user, alreadyExists: true };
    }
    user = {
      id: randomId("usr"),
      name,
      phone,
      cpf,
      status: "pendente_pagamento",
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    return { user, alreadyExists: false };
  });
}

async function createBet(body) {
  const userId = String(body.userId || body.usuario_id || "");
  const matchId = String(body.matchId || body.jogo_id || "");
  const homeScore = body.homeScore ? body.placar_casa;
  const awayScore = body.awayScore ? body.placar_fora;
  const match = games.find((item) => item.id === matchId);
  if (!match) throw new Error("Jogo invalido.");
  if (!isOptionalScore(homeScore) || !isOptionalScore(awayScore)) {
    throw new Error("Placar invalido.");
  }
  const db = readDb();
  if (isManualBettingClosed(db, matchId)) throw new Error("O jogo comeÃ§ou, fim das apostas. Aguarde o resultado!");
  if (!isBettingOpen(match)) throw new Error("As apostas para este jogo ainda nao foram abertas.");
  if (!canBet(match)) throw new Error("O jogo comeÃ§ou, fim das apostas. Aguarde o resultado!");
  if (!isCurrentBrazilMatchAvailable(db, matchId)) {
    throw new Error("Este jogo ainda nao esta liberado. As apostas seguem a sequencia dos jogos do Brasil.");
  }
  const user = db.users.find((item) => item.id === userId);
  if (!user) throw new Error("Usuario nao encontrado.");
  const paidBet = db.bets.find((item) => item.userId === userId && item.matchId === matchId && item.status === "paga");
  if (paidBet) throw new Error("Este usuario ja possui uma aposta paga para este jogo.");

  const existingPending = db.bets.find((item) => item.userId === userId && item.matchId === matchId && item.status !== "paga");
  const betId = existingPending?.id || randomId("bet");
  const description = `Bolao dos Amigos - ${match.home} x ${match.away}`;
  const payment = await createPixPayment({
    amount: betValue,
    description,
    payer: {
      name: user.name,
      email: env("MERCADO_PAGO_PAYER_EMAIL", `${onlyDigits(user.cpf) || "participante"}@bolaodosamigos.com.br`),
      cpf: onlyDigits(user.cpf),
      phone: onlyDigits(user.phone)
    },
    externalReference: betId
  });

  const bet = updateDb((freshDb) => {
    const existing = freshDb.bets.find((item) => item.id === betId);
    const nextBet = {
      id: betId,
      userId,
      matchId,
      homeScore: homeScore === undefined ? null : Number(homeScore),
      awayScore: awayScore === undefined ? null : Number(awayScore),
      value: betValue,
      status: payment.status === "approved" ? "paga" : "aguardando_pagamento",
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      ticketUrl: payment.ticketUrl,
      createdAt: existing?.createdAt || new Date().toISOString(),
      paidAt: payment.status === "approved" ? new Date().toISOString() : null
    };
    if (existing) Object.assign(existing, nextBet);
    else freshDb.bets.push(nextBet);
    return existing || nextBet;
  });

  return { bet, user, match };
}

function saveGuess(betId, body) {
  const { homeScore, awayScore } = parseRequiredScore(body);

  return updateDb((db) => {
    const bet = db.bets.find((item) => item.id === betId);
    if (!bet) return null;
    if (bet.status !== "paga") throw new Error("Pagamento ainda nao confirmado.");
    if (bet.homeScore !== null && bet.homeScore !== undefined && bet.awayScore !== null && bet.awayScore !== undefined) {
      throw new Error("Este CPF e celular ja possuem uma aposta registrada para este jogo.");
    }
    bet.homeScore = homeScore;
    bet.awayScore = awayScore;
    bet.guessAt = new Date().toISOString();
    return bet;
  });
}

function updateGuessByAdmin(betId, body) {
  const { homeScore, awayScore } = parseRequiredScore(body);

  return updateDb((db) => {
    const bet = db.bets.find((item) => item.id === betId);
    if (!bet) return null;
    if (bet.status !== "paga") throw new Error("Somente apostas pagas podem ter palpite alterado.");
    bet.homeScore = homeScore;
    bet.awayScore = awayScore;
    bet.guessAt = bet.guessAt || new Date().toISOString();
    bet.updatedByAdminAt = new Date().toISOString();
    return bet;
  });
}

function parseRequiredScore(body) {
  const homeRaw = body.homeScore ? body.placar_casa;
  const awayRaw = body.awayScore ? body.placar_fora;
  if (homeRaw === undefined || homeRaw === null || homeRaw === "" || awayRaw === undefined || awayRaw === null || awayRaw === "") {
    throw new Error("Digite o palpite completo para finalizar a aposta.");
  }
  const homeScore = Number(homeRaw);
  const awayScore = Number(awayRaw);
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    throw new Error("Placar invalido.");
  }
  return { homeScore, awayScore };
}

async function handleMercadoPagoWebhook(body) {
  const paymentId = body?.data?.id || body?.id;
  if (!paymentId || !mercadoPagoEnabled()) return;

  const payment = await getPayment(paymentId);
  if (payment.status !== "approved") return;
  const betId = payment.external_reference;
  if (!betId) return;

  updateDb((db) => {
    const bet = db.bets.find((item) => item.id === betId);
    if (!bet) return;
    bet.status = "paga";
    bet.paidAt = new Date().toISOString();
    bet.providerPaymentId = String(payment.id);
    activateUserForPaidBet(db, bet);
  });
}

function activateUserForPaidBet(db, bet) {
  const user = db.users.find((item) => item.id === bet.userId);
  if (!user) return;
  user.status = "ativo";
  user.paidAt = bet.paidAt || new Date().toISOString();
}

function buildAdminData() {
  const db = readDb();
  const settlements = games.map((game) => buildSettlement(db, game));
  const paidBets = db.bets.filter((bet) => bet.status === "paga");
  const paidUserIds = new Set(paidBets.map((bet) => bet.userId));
  const activeUsers = db.users.filter((user) => user.status === "ativo" || paidUserIds.has(user.id));
  const currentMatch = currentBrazilMatch(db);
  return {
    users: activeUsers,
    bets: paidBets,
    games,
    results: db.results || {},
    settings: db.settings || {},
    currentMatchId: currentMatch?.id || null,
    currentMatchClosed: currentMatch ? isBettingClosed(db, currentMatch) : true,
    settlements,
    totals: {
      paidBets: paidBets.length,
      gross: paidBets.length * betValue,
      net: paidBets.length * betValue * (1 - appFeePercent / 100)
    }
  };
}

function buildPublicSummary() {
  const db = readDb();
  const paidBets = db.bets.filter((bet) => bet.status === "paga").length;
  const currentMatch = currentBrazilMatch(db);
  const currentSettlement = currentMatch ? buildSettlement(db, currentMatch) : null;
  const finalSettlement = latestFinalizedBrazilSettlement(db);
  return {
    netTotal: currentSettlement ? currentSettlement.netPot : paidBets * betValue * (1 - appFeePercent / 100),
    currentMatchId: currentMatch?.id || null,
    currentMatchClosed: currentMatch ? isBettingClosed(db, currentMatch) : true,
    finalSettlement,
    nextBettingWindow: currentMatch ? bettingWindowForMatch(currentMatch) : null
  };
}

function cleanupExpiredPendingRecords() {
  if (!Number.isFinite(pendingPaymentTtlMinutes) || pendingPaymentTtlMinutes <= 0) return;
  const cutoff = Date.now() - pendingPaymentTtlMinutes * 60 * 1000;
  updateDb((db) => {
    const expiredPendingBets = db.bets.filter((bet) =>
      bet.status !== "paga" && new Date(bet.createdAt || 0).getTime() < cutoff
    );
    if (!expiredPendingBets.length) return;
    const expiredBetIds = new Set(expiredPendingBets.map((bet) => bet.id));
    const expiredUserIds = new Set(expiredPendingBets.map((bet) => bet.userId));
    db.bets = db.bets.filter((bet) => !expiredBetIds.has(bet.id));
    db.payments = (db.payments || []).filter((payment) => !expiredBetIds.has(payment.externalReference));
    db.users = db.users.filter((user) => {
      if (!expiredUserIds.has(user.id)) return true;
      return db.bets.some((bet) => bet.userId === user.id && bet.status === "paga");
    });
  });
}

function restoreBackup(body) {
  const incoming = normalizeBackupPayload(body);
  return updateDb((db) => {
    const before = {
      users: db.users.length,
      bets: db.bets.length,
      payments: (db.payments || []).length,
      results: Object.keys(db.results || {}).length
    };

    db.users = mergeById(db.users || [], incoming.users);
    db.bets = mergeById(db.bets || [], incoming.bets);
    db.payments = mergeByPaymentKey(db.payments || [], incoming.payments);
    db.results = { ...(db.results || {}), ...(incoming.results || {}) };
    db.settings = {
      ...(db.settings || {}),
      ...(incoming.settings || {}),
      manualClosedMatchIds: Array.from(new Set([
        ...((db.settings || {}).manualClosedMatchIds || []),
        ...((incoming.settings || {}).manualClosedMatchIds || [])
      ]))
    };

    return {
      ok: true,
      imported: {
        users: db.users.length - before.users,
        bets: db.bets.length - before.bets,
        payments: db.payments.length - before.payments,
        results: Object.keys(db.results || {}).length - before.results
      },
      totals: {
        users: db.users.length,
        bets: db.bets.length,
        payments: db.payments.length,
        results: Object.keys(db.results || {}).length
      }
    };
  });
}

function normalizeBackupPayload(body) {
  const source = body?.data || body?.backup || body;
  if (!source || typeof source !== "object") throw new Error("Backup invalido.");
  return {
    users: Array.isArray(source.users) ? source.users : [],
    bets: Array.isArray(source.bets) ? source.bets : [],
    payments: Array.isArray(source.payments) ? source.payments : [],
    results: source.results && typeof source.results === "object" ? source.results : {},
    settings: source.settings && typeof source.settings === "object" ? source.settings : {}
  };
}

function mergeById(current, incoming) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    if (!item || !item.id) continue;
    map.set(item.id, { ...(map.get(item.id) || {}), ...item });
  }
  return Array.from(map.values());
}

function mergeByPaymentKey(current, incoming) {
  const keyOf = (item) => item?.id || item?.providerPaymentId || item?.externalReference;
  const map = new Map(current.map((item) => [keyOf(item), item]).filter(([key]) => key));
  for (const item of incoming) {
    const key = keyOf(item);
    if (!key) continue;
    map.set(key, { ...(map.get(key) || {}), ...item });
  }
  return Array.from(map.values());
}

function deleteUser(userId) {
  return updateDb((db) => {
    const beforeUsers = db.users.length;
    const userBets = db.bets.filter((bet) => bet.userId === userId);
    const betIds = new Set(userBets.map((bet) => bet.id));
    db.users = db.users.filter((user) => user.id !== userId);
    db.bets = db.bets.filter((bet) => bet.userId !== userId);
    db.payments = (db.payments || []).filter((payment) => !betIds.has(payment.externalReference));
    return {
      deleted: db.users.length < beforeUsers,
      removedBets: userBets.length
    };
  });
}

function deleteBet(betId) {
  return updateDb((db) => {
    const beforeBets = db.bets.length;
    db.bets = db.bets.filter((bet) => bet.id !== betId);
    db.payments = (db.payments || []).filter((payment) => payment.externalReference !== betId);
    return {
      deleted: db.bets.length < beforeBets
    };
  });
}

function findResults(body) {
  const name = normalizeName(body.name || body.nome);
  const cpf = onlyDigits(body.cpf);
  if (!name || !cpf) throw new Error("Nome e CPF sao obrigatorios.");

  const db = readDb();
  const paidUserIds = new Set(db.bets.filter((bet) => bet.status === "paga").map((bet) => bet.userId));
  const user = db.users.find((item) =>
    normalizeName(item.name) === name &&
    onlyDigits(item.cpf) === cpf &&
    (item.status === "ativo" || paidUserIds.has(item.id))
  );
  if (!user) return null;

  const bets = db.bets
    .filter((bet) => bet.userId === user.id && bet.status === "paga")
    .map((bet) => ({
      ...bet,
      game: games.find((game) => game.id === bet.matchId),
      settlement: buildUserBetSettlement(db, bet)
    }));

  return { user, bets };
}

function buildUserBetSettlement(db, bet) {
  const game = games.find((item) => item.id === bet.matchId);
  if (!game) return { status: "jogo_nao_encontrado", message: "Jogo nÃ£o encontrado." };
  const settlement = buildSettlement(db, game);
  if (settlement.status !== "finalizado") {
    return {
      status: "aguardando_jogo",
      message: "Aguardando o jogo terminar para conferir o resultado."
    };
  }

  const winner = settlement.winners.find((item) => item.betId === bet.id);
  return {
    status: winner ? "ganhou" : "nao_ganhou",
    result: settlement.result,
    prize: winner ? settlement.prizePerWinner : 0,
    message: winner ? "VocÃª acertou o placar." : "VocÃª nÃ£o acertou o placar."
  };
}

function buildSettlement(db, game) {
  const result = db.results?.[game.id];
  const paidBets = db.bets.filter((bet) => bet.matchId === game.id && bet.status === "paga");
  const baseNetPot = paidBets.length * betValue * (1 - appFeePercent / 100);
  const bonus = bonusNetPotForGame(db, game.id);
  const carryover = carryoverNetPotForGame(db, game);
  const netPot = baseNetPot + bonus + carryover;

  if (!result || result.status !== "finalizado") {
    return {
      matchId: game.id,
      status: "aguardando_jogo",
      message: "Aguardando o jogo terminar.",
      paidBets: paidBets.length,
      baseNetPot,
      bonus,
      carryover,
      netPot,
      winners: [],
      prizePerWinner: 0
    };
  }

  const winners = paidBets
    .filter((bet) => Number(bet.homeScore) === Number(result.homeScore) && Number(bet.awayScore) === Number(result.awayScore))
    .map((bet) => {
      const user = db.users.find((item) => item.id === bet.userId);
      return {
        betId: bet.id,
        userId: bet.userId,
        name: user?.name || "Participante",
        cpf: user?.cpf || "",
        homeScore: bet.homeScore,
        awayScore: bet.awayScore
      };
    });

  return {
    matchId: game.id,
    status: "finalizado",
    result,
    paidBets: paidBets.length,
    baseNetPot,
    bonus,
    carryover,
    netPot,
    winners,
    prizePerWinner: winners.length ? netPot / winners.length : 0,
    message: winners.length ? "Resultado calculado." : "Ninguém acertou o placar. O valor líquido arrecadado irá para o próximo jogo."
  };
}

function bonusNetPotForGame(db, matchId) {
  const entries = db.settings?.bonusByMatchId?.[matchId];
  if (!Array.isArray(entries)) return 0;
  return entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
}

function carryoverNetPotForGame(db, game) {
  const orderedBrazilGames = games
    .filter((item) => item.home === "Brasil" || item.away === "Brasil")
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const gameIndex = orderedBrazilGames.findIndex((item) => item.id === game.id);
  if (gameIndex <= 0) return 0;

  let carryover = 0;
  for (let index = gameIndex - 1; index >= 0; index -= 1) {
    const previousGame = orderedBrazilGames[index];
    const result = db.results?.[previousGame.id];
    if (!result || result.status !== "finalizado") break;

    const paidBets = db.bets.filter((bet) => bet.matchId === previousGame.id && bet.status === "paga");
    const previousNetPot = paidBets.length * betValue * (1 - appFeePercent / 100) + bonusNetPotForGame(db, previousGame.id);
    const winners = paidBets.filter((bet) =>
      Number(bet.homeScore) === Number(result.homeScore) &&
      Number(bet.awayScore) === Number(result.awayScore)
    );
    if (winners.length) break;
    carryover += previousNetPot;
  }
  return carryover;
}

function latestFinalizedBrazilSettlement(db) {
  const finalizedGame = games
    .filter((game) => game.home === "Brasil" || game.away === "Brasil")
    .filter((game) => db.results?.[game.id]?.status === "finalizado")
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))[0];

  if (!finalizedGame) return null;
  const settlement = buildSettlement(db, finalizedGame);
  return {
    matchId: finalizedGame.id,
    game: finalizedGame,
    result: settlement.result,
    netPot: settlement.netPot,
    winners: settlement.winners.map((winner) => ({
      name: maskWinnerName(winner.name),
      homeScore: winner.homeScore,
      awayScore: winner.awayScore
    })),
    winnersCount: settlement.winners.length,
    prizePerWinner: settlement.prizePerWinner,
    message: settlement.message
  };
}

function maskWinnerName(name) {
  const parts = String(name || "Participante").trim().split(/\s+/).filter(Boolean);
  const visible = parts.slice(0, 2).join(" ") || "Participante";
  return `${visible} *****`;
}

function isCurrentBrazilMatchAvailable(db, matchId) {
  const orderedBrazilGames = games
    .filter((game) => game.home === "Brasil" || game.away === "Brasil")
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const nextGame = orderedBrazilGames.find((game) => {
    const result = db.results?.[game.id];
    return !result || result.status !== "finalizado";
  });
  return nextGame?.id === matchId;
}

function currentBrazilMatch(db) {
  return games
    .filter((game) => game.home === "Brasil" || game.away === "Brasil")
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .find((game) => {
      const result = db.results?.[game.id];
      return !result || result.status !== "finalizado";
    }) || null;
}

function isManualBettingClosed(db, matchId) {
  return Boolean(db.settings?.manualClosedMatchIds?.includes(matchId));
}

function isBettingClosed(db, match) {
  return isManualBettingClosed(db, match.id) || !isBettingOpen(match) || !canBet(match);
}

function bettingWindowForMatch(match) {
  return {
    opensAt: bettingOpenAt(match).toISOString(),
    closesMinutesBefore: betCloseMinutes
  };
}

function bettingOpenAt(match) {
  if (match.id === "j031") return new Date("2026-06-14T08:00:00-03:00");
  return new Date(0);
}

function isBettingOpen(match) {
  return Date.now() >= bettingOpenAt(match).getTime();
}

function setManualBettingClosed(matchId, closed) {
  if (!games.some((game) => game.id === matchId)) throw new Error("Jogo invalido.");
  return updateDb((db) => {
    db.settings = db.settings || {};
    const ids = new Set(Array.isArray(db.settings.manualClosedMatchIds) ? db.settings.manualClosedMatchIds : []);
    if (closed) ids.add(matchId);
    else ids.delete(matchId);
    db.settings.manualClosedMatchIds = Array.from(ids);
    const game = games.find((item) => item.id === matchId);
    return {
      ok: true,
      matchId,
      closed: isBettingClosed(db, game),
      manualClosedMatchIds: db.settings.manualClosedMatchIds
    };
  });
}

function addAdminBonus(body) {
  const matchId = String(body.matchId || "");
  const amount = Number(body.amount);
  if (!games.some((game) => game.id === matchId)) throw new Error("Jogo invalido.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Informe um valor de bonus maior que zero.");

  return updateDb((db) => {
    db.settings = db.settings || {};
    db.settings.bonusByMatchId = db.settings.bonusByMatchId && typeof db.settings.bonusByMatchId === "object"
      ? db.settings.bonusByMatchId
      : {};
    const entries = Array.isArray(db.settings.bonusByMatchId[matchId])
      ? db.settings.bonusByMatchId[matchId]
      : [];
    const bonus = {
      id: `bonus_${Date.now().toString(16)}`,
      matchId,
      amount: Math.round(amount * 100) / 100,
      description: String(body.description || "Bonus do administrador"),
      createdAt: new Date().toISOString()
    };
    entries.push(bonus);
    db.settings.bonusByMatchId[matchId] = entries;
    const game = games.find((item) => item.id === matchId);
    return {
      ok: true,
      bonus,
      settlement: buildSettlement(db, game)
    };
  });
}

function saveManualResult(body) {
  const matchId = String(body.matchId || "");
  const game = games.find((item) => item.id === matchId);
  if (!game) throw new Error("Jogo invÃ¡lido.");
  const homeScore = Number(body.homeScore);
  const awayScore = Number(body.awayScore);
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    throw new Error("Placar invÃ¡lido.");
  }

  return updateDb((db) => {
    db.results = db.results || {};
    db.results[matchId] = {
      matchId,
      homeScore,
      awayScore,
      status: "finalizado",
      source: "manual_admin",
      updatedAt: new Date().toISOString()
    };
    return { result: db.results[matchId], settlement: buildSettlement(db, game) };
  });
}

async function syncResultsFromSource() {
  const sourceUrl = env("RESULTS_SOURCE_URL");
  if (!sourceUrl) {
    return {
      updated: 0,
      message: "RESULTS_SOURCE_URL nÃ£o configurada. Configure uma API oficial/provedor para sincronizaÃ§Ã£o automÃ¡tica."
    };
  }

  const response = await fetch(sourceUrl);
  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
  let updated = 0;

  updateDb((db) => {
    db.results = db.results || {};
    for (const item of results) {
      const matchId = String(item.matchId || item.id || "");
      if (!games.some((game) => game.id === matchId)) continue;
      if (item.status !== "finalizado" && item.status !== "finished") continue;
      const homeScore = Number(item.homeScore ? item.home_score);
      const awayScore = Number(item.awayScore ? item.away_score);
      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) continue;
      db.results[matchId] = {
        matchId,
        homeScore,
        awayScore,
        status: "finalizado",
        source: item.source || "results_source_url",
        updatedAt: new Date().toISOString()
      };
      updated += 1;
    }
  });

  return { updated, message: `${updated} resultado(s) sincronizado(s).` };
}

function canBet(match) {
  return Math.floor((new Date(match.startsAt).getTime() - Date.now()) / 60000) > betCloseMinutes;
}

function isOptionalScore(value) {
  if (value === undefined || value === null || value === "") return true;
  const score = Number(value);
  return Number.isInteger(score) && score >= 0;
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(publicDir, requested));
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const headers = { "Content-Type": mimeTypes[ext] || "application/octet-stream" };
  if ([".html", ".css", ".js"].includes(ext)) {
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
    headers.Pragma = "no-cache";
    headers.Expires = "0";
  }
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload muito grande."));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalido."));
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(data));
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidCpf(value) {
  const digits = onlyDigits(value);
  return digits.length === 11 && !/^(\d)\1+$/.test(digits);
}

function isValidPhone(value) {
  const digits = onlyDigits(value);
  return digits.length >= 10 && digits.length <= 11 && !/^(\d)\1+$/.test(digits);
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}
