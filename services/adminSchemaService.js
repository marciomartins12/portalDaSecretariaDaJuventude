const mysql = require("mysql2/promise");

async function ensureColumn(connection, { database, table, columnName, ddl }) {
  const [rows] = await connection.execute(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ? LIMIT 1",
    [database, table, columnName]
  );
  if (rows.length > 0) return;
  try {
    await connection.execute(ddl);
  } catch (err) {
    process.stderr.write(`Falha ao criar coluna ${columnName} em ${table}: ${err?.message || String(err)}\n`);
  }
}

async function ensureAdminSchema() {
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
    database,
    multipleStatements: true
  });

  try {
    await ensureColumn(connection, {
      database,
      table: "gincana_participantes",
      columnName: "cpf",
      ddl: "ALTER TABLE `gincana_participantes` ADD COLUMN `cpf` VARCHAR(11) NULL"
    });
    await ensureColumn(connection, {
      database,
      table: "gincana_participantes",
      columnName: "address",
      ddl: "ALTER TABLE `gincana_participantes` ADD COLUMN `address` VARCHAR(220) NULL"
    });

    await ensureColumn(connection, {
      database,
      table: "corrida_inscricoes",
      columnName: "neighborhood",
      ddl: "ALTER TABLE `corrida_inscricoes` ADD COLUMN `neighborhood` VARCHAR(120) NULL"
    });
    await ensureColumn(connection, {
      database,
      table: "corrida_inscricoes",
      columnName: "age",
      ddl: "ALTER TABLE `corrida_inscricoes` ADD COLUMN `age` INT NOT NULL DEFAULT 0"
    });
  } finally {
    await connection.end();
  }
}

module.exports = { ensureAdminSchema };

