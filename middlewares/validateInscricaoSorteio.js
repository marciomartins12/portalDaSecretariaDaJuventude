function isBlank(v) {
  return !String(v || "").trim();
}

function digitsOnly(v) {
  return String(v || "").replace(/\D/g, "");
}

function isValidCpf(cpf) {
  cpf = String(cpf || "").replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (base, factor) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 9) + d1, 11);
  return cpf.endsWith(`${d1}${d2}`);
}

function validateInscricaoSorteio(req, res, next) {
  const data = req.body || {};
  const errors = {};

  const fullName = String(data.fullName || "").trim();
  if (isBlank(fullName)) errors.fullName = "Informe seu nome completo.";

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

  const cpfRaw = String(data.cpf || "").trim();
  const cpf = digitsOnly(cpfRaw);
  if (isBlank(cpfRaw) || isBlank(cpf)) {
    errors.cpf = "Informe seu CPF.";
  } else if (!isValidCpf(cpf)) {
    errors.cpf = "Informe um CPF válido.";
  }

  const caf = String(data.caf || "").trim();

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("inscricao-sorteio", {
      title: "Inscrição — Sorteio para Piscicultores",
      success: false,
      sorteio: require("../services/contentService").sorteio,
      form: {
        fullName,
        email,
        phone: phoneRaw,
        address,
        cpf: cpfRaw,
        caf
      },
      errors
    });
  }

  req.inscricaoSorteio = {
    fullName,
    email,
    phone,
    address,
    cpf,
    caf
  };

  next();
}

module.exports = { validateInscricaoSorteio };
