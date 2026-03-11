const { pool } = require("../config/db");

async function createGincanaInscricao(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

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
      { name: data.captainName, dob: data.captainDob, isCaptain: 1 },
      ...data.members.map((m) => ({ name: m.name, dob: m.dob, isCaptain: 0 }))
    ];

    for (const p of participants) {
      await connection.execute(
        `INSERT INTO gincana_participantes
          (inscricao_id, full_name, dob, is_captain)
         VALUES (?, ?, ?, ?)`,
        [inscricaoId, p.name, p.dob, p.isCaptain]
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
