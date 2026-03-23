const content = require("../services/contentService");
const { trabalhoJovem } = require("../services/trabalhoJovemService");
const { getCorridaInscricaoById } = require("../models/corridaInscricaoModel");
const { getSorteioInscricaoById } = require("../models/sorteioPiscicultoresModel");
const { getJogosInscricaoById } = require("../models/jogosInscricaoModel");
const path = require("path");
const fs = require("fs");

function home(req, res) {
  res.render("home", {
    title: res.locals.site?.departmentName || "Secretaria Municipal da Juventude de Peri Mirim",
    metaDescription:
      "Portal oficial da Secretaria Municipal da Juventude de Peri Mirim (MA). Informações, editais, notícias e inscrições para eventos e oportunidades.",
    gincana: content.gincana,
    corrida: content.corrida,
    feirinha: content.feirinha,
    news: content.news
  });
}

function inscricoes(req, res) {
  res.render("inscricoes", {
    title: "Inscrições",
    metaDescription:
      "Página de inscrições da Secretaria Municipal da Juventude de Peri Mirim (MA). Acesse os eventos disponíveis e faça sua inscrição.",
    gincana: content.gincana
  });
}

function editais(req, res) {
  res.render("editais", {
    title: "Editais",
    metaDescription:
      "Editais e documentos oficiais da Secretaria Municipal da Juventude de Peri Mirim (MA). Consulte regras, prazos e arquivos em PDF.",
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
    metaDescription:
      "Formulário de inscrição da Gincana Celebra Peri Mirim. Cadastre sua equipe, informe os participantes e confirme os termos.",
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
    metaDescription:
      "Formulário de inscrição da Corrida Celebra Peri Mirim. Preencha seus dados, aceite os termos e confirme sua inscrição.",
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

async function inscricaoSorteio(req, res) {
  const success = req.query?.success === "1";
  const id = String(req.query?.id || "").trim();
  let sorteioSuccess = null;
  if (success && /^\d+$/.test(id)) {
    try {
      sorteioSuccess = await getSorteioInscricaoById(Number(id));
    } catch {
      sorteioSuccess = null;
    }
  }
  res.render("inscricao-sorteio", {
    title: "Inscrição — Sorteio para Piscicultores",
    metaDescription:
      "Inscrição para o Sorteio de 10 mil alevinos durante a Feirinha do Povo.",
    sorteio: content.sorteio,
    form: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      cpf: "",
      caf: ""
    },
    errors: {},
    success,
    sorteioSuccess
  });
}

function noticias(req, res) {
  res.render("noticias", {
    title: "Notícias da Juventude",
    metaDescription:
      "Notícias, comunicados e atualizações da Secretaria Municipal da Juventude de Peri Mirim (MA).",
    news: content.news
  });
}

function trabalhoJovemPage(req, res) {
  res.render("trabalho-jovem", {
    title: "Trabalho Jovem",
    metaDescription:
      "Recursos, avisos e links do Trabalho Jovem. Informações e orientações para jovens de Peri Mirim (MA).",
    pageScript: "/public/js/trabalho-jovem.js",
    trabalhoJovem
  });
}

async function inscricaoJogos(req, res) {
  const success = req.query?.success === "1";
  const id = String(req.query?.id || "").trim();
  let jogosSuccess = null;
  if (success && /^\d+$/.test(id)) {
    try {
      jogosSuccess = await getJogosInscricaoById(Number(id));
    } catch {
      jogosSuccess = null;
    }
  }
  res.render("inscricao-jogos", {
    title: "Inscrição — Jogos Variados",
    metaDescription: "Inscrição para Jogos Variados. Selecione os esportes e informe seus dados.",
    form: {
      fullName: "",
      phone: "",
      cpf: "",
      sports: []
    },
    errors: {},
    success,
    jogosSuccess
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
  , inscricaoSorteio
  , inscricaoJogos
};
