const content = require("../services/contentService");

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function parseDate(value) {
  const s = String(value || "").trim();
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return null;
  return { raw: s, date: d };
}

function calcAge(date) {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1;
  return age;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function safeJsonParse(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return parsed;
  } catch {
    return null;
  }
}

function validateInscricaoGincana(req, res, next) {
  const data = req.body || {};
  const errors = {};

  const teamName = String(data.teamName || "").trim();
  const captainName = String(data.captainName || "").trim();
  const captainEmail = String(data.captainEmail || "").trim().toLowerCase();
  const phoneRaw = String(data.phone || "").trim();
  const phone = digitsOnly(phoneRaw);
  const neighborhood = String(data.neighborhood || "").trim();
  const captainDobParsed = parseDate(data.captainDob);
  const termsImageRelease =
    String(data.termsImageRelease || "").trim() === "1" || String(data.termsImageRelease || "").trim() === "on";
  const termsResponsibility =
    String(data.termsResponsibility || "").trim() === "1" || String(data.termsResponsibility || "").trim() === "on";

  if (isBlank(teamName)) errors.teamName = "Informe o nome da equipe.";
  if (isBlank(captainName)) errors.captainName = "Informe o nome do capitão.";

  if (isBlank(captainEmail)) {
    errors.captainEmail = "Informe um e-mail.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captainEmail)) {
    errors.captainEmail = "Informe um e-mail válido.";
  }

  if (isBlank(phoneRaw) || isBlank(phone)) errors.phone = "Informe um telefone para contato.";
  if (isBlank(neighborhood)) errors.neighborhood = "Informe o bairro.";

  if (!captainDobParsed) {
    errors.captainDob = "Informe a data de nascimento do capitão.";
  } else if (calcAge(captainDobParsed.date) < 17) {
    errors.captainDob = "O capitão precisa ter 17 anos ou mais.";
  }

  if (!termsImageRelease) errors.termsImageRelease = "Você precisa aceitar este termo.";
  if (!termsResponsibility) errors.termsResponsibility = "Você precisa aceitar este termo.";

  const membersParsed = safeJsonParse(data.membersJson);
  if (!Array.isArray(membersParsed)) {
    errors.membersJson = "Adicione os participantes antes de continuar.";
  }

  const members = Array.isArray(membersParsed)
    ? membersParsed
        .filter((m) => m && typeof m === "object")
        .map((m) => ({
          name: String(m.name || "").trim(),
          dob: String(m.dob || "").trim()
        }))
    : [];

  const validMembers = [];
  for (const m of members) {
    if (isBlank(m.name) || isBlank(m.dob)) continue;
    const parsed = parseDate(m.dob);
    if (!parsed) continue;
    if (calcAge(parsed.date) < 15) {
      errors.membersJson = "Todos os participantes precisam ter 15 anos ou mais.";
      break;
    }
    validMembers.push({ name: m.name, dob: parsed.raw });
  }

  const participantsTotal = validMembers.length + 1;
  if (!errors.membersJson) {
    if (participantsTotal < 10) errors.membersJson = "A equipe precisa ter no mínimo 10 participantes (incluindo o capitão).";
    if (participantsTotal > 15) errors.membersJson = "A equipe pode ter no máximo 15 participantes (incluindo o capitão).";
  }

  const normalized = {
    teamName,
    captainName,
    captainEmail,
    captainDob: captainDobParsed ? captainDobParsed.raw : "",
    phone,
    neighborhood,
    members: validMembers,
    participantsTotal,
    termsImageRelease,
    termsResponsibility
  };

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("inscricao", {
      title: "Inscrição — Gincana da Juventude",
      gincana: content.gincana,
      success: false,
      form: {
        teamName,
        captainName,
        captainEmail,
        captainDob: captainDobParsed ? captainDobParsed.raw : String(data.captainDob || "").trim(),
        phone: phoneRaw,
        neighborhood,
        membersJson: Array.isArray(membersParsed) ? JSON.stringify(membersParsed) : "[]",
        termsImageRelease,
        termsResponsibility
      },
      errors
    });
  }

  req.inscricaoGincana = normalized;
  next();
}

module.exports = { validateInscricaoGincana };
