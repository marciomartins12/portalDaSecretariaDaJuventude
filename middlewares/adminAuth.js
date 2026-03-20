const { verifyAdminToken } = require("../services/adminAuthService");
const { Admin } = require("../models/indexSequelize");

function getTokenFromRequest(req) {
  const fromCookie = req.cookies?.admin_token;
  if (fromCookie) return String(fromCookie);

  const auth = String(req.headers?.authorization || "");
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  return null;
}

async function requireAdmin(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.redirect("/admin/login");

    const payload = verifyAdminToken(token);
    const adminId = Number(payload?.sub);
    if (!adminId) return res.redirect("/admin/login");

    const admin = await Admin.findByPk(adminId);
    if (!admin) return res.redirect("/admin/login");

    req.admin = { id: admin.id, name: admin.name || "", email: admin.email, role: admin.role };
    res.locals.admin = req.admin;
    next();
  } catch {
    return res.redirect("/admin/login");
  }
}

function requireRole(role) {
  return (req, res, next) => {
    const r = req.admin?.role;
    if (r === role) return next();
    return res.status(403).render("admin/forbidden", { layout: "admin", title: "Acesso negado" });
  };
}

module.exports = { requireAdmin, requireRole };
