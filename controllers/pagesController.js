const content = require("../services/contentService");
const { trabalhoJovem } = require("../services/trabalhoJovemService");
const { getCorridaInscricaoById } = require("../models/corridaInscricaoModel");
const path = require("path");
const fs = require("fs");
const { getEditalGincanaFromPdf } = require("../services/editalPdfService");

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

async function edital(req, res) {
  let editalPdf = null;
  try {
    editalPdf = await getEditalGincanaFromPdf();
  } catch {
    editalPdf = null;
  }

  res.render("edital", {
    title: "Edital — Gincana da Juventude",
    gincana: content.gincana,
    editalPdf
  });
}

function editalPdf(req, res) {
  const filePath = path.join(__dirname, "..", "public", "arquivos", "edital-da-gincana-2026.pdf");
  if (!fs.existsSync(filePath)) return res.status(404).send("Arquivo não encontrado.");
  return res.download(filePath, "edital-da-gincana-2026-secretaria-de-juventude.pdf");
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
  edital,
  editalPdf,
  inscricao,
  inscricaoCorrida,
  noticias,
  trabalhoJovem: trabalhoJovemPage
};
