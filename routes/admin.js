const express = require("express");

const adminController = require("../controllers/adminController");
const adminInscricoesController = require("../controllers/adminInscricoesController");
const adminAdminsController = require("../controllers/adminAdminsController");
const { requireAdmin, requireRole } = require("../middlewares/adminAuth");

const router = express.Router();

router.get("/login", adminController.loginPage);
router.post("/login", adminController.loginSubmit);
router.post("/logout", adminController.logout);

router.get("/", requireAdmin, adminController.dashboard);
router.get("/device-count", requireAdmin, adminController.deviceCount);
router.get("/device-count/daily", requireAdmin, adminController.deviceDailyCount);
router.get("/inscricoes", requireAdmin, adminInscricoesController.listEvents);
router.get("/inscricoes/corrida", requireAdmin, adminInscricoesController.listCorrida);
router.get("/inscricoes/corrida/export.docx", requireAdmin, adminInscricoesController.exportCorridaDocx);
router.post("/inscricoes/corrida/:id/delete", requireAdmin, adminInscricoesController.deleteCorrida);
router.get("/inscricoes/gincana", requireAdmin, adminInscricoesController.listGincana);
router.get("/inscricoes/gincana/export.docx", requireAdmin, adminInscricoesController.exportGincanaDocx);
router.post("/inscricoes/gincana/:id/participants/add", requireAdmin, adminInscricoesController.addGincanaParticipant);
router.post(
  "/inscricoes/gincana/participants/:participantId/update",
  requireAdmin,
  adminInscricoesController.updateGincanaParticipant
);
router.post(
  "/inscricoes/gincana/participants/:participantId/delete",
  requireAdmin,
  adminInscricoesController.deleteGincanaParticipant
);
router.get("/inscricoes/sorteio", requireAdmin, adminInscricoesController.listSorteio);
router.get("/inscricoes/sorteio/export.csv", requireAdmin, adminInscricoesController.exportSorteioCsv);
router.get("/inscricoes/jogos", requireAdmin, adminInscricoesController.listJogos);
router.get("/inscricoes/jogos/export.csv", requireAdmin, adminInscricoesController.exportJogosCsv);

router.get("/admins", requireAdmin, requireRole("MASTER"), adminAdminsController.listAdmins);
router.get("/admins/new", requireAdmin, requireRole("MASTER"), adminAdminsController.newAdminPage);
router.post("/admins", requireAdmin, requireRole("MASTER"), adminAdminsController.createAdmin);
router.get("/admins/:id/edit", requireAdmin, requireRole("MASTER"), adminAdminsController.editAdminPage);
router.post("/admins/:id", requireAdmin, requireRole("MASTER"), adminAdminsController.updateAdmin);
router.post("/admins/:id/delete", requireAdmin, requireRole("MASTER"), adminAdminsController.deleteAdmin);

module.exports = router;
