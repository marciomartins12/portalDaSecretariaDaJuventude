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

CREATE TABLE IF NOT EXISTS devices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  device_id VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_device_id (device_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sorteio_piscicultores_inscricoes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address VARCHAR(220) NOT NULL,
  cpf VARCHAR(11) NOT NULL,
  caf VARCHAR(30) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at),
  UNIQUE KEY uq_sorteio_email (email),
  UNIQUE KEY uq_sorteio_phone (phone),
  UNIQUE KEY uq_sorteio_cpf (cpf)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jogos_inscricoes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  cpf VARCHAR(11) NOT NULL,
  sports TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at),
  UNIQUE KEY uq_jogos_phone (phone),
  UNIQUE KEY uq_jogos_cpf (cpf)
) ENGINE=InnoDB;
