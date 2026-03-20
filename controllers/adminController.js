const content = require("../services/contentService");
const { authenticateAdmin, signAdminToken } = require("../services/adminAuthService");
const { CorridaInscricao, GincanaInscricao } = require("../models/indexSequelize");

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
      ranking
    }
  });
}

module.exports = { loginPage, loginSubmit, logout, dashboard };
