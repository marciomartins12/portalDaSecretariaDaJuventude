const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Admin } = require("../models/indexSequelize");

function getJwtSecret() {
  return process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "change-me";
}

function signAdminToken(admin) {
  const secret = getJwtSecret();
  return jwt.sign(
    { role: admin.role, email: admin.email },
    secret,
    { subject: String(admin.id), expiresIn: "8h" }
  );
}

function verifyAdminToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

async function authenticateAdmin({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const pass = String(password || "");

  const admin = await Admin.findOne({ where: { email: normalizedEmail } });
  if (!admin) return null;

  const ok = await bcrypt.compare(pass, admin.passwordHash);
  if (!ok) return null;

  return admin;
}

module.exports = { signAdminToken, verifyAdminToken, authenticateAdmin };
