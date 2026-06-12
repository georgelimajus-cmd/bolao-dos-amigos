const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "db.json");

function defaultDb() {
  return {
    users: [],
    bets: [],
    payments: [],
    results: {}
  };
}

function ensureDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(defaultDb(), null, 2));
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function updateDb(mutator) {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
}

module.exports = { readDb, updateDb };
