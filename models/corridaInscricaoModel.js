const { pool } = require("../config/db");

function bibFromId(id) {
  return String(id).padStart(3, "0");
}

async function getTableColumns(table) {
  const database = process.env.DB_NAME || "secretaria_juventude";
  const [rows] = await pool.execute(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ?",
    [database, table]
  );
  return new Set(rows.map((r) => String(r.column_name)));
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

  const cols = await getTableColumns("corrida_inscricoes");
  const columns = ["full_name", "email", "phone", "address", "cpf", "dob", "terms_image_release", "terms_responsibility", "terms_ip"];
  const values = [
    data.fullName,
    data.email,
    data.phone,
    data.address,
    data.cpf,
    data.dob,
    data.termsImageRelease ? 1 : 0,
    data.termsResponsibility ? 1 : 0,
    data.termsIp || null
  ];

  if (cols.has("neighborhood")) {
    const neighborhood = String(data.neighborhood || "").trim();
    columns.splice(4, 0, "neighborhood");
    values.splice(4, 0, neighborhood);
  }
  if (cols.has("age")) {
    const age = data.age ? Number(data.age) : 0;
    const dobIndex = columns.indexOf("dob");
    columns.splice(dobIndex + 1, 0, "age");
    values.splice(dobIndex + 1, 0, Number.isFinite(age) ? age : 0);
  }

  const placeholders = columns.map(() => "?").join(", ");
  const [result] = await pool.execute(
    `INSERT INTO corrida_inscricoes (${columns.join(", ")}) VALUES (${placeholders})`,
    values
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
