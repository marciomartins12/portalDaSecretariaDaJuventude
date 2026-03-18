const { pool } = require("../config/db");

async function getTableColumns(connection, table) {
  const database = process.env.DB_NAME || "secretaria_juventude";
  const [rows] = await connection.execute(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ?",
    [database, table]
  );
  return new Set(rows.map((r) => String(r.column_name)));
}

async function createGincanaInscricao(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      "SELECT id FROM gincana_inscricoes WHERE captain_email = ? OR captain_phone = ? LIMIT 1",
      [data.captainEmail, data.phone]
    );
    if (existingRows.length > 0) {
      const err = new Error("E-mail ou telefone já cadastrado.");
      err.code = "DUPLICATE_CONTACT";
      throw err;
    }

    const [result] = await connection.execute(
      `INSERT INTO gincana_inscricoes
        (
          team_name,
          captain_name,
          captain_email,
          captain_phone,
          neighborhood,
          captain_dob,
          participants_total,
          terms_image_release,
          terms_responsibility,
          terms_ip
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.teamName,
        data.captainName,
        data.captainEmail,
        data.phone,
        data.neighborhood,
        data.captainDob,
        data.participantsTotal,
        data.termsImageRelease ? 1 : 0,
        data.termsResponsibility ? 1 : 0,
        data.termsIp || null
      ]
    );

    const inscricaoId = result.insertId;

    const participants = [
      {
        name: data.captainName,
        dob: data.captainDob,
        cpf: data.captainCpf,
        address: data.captainAddress,
        isCaptain: 1
      },
      ...data.members.map((m) => ({
        name: m.name,
        dob: m.dob,
        cpf: m.cpf,
        address: m.address,
        isCaptain: 0
      }))
    ];

    const cols = await getTableColumns(connection, "gincana_participantes");
    const hasCpf = cols.has("cpf");
    const hasAddress = cols.has("address");

    for (const p of participants) {
      const columns = ["inscricao_id", "full_name", "dob", "is_captain"];
      const values = [inscricaoId, p.name, p.dob, p.isCaptain];

      if (hasCpf) {
        columns.push("cpf");
        values.push(p.cpf || null);
      }
      if (hasAddress) {
        columns.push("address");
        values.push(p.address || null);
      }

      const placeholders = columns.map(() => "?").join(", ");
      await connection.execute(
        `INSERT INTO gincana_participantes (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );
    }

    await connection.commit();
    return { id: inscricaoId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { createGincanaInscricao };
