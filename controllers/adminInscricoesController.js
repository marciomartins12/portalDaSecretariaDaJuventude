const { CorridaInscricao, GincanaInscricao, GincanaParticipante } = require("../models/indexSequelize");
const content = require("../services/contentService");

async function listEvents(req, res) {
  const [totalGincana, totalCorrida] = await Promise.all([
    GincanaInscricao.count(),
    CorridaInscricao.count()
  ]);

  res.render("admin/inscricoes", {
    layout: "admin",
    title: "Admin • Inscrições",
    events: [
      { key: "gincana", name: content.gincana.title, total: totalGincana, href: "/admin/inscricoes/gincana" },
      { key: "corrida", name: content.corrida.title, total: totalCorrida, href: "/admin/inscricoes/corrida" }
    ]
  });
}

async function listCorrida(req, res) {
  const rows = await CorridaInscricao.findAll({
    order: [["createdAt", "DESC"]],
    attributes: ["id", "fullName", "email", "phone"]
  });

  res.render("admin/inscricoes-corrida", {
    layout: "admin",
    title: "Admin • Inscritos — Corrida",
    total: rows.length,
    rows: rows.map((r) => r.get({ plain: true }))
  });
}

async function deleteCorrida(req, res) {
  const id = Number(req.params?.id);
  if (!id) return res.redirect("/admin/inscricoes/corrida");

  await CorridaInscricao.destroy({ where: { id } });
  return res.redirect("/admin/inscricoes/corrida");
}

function formatDateBr(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function listGincana(req, res) {
  const rows = await GincanaInscricao.findAll({
    include: [
      {
        model: GincanaParticipante,
        as: "participants",
        attributes: ["fullName", "dob", "isCaptain"],
        required: false
      }
    ],
    order: [["createdAt", "DESC"]]
  });

  const teams = rows.map((inscricao) => {
    const p = inscricao.participants || [];
    const captain = p.find((x) => Boolean(x.isCaptain));
    const participants = p
      .slice()
      .sort((a, b) => Number(Boolean(b.isCaptain)) - Number(Boolean(a.isCaptain)))
      .map((x) => ({
        fullName: x.fullName,
        dob: formatDateBr(x.dob),
        role: x.isCaptain ? "Líder" : "Participante"
      }));

    return {
      id: inscricao.id,
      teamName: inscricao.teamName,
      captainName: captain?.fullName || inscricao.captainName,
      captainEmail: inscricao.captainEmail,
      participants
    };
  });

  res.render("admin/inscricoes-gincana", {
    layout: "admin",
    title: "Admin • Inscritos — Gincana",
    total: teams.length,
    teams
  });
}

module.exports = { listEvents, listCorrida, deleteCorrida, listGincana };

