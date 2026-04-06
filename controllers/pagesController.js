const content = require("../services/contentService");
const { trabalhoJovem } = require("../services/trabalhoJovemService");
const { getCorridaInscricaoById } = require("../models/corridaInscricaoModel");
const { getSorteioInscricaoById } = require("../models/sorteioPiscicultoresModel");
const { getJogosInscricaoById } = require("../models/jogosInscricaoModel");
const { pool } = require("../config/db");
const path = require("path");
const fs = require("fs");

async function loadGincanaTeamsAndPodium() {
  let teams = [];
  let podium = { first: null, second: null, third: null };
  try {
    const [teamRows] = await pool.execute(
      "SELECT id, team_name, neighborhood, created_at FROM gincana_inscricoes ORDER BY created_at ASC, id ASC"
    );
    const [pRows] = await pool.execute(
      "SELECT inscricao_id, full_name, is_captain FROM gincana_participantes ORDER BY is_captain DESC, full_name ASC"
    );
    const byTeam = new Map();
    for (const p of pRows) {
      const k = Number(p.inscricao_id);
      if (!byTeam.has(k)) byTeam.set(k, []);
      byTeam.get(k).push({
        fullName: p.full_name,
        isCaptain: Boolean(p.is_captain),
        role: p.is_captain ? "Capitão" : "Integrante"
      });
    }
    const palette = [
      { key: "yellow", label: "Amarelo", color: "#ffe135" },
      { key: "red", label: "Vermelho", color: "#ff3d6b" },
      { key: "blue", label: "Azul", color: "#22d3ee" }
    ];

    teams = teamRows.map((t, idx) => {
      const id = Number(t.id);
      const members = byTeam.get(id) || [];
      const p = palette[idx % palette.length];
      return {
        id,
        order: idx + 1,
        teamName: t.team_name,
        neighborhood: t.neighborhood || "",
        colorKey: p.key,
        colorLabel: p.label,
        colorHex: p.color,
        membersCount: members.length,
        members
      };
    });
    const findById = (id) => teams.find((t) => t.id === id) || null;
    podium = {
      first: findById(2),
      second: findById(1),
      third: findById(3)
    };
  } catch {
    teams = [];
    podium = { first: null, second: null, third: null };
  }
  return { teams, podium };
}

async function home(req, res) {
  const { podium } = await loadGincanaTeamsAndPodium();
  res.render("home", {
    title: res.locals.site?.departmentName || "Secretaria Municipal da Juventude de Peri Mirim",
    metaDescription:
      "Portal oficial da Secretaria Municipal da Juventude de Peri Mirim (MA). Informações, editais, notícias e inscrições para eventos e oportunidades.",
    gincana: content.gincana,
    feirinha: content.feirinha,
    podium,
    news: content.news,
    preloadImages: ["/public/assets/LOGO-Juventude-BRANCO.png"]
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

async function eventos(req, res) {
  const { podium } = await loadGincanaTeamsAndPodium();
  res.render("eventos", {
    title: "Eventos",
    metaDescription:
      "Eventos e inscrições da Secretaria Municipal da Juventude de Peri Mirim (MA). Confira os próximos eventos e participe.",
    gincana: content.gincana,
    feirinha: content.feirinha,
    podium
  });
}

function prettifyProvaName(filename) {
  const base = String(filename || "").replace(/\.pdf$/i, "");
  const noPrefix = base.replace(/^\s*\d+\s*[-_. ]\s*/i, "");
  const words = noPrefix
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(" ").trim() || base;
}

function listGincanaProvas() {
  const dir = path.join(__dirname, "..", "public", "arquivos", "provas");
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    entries = [];
  }
  const pdfs = entries.filter((f) => /\.pdf$/i.test(f));
  pdfs.sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }));
  return pdfs.map((f) => ({
    file: f,
    name: prettifyProvaName(f),
    href: `/gincana/provas/${encodeURIComponent(f)}`
  }));
}

async function gincanaPage(req, res) {
  let provas = [];
  const { teams, podium } = await loadGincanaTeamsAndPodium();
  try {
    provas = listGincanaProvas();
  } catch {
    provas = [];
  }

  res.render("gincana", {
    title: "Gincana",
    metaDescription: "Acompanhe a Gincana Celebra Peri Mirim. Informações, comunicados e atualizações.",
    gincana: content.gincana,
    teams,
    podium,
    provas,
    preloadImages: ["/public/assets/fotoPrincipalDaGinacana.png"]
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

function gincanaProvasPdf(req, res) {
  const dir = path.join(__dirname, "..", "public", "arquivos");
  const preferredNames = ["provasdagincana.pdf", "provas-gincana.pdf", "provasGincana.pdf", "provas-da-gincana.pdf"];

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
    pdfs.find((f) => /provas/i.test(f) && /gincana/i.test(f)) ||
    pdfs.find((f) => /provas/i.test(f)) ||
    null;

  if (!best) return res.status(404).send("Arquivo não encontrado.");
  return res.download(path.join(dir, best), best);
}

function gincanaProvaDownload(req, res) {
  const dir = path.join(__dirname, "..", "public", "arquivos", "provas");
  const raw = String(req.params?.file || "");
  const file = path.basename(raw);
  if (!/\.pdf$/i.test(file)) return res.status(404).send("Arquivo não encontrado.");
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) return res.status(404).send("Arquivo não encontrado.");
  return res.download(full, file);
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

function periMirim(req, res) {
  res.render("peri-mirim", {
    title: "Peri Mirim (MA)",
    metaDescription:
      "Peri Mirim (MA) — Informações e serviços da Secretaria da Juventude. Acompanhe notícias, editais e inscrições.",
    gincana: content.gincana,
    corrida: content.corrida,
    feirinha: content.feirinha
  });
}

module.exports = {
  home,
  inscricoes,
  eventos,
  gincana: gincanaPage,
  editais,
  editalPdf,
  gincanaProvasPdf,
  gincanaProvaDownload,
  inscricao,
  inscricaoCorrida,
  noticias,
  trabalhoJovem: trabalhoJovemPage
  , inscricaoSorteio
  , inscricaoJogos
  , periMirim
};
