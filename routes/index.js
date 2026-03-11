const express = require("express");

const pagesController = require("../controllers/pagesController");
const inscricaoController = require("../controllers/inscricaoController");
const { validateInscricaoGincana } = require("../middlewares/validateInscricaoGincana");
const { validateInscricaoCorrida } = require("../middlewares/validateInscricaoCorrida");

const router = express.Router();

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

router.get("/editais/gincana", pagesController.edital);
router.get("/editais/gincana/pdf", pagesController.editalPdf);
router.get("/noticias", pagesController.noticias);

module.exports = router;
