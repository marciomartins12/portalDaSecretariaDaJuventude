require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { configureViewEngine } = require("./config/viewEngine");
const { initDatabase } = require("./config/dbInit");
const routes = require("./routes");

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function toTelHref(phone) {
  const digits = digitsOnly(phone);
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `tel:+${withCountry}`;
}

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "100kb" }));

app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
    etag: true,
    maxAge: "7d",
    immutable: true
  })
);

configureViewEngine(app);

app.use((req, res, next) => {
  const departmentName =
    process.env.DEPARTMENT_NAME || "Secretaria Municipal da Juventude de Peri Mirim";
  const municipalityName = process.env.MUNICIPALITY_NAME || "Prefeitura Municipal de Peri Mirim";
  const phone = process.env.CONTACT_PHONE || "(98) 99999-9999";
  const showFishBgEnv = String(process.env.SHOW_FISH_BG || "").trim();

  res.locals.site = {
    brandTitle: process.env.BRAND_TITLE || "Juventude",
    brandSubtitle: process.env.BRAND_SUBTITLE || "Peri Mirim",
    departmentName,
    municipalityName,
    tagline:
      process.env.SITE_TAGLINE || "Conectando oportunidades, talentos e o futuro da juventude.",
    secretaryName: process.env.SECRETARY_NAME || "Rhuana Ruthyele",
    secretaryRole: process.env.SECRETARY_ROLE || "Secretária Municipal da Juventude",
    phone,
    phoneHref: toTelHref(phone),
    instagramUrl: process.env.INSTAGRAM_URL || "https://instagram.com",
    instagramLabel: process.env.INSTAGRAM_LABEL || "Instagram",
    email: process.env.CONTACT_EMAIL || "contato@perimirim.ma.gov.br",
    address: process.env.CONTACT_ADDRESS || "Centro — Peri Mirim (MA)",
    hours: process.env.CONTACT_HOURS || "Seg a Sex • 8h às 13h",
    showFishBg: showFishBgEnv === "" ? true : showFishBgEnv === "1" || showFishBgEnv.toLowerCase() === "true"
  };

  next();
});

app.use(routes);

app.use((req, res) => {
  res.status(404).render("notFound", { title: "Página não encontrada" });
});

app.use((err, req, res, next) => {
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).render("error", {
    title: "Erro",
    message: "Não foi possível carregar esta página no momento."
  });
});

async function start() {
  try {
    await initDatabase();
  } catch (err) {
    process.stderr.write(`Falha ao inicializar o banco de dados: ${err?.message || String(err)}\n`);
  }

  app.listen(port, () => {
    process.stdout.write(`Servidor rodando em http://localhost:${port}\n`);
  });
}

start();
