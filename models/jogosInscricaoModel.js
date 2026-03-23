const { pool } = require("../config/db");

async function createJogosInscricao(data) {
  const fullName = String(data.fullName || "").trim();
  const phone = String(data.phone || "").trim();
  const cpf = String(data.cpf || "").trim();
  const sports = Array.isArray(data.sports) ? data.sports : [];
  const sportsJson = JSON.stringify(sports);

  const [phoneRows] = await pool.execute("SELECT id FROM jogos_inscricoes WHERE phone = ? LIMIT 1", [phone]);
  if (phoneRows.length > 0) {
    const err = new Error("Telefone já cadastrado.");
    err.code = "DUPLICATE_PHONE";
    throw err;
  }
  const [cpfRows] = await pool.execute("SELECT id FROM jogos_inscricoes WHERE cpf = ? LIMIT 1", [cpf]);
  if (cpfRows.length > 0) {
    const err = new Error("CPF já cadastrado.");
    err.code = "DUPLICATE_CPF";
    throw err;
  }

  const [result] = await pool.execute(
    "INSERT INTO jogos_inscricoes (full_name, phone, cpf, sports) VALUES (?, ?, ?, ?)",
    [fullName, phone, cpf, sportsJson]
  );
  return { id: result.insertId };
}

async function getJogosInscricaoById(id) {
  const [rows] = await pool.execute(
    "SELECT id, full_name, phone, cpf, sports FROM jogos_inscricoes WHERE id = ? LIMIT 1",
    [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  let sports = [];
  try {
    sports = JSON.parse(r.sports || "[]");
  } catch {
    sports = [];
  }
  return { id: Number(r.id), fullName: r.full_name, phone: r.phone, cpf: r.cpf, sports };
}

module.exports = { createJogosInscricao, getJogosInscricaoById };

