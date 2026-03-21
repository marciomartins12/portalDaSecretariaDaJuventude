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

  const fullName = String(data.fullName || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const phone = String(data.phone || "").trim();
  const address = String(data.address || "").trim();
  const neighborhood = String(data.neighborhood || "").trim();
  const cpf = String(data.cpf || "").trim();
  const dob = String(data.dob || "").trim();
  const age = data.age ? Number(data.age) : 0;
  const termsImageRelease = data.termsImageRelease ? 1 : 0;
  const termsResponsibility = data.termsResponsibility ? 1 : 0;
  const termsIp = data.termsIp || null;

  const baseColumns = [
    "full_name",
    "email",
    "phone",
    "address",
    "cpf",
    "dob",
    "terms_image_release",
    "terms_responsibility",
    "terms_ip"
  ];
  const baseValues = [fullName, email, phone, address, cpf, dob, termsImageRelease, termsResponsibility, termsIp];

  const candidates = [
    {
      columns: [...baseColumns.slice(0, 4), "neighborhood", ...baseColumns.slice(4), "age"],
      values: [...baseValues.slice(0, 4), neighborhood, ...baseValues.slice(4), Number.isFinite(age) ? age : 0]
    },
    {
      columns: [...baseColumns.slice(0, 4), "neighborhood", ...baseColumns.slice(4)],
      values: [...baseValues.slice(0, 4), neighborhood, ...baseValues.slice(4)]
    },
    { columns: [...baseColumns, "age"], values: [...baseValues, Number.isFinite(age) ? age : 0] },
    { columns: baseColumns, values: baseValues }
  ];

  let lastErr = null;
  for (const c of candidates) {
    try {
      const placeholders = c.columns.map(() => "?").join(", ");
      const [result] = await pool.execute(
        `INSERT INTO corrida_inscricoes (${c.columns.join(", ")}) VALUES (${placeholders})`,
        c.values
      );
      const id = result.insertId;
      const bibNumber = bibFromId(id);
      return { id, bibNumber };
    } catch (err) {
      const msg = String(err?.message || "");
      if (err?.code === "ER_BAD_FIELD_ERROR" || /Unknown column/i.test(msg)) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }

  if (lastErr) throw lastErr;
  throw new Error("Falha ao criar inscrição de corrida.");

  // unreachable
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
