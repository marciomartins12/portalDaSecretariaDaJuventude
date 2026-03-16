const { pool } = require("../config/db");

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
          captain_cpf,
          captain_address,
          captain_phone,
          neighborhood,
          captain_dob,
          participants_total,
          terms_image_release,
          terms_responsibility,
          terms_ip
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.teamName,
        data.captainName,
        data.captainEmail,
        data.captainCpf,
        data.captainAddress,
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
      await connection.execute(
        `INSERT INTO gincana_participantes
          (inscricao_id, full_name, dob, cpf, address, is_captain)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [inscricaoId, p.name, p.dob, p.cpf, p.address, p.isCaptain]
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
