function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidCpf(cpfDigits) {
  const cpf = digitsOnly(cpfDigits);
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (base, factor) => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (factor - i);
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 9) + String(d1), 11);
  return cpf.endsWith(`${d1}${d2}`);
}

function parseDate(value) {
  const s = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
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

function validateInscricaoCorrida(req, res, next) {
  const data = req.body || {};
  const errors = {};

  if (isBlank(data.fullName)) errors.fullName = "Informe seu nome completo.";
  const email = String(data.email || "").trim().toLowerCase();
  if (isBlank(email)) {
    errors.email = "Informe um e-mail.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Informe um e-mail válido.";
  }
  const phoneRaw = String(data.phone || "").trim();
  const phone = digitsOnly(phoneRaw);
  if (isBlank(phoneRaw) || isBlank(phone)) errors.phone = "Informe um telefone para contato.";
  const address = String(data.address || "").trim();
  if (isBlank(address)) errors.address = "Informe seu endereço.";
  const neighborhood = String(data.neighborhood || "").trim();
  if (isBlank(neighborhood)) errors.neighborhood = "Informe seu bairro.";

  const cpfRaw = String(data.cpf || "").trim();
  const cpf = digitsOnly(cpfRaw);
  if (isBlank(cpfRaw) || isBlank(cpf)) {
    errors.cpf = "Informe seu CPF.";
  } else if (!isValidCpf(cpf)) {
    errors.cpf = "Informe um CPF válido.";
  }

  const dobParsed = parseDate(data.dob);
  if (!dobParsed) {
    errors.dob = "Informe sua data de nascimento.";
  } else if (calcAge(dobParsed.date) < 15) {
    errors.dob = "Você precisa ter 15 anos ou mais.";
  }

  const termsImageRelease =
    String(data.termsImageRelease || "").trim() === "1" || String(data.termsImageRelease || "").trim() === "on";
  const termsResponsibility =
    String(data.termsResponsibility || "").trim() === "1" || String(data.termsResponsibility || "").trim() === "on";
  if (!termsImageRelease) errors.termsImageRelease = "Você precisa aceitar este termo.";
  if (!termsResponsibility) errors.termsResponsibility = "Você precisa aceitar este termo.";

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("inscricao-corrida", {
      title: "Inscrição — Corrida da Juventude",
      success: false,
      form: {
        fullName: data.fullName || "",
        email: data.email || "",
        phone: phoneRaw,
        address,
        neighborhood,
        cpf: cpfRaw,
        dob: dobParsed ? dobParsed.raw : String(data.dob || "").trim(),
        termsImageRelease,
        termsResponsibility
      },
      errors
    });
  }

  req.inscricaoCorrida = {
    fullName: String(data.fullName || "").trim(),
    email,
    phone,
    address,
    neighborhood,
    cpf,
    dob: dobParsed.raw,
    termsImageRelease,
    termsResponsibility
  };

  next();
}

module.exports = { validateInscricaoCorrida };
