const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function ensureIndex(connection, { database, table, indexName, ddl }) {
  const [rows] = await connection.execute(
    `SELECT 1
     FROM information_schema.statistics
     WHERE table_schema = ? AND table_name = ? AND index_name = ?
     LIMIT 1`,
    [database, table, indexName]
  );

  if (rows.length > 0) return;

  try {
    await connection.execute(ddl);
  } catch (err) {
    process.stderr.write(
      `Falha ao criar índice ${indexName} em ${table}: ${err?.message || String(err)}\n`
    );
  }
}

async function ensureColumn(connection, { database, table, columnName, existsSql, ddl }) {
  const [rows] = await connection.execute(existsSql, [database, table, columnName]);
  if (rows.length > 0) return;
  try {
    await connection.execute(ddl);
  } catch (err) {
    process.stderr.write(
      `Falha ao criar coluna ${columnName} em ${table}: ${err?.message || String(err)}\n`
    );
  }
}

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

    const columnExistsSql =
      "SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ? LIMIT 1";

    await ensureColumn(connection, {
      database,
      table: "corrida_inscricoes",
      columnName: "address",
      existsSql: columnExistsSql,
      ddl: "ALTER TABLE `corrida_inscricoes` ADD COLUMN `address` VARCHAR(220) NOT NULL DEFAULT ''"
    });
    await ensureColumn(connection, {
      database,
      table: "corrida_inscricoes",
      columnName: "cpf",
      existsSql: columnExistsSql,
      ddl: "ALTER TABLE `corrida_inscricoes` ADD COLUMN `cpf` VARCHAR(11) NULL"
    });
    await ensureColumn(connection, {
      database,
      table: "corrida_inscricoes",
      columnName: "dob",
      existsSql: columnExistsSql,
      ddl: "ALTER TABLE `corrida_inscricoes` ADD COLUMN `dob` DATE NULL"
    });

    await ensureIndex(connection, {
      database,
      table: "corrida_inscricoes",
      indexName: "uq_corrida_email",
      ddl: "ALTER TABLE `corrida_inscricoes` ADD UNIQUE KEY `uq_corrida_email` (`email`)"
    });
    await ensureIndex(connection, {
      database,
      table: "corrida_inscricoes",
      indexName: "uq_corrida_phone",
      ddl: "ALTER TABLE `corrida_inscricoes` ADD UNIQUE KEY `uq_corrida_phone` (`phone`)"
    });
    await ensureIndex(connection, {
      database,
      table: "corrida_inscricoes",
      indexName: "uq_corrida_cpf",
      ddl: "ALTER TABLE `corrida_inscricoes` ADD UNIQUE KEY `uq_corrida_cpf` (`cpf`)"
    });
    await ensureIndex(connection, {
      database,
      table: "gincana_inscricoes",
      indexName: "uq_gincana_captain_email",
      ddl: "ALTER TABLE `gincana_inscricoes` ADD UNIQUE KEY `uq_gincana_captain_email` (`captain_email`)"
    });
    await ensureIndex(connection, {
      database,
      table: "gincana_inscricoes",
      indexName: "uq_gincana_captain_phone",
      ddl: "ALTER TABLE `gincana_inscricoes` ADD UNIQUE KEY `uq_gincana_captain_phone` (`captain_phone`)"
    });
  } finally {
    await connection.end();
  }
}

module.exports = { initDatabase };
