function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function toInt(value) {
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
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
  if (isBlank(data.neighborhood)) errors.neighborhood = "Informe o bairro.";

  const age = toInt(data.age);
  if (age === null || age < 0 || age > 120) errors.age = "Informe uma idade válida.";

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
        neighborhood: data.neighborhood || "",
        age: data.age || "",
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
    neighborhood: String(data.neighborhood || "").trim(),
    age,
    termsImageRelease,
    termsResponsibility
  };

  next();
}

module.exports = { validateInscricaoCorrida };
