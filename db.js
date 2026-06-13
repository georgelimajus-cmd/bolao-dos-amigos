const fs = require("node:fs");
const path = require("node:path");

function getDataDir() {
  return process.env.DATA_DIR || path.join(__dirname, "..", "data");
}

function getDbPath() {
  return path.join(getDataDir(), "db.json");
}

function defaultDb() {
  return {
    users: [],
    bets: [],
    payments: [],
    results: {}
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
  return JSON.parse(fs.readFileSync(getDbPath(), "utf8"));
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(getDbPath(), JSON.stringify(db, null, 2));
}

function updateDb(mutator) {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
}

module.exports = { readDb, updateDb };
