const { pool } = require("../config/db");
const { CorridaInscricao, GincanaInscricao } = require("../models/indexSequelize");
const content = require("../services/contentService");
const { buildCorridaDocx, buildGincanaDocx } = require("../services/docxExportService");

function dateOnlyParts(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const yyyy = value.getUTCFullYear();
    const mm = value.getUTCMonth() + 1;
    const dd = value.getUTCDate();
    return { yyyy, mm, dd };
  }

  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  return { yyyy: Number(m[1]), mm: Number(m[2]), dd: Number(m[3]) };
}

function formatDateBr(value) {
  const p = dateOnlyParts(value);
  if (!p) return "";
  const dd = String(p.dd).padStart(2, "0");
  const mm = String(p.mm).padStart(2, "0");
  const yyyy = String(p.yyyy);
  return `${dd}/${mm}/${yyyy}`;
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
  const p = dateOnlyParts(dob);
  if (!p) return null;

  const now = new Date();
  let age = now.getFullYear() - p.yyyy;
  const m = (now.getMonth() + 1) - p.mm;
  if (m < 0 || (m === 0 && now.getDate() < p.dd)) age -= 1;
  return age;
}

function bibFromId(id) {
  return String(id).padStart(3, "0");
}

async function listEvents(req, res) {
  const [totalGincana, totalCorrida, [sorteioCountRows], [jogosCountRows]] = await Promise.all([
    GincanaInscricao.count(),
    CorridaInscricao.count(),
    pool.execute("SELECT COUNT(*) AS c FROM sorteio_piscicultores_inscricoes"),
    pool.execute("SELECT COUNT(*) AS c FROM jogos_inscricoes")
  ]);
  const totalSorteio = Number(sorteioCountRows?.[0]?.c || 0);
  const totalJogos = Number(jogosCountRows?.[0]?.c || 0);

  res.render("admin/inscricoes", {
    layout: "admin",
    title: "Admin • Inscrições",
    events: [
      {
        key: "gincana",
        name: content.gincana.title,
        total: totalGincana,
        href: "/admin/inscricoes/gincana",
        exportHref: "/admin/inscricoes/gincana/export.docx",
        exportLabel: "Exportar DOCX"
      },
      {
        key: "corrida",
        name: content.corrida.title,
        total: totalCorrida,
        href: "/admin/inscricoes/corrida",
        exportHref: "/admin/inscricoes/corrida/export.docx",
        exportLabel: "Exportar DOCX"
      },
      {
        key: "sorteio",
        name: "Sorteio para Psiculutores",
        total: totalSorteio,
        href: "/admin/inscricoes/sorteio",
        exportHref: "/admin/inscricoes/sorteio/export.csv",
        exportLabel: "Exportar CSV"
      },
      {
        key: "jogos",
        name: "Jogos Variados",
        total: totalJogos,
        href: "/admin/inscricoes/jogos",
        exportHref: "/admin/inscricoes/jogos/export.csv",
        exportLabel: "Exportar CSV"
      }
    ]
  });
}

async function listCorrida(req, res) {
  const q = String(req.query?.q || "").trim();
  const email = String(req.query?.email || "").trim();
  const phone = String(req.query?.phone || "").trim();
  let sql = "SELECT * FROM corrida_inscricoes";
  const wheres = [];
  const params = [];
  if (q) {
    wheres.push("full_name LIKE ?");
    params.push(`%${q}%`);
  }
  if (email) {
    wheres.push("email LIKE ?");
    params.push(`%${email}%`);
  }
  if (phone) {
    wheres.push("phone LIKE ?");
    params.push(`%${phone}%`);
  }
  if (wheres.length > 0) {
    sql += " WHERE " + wheres.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.execute(sql, params);

  const queryPairs = [];
  if (q) queryPairs.push(`q=${encodeURIComponent(q)}`);
  if (email) queryPairs.push(`email=${encodeURIComponent(email)}`);
  if (phone) queryPairs.push(`phone=${encodeURIComponent(phone)}`);
  const exportHref =
    "/admin/inscricoes/corrida/export.docx" + (queryPairs.length ? `?${queryPairs.join("&")}` : "");

  res.render("admin/inscricoes-corrida", {
    layout: "admin",
    title: "Admin • Inscritos — Corrida",
    total: rows.length,
    exportHref,
    q,
    email,
    phone,
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
  const q = String(req.query?.q || "").trim();
  let sql = "SELECT * FROM gincana_inscricoes";
  const params = [];
  if (q) {
    sql += " WHERE team_name LIKE ?";
    params.push(`%${q}%`);
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.execute(sql, params);

  const teams = [];
  for (const r of rows) {
    const [pRows] = await pool.execute(
      "SELECT * FROM gincana_participantes WHERE inscricao_id = ? ORDER BY is_captain DESC, id ASC",
      [r.id]
    );
    const captainRow = pRows.find((x) => Boolean(x.is_captain)) || null;
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
      captainCpf: captainRow?.cpf ?? "",
      captainAddress: captainRow?.address ?? "",
      participantsTotal: Number(r.participants_total || 0),
      termsImageRelease: r.terms_image_release ? "Sim" : "Não",
      termsResponsibility: r.terms_responsibility ? "Sim" : "Não",
      termsIp: r.terms_ip ?? "",
      participants
    });
  }

  const exportHref =
    "/admin/inscricoes/gincana/export.docx" + (q ? `?q=${encodeURIComponent(q)}` : "");

  res.render("admin/inscricoes-gincana", {
    layout: "admin",
    title: "Admin • Inscritos — Gincana",
    total: teams.length,
    exportHref,
    q,
    teams
  });
}

async function exportCorridaDocx(req, res) {
  const q = String(req.query?.q || "").trim();
  const email = String(req.query?.email || "").trim();
  const phone = String(req.query?.phone || "").trim();
  let sql = "SELECT * FROM corrida_inscricoes";
  const wheres = [];
  const params = [];
  if (q) {
    wheres.push("full_name LIKE ?");
    params.push(`%${q}%`);
  }
  if (email) {
    wheres.push("email LIKE ?");
    params.push(`%${email}%`);
  }
  if (phone) {
    wheres.push("phone LIKE ?");
    params.push(`%${phone}%`);
  }
  if (wheres.length > 0) {
    sql += " WHERE " + wheres.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.execute(sql, params);

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
      subtitle: `Total: ${mapped.length}`,
      departmentName: res.locals.site?.departmentName || "",
      exportedBy: req.admin?.email || "",
      exportedAt: formatDateTimeBr(new Date())
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
  const q = String(req.query?.q || "").trim();
  let sql = "SELECT * FROM gincana_inscricoes";
  const params = [];
  if (q) {
    sql += " WHERE team_name LIKE ?";
    params.push(`%${q}%`);
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.execute(sql, params);
  const teams = [];
  for (const r of rows) {
    const [pRows] = await pool.execute(
      "SELECT * FROM gincana_participantes WHERE inscricao_id = ? ORDER BY is_captain DESC, id ASC",
      [r.id]
    );
    const captainRow = pRows.find((x) => Boolean(x.is_captain)) || null;
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
      captainCpf: captainRow?.cpf ?? "",
      captainAddress: captainRow?.address ?? "",
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
      subtitle: `Equipes: ${teams.length}`,
      departmentName: res.locals.site?.departmentName || "",
      exportedBy: req.admin?.email || "",
      exportedAt: formatDateTimeBr(new Date())
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

async function listSorteio(req, res) {
  const [rows] = await pool.execute(
    "SELECT * FROM sorteio_piscicultores_inscricoes ORDER BY created_at DESC"
  );

  res.render("admin/inscricoes-sorteio", {
    layout: "admin",
    title: "Admin • Inscritos — Sorteio",
    total: rows.length,
    exportHref: "/admin/inscricoes/sorteio/export.csv",
    rows: rows.map((r) => ({
      id: Number(r.id),
      ticket: bibFromId(r.id),
      createdAt: formatDateTimeBr(r.created_at),
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      cpf: r.cpf,
      caf: r.caf
    }))
  });
}

async function exportSorteioCsv(req, res) {
  const [rows] = await pool.execute(
    "SELECT * FROM sorteio_piscicultores_inscricoes ORDER BY created_at DESC"
  );
  const header = ["id", "ticket", "created_at", "full_name", "email", "phone", "address", "cpf", "caf"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const values = [
      r.id,
      bibFromId(r.id),
      formatDateTimeBr(r.created_at),
      `"${String(r.full_name || "").replace(/"/g, '""')}"`,
      r.email,
      r.phone,
      `"${String(r.address || "").replace(/"/g, '""')}"`,
      r.cpf,
      r.caf || ""
    ];
    lines.push(values.join(","));
  }
  const csv = lines.join("\n");
  res.setHeader("Content-Disposition", `attachment; filename="inscritos-sorteio.csv"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send("\uFEFF" + csv);
}

module.exports.listSorteio = listSorteio;
module.exports.exportSorteioCsv = exportSorteioCsv;

function formatJogosSports(raw) {
  let keys = [];
  try {
    keys = JSON.parse(String(raw || "[]"));
  } catch {
    keys = [];
  }
  const map = {
    domino: "Dominó",
    sinuca: "Sinuca",
    travinho: "Travinho",
    videogame_ps2: "Videogame (PES PS2)",
    dama: "Dama"
  };
  return (Array.isArray(keys) ? keys : [])
    .map((k) => map[String(k || "").trim()] || String(k || "").trim())
    .filter(Boolean)
    .join(", ");
}

async function listJogos(req, res) {
  const q = String(req.query?.q || "").trim();
  const sport = String(req.query?.sport || "").trim().toLowerCase();
  const allowed = new Set(["domino", "sinuca", "travinho", "videogame_ps2", "dama"]);
  let sql = "SELECT * FROM jogos_inscricoes";
  const wheres = [];
  const params = [];
  if (q) {
    wheres.push("full_name LIKE ?");
    params.push(`%${q}%`);
  }
  if (sport && allowed.has(sport)) {
    wheres.push("sports LIKE ?");
    params.push(`%"${sport}"%`);
  }
  if (wheres.length > 0) {
    sql += " WHERE " + wheres.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.execute(sql, params);
  res.render("admin/inscricoes-jogos", {
    layout: "admin",
    title: "Admin • Inscritos — Jogos Variados",
    total: rows.length,
    exportHref: "/admin/inscricoes/jogos/export.csv",
    q,
    sport,
    rows: rows.map((r) => ({
      id: Number(r.id),
      createdAt: formatDateTimeBr(r.created_at),
      fullName: r.full_name,
      phone: r.phone,
      cpf: r.cpf,
      sports: formatJogosSports(r.sports)
    }))
  });
}

async function exportJogosCsv(req, res) {
  const q = String(req.query?.q || "").trim();
  const sport = String(req.query?.sport || "").trim().toLowerCase();
  const allowed = new Set(["domino", "sinuca", "travinho", "videogame_ps2", "dama"]);
  let sql = "SELECT * FROM jogos_inscricoes";
  const wheres = [];
  const params = [];
  if (q) {
    wheres.push("full_name LIKE ?");
    params.push(`%${q}%`);
  }
  if (sport && allowed.has(sport)) {
    wheres.push("sports LIKE ?");
    params.push(`%"${sport}"%`);
  }
  if (wheres.length > 0) {
    sql += " WHERE " + wheres.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.execute(sql, params);
  const header = ["id", "created_at", "full_name", "phone", "cpf", "sports"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const values = [
      r.id,
      formatDateTimeBr(r.created_at),
      `"${String(r.full_name || "").replace(/"/g, '""')}"`,
      r.phone,
      r.cpf,
      `"${String(formatJogosSports(r.sports) || "").replace(/"/g, '""')}"`
    ];
    lines.push(values.join(","));
  }
  const csv = lines.join("\n");
  res.setHeader("Content-Disposition", `attachment; filename="inscritos-jogos-variados.csv"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send("\uFEFF" + csv);
}

module.exports.listJogos = listJogos;
module.exports.exportJogosCsv = exportJogosCsv;
