CREATE DATABASE IF NOT EXISTS secretaria_juventude
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE secretaria_juventude;

CREATE TABLE IF NOT EXISTS gincana_inscricoes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_name VARCHAR(120) NOT NULL,
  captain_name VARCHAR(160) NOT NULL,
  captain_email VARCHAR(160) NOT NULL,
  captain_phone VARCHAR(40) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  captain_dob DATE NOT NULL,
  participants_total INT NOT NULL,
  terms_image_release TINYINT(1) NOT NULL DEFAULT 0,
  terms_responsibility TINYINT(1) NOT NULL DEFAULT 0,
  terms_ip VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at),
  UNIQUE KEY uq_gincana_captain_email (captain_email),
  UNIQUE KEY uq_gincana_captain_phone (captain_phone)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gincana_participantes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inscricao_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  dob DATE NOT NULL,
  cpf VARCHAR(11) NULL,
  address VARCHAR(220) NULL,
  is_captain TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inscricao_id (inscricao_id),
  CONSTRAINT fk_gincana_participantes_inscricao
    FOREIGN KEY (inscricao_id)
    REFERENCES gincana_inscricoes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS corrida_inscricoes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address VARCHAR(220) NOT NULL,
  neighborhood VARCHAR(120) NULL,
  cpf VARCHAR(11) NULL,
  dob DATE NULL,
  age INT NOT NULL DEFAULT 0,
  terms_image_release TINYINT(1) NOT NULL DEFAULT 0,
  terms_responsibility TINYINT(1) NOT NULL DEFAULT 0,
  terms_ip VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at),
  UNIQUE KEY uq_corrida_email (email),
  UNIQUE KEY uq_corrida_phone (phone),
  UNIQUE KEY uq_corrida_cpf (cpf)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS atendimentos (
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mensagens (
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
) ENGINE=InnoDB;
