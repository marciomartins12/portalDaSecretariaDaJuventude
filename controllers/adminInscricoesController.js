const { pool } = require("../config/db");
const { CorridaInscricao, GincanaInscricao } = require("../models/indexSequelize");
const content = require("../services/contentService");
const { buildCorridaDocx, buildGincanaDocx } = require("../services/docxExportService");

function formatDateBr(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTimeBr(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function calcAge(dob) {
  const s = String(dob || "").trim();
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

function bibFromId(id) {
  return String(id).padStart(3, "0");
}

async function listEvents(req, res) {
  const [totalGincana, totalCorrida] = await Promise.all([
    GincanaInscricao.count(),
    CorridaInscricao.count()
  ]);

  res.render("admin/inscricoes", {
    layout: "admin",
    title: "Admin • Inscrições",
    events: [
      {
        key: "gincana",
        name: content.gincana.title,
        total: totalGincana,
        href: "/admin/inscricoes/gincana",
        exportHref: "/admin/inscricoes/gincana/export.docx"
      },
      {
        key: "corrida",
        name: content.corrida.title,
        total: totalCorrida,
        href: "/admin/inscricoes/corrida",
        exportHref: "/admin/inscricoes/corrida/export.docx"
      }
    ]
  });
}

async function listCorrida(req, res) {
  const [rows] = await pool.execute(
    "SELECT * FROM corrida_inscricoes ORDER BY created_at DESC"
  );

  res.render("admin/inscricoes-corrida", {
    layout: "admin",
    title: "Admin • Inscritos — Corrida",
    total: rows.length,
    exportHref: "/admin/inscricoes/corrida/export.docx",
    rows: rows.map((r) => ({
      id: Number(r.id),
      bib: bibFromId(r.id),
      createdAt: formatDateTimeBr(r.created_at),
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      neighborhood: r.neighborhood ?? "",
      cpf: r.cpf ?? "",
      dob: r.dob ? formatDateBr(r.dob) : "",
      age: r.age ? Number(r.age) : calcAge(r.dob),
      termsImageRelease: r.terms_image_release ? "Sim" : "Não",
      termsResponsibility: r.terms_responsibility ? "Sim" : "Não",
      termsIp: r.terms_ip ?? ""
    }))
  });
}

async function deleteCorrida(req, res) {
  const id = Number(req.params?.id);
  if (!id) return res.redirect("/admin/inscricoes/corrida");

  await pool.execute("DELETE FROM corrida_inscricoes WHERE id = ? LIMIT 1", [id]);
  return res.redirect("/admin/inscricoes/corrida");
}

async function listGincana(req, res) {
  const [rows] = await pool.execute("SELECT * FROM gincana_inscricoes ORDER BY created_at DESC");

  const teams = [];
  for (const r of rows) {
    const [pRows] = await pool.execute(
      "SELECT * FROM gincana_participantes WHERE inscricao_id = ? ORDER BY is_captain DESC, id ASC",
      [r.id]
    );
    const participants = pRows.map((p) => ({
      fullName: p.full_name,
      dob: p.dob ? formatDateBr(p.dob) : "",
      age: calcAge(p.dob),
      cpf: p.cpf ?? "",
      address: p.address ?? "",
      role: p.is_captain ? "Líder" : "Participante"
    }));

    teams.push({
      id: Number(r.id),
      createdAt: formatDateTimeBr(r.created_at),
      teamName: r.team_name,
      captainName: r.captain_name,
      captainEmail: r.captain_email,
      captainPhone: r.captain_phone,
      neighborhood: r.neighborhood,
      captainDob: r.captain_dob ? formatDateBr(r.captain_dob) : "",
      captainAge: calcAge(r.captain_dob),
      participantsTotal: Number(r.participants_total || 0),
      termsImageRelease: r.terms_image_release ? "Sim" : "Não",
      termsResponsibility: r.terms_responsibility ? "Sim" : "Não",
      termsIp: r.terms_ip ?? "",
      participants
    });
  }

  res.render("admin/inscricoes-gincana", {
    layout: "admin",
    title: "Admin • Inscritos — Gincana",
    total: teams.length,
    exportHref: "/admin/inscricoes/gincana/export.docx",
    teams
  });
}

async function exportCorridaDocx(req, res) {
  const [rows] = await pool.execute(
    "SELECT * FROM corrida_inscricoes ORDER BY created_at DESC"
  );

  const mapped = rows.map((r) => ({
    id: Number(r.id),
    bib: bibFromId(r.id),
    createdAt: formatDateTimeBr(r.created_at),
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    neighborhood: r.neighborhood ?? "",
    cpf: r.cpf ?? "",
    dob: r.dob ? formatDateBr(r.dob) : "",
    age: r.age ? Number(r.age) : calcAge(r.dob),
    termsImageRelease: r.terms_image_release ? "Sim" : "Não",
    termsResponsibility: r.terms_responsibility ? "Sim" : "Não",
    termsIp: r.terms_ip ?? ""
  }));

  const buffer = await buildCorridaDocx({
    heading: {
      title: "Inscritos — Corrida",
      subtitle: `Total: ${mapped.length}`
    },
    rows: mapped
  });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="inscritos-corrida.docx"`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.send(buffer);
}

async function exportGincanaDocx(req, res) {
  const [rows] = await pool.execute("SELECT * FROM gincana_inscricoes ORDER BY created_at DESC");
  const teams = [];
  for (const r of rows) {
    const [pRows] = await pool.execute(
      "SELECT * FROM gincana_participantes WHERE inscricao_id = ? ORDER BY is_captain DESC, id ASC",
      [r.id]
    );
    const participants = pRows.map((p) => ({
      fullName: p.full_name,
      dob: p.dob ? formatDateBr(p.dob) : "",
      age: calcAge(p.dob),
      cpf: p.cpf ?? "",
      address: p.address ?? "",
      role: p.is_captain ? "Líder" : "Participante"
    }));

    teams.push({
      id: Number(r.id),
      createdAt: formatDateTimeBr(r.created_at),
      teamName: r.team_name,
      captainName: r.captain_name,
      captainEmail: r.captain_email,
      captainPhone: r.captain_phone,
      neighborhood: r.neighborhood,
      captainDob: r.captain_dob ? formatDateBr(r.captain_dob) : "",
      captainAge: calcAge(r.captain_dob),
      participantsTotal: Number(r.participants_total || 0),
      termsImageRelease: r.terms_image_release ? "Sim" : "Não",
      termsResponsibility: r.terms_responsibility ? "Sim" : "Não",
      termsIp: r.terms_ip ?? "",
      participants
    });
  }

  const buffer = await buildGincanaDocx({
    heading: {
      title: "Inscritos — Gincana",
      subtitle: `Equipes: ${teams.length}`
    },
    teams
  });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="inscritos-gincana.docx"`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.send(buffer);
}

module.exports = {
  listEvents,
  listCorrida,
  deleteCorrida,
  listGincana,
  exportCorridaDocx,
  exportGincanaDocx
};
