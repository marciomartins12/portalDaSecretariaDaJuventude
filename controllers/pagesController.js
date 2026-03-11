const content = require("../services/contentService");
const PDFDocument = require("pdfkit");

function home(req, res) {
  res.render("home", {
    title: res.locals.site?.departmentName || "Secretaria Municipal da Juventude de Peri Mirim",
    gincana: content.gincana,
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

function edital(req, res) {
  res.render("edital", {
    title: "Edital — Gincana da Juventude",
    gincana: content.gincana,
    edital: content.edital
  });
}

function editalPdf(req, res) {
  const filename = "edital-gincana-juventude-peri-mirim.pdf";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  doc.info.Title = "Edital — Gincana da Juventude de Peri Mirim";
  doc.info.Author = "Secretaria Municipal da Juventude de Peri Mirim";

  doc.fontSize(20).text("EDITAL", { align: "center" });
  doc.moveDown(0.4);
  doc.fontSize(14).text(content.gincana.title, { align: "center" });
  doc.moveDown(0.6);
  doc.fontSize(11).fillColor("#333333").text(
    `${content.gincana.dateLabel} • ${content.gincana.location}`,
    { align: "center" }
  );
  doc.moveDown(1.2);

  doc.fillColor("#111111").fontSize(13).text("1. Objetivo", { continued: false });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#333333").text(content.edital.objective);
  doc.moveDown(0.9);

  doc.fillColor("#111111").fontSize(13).text("2. Regras", { continued: false });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#333333");
  content.edital.rules.forEach((r) => doc.text(`• ${r}`));
  doc.moveDown(0.9);

  doc.fillColor("#111111").fontSize(13).text("3. Cronograma", { continued: false });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#333333");
  content.edital.timeline.forEach((t) => doc.text(`• ${t.title}: ${t.desc}`));
  doc.moveDown(0.9);

  doc.fillColor("#111111").fontSize(13).text("4. Requisitos", { continued: false });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#333333");
  content.edital.requirements.forEach((r) => doc.text(`• ${r}`));
  doc.moveDown(0.9);

  doc.fillColor("#111111").fontSize(13).text("5. Premiação", { continued: false });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#333333");
  content.edital.prizes.forEach((p) => doc.text(`• ${p}`));
  doc.moveDown(1.2);

  doc.fillColor("#666666")
    .fontSize(9)
    .text("Secretaria Municipal da Juventude de Peri Mirim • Portal digital", {
      align: "center"
    });

  doc.end();
}

function inscricao(req, res) {
  const success = req.query?.success === "1";
  res.render("inscricao", {
    title: "Inscrição — Gincana da Juventude",
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

function inscricaoCorrida(req, res) {
  const success = req.query?.success === "1";
  res.render("inscricao-corrida", {
    title: "Inscrição — Corrida da Juventude",
    form: {
      fullName: "",
      email: "",
      phone: "",
      neighborhood: "",
      age: "",
      termsImageRelease: false,
      termsResponsibility: false
    },
    errors: {},
    success
  });
}

function noticias(req, res) {
  res.render("noticias", {
    title: "Notícias da Juventude",
    news: content.news
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
  noticias
};
