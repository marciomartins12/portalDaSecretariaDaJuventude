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

async function ensureTable(connection, { database, table, ddl }) {
  const [rows] = await connection.execute(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ? LIMIT 1",
    [database, table]
  );
  if (rows.length > 0) return;
  try {
    await connection.execute(ddl);
  } catch (err) {
    process.stderr.write(`Falha ao criar tabela ${table}: ${err?.message || String(err)}\n`);
  }
}

async function ensureIndex(connection, { database, table, indexName, ddl }) {
  const [rows] = await connection.execute(
    "SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1",
    [database, table, indexName]
  );
  if (rows.length > 0) return;
  try {
    await connection.execute(ddl);
  } catch (err) {
    process.stderr.write(`Falha ao criar índice ${indexName} em ${table}: ${err?.message || String(err)}\n`);
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
    await ensureTable(connection, {
      database,
      table: "atendimentos",
      ddl: `CREATE TABLE IF NOT EXISTS atendimentos (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        telefone VARCHAR(40) NOT NULL,
        status ENUM('aberto', 'em_atendimento', 'finalizado') NOT NULL DEFAULT 'aberto',
        atendente_id BIGINT UNSIGNED NULL,
        data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data_fim DATETIME NULL,
        last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        unread_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_status (status),
        KEY idx_telefone (telefone),
        KEY idx_last_activity (last_activity_at),
        KEY idx_atendente (atendente_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    });

    await ensureTable(connection, {
      database,
      table: "mensagens",
      ddl: `CREATE TABLE IF NOT EXISTS mensagens (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        atendimento_id BIGINT UNSIGNED NOT NULL,
        remetente ENUM('cliente', 'atendente') NOT NULL,
        atendente_id BIGINT UNSIGNED NULL,
        conteudo TEXT NOT NULL,
        whatsapp_id VARCHAR(120) NULL,
        status ENUM('enviado', 'erro') NOT NULL DEFAULT 'enviado',
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_atendimento_id (atendimento_id),
        KEY idx_timestamp (timestamp),
        UNIQUE KEY uq_whatsapp_id (whatsapp_id),
        CONSTRAINT fk_mensagens_atendimento
          FOREIGN KEY (atendimento_id)
          REFERENCES atendimentos (id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    });

    await ensureIndex(connection, {
      database,
      table: "mensagens",
      indexName: "uq_whatsapp_id",
      ddl: "ALTER TABLE `mensagens` ADD UNIQUE KEY `uq_whatsapp_id` (`whatsapp_id`)"
    });

    await ensureColumn(connection, {
      database,
      table: "admins",
      columnName: "name",
      ddl: "ALTER TABLE `admins` ADD COLUMN `name` VARCHAR(120) NOT NULL DEFAULT ''"
    });

    await ensureColumn(connection, {
      database,
      table: "admins",
      columnName: "presence_status",
      ddl: "ALTER TABLE `admins` ADD COLUMN `presence_status` ENUM('online', 'offline') NOT NULL DEFAULT 'offline'"
    });

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
