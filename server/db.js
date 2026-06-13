const fs = require("node:fs");
const path = require("node:path");

const restoredSeedData = {
  users: [
    {
      id: "usr_joana_darque",
      name: "Joana Darque Rodrigues Castelo Lima",
      phone: "(99) 8120-8636",
      cpf: "002.133.943-08",
      status: "ativo",
      createdAt: "2026-06-13T03:34:00.000Z",
      paidAt: "2026-06-13T03:34:00.000Z"
    },
    {
      id: "usr_jonathan_wlyssys",
      name: "Jonathan Wlyssys Castelo Lima",
      phone: "(99) 99189-7424",
      cpf: "036.114.973-55",
      status: "ativo",
      createdAt: "2026-06-13T03:34:00.000Z",
      paidAt: "2026-06-13T03:34:00.000Z"
    }
  ],
  bets: [
    {
      id: "bet_84fd75db39a40973",
      userId: "usr_joana_darque",
      matchId: "j006",
      homeScore: 2,
      awayScore: 1,
      value: 10,
      status: "paga",
      provider: "manual_restore",
      providerPaymentId: "manual_restore_joana",
      qrCode: "",
      qrCodeBase64: "",
      ticketUrl: "",
      createdAt: "2026-06-13T03:34:00.000Z",
      paidAt: "2026-06-13T03:34:00.000Z",
      guessAt: "2026-06-13T03:34:00.000Z"
    },
    {
      id: "bet_d0e52f23744947b6",
      userId: "usr_jonathan_wlyssys",
      matchId: "j006",
      homeScore: 2,
      awayScore: 1,
      value: 10,
      status: "paga",
      provider: "manual_restore",
      providerPaymentId: "manual_restore_jonathan",
      qrCode: "",
      qrCodeBase64: "",
      ticketUrl: "",
      createdAt: "2026-06-13T03:34:00.000Z",
      paidAt: "2026-06-13T03:34:00.000Z",
      guessAt: "2026-06-13T03:34:00.000Z"
    }
  ]
};

function getDataDir() {
  return process.env.DATA_DIR || path.join(__dirname, "..", "data");
}

function getDbPath() {
  return path.join(getDataDir(), "db.json");
}

function defaultDb() {
  return {
    users: [...restoredSeedData.users],
    bets: [...restoredSeedData.bets],
    payments: [],
    results: {},
    settings: {
      manualClosedMatchIds: []
    }
  };
}

function ensureDb() {
  const dataDir = getDataDir();
  const dbPath = getDbPath();
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(defaultDb(), null, 2));
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(getDbPath(), "utf8"));
  if (ensureRestoredSeedData(db)) writeDb(db);
  return db;
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(getDbPath(), JSON.stringify(db, null, 2));
}

function updateDb(mutator) {
  const db = readDb();
  const result = mutator(db);
  ensureRestoredSeedData(db);
  writeDb(db);
  return result;
}

function ensureRestoredSeedData(db) {
  let changed = false;
  db.users = Array.isArray(db.users) ? db.users : [];
  db.bets = Array.isArray(db.bets) ? db.bets : [];
  db.payments = Array.isArray(db.payments) ? db.payments : [];
  db.results = db.results && typeof db.results === "object" ? db.results : {};
  db.settings = db.settings && typeof db.settings === "object" ? db.settings : {};
  db.settings.manualClosedMatchIds = Array.isArray(db.settings.manualClosedMatchIds)
    ? db.settings.manualClosedMatchIds
    : [];

  if (!db.settings.repairedJ031BetsToJ006) {
    for (const bet of db.bets) {
      if (bet && bet.matchId === "j031") {
        bet.migratedFromMatchId = "j031";
        bet.matchId = "j006";
        bet.migratedToMatchId = "j006";
        bet.migratedAt = new Date().toISOString();
        changed = true;
      }
    }
    db.settings.repairedJ031BetsToJ006 = true;
    changed = true;
  }

  for (const user of restoredSeedData.users) {
    if (!db.users.some((item) => item.id === user.id)) {
      db.users.push({ ...user });
      changed = true;
    }
  }

  for (const bet of restoredSeedData.bets) {
    if (!db.bets.some((item) => item.id === bet.id)) {
      db.bets.push({ ...bet });
      changed = true;
    }
  }

  return changed;
}

module.exports = { readDb, updateDb };
