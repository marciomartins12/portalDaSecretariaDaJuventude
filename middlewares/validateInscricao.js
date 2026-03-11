function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function toInt(value) {
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function validateInscricao(req, res, next) {
  const data = req.body || {};
  const errors = {};

  if (isBlank(data.teamName)) errors.teamName = "Informe o nome da equipe.";
  if (isBlank(data.leaderName)) errors.leaderName = "Informe o nome do líder.";
  if (isBlank(data.phone)) errors.phone = "Informe um telefone para contato.";
  if (isBlank(data.neighborhood)) errors.neighborhood = "Informe o bairro.";

  const age = toInt(data.age);
  if (age === null || age < 10 || age > 60) errors.age = "Informe uma idade válida.";

  const participantsCount = toInt(data.participantsCount);
  if (participantsCount === null || participantsCount < 3 || participantsCount > 50) {
    errors.participantsCount = "Informe a quantidade de participantes (3 a 50).";
  }

  const members = String(data.members || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (members.length < 2) errors.members = "Liste ao menos 2 membros além do líder.";

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("inscricao", {
      title: "Inscrição — Gincana da Juventude",
      gincana: require("../services/contentService").gincana,
      success: false,
      form: {
        teamName: data.teamName || "",
        leaderName: data.leaderName || "",
        phone: data.phone || "",
        neighborhood: data.neighborhood || "",
        age: data.age || "",
        participantsCount: data.participantsCount || "",
        members: data.members || ""
      },
      errors
    });
  }

  next();
}

module.exports = { validateInscricao };

