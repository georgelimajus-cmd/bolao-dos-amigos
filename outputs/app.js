const ENTRY_VALUE = 10;
const ADMIN_PERCENT = 0.25;
const ADMIN_PIN = "a20b30c40d@";
const PIX_KEY = "11999999999";
const MERCHANT_NAME = "BOLAO DOS AMIGOS";
const MERCHANT_CITY = "SAO PAULO";
const API_BASE = location.protocol.startsWith("http") ? "" : null;
const HAS_API = API_BASE !== null;
const SESSION_TIMEOUT_MS = 1 * 60 * 1000;
const STORAGE_KEY = "bolao-dos-amigos-state-teste-1";
const LEGACY_STORAGE_KEYS = ["bolao-dos-amigos-state"];
let appConfig = { betValue: ENTRY_VALUE, mercadoPagoEnabled: false };
let paymentPoll = null;
let sessionTimer = null;

const matches = [
  fixture(1, "Fase de grupos", "Grupo A", "Mexico", "Africa do Sul", "2026-06-11", "16:00", "Estadio Azteca, Cidade do Mexico"),
  fixture(2, "Fase de grupos", "Grupo A", "Coreia do Sul", "Tchequia", "2026-06-11", "23:00", "Estadio Akron, Zapopan"),
  fixture(3, "Fase de grupos", "Grupo B", "Canada", "Bosnia e Herzegovina", "2026-06-12", "16:00", "BMO Field, Toronto"),
  fixture(4, "Fase de grupos", "Grupo D", "Estados Unidos", "Paraguai", "2026-06-12", "22:00", "SoFi Stadium, Inglewood"),
  fixture(5, "Fase de grupos", "Grupo B", "Catar", "Suica", "2026-06-13", "16:00", "Levi's Stadium, Santa Clara"),
  fixture(6, "Fase de grupos", "Grupo C", "Brasil", "Marrocos", "2026-06-13", "19:00", "Gillette Stadium, Foxborough"),
  fixture(7, "Fase de grupos", "Grupo C", "Haiti", "Escocia", "2026-06-13", "22:00", "MetLife Stadium, East Rutherford"),
  fixture(8, "Fase de grupos", "Grupo D", "Australia", "Turquia", "2026-06-14", "01:00", "BC Place, Vancouver"),
  fixture(9, "Fase de grupos", "Grupo E", "Costa do Marfim", "Equador", "2026-06-14", "14:00", "Lincoln Financial Field, Philadelphia"),
  fixture(10, "Fase de grupos", "Grupo F", "Holanda", "Japao", "2026-06-14", "17:00", "AT&T Stadium, Arlington"),
  fixture(11, "Fase de grupos", "Grupo E", "Alemanha", "Curacao", "2026-06-14", "20:00", "NRG Stadium, Houston"),
  fixture(12, "Fase de grupos", "Grupo F", "Suecia", "Tunisia", "2026-06-14", "23:00", "Estadio BBVA, Guadalupe"),
  fixture(13, "Fase de grupos", "Grupo H", "Espanha", "Cabo Verde", "2026-06-15", "13:00", "Mercedes-Benz Stadium, Atlanta"),
  fixture(14, "Fase de grupos", "Grupo G", "Belgica", "Egito", "2026-06-15", "16:00", "Lumen Field, Seattle"),
  fixture(15, "Fase de grupos", "Grupo H", "Arabia Saudita", "Uruguai", "2026-06-15", "19:00", "Hard Rock Stadium, Miami Gardens"),
  fixture(16, "Fase de grupos", "Grupo G", "Ira", "Nova Zelandia", "2026-06-15", "22:00", "SoFi Stadium, Inglewood"),
  fixture(17, "Fase de grupos", "Grupo I", "Franca", "Senegal", "2026-06-16", "16:00", "MetLife Stadium, East Rutherford"),
  fixture(18, "Fase de grupos", "Grupo I", "Iraque", "Noruega", "2026-06-16", "19:00", "Gillette Stadium, Foxborough"),
  fixture(19, "Fase de grupos", "Grupo J", "Argentina", "Argelia", "2026-06-16", "22:00", "Arrowhead Stadium, Kansas City"),
  fixture(20, "Fase de grupos", "Grupo J", "Austria", "Jordania", "2026-06-17", "01:00", "Levi's Stadium, Santa Clara"),
  fixture(21, "Fase de grupos", "Grupo K", "Portugal", "RD Congo", "2026-06-17", "14:00", "NRG Stadium, Houston"),
  fixture(22, "Fase de grupos", "Grupo L", "Inglaterra", "Croacia", "2026-06-17", "17:00", "AT&T Stadium, Arlington"),
  fixture(23, "Fase de grupos", "Grupo L", "Gana", "Panama", "2026-06-17", "20:00", "BMO Field, Toronto"),
  fixture(24, "Fase de grupos", "Grupo K", "Uzbequistao", "Colombia", "2026-06-17", "23:00", "Estadio Azteca, Cidade do Mexico"),
  fixture(25, "Fase de grupos", "Grupo A", "Tchequia", "Africa do Sul", "2026-06-18", "13:00", "Mercedes-Benz Stadium, Atlanta"),
  fixture(26, "Fase de grupos", "Grupo B", "Suica", "Bosnia e Herzegovina", "2026-06-18", "16:00", "SoFi Stadium, Inglewood"),
  fixture(27, "Fase de grupos", "Grupo B", "Canada", "Catar", "2026-06-18", "19:00", "BC Place, Vancouver"),
  fixture(28, "Fase de grupos", "Grupo A", "Mexico", "Coreia do Sul", "2026-06-18", "22:00", "Estadio Akron, Zapopan"),
  fixture(29, "Fase de grupos", "Grupo D", "Estados Unidos", "Australia", "2026-06-19", "16:00", "Lumen Field, Seattle"),
  fixture(30, "Fase de grupos", "Grupo C", "Escocia", "Marrocos", "2026-06-19", "19:00", "Lincoln Financial Field, Philadelphia"),
  fixture(31, "Fase de grupos", "Grupo C", "Brasil", "Haiti", "2026-06-19", "22:00", "Gillette Stadium, Foxborough"),
  fixture(32, "Fase de grupos", "Grupo D", "Turquia", "Paraguai", "2026-06-20", "01:00", "Levi's Stadium, Santa Clara"),
  fixture(33, "Fase de grupos", "Grupo F", "Holanda", "Suecia", "2026-06-20", "14:00", "NRG Stadium, Houston"),
  fixture(34, "Fase de grupos", "Grupo E", "Alemanha", "Costa do Marfim", "2026-06-20", "17:00", "BMO Field, Toronto"),
  fixture(35, "Fase de grupos", "Grupo E", "Equador", "Curacao", "2026-06-20", "21:00", "Arrowhead Stadium, Kansas City"),
  fixture(36, "Fase de grupos", "Grupo F", "Tunisia", "Japao", "2026-06-21", "01:00", "Estadio BBVA, Guadalupe"),
  fixture(37, "Fase de grupos", "Grupo H", "Espanha", "Arabia Saudita", "2026-06-21", "13:00", "Mercedes-Benz Stadium, Atlanta"),
  fixture(38, "Fase de grupos", "Grupo G", "Belgica", "Ira", "2026-06-21", "16:00", "SoFi Stadium, Inglewood"),
  fixture(39, "Fase de grupos", "Grupo H", "Uruguai", "Cabo Verde", "2026-06-21", "19:00", "Hard Rock Stadium, Miami Gardens"),
  fixture(40, "Fase de grupos", "Grupo G", "Nova Zelandia", "Egito", "2026-06-21", "22:00", "BC Place, Vancouver"),
  fixture(41, "Fase de grupos", "Grupo J", "Argentina", "Austria", "2026-06-22", "14:00", "AT&T Stadium, Arlington"),
  fixture(42, "Fase de grupos", "Grupo I", "Franca", "Iraque", "2026-06-22", "18:00", "Lincoln Financial Field, Philadelphia"),
  fixture(43, "Fase de grupos", "Grupo I", "Noruega", "Senegal", "2026-06-22", "21:00", "MetLife Stadium, East Rutherford"),
  fixture(44, "Fase de grupos", "Grupo J", "Jordania", "Argelia", "2026-06-23", "00:00", "Levi's Stadium, Santa Clara"),
  fixture(45, "Fase de grupos", "Grupo K", "Portugal", "Uzbequistao", "2026-06-23", "14:00", "NRG Stadium, Houston"),
  fixture(46, "Fase de grupos", "Grupo L", "Inglaterra", "Gana", "2026-06-23", "17:00", "Gillette Stadium, Foxborough"),
  fixture(47, "Fase de grupos", "Grupo L", "Panama", "Croacia", "2026-06-23", "20:00", "BMO Field, Toronto"),
  fixture(48, "Fase de grupos", "Grupo K", "Colombia", "RD Congo", "2026-06-23", "23:00", "Estadio Akron, Zapopan"),
  fixture(49, "Fase de grupos", "Grupo B", "Suica", "Canada", "2026-06-24", "16:00", "BC Place, Vancouver"),
  fixture(50, "Fase de grupos", "Grupo B", "Bosnia e Herzegovina", "Catar", "2026-06-24", "16:00", "Lumen Field, Seattle"),
  fixture(51, "Fase de grupos", "Grupo C", "Escocia", "Brasil", "2026-06-24", "19:00", "Hard Rock Stadium, Miami Gardens"),
  fixture(52, "Fase de grupos", "Grupo C", "Marrocos", "Haiti", "2026-06-24", "19:00", "Mercedes-Benz Stadium, Atlanta"),
  fixture(53, "Fase de grupos", "Grupo A", "Tchequia", "Mexico", "2026-06-24", "22:00", "Estadio Azteca, Cidade do Mexico"),
  fixture(54, "Fase de grupos", "Grupo A", "Africa do Sul", "Coreia do Sul", "2026-06-24", "22:00", "Estadio BBVA, Guadalupe"),
  fixture(55, "Fase de grupos", "Grupo E", "Curacao", "Costa do Marfim", "2026-06-25", "17:00", "Lincoln Financial Field, Philadelphia"),
  fixture(56, "Fase de grupos", "Grupo E", "Equador", "Alemanha", "2026-06-25", "17:00", "MetLife Stadium, East Rutherford"),
  fixture(57, "Fase de grupos", "Grupo F", "Japao", "Suecia", "2026-06-25", "20:00", "AT&T Stadium, Arlington"),
  fixture(58, "Fase de grupos", "Grupo F", "Tunisia", "Holanda", "2026-06-25", "20:00", "Arrowhead Stadium, Kansas City"),
  fixture(59, "Fase de grupos", "Grupo D", "Turquia", "Estados Unidos", "2026-06-25", "23:00", "SoFi Stadium, Inglewood"),
  fixture(60, "Fase de grupos", "Grupo D", "Paraguai", "Australia", "2026-06-25", "23:00", "Levi's Stadium, Santa Clara"),
  fixture(61, "Fase de grupos", "Grupo I", "Noruega", "Franca", "2026-06-26", "16:00", "Gillette Stadium, Foxborough"),
  fixture(62, "Fase de grupos", "Grupo I", "Senegal", "Iraque", "2026-06-26", "16:00", "BMO Field, Toronto"),
  fixture(63, "Fase de grupos", "Grupo H", "Cabo Verde", "Arabia Saudita", "2026-06-26", "21:00", "NRG Stadium, Houston"),
  fixture(64, "Fase de grupos", "Grupo H", "Uruguai", "Espanha", "2026-06-26", "21:00", "Estadio Akron, Zapopan"),
  fixture(65, "Fase de grupos", "Grupo G", "Egito", "Ira", "2026-06-27", "00:00", "Lumen Field, Seattle"),
  fixture(66, "Fase de grupos", "Grupo G", "Nova Zelandia", "Belgica", "2026-06-27", "00:00", "BC Place, Vancouver"),
  fixture(67, "Fase de grupos", "Grupo L", "Panama", "Inglaterra", "2026-06-27", "18:00", "MetLife Stadium, East Rutherford"),
  fixture(68, "Fase de grupos", "Grupo L", "Croacia", "Gana", "2026-06-27", "18:00", "Lincoln Financial Field, Philadelphia"),
  fixture(69, "Fase de grupos", "Grupo K", "Colombia", "Portugal", "2026-06-27", "20:30", "Hard Rock Stadium, Miami Gardens"),
  fixture(70, "Fase de grupos", "Grupo K", "RD Congo", "Uzbequistao", "2026-06-27", "20:30", "Mercedes-Benz Stadium, Atlanta"),
  fixture(71, "Fase de grupos", "Grupo J", "Argelia", "Austria", "2026-06-27", "23:00", "Arrowhead Stadium, Kansas City"),
  fixture(72, "Fase de grupos", "Grupo J", "Jordania", "Argentina", "2026-06-27", "23:00", "AT&T Stadium, Arlington"),
  fixture(73, "32 avos", "32 avos", "2o Grupo A", "2o Grupo B", "2026-06-28", null, "SoFi Stadium, Inglewood"),
  fixture(74, "32 avos", "32 avos", "1o Grupo E", "3o Grupo A/B/C/D/F", "2026-06-29", null, "Gillette Stadium, Foxborough"),
  fixture(75, "32 avos", "32 avos", "1o Grupo F", "2o Grupo C", "2026-06-29", null, "Estadio BBVA, Guadalupe"),
  fixture(76, "32 avos", "32 avos", "1o Grupo C", "2o Grupo F", "2026-06-29", null, "NRG Stadium, Houston"),
  fixture(77, "32 avos", "32 avos", "1o Grupo I", "3o Grupo C/D/F/G/H", "2026-06-30", null, "MetLife Stadium, East Rutherford"),
  fixture(78, "32 avos", "32 avos", "2o Grupo E", "2o Grupo I", "2026-06-30", null, "AT&T Stadium, Arlington"),
  fixture(79, "32 avos", "32 avos", "1o Grupo A", "3o Grupo C/E/F/H/I", "2026-06-30", null, "Estadio Azteca, Cidade do Mexico"),
  fixture(80, "32 avos", "32 avos", "1o Grupo L", "3o Grupo E/H/I/J/K", "2026-07-01", null, "Mercedes-Benz Stadium, Atlanta"),
  fixture(81, "32 avos", "32 avos", "1o Grupo D", "3o Grupo B/E/F/I/J", "2026-07-01", null, "Levi's Stadium, Santa Clara"),
  fixture(82, "32 avos", "32 avos", "1o Grupo G", "3o Grupo A/E/H/I/J", "2026-07-01", null, "Lumen Field, Seattle"),
  fixture(83, "32 avos", "32 avos", "2o Grupo K", "2o Grupo L", "2026-07-02", null, "BMO Field, Toronto"),
  fixture(84, "32 avos", "32 avos", "1o Grupo H", "2o Grupo J", "2026-07-02", null, "SoFi Stadium, Inglewood"),
  fixture(85, "32 avos", "32 avos", "1o Grupo B", "3o Grupo E/F/G/I/J", "2026-07-02", null, "BC Place, Vancouver"),
  fixture(86, "32 avos", "32 avos", "1o Grupo J", "2o Grupo H", "2026-07-03", null, "Hard Rock Stadium, Miami Gardens"),
  fixture(87, "32 avos", "32 avos", "1o Grupo K", "3o Grupo D/E/I/J/L", "2026-07-03", null, "Arrowhead Stadium, Kansas City"),
  fixture(88, "32 avos", "32 avos", "2o Grupo D", "2o Grupo G", "2026-07-03", null, "AT&T Stadium, Arlington"),
  fixture(89, "Oitavas", "Oitavas", "Vencedor jogo 74", "Vencedor jogo 77", "2026-07-04", null, "Lincoln Financial Field, Philadelphia"),
  fixture(90, "Oitavas", "Oitavas", "Vencedor jogo 73", "Vencedor jogo 75", "2026-07-04", null, "NRG Stadium, Houston"),
  fixture(91, "Oitavas", "Oitavas", "Vencedor jogo 76", "Vencedor jogo 78", "2026-07-05", null, "MetLife Stadium, East Rutherford"),
  fixture(92, "Oitavas", "Oitavas", "Vencedor jogo 79", "Vencedor jogo 80", "2026-07-05", null, "Estadio Azteca, Cidade do Mexico"),
  fixture(93, "Oitavas", "Oitavas", "Vencedor jogo 83", "Vencedor jogo 84", "2026-07-06", null, "AT&T Stadium, Arlington"),
  fixture(94, "Oitavas", "Oitavas", "Vencedor jogo 81", "Vencedor jogo 82", "2026-07-06", null, "Lumen Field, Seattle"),
  fixture(95, "Oitavas", "Oitavas", "Vencedor jogo 86", "Vencedor jogo 88", "2026-07-07", null, "Mercedes-Benz Stadium, Atlanta"),
  fixture(96, "Oitavas", "Oitavas", "Vencedor jogo 85", "Vencedor jogo 87", "2026-07-07", null, "BC Place, Vancouver"),
  fixture(97, "Quartas", "Quartas", "Vencedor jogo 89", "Vencedor jogo 90", "2026-07-09", null, "Gillette Stadium, Foxborough"),
  fixture(98, "Quartas", "Quartas", "Vencedor jogo 93", "Vencedor jogo 94", "2026-07-10", null, "SoFi Stadium, Inglewood"),
  fixture(99, "Quartas", "Quartas", "Vencedor jogo 91", "Vencedor jogo 92", "2026-07-11", null, "Hard Rock Stadium, Miami Gardens"),
  fixture(100, "Quartas", "Quartas", "Vencedor jogo 95", "Vencedor jogo 96", "2026-07-11", null, "Arrowhead Stadium, Kansas City"),
  fixture(101, "Semifinais", "Semifinais", "Vencedor jogo 97", "Vencedor jogo 98", "2026-07-14", null, "AT&T Stadium, Arlington"),
  fixture(102, "Semifinais", "Semifinais", "Vencedor jogo 99", "Vencedor jogo 100", "2026-07-15", null, "Mercedes-Benz Stadium, Atlanta"),
  fixture(103, "3o lugar", "3o lugar", "Perdedor jogo 101", "Perdedor jogo 102", "2026-07-18", null, "Hard Rock Stadium, Miami Gardens"),
  fixture(104, "Final", "Final", "Vencedor jogo 101", "Vencedor jogo 102", "2026-07-19", null, "MetLife Stadium, East Rutherford")
];

const brazilMatches = matches.filter((match) => match.home === "Brasil" || match.away === "Brasil");

function fixture(number, stage, group, home, away, date, time, venue) {
  return {
    id: `j${String(number).padStart(3, "0")}`,
    number,
    stage,
    group,
    home,
    away,
    venue,
    displayTime: time || "Horario a confirmar",
    startsAt: `${date}T${time || "12:00"}:00-03:00`
  };
}

const state = loadState();

const els = {
  signupForm: document.querySelector("#signupForm"),
  signupButton: document.querySelector("#signupButton"),
  name: document.querySelector("#name"),
  phone: document.querySelector("#phone"),
  cpf: document.querySelector("#cpf"),
  userStatus: document.querySelector("#userStatus"),
  signupSummary: document.querySelector("#signupSummary"),
  newParticipantButton: document.querySelector("#newParticipantButton"),
  netPrize: document.querySelector("#netPrize"),
  screenButtons: document.querySelectorAll("[data-screen-target]"),
  betPanel: document.querySelector("#apostas"),
  betForm: document.querySelector("#betForm"),
  gameSelect: document.querySelector("#gameSelect"),
  singleMatch: document.querySelector("#singleMatch"),
  confirmBet: document.querySelector("#confirmBet"),
  betStatus: document.querySelector("#betStatus"),
  paymentPanel: document.querySelector("#pagamento"),
  paymentMatch: document.querySelector("#paymentMatch"),
  paymentStatus: document.querySelector("#paymentStatus"),
  orderId: document.querySelector("#orderId"),
  pixCode: document.querySelector("#pixCode"),
  qrImage: document.querySelector("#qrImage"),
  qrFallback: document.querySelector("#qrFallback"),
  copyPix: document.querySelector("#copyPix"),
  simulatePayment: document.querySelector("#simulatePayment"),
  ticketUrl: document.querySelector("#ticketUrl"),
  confirmationPanel: document.querySelector("#confirmacao"),
  successMessage: document.querySelector("#successMessage"),
  newBetButton: document.querySelector("#newBetButton"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminPin: document.querySelector("#adminPin"),
  adminStatus: document.querySelector("#adminStatus"),
  adminDashboard: document.querySelector("#adminDashboard"),
  adminRefresh: document.querySelector("#adminRefresh"),
  adminBackup: document.querySelector("#adminBackup"),
  adminRestore: document.querySelector("#adminRestore"),
  adminRestoreFile: document.querySelector("#adminRestoreFile"),
  adminLogout: document.querySelector("#adminLogout"),
  adminUsers: document.querySelector("#adminUsers"),
  adminGames: document.querySelector("#adminGames"),
  adminBets: document.querySelector("#adminBets"),
  adminResults: document.querySelector("#adminResults"),
  resultsForm: document.querySelector("#resultsForm"),
  resultsName: document.querySelector("#resultsName"),
  resultsCpf: document.querySelector("#resultsCpf"),
  resultsBox: document.querySelector("#resultsBox")
};

init();

async function init() {
  normalizeState();
  await loadServerConfig();
  hydrateUser();
  bindEvents();
  populateGames();
  renderAll();
  showScreen("inicio");
  scheduleSessionLogout();
}

async function loadServerConfig() {
  if (!HAS_API) return;
  try {
    appConfig = await apiGet("/api/config");
  } catch {
    appConfig = { betValue: ENTRY_VALUE, mercadoPagoEnabled: false };
  }
}

function bindEvents() {
  els.phone.addEventListener("input", () => {
    els.phone.value = maskPhone(els.phone.value);
  });

  els.cpf.addEventListener("input", () => {
    els.cpf.value = maskCpf(els.cpf.value);
  });

  els.screenButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.dataset.screenTarget;
      if (target === "inicio" || target === "cadastro" || target === "resultados" || target === "regras" || target === "admin") {
        showScreen(target);
        return;
      }
      if ((target === "pagamento" || target === "apostas") && !state.user) {
        showScreen("cadastro");
        return;
      }
      if (target === "pagamento") {
        try {
          await ensurePaymentForCurrentMatch();
          renderAll();
        } catch (error) {
          els.userStatus.textContent = error.message;
          showScreen("cadastro");
          return;
        }
      }
      if (target === "apostas") {
        const bet = pendingBet();
        if (!bet?.paid) {
          showScreen("pagamento");
          return;
        }
      }
      showScreen(target);
    });
  });

  els.signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = {
      name: els.name.value.trim(),
      phone: els.phone.value.trim(),
      cpf: els.cpf.value.trim()
    };

    if (!isValidCpf(user.cpf)) {
      els.userStatus.textContent = "Confira o CPF informado antes de continuar.";
      return;
    }
    if (!isValidPhone(user.phone)) {
      els.userStatus.textContent = "Informe um nÃºmero de celular vÃ¡lido com DDD.";
      return;
    }
    if (normalizeText(user.name).split(" ").length < 2) {
      els.userStatus.textContent = "Informe o nome completo do participante.";
      return;
    }

    try {
      state.user = HAS_API ? (await apiPost("/api/usuarios", user)).user : user;
    } catch (error) {
      els.userStatus.textContent = error.message;
      return;
    }
    state.currentMatchId = state.currentMatchId || firstAvailableMatchId();
    state.sessionExpiresAt = null;
    saveState();
    await ensurePaymentForCurrentMatch();
    hydrateUser();
    renderAll();
    scheduleSessionLogout();
    showScreen("pagamento");
  });

  els.betForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const match = currentMatch();
    if (!match || !canBet(match)) return;
    const existingBet = state.bets[match.id];
    if (!existingBet?.paid) {
      els.betStatus.textContent = "O palpite serÃ¡ liberado somente apÃ³s confirmaÃ§Ã£o do pagamento.";
      return;
    }

    const homeInput = document.querySelector("#betHomeScore");
    const awayInput = document.querySelector("#betAwayScore");
    const homeRaw = homeInput.value.trim();
    const awayRaw = awayInput.value.trim();
    if (homeRaw === "" || awayRaw === "") {
      els.betStatus.textContent = "Digite o palpite completo para finalizar a aposta.";
      if (homeRaw === "") homeInput.focus();
      else awayInput.focus();
      return;
    }
    const home = Number(homeRaw);
    const away = Number(awayRaw);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
      els.betStatus.textContent = "Informe um placar vÃ¡lido para finalizar a aposta.";
      return;
    }
    try {
      if (HAS_API) {
        const result = await apiPost(`/api/apostas/${existingBet.id}/palpite`, {
          homeScore: home,
          awayScore: away
        });
        state.bets[match.id] = normalizeApiBet(result.bet);
      } else {
        state.bets[match.id] = {
          ...existingBet,
          home,
          away,
          guessAt: new Date().toISOString()
        };
      }
      state.lastConfirmedMatchId = match.id;
      state.sessionExpiresAt = Date.now() + SESSION_TIMEOUT_MS;
      saveState();
      renderAll();
      showScreen("confirmacao");
    } catch (error) {
      els.betStatus.textContent = error.message;
    }
  });

  els.copyPix.addEventListener("click", async () => {
    const bet = pendingBet();
    if (!bet?.pix) return;
    try {
      await navigator.clipboard.writeText(bet.pix);
      els.copyPix.textContent = "PIX copiado";
      setTimeout(() => (els.copyPix.textContent = "Copiar PIX"), 1800);
    } catch {
      els.pixCode.select();
      document.execCommand("copy");
    }
  });

  els.simulatePayment.addEventListener("click", async () => {
    const bet = pendingBet();
    if (!bet) return;
    if (HAS_API) {
      try {
        const result = await apiPost(`/api/apostas/${bet.id}/simular-pagamento`, {});
        Object.assign(bet, normalizeApiBet(result.bet));
      } catch (error) {
        els.paymentStatus.textContent = error.message;
        return;
      }
    } else {
      bet.paid = true;
      bet.paidAt = new Date().toISOString();
    }
    state.lastConfirmedMatchId = bet.matchId;
    state.pendingMatchId = null;
    state.sessionExpiresAt = null;
    saveState();
    renderAll();
    showScreen("apostas");
  });

  els.newBetButton.addEventListener("click", () => {
    logoutParticipant();
  });

  els.adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (els.adminPin.value === ADMIN_PIN) {
      state.adminUnlocked = true;
      els.adminPin.value = "";
      saveState();
      renderAdmin();
      return;
    }
    els.adminStatus.textContent = "PIN incorreto. Acesso restrito ao administrador.";
  });

  els.adminRefresh.addEventListener("click", renderAdminData);
  els.adminBackup.addEventListener("click", downloadAdminBackup);
  els.adminRestore.addEventListener("click", () => els.adminRestoreFile.click());
  els.adminRestoreFile.addEventListener("change", restoreAdminBackup);
  els.adminUsers.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-user]");
    if (!button) return;
    await deleteAdminUser(button.dataset.deleteUser);
  });
  els.adminBets.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-save-admin-bet]");
    if (!button) return;
    await saveAdminBetGuess(button.dataset.saveAdminBet);
  });

  els.adminLogout.addEventListener("click", () => {
    state.adminUnlocked = false;
    saveState();
    renderAdmin();
  });

  els.resultsCpf.addEventListener("input", () => {
    els.resultsCpf.value = maskCpf(els.resultsCpf.value);
  });

  els.resultsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await renderParticipantResults();
  });

  els.newParticipantButton.addEventListener("click", startNewParticipant);
}

function renderAll() {
  renderStats();
  renderCadastroStep();
  renderBetStep();
  renderPaymentStep();
  renderConfirmationStep();
  renderAdmin();
}

function hydrateUser() {
  if (!state.user) return;
  els.name.value = state.user.name;
  els.phone.value = state.user.phone;
  els.cpf.value = state.user.cpf;
}

function renderCadastroStep() {
  const hasUser = Boolean(state.user);
  els.betPanel.classList.toggle("is-hidden", !hasUser);
  els.name.disabled = hasUser;
  els.phone.disabled = hasUser;
  els.cpf.disabled = hasUser;
  els.signupButton.textContent = hasUser ? "Cadastro jÃ¡ realizado" : "Continuar para aposta";
  els.signupButton.disabled = hasUser;
  els.userStatus.textContent = hasUser
    ? `Cadastro salvo para ${state.user.name}. VocÃª pode usar este cadastro para apostar em outros jogos.`
    : "FaÃ§a seu cadastro uma Ãºnica vez para apostar nos jogos do Brasil.";
  renderSignupSummary();
}

function renderSignupSummary() {
  if (!state.user) {
    els.signupSummary.classList.add("is-hidden");
    els.signupSummary.innerHTML = "";
    els.newParticipantButton.classList.add("is-hidden");
    return;
  }

  const bets = Object.values(state.bets);
  const rows = bets.length
    ? bets.map((bet) => {
        const match = brazilMatches.find((item) => item.id === bet.matchId);
        const hasGuess = bet.home !== null && bet.home !== undefined && bet.away !== null && bet.away !== undefined;
        return `
          <div class="admin-row">
            <strong>${match ? `${escapeHtml(match.home)} x ${escapeHtml(match.away)}` : "Jogo do Brasil"}</strong>
            <span>Status: ${bet.paid ? "Pagamento confirmado" : "Aguardando pagamento"}</span>
            <span>Palpite: ${hasGuess ? `${bet.home} x ${bet.away}` : "ainda nÃ£o informado"}</span>
            <span>Data: ${formatDateTime(bet.guessAt || bet.paidAt || bet.createdAt)}</span>
          </div>
        `;
      }).join("")
    : `<p class="empty">Nenhuma aposta registrada para este cadastro.</p>`;

  els.signupSummary.classList.remove("is-hidden");
  els.signupSummary.innerHTML = `
    <div class="admin-row">
      <strong>Resumo da aposta</strong>
      <span>Participante: ${escapeHtml(state.user.name)}</span>
      <span>CPF: ${escapeHtml(state.user.cpf)}</span>
    </div>
    ${rows}
  `;
  els.newParticipantButton.classList.remove("is-hidden");
}

function renderStats() {
  if (HAS_API) {
    apiGet("/api/resumo")
      .then((data) => {
        els.netPrize.textContent = money(data.netTotal || 0);
      })
      .catch(() => {
        els.netPrize.textContent = money(0);
      });
    return;
  }
  const netTotal = Object.values(state.bets).filter((bet) => bet.paid).length * ENTRY_VALUE * (1 - ADMIN_PERCENT);
  els.netPrize.textContent = money(netTotal);
}

function populateGames() {
  if (!state.currentMatchId) state.currentMatchId = firstAvailableMatchId() || brazilMatches[0]?.id || null;
}

function renderBetStep() {
  if (!state.user) return;
  const match = currentMatch();
  if (!match) {
    els.singleMatch.innerHTML = `<p class="empty">Nenhum jogo do Brasil disponÃ­vel.</p>`;
    els.confirmBet.disabled = true;
    return;
  }

  const bet = state.bets[match.id];
  const paid = Boolean(bet?.paid);
  const hasGuess = bet?.home !== null && bet?.home !== undefined && bet?.away !== null && bet?.away !== undefined;
  const locked = !canBet(match);
  els.confirmBet.disabled = !paid || hasGuess || locked;
  els.confirmBet.textContent = hasGuess ? "Palpite jÃ¡ salvo neste jogo" : "Salvar palpite";
  els.betStatus.textContent = !paid
    ? "O palpite serÃ¡ liberado somente apÃ³s confirmaÃ§Ã£o do pagamento."
    : hasGuess
      ? "Palpite salvo. Boa sorte no BolÃ£o dos Amigos!"
      : "Pagamento confirmado. Informe seu placar para este jogo.";

  els.singleMatch.innerHTML = `
    <article class="match-card single-card">
      <div class="match-meta">
        <span>Jogo ${match.number} - ${formatDate(match)}</span>
        <span class="badge">${match.group}</span>
      </div>
      <div class="teams">
        <label class="team-row">
          <span>${match.home}</span>
          <input id="betHomeScore" type="number" min="0" inputmode="numeric" value="${bet?.home ?? ""}" ${!paid || hasGuess || locked ? "disabled" : ""} required>
        </label>
        <label class="team-row">
          <span>${match.away}</span>
          <input id="betAwayScore" type="number" min="0" inputmode="numeric" value="${bet?.away ?? ""}" ${!paid || hasGuess || locked ? "disabled" : ""} required>
        </label>
      </div>
      <div class="match-pool">
        <span>${match.venue}</span>
        <span class="badge">${paid ? "Pago" : locked ? "Fechado" : "Aberto"}</span>
      </div>
    </article>
  `;
}

function renderPaymentStep() {
  const bet = pendingBet();
  renderPaymentMatch();
  els.paymentPanel.classList.toggle("is-hidden", !bet);
  if (!bet) {
    els.paymentStatus.textContent = "Aguardando aposta";
    els.orderId.textContent = "-";
    els.pixCode.value = "";
    els.copyPix.disabled = true;
    els.simulatePayment.disabled = true;
    els.ticketUrl.classList.add("is-hidden");
    els.ticketUrl.removeAttribute("href");
    drawEmptyQr();
    return;
  }

  els.paymentStatus.textContent = bet.paid ? "Pagamento confirmado" : "Aguardando pagamento";
  els.orderId.textContent = bet.orderId;
  els.pixCode.value = bet.pix;
  els.copyPix.disabled = !bet.pix;
  els.simulatePayment.classList.toggle("is-hidden", Boolean(appConfig.mercadoPagoEnabled));
  els.simulatePayment.disabled = bet.paid || Boolean(appConfig.mercadoPagoEnabled);
  els.simulatePayment.textContent = HAS_API ? "Simular pagamento" : "Confirmar pagamento";
  els.ticketUrl.classList.toggle("is-hidden", !bet.ticketUrl);
  if (bet.ticketUrl) els.ticketUrl.href = bet.ticketUrl;
  if (HAS_API && !bet.paid) startPaymentPolling(bet);
  if (!bet.pix) {
    els.pixCode.placeholder = "PIX simulado. Para gerar um QR Code pagÃ¡vel, ative o Mercado Pago no Render ou configure PIX_KEY no ambiente local.";
    drawQrHelp("PIX simulado", "Use o Render com Mercado Pago ativo");
  } else if (bet.qrCodeBase64) {
    els.qrFallback.style.display = "none";
    els.qrImage.style.display = "block";
    els.qrImage.src = `data:image/png;base64,${bet.qrCodeBase64}`;
  } else {
    els.pixCode.placeholder = "O cÃ³digo PIX aparecerÃ¡ aqui.";
    renderQr(bet.pix);
  }
}

function renderPaymentMatch() {
  const match = currentMatch();
  if (!match) {
    els.paymentMatch.innerHTML = `<p class="empty">Nenhum jogo do Brasil disponÃ­vel.</p>`;
    return;
  }
  const bet = state.bets[match.id];
  els.paymentMatch.innerHTML = `
    <article class="match-card single-card">
      <div class="match-meta">
        <span>Jogo atual do Brasil</span>
        <span class="badge">${bet?.paid ? "Pagamento confirmado" : "Aguardando pagamento"}</span>
      </div>
      <div class="teams">
        <div class="team-row"><span>${match.home}</span><strong>${match.displayTime} BRT</strong></div>
        <div class="team-row"><span>${match.away}</span><strong>${match.group}</strong></div>
      </div>
      <div class="match-pool">
        <span>${formatDate(match)}</span>
        <span>${match.venue}</span>
      </div>
    </article>
  `;
}

function renderConfirmationStep() {
  const matchId = state.lastConfirmedMatchId;
  const bet = matchId ? state.bets[matchId] : null;
  els.confirmationPanel.classList.toggle("is-hidden", !bet?.paid);
  if (!bet?.paid) return;
  const match = brazilMatches.find((item) => item.id === bet.matchId);
  els.successMessage.innerHTML = `
    <strong>Aposta confirmada com sucesso!</strong>
    <p>${state.user.name}, sua aposta em <strong>${match.home} ${bet.home} x ${bet.away} ${match.away}</strong> foi registrada e paga.</p>
    <p>Boa sorte no BolÃ£o dos Amigos!</p>
  `;
}

function renderAdmin() {
  const unlocked = Boolean(state.adminUnlocked);
  els.adminLoginForm.classList.toggle("is-hidden", unlocked);
  els.adminDashboard.classList.toggle("is-hidden", !unlocked);
  els.adminStatus.textContent = unlocked
    ? "Acesso liberado. Dados carregados do armazenamento local deste protÃ³tipo."
    : "Somente o administrador visualiza jogos, cadastro e apostas feitas.";
  if (unlocked) renderAdminData();
}

function renderAdminData() {
  if (HAS_API) {
    renderAdminDataFromApi();
    return;
  }
  renderAdminUsers();
  renderAdminGames();
  renderAdminBets();
  els.adminResults.innerHTML = `<p class="empty">Resultados, ganhadores e rateio aparecerÃ£o aqui quando houver apostas e placares finalizados.</p>`;
}

function renderAdminUsers() {
  if (!state.user) {
    els.adminUsers.innerHTML = `<p class="empty">Nenhum cadastro realizado ainda.</p>`;
    return;
  }
  els.adminUsers.innerHTML = `
    <dl class="admin-list">
      <div><dt>Nome</dt><dd>${escapeHtml(state.user.name)}</dd></div>
      <div><dt>Celular</dt><dd>${escapeHtml(state.user.phone)}</dd></div>
      <div><dt>CPF</dt><dd>${escapeHtml(state.user.cpf)}</dd></div>
    </dl>
    <button type="button" class="danger" data-delete-user="local">Excluir cadastro</button>
  `;
}

function renderAdminGames() {
  els.adminGames.innerHTML = brazilMatches
    .map((match) => {
      const bet = state.bets[match.id];
      return `
        <div class="admin-row">
          <strong>Jogo ${match.number}: ${match.home} x ${match.away}</strong>
          <span>${formatDate(match)}</span>
          <span>${match.venue}</span>
          <span class="badge">${bet?.paid ? "Aposta paga" : bet ? "PIX gerado" : "Sem aposta"}</span>
        </div>
      `;
    })
    .join("");
}

function renderAdminBets() {
  const bets = Object.values(state.bets);
  if (!bets.length) {
    els.adminBets.innerHTML = `<p class="empty">Nenhuma aposta feita ainda.</p>`;
    return;
  }
  els.adminBets.innerHTML = bets
    .map((bet) => {
      const match = brazilMatches.find((item) => item.id === bet.matchId);
      return `
        <div class="admin-row">
          <strong>${match.home} ${bet.home} x ${bet.away} ${match.away}</strong>
          <span>Participante: ${state.user ? escapeHtml(state.user.name) : "-"}</span>
          <span>Pedido: ${escapeHtml(bet.orderId)}</span>
          <span class="badge">${bet.paid ? "Pago" : "Aguardando pagamento"}</span>
        </div>
      `;
    })
    .join("");
}

async function ensurePaymentForCurrentMatch() {
  const match = currentMatch();
  if (!state.user || !match) return null;
  const existingBet = state.bets[match.id];
  if (existingBet) {
    state.pendingMatchId = existingBet.paid ? null : match.id;
    return existingBet;
  }

  if (HAS_API) {
    const result = await apiPost("/api/apostas", {
      userId: state.user.id,
      matchId: match.id
    });
    state.bets[match.id] = normalizeApiBet(result.bet);
  } else {
    const orderId = makeOrderId(match.id);
    state.bets[match.id] = {
      matchId: match.id,
      home: null,
      away: null,
      orderId,
      pix: buildPixPayload(orderId, ENTRY_VALUE),
      paid: false,
      createdAt: new Date().toISOString()
    };
  }
  state.pendingMatchId = match.id;
  saveState();
  return state.bets[match.id];
}

async function renderAdminDataFromApi() {
  try {
    const data = await apiGet(`/api/admin?pin=${encodeURIComponent(ADMIN_PIN)}`);
    els.adminUsers.innerHTML = data.users.length
      ? data.users.map((user) => `
          <dl class="admin-list">
            <div><dt>Nome</dt><dd>${escapeHtml(user.name)}</dd></div>
            <div><dt>Celular</dt><dd>${escapeHtml(user.phone)}</dd></div>
            <div><dt>CPF</dt><dd>${escapeHtml(user.cpf)}</dd></div>
          </dl>
          <button type="button" class="danger" data-delete-user="${escapeHtml(user.id)}">Excluir cadastro</button>
        `).join("")
      : `<p class="empty">Nenhum cadastro realizado ainda.</p>`;

    els.adminGames.innerHTML = data.games.map((match) => {
      const bet = data.bets.find((item) => item.matchId === match.id);
      return `
        <div class="admin-row">
          <strong>Jogo ${match.number}: ${match.home} x ${match.away}</strong>
          <span>${formatDate(match)}</span>
          <span>${match.venue}</span>
          <span class="badge">${bet?.status === "paga" ? "Aposta paga" : bet ? "PIX gerado" : "Sem aposta"}</span>
        </div>
      `;
    }).join("");

    els.adminBets.innerHTML = data.bets.length
      ? data.bets.map((bet) => {
          const match = data.games.find((item) => item.id === bet.matchId);
          const user = data.users.find((item) => item.id === bet.userId);
          return `
            <div class="admin-row">
              <strong>${match.home} ${bet.homeScore} x ${bet.awayScore} ${match.away}</strong>
              <span>Participante: ${user ? escapeHtml(user.name) : "-"}</span>
              <span>Pedido: ${escapeHtml(bet.id)}</span>
              <span class="badge">${bet.status === "paga" ? "Pago" : "Aguardando pagamento"}</span>
              <div class="admin-bet-edit" data-admin-bet-form="${escapeHtml(bet.id)}">
                <label>
                  Brasil
                  <input type="number" min="0" step="1" inputmode="numeric" data-admin-home-score value="${Number.isInteger(bet.homeScore) ? bet.homeScore : ""}" aria-label="Placar do Brasil">
                </label>
                <label>
                  ${escapeHtml(match.away)}
                  <input type="number" min="0" step="1" inputmode="numeric" data-admin-away-score value="${Number.isInteger(bet.awayScore) ? bet.awayScore : ""}" aria-label="Placar do adversÃ¡rio">
                </label>
                <button type="button" data-save-admin-bet="${escapeHtml(bet.id)}">Salvar palpite</button>
              </div>
            </div>
          `;
        }).join("")
      : `<p class="empty">Nenhuma aposta feita ainda.</p>`;

    els.adminResults.innerHTML = data.settlements.map((settlement) => {
      const match = data.games.find((item) => item.id === settlement.matchId);
      const resultText = settlement.status === "finalizado"
        ? `${match.home} ${settlement.result.homeScore} x ${settlement.result.awayScore} ${match.away}`
        : "Aguardando o jogo";
      const winners = settlement.winners.length
        ? settlement.winners.map((winner) => `
            <div class="admin-row">
              <strong>${escapeHtml(winner.name)}</strong>
              <span>CPF: ${escapeHtml(winner.cpf)}</span>
              <span>Valor a receber: ${money(settlement.prizePerWinner)}</span>
            </div>
          `).join("")
        : `<p class="empty">${settlement.status === "finalizado" ? "NinguÃ©m acertou." : "Sem ganhadores enquanto o jogo nÃ£o terminar."}</p>`;
      return `
        <div class="admin-row">
          <strong>${match.home} x ${match.away}</strong>
          <span>Resultado: ${resultText}</span>
          <span>Total lÃ­quido: ${money(settlement.netPot)}</span>
          <span>${settlement.message}</span>
        </div>
        ${winners}
      `;
    }).join("");
  } catch (error) {
    els.adminStatus.textContent = error.message;
    state.adminUnlocked = false;
    saveState();
    els.adminLoginForm.classList.remove("is-hidden");
    els.adminDashboard.classList.add("is-hidden");
    els.adminUsers.innerHTML = "";
    els.adminGames.innerHTML = "";
    els.adminBets.innerHTML = "";
    els.adminResults.innerHTML = "";
  }
}

async function deleteAdminUser(userId) {
  const confirmed = window.confirm("Excluir este cadastro e todas as apostas vinculadas?");
  if (!confirmed) return;

  try {
    if (HAS_API && userId !== "local") {
      await apiDelete(`/api/admin/usuarios/${encodeURIComponent(userId)}?pin=${encodeURIComponent(ADMIN_PIN)}`);
    } else {
      state.user = null;
      state.bets = {};
      state.pendingMatchId = null;
      state.lastConfirmedMatchId = null;
      state.sessionExpiresAt = null;
      saveState();
    }
    if (state.user?.id === userId || userId === "local") logoutParticipant();
    await renderAdminData();
    renderAll();
    els.adminStatus.textContent = "Cadastro excluÃ­do com sucesso.";
  } catch (error) {
    els.adminStatus.textContent = error.message;
  }
}

async function saveAdminBetGuess(betId) {
  const form = els.adminBets.querySelector(`[data-admin-bet-form="${cssEscape(betId)}"]`);
  const homeInput = form?.querySelector("[data-admin-home-score]");
  const awayInput = form?.querySelector("[data-admin-away-score]");
  const homeRaw = homeInput?.value.trim() || "";
  const awayRaw = awayInput?.value.trim() || "";
  const homeScore = Number(homeRaw);
  const awayScore = Number(awayRaw);

  if (homeRaw === "" || awayRaw === "" || !Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    els.adminStatus.textContent = "Informe o placar completo para alterar o palpite.";
    if (homeRaw === "") homeInput?.focus();
    else if (awayRaw === "") awayInput?.focus();
    return;
  }

  try {
    await saveAdminGuessRequest(betId, homeScore, awayScore);
    els.adminStatus.textContent = "Palpite alterado com sucesso.";
    await renderAdminData();
    const saved = await findAdminBet(betId);
    if (!saved || saved.homeScore !== homeScore || saved.awayScore !== awayScore) {
      els.adminStatus.textContent = "O servidor respondeu, mas o placar nao ficou salvo. Atualize o server/index.js no Render e faca novo deploy.";
    }
  } catch (error) {
    els.adminStatus.textContent = error.message;
  }
}

async function saveAdminGuessRequest(betId, homeScore, awayScore) {
  const payload = { pin: ADMIN_PIN, homeScore, awayScore };
  try {
    return await apiPost(`/api/admin/apostas/${encodeURIComponent(betId)}/palpite`, payload);
  } catch (error) {
    const fallbackErrors = ["404", "Aposta nao encontrada", "Aposta não encontrada", "Cannot POST", "Not found"];
    if (!fallbackErrors.some((text) => error.message.includes(text))) throw error;
    try {
      return await apiPost("/api/admin/alterar-palpite", { ...payload, betId });
    } catch (fallbackError) {
      if (!fallbackErrors.some((text) => fallbackError.message.includes(text))) throw fallbackError;
      return saveAdminGuessViaBackup(betId, homeScore, awayScore);
    }
  }
}

async function saveAdminGuessViaBackup(betId, homeScore, awayScore) {
  const backup = await apiGet(`/api/admin/backup?pin=${encodeURIComponent(ADMIN_PIN)}`);
  const data = backup.data || backup;
  const bet = data.bets?.find((item) => item.id === betId);
  if (!bet) throw new Error("Aposta nao encontrada no backup do servidor.");
  if (bet.status !== "paga") throw new Error("Somente apostas pagas podem ter palpite alterado.");
  bet.homeScore = homeScore;
  bet.awayScore = awayScore;
  bet.guessAt = bet.guessAt || new Date().toISOString();
  bet.updatedByAdminAt = new Date().toISOString();
  return apiPost("/api/admin/restaurar", {
    pin: ADMIN_PIN,
    data
  });
}

async function findAdminBet(betId) {
  const data = await apiGet(`/api/admin?pin=${encodeURIComponent(ADMIN_PIN)}`);
  return data.bets.find((bet) => bet.id === betId);
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}
async function downloadAdminBackup() {
  try {
    if (!HAS_API) {
      const localBackup = {
        exportedAt: new Date().toISOString(),
        data: {
          users: state.user ? [state.user] : [],
          bets: Object.values(state.bets),
          payments: [],
          results: {}
        }
      };
      downloadJson(localBackup, `backup-bolao-${Date.now()}.json`);
      return;
    }
    const backup = await apiGet(`/api/admin/backup?pin=${encodeURIComponent(ADMIN_PIN)}`);
    downloadJson(backup, `backup-bolao-${Date.now()}.json`);
  } catch (error) {
    els.adminStatus.textContent = error.message;
  }
}

async function restoreAdminBackup() {
  const file = els.adminRestoreFile.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    if (!HAS_API) {
      throw new Error("ImportaÃ§Ã£o de backup exige o backend ativo.");
    }
    const result = await apiPost("/api/admin/restaurar", {
      pin: ADMIN_PIN,
      ...backup
    });
    els.adminStatus.textContent = `Backup importado. Cadastros: ${result.totals.users}. Apostas: ${result.totals.bets}.`;
    await renderAdminData();
  } catch (error) {
    els.adminStatus.textContent = `Erro ao importar backup: ${error.message}`;
  } finally {
    els.adminRestoreFile.value = "";
  }
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeApiBet(bet) {
  return {
    id: bet.id,
    matchId: bet.matchId,
    home: bet.homeScore,
    away: bet.awayScore,
    orderId: bet.providerPaymentId || bet.id,
    pix: bet.qrCode || "",
    qrCodeBase64: bet.qrCodeBase64 || "",
    ticketUrl: bet.ticketUrl || "",
    provider: bet.provider || "",
    paid: bet.status === "paga",
    paidAt: bet.paidAt,
    createdAt: bet.createdAt,
    guessAt: bet.guessAt
  };
}

async function apiGet(path) {
  const response = await fetch(path);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro na API.");
  return data;
}

async function apiPost(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro na API.");
  return data;
}

async function apiDelete(path) {
  const response = await fetch(path, { method: "DELETE" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro na API.");
  return data;
}

function currentMatch() {
  return brazilMatches.find((match) => match.id === state.currentMatchId);
}

function pendingBet() {
  if (state.pendingMatchId && state.bets[state.pendingMatchId]) return state.bets[state.pendingMatchId];
  const match = currentMatch();
  return match ? state.bets[match.id] : null;
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active-screen", screen.id === screenId);
  });
  els.screenButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.screenTarget === screenId);
  });
  requestAnimationFrame(() => alignActiveScreen(screenId));
}

function alignActiveScreen(screenId) {
  if (screenId === "inicio") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const screen = document.getElementById(screenId);
  const header = document.querySelector(".topbar");
  if (!screen) return;

  const headerHeight = header?.getBoundingClientRect().height || 0;
  const targetTop = screen.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
  window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
}

function startPaymentPolling(bet) {
  if (!HAS_API || paymentPoll || !bet?.id) return;
  paymentPoll = setInterval(async () => {
    try {
      const result = await apiGet(`/api/apostas/${bet.id}`);
      const updated = normalizeApiBet(result.bet);
      state.bets[updated.matchId] = updated;
      if (updated.paid) {
        clearInterval(paymentPoll);
        paymentPoll = null;
        state.pendingMatchId = null;
        saveState();
        renderAll();
        showScreen("apostas");
      }
    } catch {
      clearInterval(paymentPoll);
      paymentPoll = null;
    }
  }, 5000);
}

function firstAvailableMatchId() {
  return brazilMatches.find((match) => !state.bets[match.id]?.paid && canBet(match))?.id || null;
}

function canBet(match) {
  return minutesTo(match.startsAt) > 30;
}

function minutesTo(dateString) {
  const start = new Date(dateString).getTime();
  return Math.floor((start - Date.now()) / 60000);
}

function formatDate(match) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(match.startsAt));
  return `${date} - ${match.displayTime} BRT`;
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function makeOrderId(matchId = "") {
  return `BA${matchId.toUpperCase()}${Date.now().toString().slice(-6)}`;
}

function buildPixPayload(orderId, amount) {
  const txid = orderId.replace(/[^A-Z0-9]/gi, "").slice(0, 25).toUpperCase();
  const gui = emv("00", "br.gov.bcb.pix");
  const key = emv("01", PIX_KEY);
  const description = emv("02", "Bolao dos Amigos 2026");
  const merchantAccount = emv("26", gui + key + description);
  const additional = emv("62", emv("05", txid));
  const withoutCrc =
    emv("00", "01") +
    merchantAccount +
    emv("52", "0000") +
    emv("53", "986") +
    emv("54", amount.toFixed(2)) +
    emv("58", "BR") +
    emv("59", MERCHANT_NAME) +
    emv("60", MERCHANT_CITY) +
    additional +
    "6304";
  return withoutCrc + crc16(withoutCrc);
}

function emv(id, value) {
  const clean = String(value);
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

function renderQr(text) {
  const encoded = encodeURIComponent(text);
  els.qrFallback.style.display = "none";
  els.qrImage.style.display = "block";
  els.qrImage.src = `https://quickchart.io/qr?size=220&margin=1&text=${encoded}`;
  els.qrImage.onerror = () => {
    els.qrImage.removeAttribute("src");
    els.qrImage.style.display = "none";
    els.qrFallback.style.display = "block";
    drawQrHelp();
  };
}

function drawEmptyQr() {
  const ctx = els.qrFallback.getContext("2d");
  els.qrImage.removeAttribute("src");
  els.qrImage.style.display = "none";
  els.qrFallback.style.display = "block";
  ctx.fillStyle = "#f7faf8";
  ctx.fillRect(0, 0, 220, 220);
  ctx.fillStyle = "#91bb9b";
  ctx.font = "700 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PIX aguardando", 110, 112);
}

function drawFallbackQr(text) {
  const ctx = els.qrFallback.getContext("2d");
  const cells = 29;
  const size = 220;
  const cell = size / cells;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111";
  drawFinder(ctx, cell, 2, 2);
  drawFinder(ctx, cell, 20, 2);
  drawFinder(ctx, cell, 2, 20);
  let seed = 0;
  for (let i = 0; i < text.length; i += 1) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      if (isFinderArea(x, y)) continue;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      if ((seed + x * 7 + y * 13) % 5 < 2) {
        ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
      }
    }
  }
}

function drawQrHelp(lineOne = "Use o PIX copia e cola", lineTwo = "ou abrir pagamento") {
  const ctx = els.qrFallback.getContext("2d");
  els.qrImage.removeAttribute("src");
  els.qrImage.style.display = "none";
  els.qrFallback.style.display = "block";
  ctx.fillStyle = "#f7faf8";
  ctx.fillRect(0, 0, 220, 220);
  ctx.fillStyle = "#075f37";
  ctx.font = "700 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(lineOne, 110, 100);
  ctx.fillText(lineTwo, 110, 122);
}

function drawFinder(ctx, cell, x, y) {
  ctx.fillRect(x * cell, y * cell, 7 * cell, 7 * cell);
  ctx.fillStyle = "#fff";
  ctx.fillRect((x + 1) * cell, (y + 1) * cell, 5 * cell, 5 * cell);
  ctx.fillStyle = "#111";
  ctx.fillRect((x + 2) * cell, (y + 2) * cell, 3 * cell, 3 * cell);
}

function isFinderArea(x, y) {
  const inTopLeft = x >= 2 && x <= 8 && y >= 2 && y <= 8;
  const inTopRight = x >= 20 && x <= 26 && y >= 2 && y <= 8;
  const inBottomLeft = x >= 2 && x <= 8 && y >= 20 && y <= 26;
  return inTopLeft || inTopRight || inBottomLeft;
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      [a && `(${a}`, a.length === 2 && ") ", b, c && `-${c}`].filter(Boolean).join("")
    );
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function maskCpf(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function isValidCpf(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 && !/^(\d)\1+$/.test(digits);
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11 && !/^(\d)\1+$/.test(digits);
}

function normalizeState() {
  if (state.sessionExpiresAt && Date.now() > state.sessionExpiresAt) {
    state.user = null;
    state.bets = {};
    state.pendingMatchId = null;
    state.lastConfirmedMatchId = null;
    state.sessionExpiresAt = null;
  }
  if (HAS_API && state.user && !state.user.id) {
    state.user = null;
    state.bets = {};
    state.pendingMatchId = null;
    state.lastConfirmedMatchId = null;
  }
  state.bets = state.bets || {};
  state.pendingMatchId = state.pendingMatchId || null;
  state.lastConfirmedMatchId = state.lastConfirmedMatchId || null;
  if (!state.currentMatchId) state.currentMatchId = firstAvailableMatchId() || brazilMatches[0]?.id || null;
  state.sessionExpiresAt = state.sessionExpiresAt || null;
}

function scrollToPanel(panel) {
  panel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scheduleSessionLogout() {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (!state.user || !state.sessionExpiresAt) return;
  const delay = Math.max(0, state.sessionExpiresAt - Date.now());
  sessionTimer = setTimeout(logoutParticipant, delay);
}

function logoutParticipant() {
  state.user = null;
  state.bets = {};
  state.pendingMatchId = null;
  state.lastConfirmedMatchId = null;
  state.sessionExpiresAt = null;
  saveState();
  els.signupForm.reset();
  els.name.disabled = false;
  els.phone.disabled = false;
  els.cpf.disabled = false;
  els.signupButton.disabled = false;
  renderAll();
  showScreen("inicio");
}

function startNewParticipant() {
  state.user = null;
  state.bets = {};
  state.pendingMatchId = null;
  state.lastConfirmedMatchId = null;
  state.sessionExpiresAt = null;
  saveState();
  els.signupForm.reset();
  els.name.disabled = false;
  els.phone.disabled = false;
  els.cpf.disabled = false;
  els.signupButton.disabled = false;
  els.signupSummary.classList.add("is-hidden");
  els.signupSummary.innerHTML = "";
  els.newParticipantButton.classList.add("is-hidden");
  renderAll();
  showScreen("cadastro");
}

async function renderParticipantResults() {
  const name = els.resultsName.value.trim();
  const cpf = els.resultsCpf.value.trim();
  if (!name || !cpf) return;
  els.resultsBox.innerHTML = "Buscando seus palpites...";

  try {
    const data = HAS_API
      ? await apiPost("/api/resultados", { name, cpf })
      : getLocalResults(name, cpf);
    els.resultsBox.innerHTML = buildResultsHtml(data);
  } catch (error) {
    els.resultsBox.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

function getLocalResults(name, cpf) {
  if (!state.user || normalizeText(state.user.name) !== normalizeText(name) || onlyDigits(state.user.cpf) !== onlyDigits(cpf)) {
    throw new Error("Participante nÃ£o encontrado.");
  }
  return {
    user: state.user,
    bets: Object.values(state.bets).map((bet) => ({
      id: bet.id || bet.orderId,
      matchId: bet.matchId,
      homeScore: bet.home,
      awayScore: bet.away,
      status: bet.paid ? "paga" : "aguardando_pagamento",
      guessAt: bet.guessAt,
      paidAt: bet.paidAt,
      createdAt: bet.createdAt,
      game: brazilMatches.find((match) => match.id === bet.matchId)
    }))
  };
}

function buildResultsHtml(data) {
  if (!data.bets.length) {
    return `<p class="empty">${escapeHtml(data.user.name)}, nenhuma aposta encontrada.</p>`;
  }
  return `
    <div class="admin-row">
      <strong>${escapeHtml(data.user.name)}</strong>
      <span>CPF: ${escapeHtml(data.user.cpf)}</span>
    </div>
    ${data.bets.map((bet) => {
      const settlement = bet.settlement || {};
      const hasGuess = bet.homeScore !== null && bet.homeScore !== undefined && bet.awayScore !== null && bet.awayScore !== undefined;
      const resultLine = settlement.result
        ? `Resultado: ${bet.game.home} ${settlement.result.homeScore} x ${settlement.result.awayScore} ${bet.game.away}`
        : "Resultado: aguardando o jogo";
      const prize = settlement.status === "ganhou" ? money(settlement.prize) : money(0);
      return `
        <div class="admin-row">
          <strong>${escapeHtml(bet.game.home)} x ${escapeHtml(bet.game.away)}</strong>
          <span>Seu palpite: ${hasGuess ? `${bet.homeScore} x ${bet.awayScore}` : "ainda nÃ£o informado"}</span>
          <span>${formatDate(bet.game)}</span>
          <span>Palpite feito em: ${formatDateTime(bet.guessAt || bet.paidAt || bet.createdAt)}</span>
          <span>${resultLine}</span>
          <span>${settlement.message || "Aguardando o jogo."}</span>
          <span>Valor a receber: ${prize}</span>
          <span class="badge">${settlement.status === "ganhou" ? "Ganhou" : settlement.status === "nao_ganhou" ? "NÃ£o ganhou" : "Aguardando"}</span>
        </div>
      `;
    }).join("")}
  `;
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadState() {
  try {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function defaultState() {
  return {
    user: null,
    bets: {},
    currentMatchId: null,
    pendingMatchId: null,
    lastConfirmedMatchId: null,
    adminUnlocked: false,
    sessionExpiresAt: null
  };
}
