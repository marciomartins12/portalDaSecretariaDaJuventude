const express = require("express");

const { pool } = require("../config/db");
const pagesController = require("../controllers/pagesController");
const inscricaoController = require("../controllers/inscricaoController");
const { validateInscricaoGincana } = require("../middlewares/validateInscricaoGincana");
const { validateInscricaoCorrida } = require("../middlewares/validateInscricaoCorrida");

const router = express.Router();

router.post("/track-device", async (req, res) => {
  const deviceId = String(req.body?.device_id || req.body?.deviceId || "").trim();
  if (!deviceId || deviceId.length > 80) return res.status(400).json({ ok: false });
  if (!/^[a-zA-Z0-9-]{12,80}$/.test(deviceId)) return res.status(400).json({ ok: false });

  try {
    await pool.execute(
      "INSERT INTO devices (device_id) VALUES (?) ON DUPLICATE KEY UPDATE device_id = device_id",
      [deviceId]
    );
  } catch (err) {
    process.stderr.write(`Falha ao registrar device_id: ${err?.message || String(err)}\n`);
  }

  return res.status(204).end();
});

router.get("/", pagesController.home);
router.get("/inscricoes", pagesController.inscricoes);
router.get("/editais", pagesController.editais);

router.get("/inscricoes/gincana", pagesController.inscricao);
router.post("/inscricoes/gincana/revisar", validateInscricaoGincana, inscricaoController.reviewGincana);
router.post("/inscricoes/gincana/enviar", validateInscricaoGincana, inscricaoController.submitGincana);
router.post("/inscricoes/gincana/editar", validateInscricaoGincana, inscricaoController.editGincana);

router.get("/inscricoes/corrida", pagesController.inscricaoCorrida);
router.post(
  "/inscricoes/corrida",
  validateInscricaoCorrida,
  inscricaoController.submitCorrida
);

router.get("/inscricao", (req, res) => res.redirect(302, "/inscricoes"));
router.post("/inscricao", (req, res) => res.redirect(302, "/inscricoes"));

router.get("/edital", (req, res) => res.redirect(302, "/editais"));
router.get("/edital/pdf", (req, res) => res.redirect(302, "/editais/gincana/pdf"));

router.get("/editais/gincana/pdf", pagesController.editalPdf);
router.get("/noticias", pagesController.noticias);
router.get("/trabalho-jovem", pagesController.trabalhoJovem);

module.exports = router;
