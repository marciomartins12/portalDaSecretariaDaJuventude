const express = require("express");

const { pool } = require("../config/db");
const pagesController = require("../controllers/pagesController");
const inscricaoController = require("../controllers/inscricaoController");
const { validateInscricaoGincana } = require("../middlewares/validateInscricaoGincana");
const { validateInscricaoCorrida } = require("../middlewares/validateInscricaoCorrida");
const { validateInscricaoSorteio } = require("../middlewares/validateInscricaoSorteio");
const { validateInscricaoJogos } = require("../middlewares/validateInscricaoJogos");

const router = express.Router();

router.get("/robots.txt", (req, res) => {
  const envBase = String(process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const proto = forwardedProto || req.protocol;
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || String(req.headers.host || "").trim();
  const baseUrl = envBase || (host ? `${proto}://${host}` : "");
  const sitemapUrl = baseUrl ? `${baseUrl}/sitemap.xml` : "/sitemap.xml";

  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${sitemapUrl}\n`);
});

router.get("/sitemap.xml", (req, res) => {
  const envBase = String(process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const proto = forwardedProto || req.protocol;
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || String(req.headers.host || "").trim();
  const baseUrl = envBase || (host ? `${proto}://${host}` : "");
  const now = new Date().toISOString();
  const toUrl = (path) => (baseUrl ? `${baseUrl}${path}` : path);

  const urls = [
    "/",
    "/inscricoes",
    "/eventos",
    "/gincana",
    "/gincana/provas/pdf",
    "/inscricoes/corrida",
    "/inscricoes/piscicultores",
    "/inscricoes/jogos",
    "/peri-mirim",
    "/editais",
    "/editais/gincana/pdf",
    "/noticias",
    "/trabalho-jovem"
  ];
  if (String(process.env.GINCANA_INSCRICOES_ABERTAS || "0").trim() === "1") {
    urls.splice(4, 0, "/inscricoes/gincana");
  }

  const body = urls
    .map((p) => {
      const loc = toUrl(p);
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`;
    })
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`;

  res.type("application/xml").send(xml);
});

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
router.get("/eventos", pagesController.eventos);
router.get("/gincana", pagesController.gincana);
router.get("/editais", pagesController.editais);

const gincanaInscricoesAbertas = String(process.env.GINCANA_INSCRICOES_ABERTAS || "0").trim() === "1";
if (gincanaInscricoesAbertas) {
  router.get("/inscricoes/gincana", pagesController.inscricao);
  router.post("/inscricoes/gincana/revisar", validateInscricaoGincana, inscricaoController.reviewGincana);
  router.post("/inscricoes/gincana/enviar", validateInscricaoGincana, inscricaoController.submitGincana);
  router.post("/inscricoes/gincana/editar", validateInscricaoGincana, inscricaoController.editGincana);
} else {
  router.get("/inscricoes/gincana", (req, res) => res.redirect(302, "/gincana"));
  router.post("/inscricoes/gincana/revisar", (req, res) => res.status(410).redirect(302, "/gincana"));
  router.post("/inscricoes/gincana/enviar", (req, res) => res.status(410).redirect(302, "/gincana"));
  router.post("/inscricoes/gincana/editar", (req, res) => res.status(410).redirect(302, "/gincana"));
}

router.get("/inscricoes/corrida", pagesController.inscricaoCorrida);
router.post(
  "/inscricoes/corrida",
  validateInscricaoCorrida,
  inscricaoController.submitCorrida
);

router.get("/inscricoes/piscicultores", pagesController.inscricaoSorteio);
router.post(
  "/inscricoes/piscicultores",
  validateInscricaoSorteio,
  inscricaoController.submitSorteio
);

router.get("/inscricoes/jogos", pagesController.inscricaoJogos);
router.post(
  "/inscricoes/jogos",
  validateInscricaoJogos,
  inscricaoController.submitJogos
);

router.get("/peri-mirim", pagesController.periMirim);

router.get("/inscricao", (req, res) => res.redirect(302, "/inscricoes"));
router.post("/inscricao", (req, res) => res.redirect(302, "/inscricoes"));

router.get("/edital", (req, res) => res.redirect(302, "/editais"));
router.get("/edital/pdf", (req, res) => res.redirect(302, "/editais/gincana/pdf"));

router.get("/editais/gincana/pdf", pagesController.editalPdf);
router.get("/gincana/provas/pdf", pagesController.gincanaProvasPdf);
router.get("/noticias", pagesController.noticias);
router.get("/trabalho-jovem", pagesController.trabalhoJovem);

module.exports = router;
