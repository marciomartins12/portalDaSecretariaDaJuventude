const { pool } = require("../config/db");

async function createCorridaInscricao(data) {
  const [result] = await pool.execute(
    `INSERT INTO corrida_inscricoes
      (full_name, email, phone, neighborhood, age, terms_image_release, terms_responsibility, terms_ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.fullName,
      data.email,
      data.phone,
      data.neighborhood,
      data.age,
      data.termsImageRelease ? 1 : 0,
      data.termsResponsibility ? 1 : 0,
      data.termsIp || null
    ]
  );

  return { id: result.insertId };
}

module.exports = { createCorridaInscricao };
