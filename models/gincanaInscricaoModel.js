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

    for (const p of participants) {
      const baseColumns = ["inscricao_id", "full_name", "dob", "is_captain"];
      const baseValues = [inscricaoId, p.name, p.dob, p.isCaptain];

      const candidates = [
        { columns: [...baseColumns, "cpf", "address"], values: [...baseValues, p.cpf || null, p.address || null] },
        { columns: [...baseColumns, "cpf"], values: [...baseValues, p.cpf || null] },
        { columns: [...baseColumns, "address"], values: [...baseValues, p.address || null] },
        { columns: baseColumns, values: baseValues }
      ];

      let lastErr = null;
      for (const c of candidates) {
        try {
          const placeholders = c.columns.map(() => "?").join(", ");
          await connection.execute(
            `INSERT INTO gincana_participantes (${c.columns.join(", ")}) VALUES (${placeholders})`,
            c.values
          );
          lastErr = null;
          break;
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
