const content = require("../services/contentService");
const { trabalhoJovem } = require("../services/trabalhoJovemService");
const { getCorridaInscricaoById } = require("../models/corridaInscricaoModel");
const path = require("path");
const fs = require("fs");

function home(req, res) {
  res.render("home", {
    title: res.locals.site?.departmentName || "Secretaria Municipal da Juventude de Peri Mirim",
    gincana: content.gincana,
    corrida: content.corrida,
    feirinha: content.feirinha,
    news: content.news
  });
}

function inscricoes(req, res) {
  res.render("inscricoes", {
    title: "Inscrições",
    gincana: content.gincana
  });
}

function editais(req, res) {
  res.render("editais", {
    title: "Editais",
    gincana: content.gincana
  });
}

function editalPdf(req, res) {
  const dir = path.join(__dirname, "..", "public", "arquivos");
  const preferredNames = ["editaldagincana.pdf", "edital-da-gincana-2026.pdf", "editalGincana.pdf"];

  for (const name of preferredNames) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return res.download(p, name);
  }

  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    entries = [];
  }

  const pdfs = entries.filter((f) => /\.pdf$/i.test(f));
  const best =
    pdfs.find((f) => /edital/i.test(f) && /gincana/i.test(f)) ||
    pdfs.find((f) => /edital/i.test(f)) ||
    pdfs[0];

  if (!best) return res.status(404).send("Arquivo não encontrado.");
  return res.download(path.join(dir, best), best);
}

function inscricao(req, res) {
  const success = req.query?.success === "1";
  res.render("inscricao", {
    title: "Inscrição — Gincana Celebra Peri Mirim",
    gincana: content.gincana,
    form: {
      teamName: "",
      captainName: "",
      captainEmail: "",
      captainDob: "",
      phone: "",
      neighborhood: "",
      membersJson: "[]",
      termsImageRelease: false,
      termsResponsibility: false
    },
    errors: {},
    success
  });
}

async function inscricaoCorrida(req, res) {
  const success = req.query?.success === "1";
  const id = String(req.query?.id || "").trim();
  let corridaSuccess = null;
  if (success && /^\d+$/.test(id)) {
    try {
      corridaSuccess = await getCorridaInscricaoById(Number(id));
    } catch {
      corridaSuccess = null;
    }
  }
  res.render("inscricao-corrida", {
    title: "Inscrição — Corrida Celebra Peri Mirim",
    corrida: content.corrida,
    form: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      cpf: "",
      dob: "",
      termsImageRelease: false,
      termsResponsibility: false
    },
    errors: {},
    success,
    corridaSuccess
  });
}

function noticias(req, res) {
  res.render("noticias", {
    title: "Notícias da Juventude",
    news: content.news
  });
}

function trabalhoJovemPage(req, res) {
  res.render("trabalho-jovem", {
    title: "Trabalho Jovem",
    pageScript: "/public/js/trabalho-jovem.js",
    trabalhoJovem
  });
}

module.exports = {
  home,
  inscricoes,
  editais,
  editalPdf,
  inscricao,
  inscricaoCorrida,
  noticias,
  trabalhoJovem: trabalhoJovemPage
};
