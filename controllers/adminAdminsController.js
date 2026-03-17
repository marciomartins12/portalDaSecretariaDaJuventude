const bcrypt = require("bcryptjs");
const { Admin } = require("../models/indexSequelize");

async function listAdmins(req, res) {
  const rows = await Admin.findAll({ order: [["created_at", "DESC"]] });
  res.render("admin/admins", {
    layout: "admin",
    title: "Admin • Administradores",
    rows: rows.map((r) => ({ id: r.id, email: r.email, role: r.role }))
  });
}

function newAdminPage(req, res) {
  res.render("admin/admin-new", {
    layout: "admin",
    title: "Admin • Novo administrador",
    error: null,
    form: { email: "", role: "ADMIN" }
  });
}

async function createAdmin(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const role = String(req.body?.role || "ADMIN").trim() === "MASTER" ? "MASTER" : "ADMIN";

  if (!email || !password) {
    return res.status(400).render("admin/admin-new", {
      layout: "admin",
      title: "Admin • Novo administrador",
      error: "Preencha e-mail e senha.",
      form: { email, role }
    });
  }

  const exists = await Admin.findOne({ where: { email } });
  if (exists) {
    return res.status(400).render("admin/admin-new", {
      layout: "admin",
      title: "Admin • Novo administrador",
      error: "Já existe um administrador com este e-mail.",
      form: { email, role }
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.create({ email, passwordHash, role });
  return res.redirect("/admin/admins");
}

async function editAdminPage(req, res) {
  const id = Number(req.params?.id);
  const admin = await Admin.findByPk(id);
  if (!admin) return res.redirect("/admin/admins");

  res.render("admin/admin-edit", {
    layout: "admin",
    title: "Admin • Editar administrador",
    error: null,
    form: { id: admin.id, email: admin.email, role: admin.role }
  });
}

async function updateAdmin(req, res) {
  const id = Number(req.params?.id);
  const admin = await Admin.findByPk(id);
  if (!admin) return res.redirect("/admin/admins");

  const email = String(req.body?.email || "").trim().toLowerCase();
  const role = String(req.body?.role || "ADMIN").trim() === "MASTER" ? "MASTER" : "ADMIN";
  const password = String(req.body?.password || "");

  if (!email) {
    return res.status(400).render("admin/admin-edit", {
      layout: "admin",
      title: "Admin • Editar administrador",
      error: "Informe um e-mail válido.",
      form: { id: admin.id, email, role }
    });
  }

  const exists = await Admin.findOne({ where: { email } });
  if (exists && Number(exists.id) !== Number(admin.id)) {
    return res.status(400).render("admin/admin-edit", {
      layout: "admin",
      title: "Admin • Editar administrador",
      error: "Já existe um administrador com este e-mail.",
      form: { id: admin.id, email, role }
    });
  }

  if (admin.role === "MASTER" && role !== "MASTER") {
    const masterCount = await Admin.count({ where: { role: "MASTER" } });
    if (masterCount <= 1) {
      return res.status(400).render("admin/admin-edit", {
        layout: "admin",
        title: "Admin • Editar administrador",
        error: "Não é possível remover o último MASTER.",
        form: { id: admin.id, email, role: admin.role }
      });
    }
  }

  admin.email = email;
  admin.role = role;
  if (password) {
    admin.passwordHash = await bcrypt.hash(password, 12);
  }
  await admin.save();
  return res.redirect("/admin/admins");
}

async function deleteAdmin(req, res) {
  const id = Number(req.params?.id);
  if (!id) return res.redirect("/admin/admins");

  if (Number(req.admin?.id) === id) return res.redirect("/admin/admins");

  const admin = await Admin.findByPk(id);
  if (!admin) return res.redirect("/admin/admins");

  if (admin.role === "MASTER") {
    const masterCount = await Admin.count({ where: { role: "MASTER" } });
    if (masterCount <= 1) return res.redirect("/admin/admins");
  }

  await Admin.destroy({ where: { id } });
  return res.redirect("/admin/admins");
}

module.exports = { listAdmins, newAdminPage, createAdmin, editAdminPage, updateAdmin, deleteAdmin };

