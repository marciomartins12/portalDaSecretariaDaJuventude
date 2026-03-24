function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidCpf(cpfDigits) {
  const cpf = digitsOnly(cpfDigits);
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (base, factor) => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) sum += Number(base[i]) * (factor - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 9) + String(d1), 11);
  return cpf.endsWith(`${d1}${d2}`);
}

function normalizeSports(input) {
  const allowed = new Map([
    ["domino", "Dominó"],
    ["sinuca", "Sinuca"],
    ["travinho", "Travinho"],
    ["videogame_bomba_patch", "Videogame (Bomba Patch)"],
    ["videogame_ps2", "Videogame (Bomba Patch)"],
    ["dama", "Dama"]
  ]);
  const arr = Array.isArray(input) ? input : input ? [input] : [];
  const out = [];
  for (const raw of arr) {
    const k = String(raw || "").trim().toLowerCase();
    if (allowed.has(k)) out.push(k === "videogame_ps2" ? "videogame_bomba_patch" : k);
  }
  return Array.from(new Set(out));
}

function validateInscricaoJogos(req, res, next) {
  const data = req.body || {};
  const errors = {};

  const fullName = String(data.fullName || "").trim();
  const phoneRaw = String(data.phone || "").trim();
  const phone = digitsOnly(phoneRaw);
  const cpfRaw = String(data.cpf || "").trim();
  const cpf = digitsOnly(cpfRaw);
  const sports = normalizeSports(data.sports);

  if (!fullName) errors.fullName = "Informe seu nome completo.";
  if (!phoneRaw || !phone) errors.phone = "Informe seu telefone.";
  if (!cpfRaw || !cpf) errors.cpf = "Informe seu CPF.";
  else if (!isValidCpf(cpf)) errors.cpf = "Informe um CPF válido.";
  if (!Array.isArray(sports) || sports.length === 0) errors.sports = "Selecione pelo menos um esporte.";

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("inscricao-jogos", {
      title: "Inscrição — Jogos Variados",
      success: false,
      form: {
        fullName,
        phone: phoneRaw,
        cpf: cpfRaw,
        sports
      },
      errors
    });
  }

  req.inscricaoJogos = { fullName, phone, cpf, sports };
  next();
}

module.exports = { validateInscricaoJogos };
