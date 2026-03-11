const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function initDatabase() {
  const auto = String(process.env.DB_AUTO_INIT || "0").trim() === "1";
  if (!auto) return;

  const host = process.env.DB_HOST || "127.0.0.1";
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "secretaria_juventude";

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
    const raw = fs.readFileSync(schemaPath, "utf8");
    const sql = raw
      .replace(/CREATE DATABASE IF NOT EXISTS\s+secretaria_juventude/gi, `CREATE DATABASE IF NOT EXISTS \`${database}\``)
      .replace(/USE\s+secretaria_juventude;/gi, `USE \`${database}\`;`);
    await connection.query(sql);
  } finally {
    await connection.end();
  }
}

module.exports = { initDatabase };
