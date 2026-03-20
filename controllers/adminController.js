const content = require("../services/contentService");
const { authenticateAdmin, signAdminToken } = require("../services/adminAuthService");
const { CorridaInscricao, GincanaInscricao } = require("../models/indexSequelize");
const { pool } = require("../config/db");

function loginPage(req, res) {
  res.render("admin/login", {
    layout: "admin",
    title: "Admin • Login",
    showPublicChrome: true,
    error: null,
    email: ""
  });
}

async function loginSubmit(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  const admin = await authenticateAdmin({ email, password });
  if (!admin) {
    return res.status(401).render("admin/login", {
      layout: "admin",
      title: "Admin • Login",
      showPublicChrome: true,
      error: "Credenciais inválidas.",
      email
    });
  }

  const token = signAdminToken(admin);
  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: String(process.env.NODE_ENV || "").trim() === "production",
    maxAge: 8 * 60 * 60 * 1000
  });
  return res.redirect("/admin");
}

function logout(req, res) {
  res.clearCookie("admin_token");
  res.redirect("/admin/login");
}

async function dashboard(req, res) {
  const [totalGincana, totalCorrida] = await Promise.all([
    GincanaInscricao.count(),
    CorridaInscricao.count()
  ]);

  let totalDispositivos = 0;
  try {
    const [rows] = await pool.execute("SELECT COUNT(*) AS total FROM devices");
    totalDispositivos = Number(rows?.[0]?.total || 0);
  } catch {
    totalDispositivos = 0;
  }

  const ranking = [
    { key: "gincana", name: content.gincana.title, total: totalGincana },
    { key: "corrida", name: content.corrida.title, total: totalCorrida }
  ].sort((a, b) => b.total - a.total);

  res.render("admin/dashboard", {
    layout: "admin",
    title: "Admin • Dashboard",
    stats: {
      totalEventos: 3,
      totalInscricoes: totalGincana + totalCorrida,
      totalGincana,
      totalCorrida,
      totalDispositivos,
      ranking
    }
  });
}

async function deviceCount(req, res) {
  try {
    const [rows] = await pool.execute("SELECT COUNT(*) AS total FROM devices");
    const total = Number(rows?.[0]?.total || 0);
    return res.json({ total });
  } catch (err) {
    process.stderr.write(`Falha ao contar devices: ${err?.message || String(err)}\n`);
    return res.status(500).json({ total: 0 });
  }
}

async function deviceDailyCount(req, res) {
  try {
    const [rows] = await pool.execute(
      "SELECT DATE(created_at) AS day, COUNT(*) AS total FROM devices GROUP BY day ORDER BY day DESC LIMIT 365"
    );
    return res.json(
      rows.map((r) => ({
        day: r.day ? String(r.day) : null,
        total: Number(r.total || 0)
      }))
    );
  } catch (err) {
    process.stderr.write(`Falha ao contar devices por dia: ${err?.message || String(err)}\n`);
    return res.status(500).json([]);
  }
}

module.exports = { loginPage, loginSubmit, logout, dashboard, deviceCount, deviceDailyCount };
