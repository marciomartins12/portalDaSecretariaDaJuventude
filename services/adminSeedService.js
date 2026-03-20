const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/sequelize");
const { Admin } = require("../models/indexSequelize");

async function initAdminSeed() {
  await sequelize.authenticate();
  await Admin.sync();

  const email = String(process.env.ADMIN_MASTER_EMAIL || "marciom1martins@gmail.com").trim().toLowerCase();
  const password = String(process.env.ADMIN_MASTER_PASSWORD || "admin123");
  const name = String(process.env.ADMIN_MASTER_NAME || "Administrador").trim();

  const exists = await Admin.findOne({ where: { email } });
  if (exists) {
    let changed = false;
    if (!exists.name && name) {
      exists.name = name;
      changed = true;
    }
    if (exists.role !== "MASTER") {
      exists.role = "MASTER";
      changed = true;
    }

    const ok = await bcrypt.compare(password, exists.passwordHash);
    if (!ok) {
      exists.passwordHash = await bcrypt.hash(password, 12);
      changed = true;
    }

    if (changed) await exists.save();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.create({ name, email, passwordHash, role: "MASTER" });
}

module.exports = { initAdminSeed };
