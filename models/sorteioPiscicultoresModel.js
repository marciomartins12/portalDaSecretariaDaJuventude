const { pool } = require("../config/db");

function ticketFromId(id) {
  return String(id).padStart(3, "0");
}

async function createSorteioInscricao(data) {
  const [emailRows] = await pool.execute(
    "SELECT id FROM sorteio_piscicultores_inscricoes WHERE email = ? LIMIT 1",
    [data.email]
  );
  if (emailRows.length > 0) {
    const err = new Error("E-mail já cadastrado.");
    err.code = "DUPLICATE_EMAIL";
    throw err;
  }

  const [phoneRows] = await pool.execute(
    "SELECT id FROM sorteio_piscicultores_inscricoes WHERE phone = ? LIMIT 1",
    [data.phone]
  );
  if (phoneRows.length > 0) {
    const err = new Error("Telefone já cadastrado.");
    err.code = "DUPLICATE_PHONE";
    throw err;
  }

  const [cpfRows] = await pool.execute(
    "SELECT id FROM sorteio_piscicultores_inscricoes WHERE cpf = ? LIMIT 1",
    [data.cpf]
  );
  if (cpfRows.length > 0) {
    const err = new Error("CPF já cadastrado.");
    err.code = "DUPLICATE_CPF";
    throw err;
  }

  const fullName = String(data.fullName || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const phone = String(data.phone || "").trim();
  const address = String(data.address || "").trim();
  const cpf = String(data.cpf || "").trim();
  const caf = String(data.caf || "").trim();

  const [result] = await pool.execute(
    `INSERT INTO sorteio_piscicultores_inscricoes
      (full_name, email, phone, address, cpf, caf)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [fullName, email, phone, address, cpf, caf || null]
  );

  const id = result.insertId;
  const ticketNumber = ticketFromId(id);
  return { id, ticketNumber };
}

async function getSorteioInscricaoById(id) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email
     FROM sorteio_piscicultores_inscricoes
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: Number(row.id),
    fullName: row.full_name,
    email: row.email,
    ticketNumber: ticketFromId(row.id)
  };
}

module.exports = { createSorteioInscricao, getSorteioInscricaoById };
