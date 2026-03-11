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
  KEY idx_captain_email (captain_email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gincana_participantes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inscricao_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  dob DATE NOT NULL,
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
  neighborhood VARCHAR(120) NOT NULL,
  age INT NOT NULL,
  terms_image_release TINYINT(1) NOT NULL DEFAULT 0,
  terms_responsibility TINYINT(1) NOT NULL DEFAULT 0,
  terms_ip VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at),
  KEY idx_email (email)
) ENGINE=InnoDB;
