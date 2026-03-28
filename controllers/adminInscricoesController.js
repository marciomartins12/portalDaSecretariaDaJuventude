const { pool } = require("../config/db");
const { CorridaInscricao, GincanaInscricao } = require("../models/indexSequelize");
const content = require("../services/contentService");
const { buildCorridaDocx, buildGincanaDocx, buildJogosDocx } = require("../services/docxExportService");

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

function formatDateIso(value) {
  const p = dateOnlyParts(value);
  if (!p) return "";
  const dd = String(p.dd).padStart(2, "0");
  const mm = String(p.mm).padStart(2, "0");
  const yyyy = String(p.yyyy);
  return `${yyyy}-${mm}-${dd}`;
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
        exportHref: "/admin/inscricoes/jogos/export.docx",
        exportLabel: "Exportar DOCX"
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
      id: Number(p.id),
      fullName: p.full_name,
      dob: p.dob ? formatDateBr(p.dob) : "",
      dobValue: p.dob ? formatDateIso(p.dob) : "",
      age: calcAge(p.dob),
      cpf: p.cpf ?? "",
      address: p.address ?? "",
      role: p.is_captain ? "Líder" : "Participante",
      roleValue: p.is_captain ? "captain" : "member"
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
    teams,
    error: String(req.query?.error || "").trim(),
    success: String(req.query?.success || "").trim()
  });
}

async function syncGincanaTeamCounts(teamId) {
  const [countRows] = await pool.execute("SELECT COUNT(*) AS c FROM gincana_participantes WHERE inscricao_id = ?", [
    teamId
  ]);
  const total = Number(countRows?.[0]?.c || 0);
  await pool.execute("UPDATE gincana_inscricoes SET participants_total = ? WHERE id = ? LIMIT 1", [total, teamId]);
  return total;
}

async function syncGincanaCaptainFromParticipant(participantId) {
  const [rows] = await pool.execute(
    "SELECT id, inscricao_id, full_name, dob FROM gincana_participantes WHERE id = ? LIMIT 1",
    [participantId]
  );
  if (rows.length === 0) return null;
  const p = rows[0];
  await pool.execute("UPDATE gincana_inscricoes SET captain_name = ?, captain_dob = ? WHERE id = ? LIMIT 1", [
    p.full_name,
    p.dob || null,
    p.inscricao_id
  ]);
  return Number(p.inscricao_id);
}

async function addGincanaParticipant(req, res) {
  const teamId = Number(req.params?.id);
  if (!teamId) return res.redirect("/admin/inscricoes/gincana?error=Equipe inválida");

  const fullName = String(req.body?.fullName || "").trim();
  const dobRaw = String(req.body?.dob || "").trim();
  const dobParts = dateOnlyParts(dobRaw);
  const cpfRaw = String(req.body?.cpf || "").trim();
  const cpf = digitsOnly(cpfRaw);
  const address = String(req.body?.address || "").trim();
  const role = String(req.body?.role || "member").trim();
  const isCaptain = role === "captain";

  if (!fullName) return res.redirect(`/admin/inscricoes/gincana?error=Informe o nome do participante#team-${teamId}`);
  if (!dobParts) return res.redirect(`/admin/inscricoes/gincana?error=Informe a data de nascimento#team-${teamId}`);
  if (!cpf || !isValidCpf(cpf)) return res.redirect(`/admin/inscricoes/gincana?error=Informe um CPF válido#team-${teamId}`);
  if (!address) return res.redirect(`/admin/inscricoes/gincana?error=Informe o endereço#team-${teamId}`);

  const [countRows] = await pool.execute("SELECT COUNT(*) AS c FROM gincana_participantes WHERE inscricao_id = ?", [
    teamId
  ]);
  const currentTotal = Number(countRows?.[0]?.c || 0);
  if (currentTotal >= 15) {
    return res.redirect(`/admin/inscricoes/gincana?error=Esta equipe já possui 15 participantes#team-${teamId}`);
  }

  const [result] = await pool.execute(
    "INSERT INTO gincana_participantes (inscricao_id, full_name, dob, is_captain, cpf, address) VALUES (?, ?, ?, ?, ?, ?)",
    [teamId, fullName, formatDateIso(dobRaw), isCaptain ? 1 : 0, cpf, address]
  );
  const newId = Number(result.insertId);

  if (isCaptain) {
    await pool.execute("UPDATE gincana_participantes SET is_captain = 0 WHERE inscricao_id = ? AND id <> ?", [
      teamId,
      newId
    ]);
    await pool.execute("UPDATE gincana_participantes SET is_captain = 1 WHERE id = ? LIMIT 1", [newId]);
    await syncGincanaCaptainFromParticipant(newId);
  }

  await syncGincanaTeamCounts(teamId);
  return res.redirect(`/admin/inscricoes/gincana?success=Participante adicionado#team-${teamId}`);
}

async function updateGincanaParticipant(req, res) {
  const participantId = Number(req.params?.participantId);
  if (!participantId) return res.redirect("/admin/inscricoes/gincana?error=Participante inválido");

  const [pRows] = await pool.execute("SELECT id, inscricao_id FROM gincana_participantes WHERE id = ? LIMIT 1", [
    participantId
  ]);
  if (pRows.length === 0) return res.redirect("/admin/inscricoes/gincana?error=Participante não encontrado");
  const teamId = Number(pRows[0].inscricao_id);

  const fullName = String(req.body?.fullName || "").trim();
  const dobRaw = String(req.body?.dob || "").trim();
  const dobParts = dateOnlyParts(dobRaw);
  const cpfRaw = String(req.body?.cpf || "").trim();
  const cpf = digitsOnly(cpfRaw);
  const address = String(req.body?.address || "").trim();
  const role = String(req.body?.role || "member").trim();
  const isCaptain = role === "captain";

  if (!fullName) return res.redirect(`/admin/inscricoes/gincana?error=Informe o nome do participante#team-${teamId}`);
  if (!dobParts) return res.redirect(`/admin/inscricoes/gincana?error=Informe a data de nascimento#team-${teamId}`);
  if (!cpf || !isValidCpf(cpf)) return res.redirect(`/admin/inscricoes/gincana?error=Informe um CPF válido#team-${teamId}`);
  if (!address) return res.redirect(`/admin/inscricoes/gincana?error=Informe o endereço#team-${teamId}`);

  await pool.execute(
    "UPDATE gincana_participantes SET full_name = ?, dob = ?, cpf = ?, address = ?, is_captain = ? WHERE id = ? LIMIT 1",
    [fullName, formatDateIso(dobRaw), cpf, address, isCaptain ? 1 : 0, participantId]
  );

  if (isCaptain) {
    await pool.execute("UPDATE gincana_participantes SET is_captain = 0 WHERE inscricao_id = ? AND id <> ?", [
      teamId,
      participantId
    ]);
    await syncGincanaCaptainFromParticipant(participantId);
  } else {
    const [capRows] = await pool.execute(
      "SELECT id FROM gincana_participantes WHERE inscricao_id = ? AND is_captain = 1 LIMIT 1",
      [teamId]
    );
    if (capRows.length === 0) {
      await pool.execute("UPDATE gincana_participantes SET is_captain = 1 WHERE id = ? LIMIT 1", [participantId]);
      await syncGincanaCaptainFromParticipant(participantId);
    }
  }

  await syncGincanaTeamCounts(teamId);
  return res.redirect(`/admin/inscricoes/gincana?success=Participante atualizado#team-${teamId}`);
}

async function deleteGincanaParticipant(req, res) {
  const participantId = Number(req.params?.participantId);
  if (!participantId) return res.redirect("/admin/inscricoes/gincana?error=Participante inválido");

  const [pRows] = await pool.execute(
    "SELECT id, inscricao_id, is_captain FROM gincana_participantes WHERE id = ? LIMIT 1",
    [participantId]
  );
  if (pRows.length === 0) return res.redirect("/admin/inscricoes/gincana?error=Participante não encontrado");
  const teamId = Number(pRows[0].inscricao_id);
  const wasCaptain = Boolean(pRows[0].is_captain);

  await pool.execute("DELETE FROM gincana_participantes WHERE id = ? LIMIT 1", [participantId]);

  if (wasCaptain) {
    const [nextRows] = await pool.execute(
      "SELECT id FROM gincana_participantes WHERE inscricao_id = ? ORDER BY id ASC LIMIT 1",
      [teamId]
    );
    if (nextRows.length > 0) {
      const nextId = Number(nextRows[0].id);
      await pool.execute("UPDATE gincana_participantes SET is_captain = 0 WHERE inscricao_id = ?", [teamId]);
      await pool.execute("UPDATE gincana_participantes SET is_captain = 1 WHERE id = ? LIMIT 1", [nextId]);
      await syncGincanaCaptainFromParticipant(nextId);
    }
  }

  await syncGincanaTeamCounts(teamId);
  return res.redirect(`/admin/inscricoes/gincana?success=Participante removido#team-${teamId}`);
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
  addGincanaParticipant,
  updateGincanaParticipant,
  deleteGincanaParticipant,
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
    videogame_bomba_patch: "Videogame (Bomba Patch)",
    videogame_ps2: "Videogame (Bomba Patch)",
    dama: "Dama"
  };
  return (Array.isArray(keys) ? keys : [])
    .map((k) => map[String(k || "").trim()] || String(k || "").trim())
    .filter(Boolean)
    .join(", ");
}

function parseJogosSportKeys(raw) {
  let keys = [];
  try {
    keys = JSON.parse(String(raw || "[]"));
  } catch {
    keys = [];
  }
  const normalized = (Array.isArray(keys) ? keys : [])
    .map((k) => String(k || "").trim())
    .filter(Boolean)
    .map((k) => {
      if (k === "videogame_ps2") return "videogame_bomba_patch";
      return k;
    });
  return Array.from(new Set(normalized));
}

function csvCell(value) {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

async function listJogos(req, res) {
  const q = String(req.query?.q || "").trim();
  const sport = String(req.query?.sport || "").trim().toLowerCase();
  const allowed = new Set(["domino", "sinuca", "travinho", "videogame_bomba_patch", "videogame_ps2", "dama"]);
  let sql = "SELECT * FROM jogos_inscricoes";
  const wheres = [];
  const params = [];
  if (q) {
    wheres.push("full_name LIKE ?");
    params.push(`%${q}%`);
  }
  if (sport && allowed.has(sport)) {
    if (sport === "videogame_bomba_patch" || sport === "videogame_ps2") {
      wheres.push("(sports LIKE ? OR sports LIKE ?)");
      params.push(`%\"videogame_bomba_patch\"%`, `%\"videogame_ps2\"%`);
    } else {
      wheres.push("sports LIKE ?");
      params.push(`%\"${sport}\"%`);
    }
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
    exportHref: "/admin/inscricoes/jogos/export.docx",
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

async function exportJogosDocx(req, res) {
  const q = String(req.query?.q || "").trim();
  const sport = String(req.query?.sport || "").trim().toLowerCase();
  const allowed = new Set(["domino", "sinuca", "travinho", "videogame_bomba_patch", "videogame_ps2", "dama"]);
  let sql = "SELECT * FROM jogos_inscricoes";
  const wheres = [];
  const params = [];
  if (q) {
    wheres.push("full_name LIKE ?");
    params.push(`%${q}%`);
  }
  if (sport && allowed.has(sport)) {
    if (sport === "videogame_bomba_patch" || sport === "videogame_ps2") {
      wheres.push("(sports LIKE ? OR sports LIKE ?)");
      params.push(`%\"videogame_bomba_patch\"%`, `%\"videogame_ps2\"%`);
    } else {
      wheres.push("sports LIKE ?");
      params.push(`%\"${sport}\"%`);
    }
  }
  if (wheres.length > 0) {
    sql += " WHERE " + wheres.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.execute(sql, params);

  const sportDefs = [
    { key: "domino", label: "Dominó" },
    { key: "sinuca", label: "Sinuca" },
    { key: "travinho", label: "Travinho" },
    { key: "videogame_bomba_patch", label: "Videogame (Bomba Patch)" },
    { key: "dama", label: "Dama" }
  ];
  const filterKey = sport === "videogame_ps2" ? "videogame_bomba_patch" : sport;

  const groups = [];
  for (const def of sportDefs) {
    if (filterKey && allowed.has(filterKey) && def.key !== filterKey) continue;
    const groupRows = rows.filter((r) => parseJogosSportKeys(r.sports).includes(def.key));
    if (groupRows.length === 0) continue;
    groups.push({
      key: def.key,
      label: def.label,
      rows: groupRows.map((r) => ({
        id: Number(r.id),
        createdAt: formatDateTimeBr(r.created_at),
        fullName: r.full_name,
        phone: r.phone,
        cpf: r.cpf,
        sports: formatJogosSports(r.sports)
      }))
    });
  }

  const total = groups.reduce((acc, g) => acc + g.rows.length, 0);
  const buffer = await buildJogosDocx({
    heading: {
      title: "Inscritos — Jogos Variados",
      subtitle: `Total: ${total}`,
      departmentName: res.locals.site?.departmentName || "",
      exportedBy: req.admin?.email || "",
      exportedAt: formatDateTimeBr(new Date())
    },
    groups
  });

  res.setHeader("Content-Disposition", `attachment; filename="inscritos-jogos-variados-por-jogo.docx"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.send(buffer);
}

async function exportJogosCsv(req, res) {
  const q = String(req.query?.q || "").trim();
  const sport = String(req.query?.sport || "").trim().toLowerCase();
  const allowed = new Set(["domino", "sinuca", "travinho", "videogame_bomba_patch", "videogame_ps2", "dama"]);
  let sql = "SELECT * FROM jogos_inscricoes";
  const wheres = [];
  const params = [];
  if (q) {
    wheres.push("full_name LIKE ?");
    params.push(`%${q}%`);
  }
  if (sport && allowed.has(sport)) {
    if (sport === "videogame_bomba_patch" || sport === "videogame_ps2") {
      wheres.push("(sports LIKE ? OR sports LIKE ?)");
      params.push(`%\"videogame_bomba_patch\"%`, `%\"videogame_ps2\"%`);
    } else {
      wheres.push("sports LIKE ?");
      params.push(`%\"${sport}\"%`);
    }
  }
  if (wheres.length > 0) {
    sql += " WHERE " + wheres.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";
  const [rows] = await pool.execute(sql, params);
  const sportDefs = [
    { key: "domino", label: "Dominó" },
    { key: "sinuca", label: "Sinuca" },
    { key: "travinho", label: "Travinho" },
    { key: "videogame_bomba_patch", label: "Videogame (Bomba Patch)" },
    { key: "dama", label: "Dama" }
  ];

  const filterKey = sport === "videogame_ps2" ? "videogame_bomba_patch" : sport;
  const header = ["id", "created_at", "full_name", "phone", "cpf", "sports"];
  const lines = [];

  for (const def of sportDefs) {
    if (filterKey && allowed.has(filterKey) && def.key !== filterKey) continue;
    const group = rows.filter((r) => parseJogosSportKeys(r.sports).includes(def.key));
    if (group.length === 0) continue;

    lines.push(csvCell(`Jogo: ${def.label}`));
    lines.push(header.join(","));
    for (const r of group) {
      const values = [
        r.id,
        formatDateTimeBr(r.created_at),
        csvCell(r.full_name || ""),
        r.phone,
        r.cpf,
        csvCell(formatJogosSports(r.sports) || "")
      ];
      lines.push(values.join(","));
    }
    lines.push("");
  }

  if (lines.length === 0) {
    lines.push(header.join(","));
  }

  const csv = lines.join("\n");
  res.setHeader("Content-Disposition", `attachment; filename="inscritos-jogos-variados-por-jogo.csv"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send("\uFEFF" + csv);
}

module.exports.listJogos = listJogos;
module.exports.exportJogosCsv = exportJogosCsv;
module.exports.exportJogosDocx = exportJogosDocx;
