const express = require("express");

const adminController = require("../controllers/adminController");
const adminInscricoesController = require("../controllers/adminInscricoesController");
const adminAdminsController = require("../controllers/adminAdminsController");
const atendimentoController = require("../controllers/atendimentoController");
const mensagemController = require("../controllers/mensagemController");
const { requireAdmin, requireRole } = require("../middlewares/adminAuth");

const router = express.Router();

router.get("/login", adminController.loginPage);
router.post("/login", adminController.loginSubmit);
router.post("/logout", adminController.logout);

router.get("/", requireAdmin, adminController.dashboard);
router.get("/inscricoes", requireAdmin, adminInscricoesController.listEvents);
router.get("/inscricoes/corrida", requireAdmin, adminInscricoesController.listCorrida);
router.get("/inscricoes/corrida/export.docx", requireAdmin, adminInscricoesController.exportCorridaDocx);
router.post("/inscricoes/corrida/:id/delete", requireAdmin, adminInscricoesController.deleteCorrida);
router.get("/inscricoes/gincana", requireAdmin, adminInscricoesController.listGincana);
router.get("/inscricoes/gincana/export.docx", requireAdmin, adminInscricoesController.exportGincanaDocx);

router.get("/atendimentos", requireAdmin, atendimentoController.atendimentosPage);
router.get("/api/atendimentos", requireAdmin, atendimentoController.apiListAtendimentos);
router.post("/api/atendimentos/:id/assume", requireAdmin, atendimentoController.apiAssumirAtendimento);
router.post("/api/atendimentos/:id/release", requireAdmin, atendimentoController.apiLiberarAtendimento);
router.post("/api/atendimentos/:id/finalize", requireAdmin, atendimentoController.apiFinalizarAtendimento);
router.get("/api/atendimentos/:id/messages", requireAdmin, mensagemController.apiListMessages);
router.post("/api/atendimentos/:id/send", requireAdmin, mensagemController.apiSendMessage);

router.get("/api/whatsapp/status", requireAdmin, mensagemController.apiWhatsappStatus);
router.post("/api/whatsapp/connect", requireAdmin, mensagemController.apiWhatsappConnect);
router.get("/api/whatsapp/qr", requireAdmin, mensagemController.apiWhatsappQr);

router.get("/admins", requireAdmin, requireRole("MASTER"), adminAdminsController.listAdmins);
router.get("/admins/new", requireAdmin, requireRole("MASTER"), adminAdminsController.newAdminPage);
router.post("/admins", requireAdmin, requireRole("MASTER"), adminAdminsController.createAdmin);
router.get("/admins/:id/edit", requireAdmin, requireRole("MASTER"), adminAdminsController.editAdminPage);
router.post("/admins/:id", requireAdmin, requireRole("MASTER"), adminAdminsController.updateAdmin);
router.post("/admins/:id/delete", requireAdmin, requireRole("MASTER"), adminAdminsController.deleteAdmin);

module.exports = router;
