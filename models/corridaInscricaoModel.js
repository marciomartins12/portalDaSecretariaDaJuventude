const { pool } = require("../config/db");

function bibFromId(id) {
  return String(id).padStart(3, "0");
}

async function createCorridaInscricao(data) {
  const [emailRows] = await pool.execute(
    "SELECT id FROM corrida_inscricoes WHERE email = ? LIMIT 1",
    [data.email]
  );
  if (emailRows.length > 0) {
    const err = new Error("E-mail já cadastrado.");
    err.code = "DUPLICATE_EMAIL";
    throw err;
  }

  const [phoneRows] = await pool.execute(
    "SELECT id FROM corrida_inscricoes WHERE phone = ? LIMIT 1",
    [data.phone]
  );
  if (phoneRows.length > 0) {
    const err = new Error("Telefone já cadastrado.");
    err.code = "DUPLICATE_PHONE";
    throw err;
  }

  const [cpfRows] = await pool.execute(
    "SELECT id FROM corrida_inscricoes WHERE cpf = ? LIMIT 1",
    [data.cpf]
  );
  if (cpfRows.length > 0) {
    const err = new Error("CPF já cadastrado.");
    err.code = "DUPLICATE_CPF";
    throw err;
  }

  const [result] = await pool.execute(
    `INSERT INTO corrida_inscricoes
      (full_name, email, phone, address, neighborhood, cpf, dob, age, terms_image_release, terms_responsibility, terms_ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.fullName,
      data.email,
      data.phone,
      data.address,
      data.neighborhood || null,
      data.cpf,
      data.dob,
      data.age || 0,
      data.termsImageRelease ? 1 : 0,
      data.termsResponsibility ? 1 : 0,
      data.termsIp || null
    ]
  );

  const id = result.insertId;
  const bibNumber = bibFromId(id);

  return { id, bibNumber };
}

async function getCorridaInscricaoById(id) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email
     FROM corrida_inscricoes
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
    bibNumber: bibFromId(row.id)
  };
}

module.exports = { createCorridaInscricao, getCorridaInscricaoById };
