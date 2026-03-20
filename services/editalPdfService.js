const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

let cache = null;

function normalizeLine(line) {
  return String(line || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractHeader(lines) {
  const find = (re) => {
    for (const l of lines) {
      const m = re.exec(l);
      if (m) return m;
    }
    return null;
  };

  const numberMatch = find(/EDITAL\s*N[ºo]?\s*0*([0-9]+\/[0-9]{4})/i);
  const number = numberMatch ? numberMatch[1] : null;

  const cnpjMatch = find(/CNPJ:\s*([0-9.\-\/]+)/i);
  const cnpj = cnpjMatch ? cnpjMatch[1] : null;

  const addressMatch = find(/Rua\s+do\s+Azevedo.*CEP:\s*[0-9.\-]+/i);
  const address = addressMatch ? addressMatch[0] : null;

  const titleLine = lines.find((l) => /GINCANA/i.test(l) && /PERI-?MIRIM/i.test(l)) || null;

  return { number, cnpj, address, titleLine };
}

function parseSectionsFromLines(lines) {
  const sectionRe = /^(\d{1,2})\.\s+([A-ZÁÉÍÓÚÃÕÇ0-9][A-ZÁÉÍÓÚÃÕÇ0-9\s\-–—()\/.,]+)$/;
  const subRe = /^(\d{1,2})\.(\d{1,2})\s+(.+)$/;

  const sections = [];
  let introLines = [];
  let current = null;

  const pushSection = () => {
    if (!current) return;
    sections.push(current);
    current = null;
  };

  const pushBlock = (sec, block) => {
    if (!sec.blocks) sec.blocks = [];
    const last = sec.blocks[sec.blocks.length - 1];
    if (block.type === "list" && last && last.type === "list") {
      last.items.push(...block.items);
      return;
    }
    sec.blocks.push(block);
  };

  for (const raw of lines) {
    const line = normalizeLine(raw);
    if (!line) continue;

    const mSec = sectionRe.exec(line);
    if (mSec) {
      pushSection();
      current = {
        number: mSec[1],
        title: mSec[2],
        anchor: `sec-${mSec[1]}`,
        blocks: []
      };
      continue;
    }

    if (!current) {
      introLines.push(line);
      continue;
    }

    const mSub = subRe.exec(line);
    if (mSub) {
      pushBlock(current, { type: "h", text: `${mSub[1]}.${mSub[2]} ${mSub[3]}` });
      continue;
    }

    if (line.startsWith("•")) {
      const item = normalizeLine(line.replace(/^•\s*/, ""));
      if (item) pushBlock(current, { type: "list", items: [item] });
      continue;
    }

    pushBlock(current, { type: "p", text: line });
  }

  pushSection();
  return { introLines, sections };
}

async function getEditalGincanaFromPdf() {
  const pdfPath = path.join(__dirname, "..", "public", "arquivos", "edital-da-gincana-2026.pdf");
  const stat = fs.statSync(pdfPath);
  if (cache && cache.mtimeMs === stat.mtimeMs) return cache.data;

  const raw = fs.readFileSync(pdfPath);
  const parsed = await pdfParse(raw);

  const lines = String(parsed.text || "")
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const header = extractHeader(lines);
  const { introLines, sections } = parseSectionsFromLines(lines);

  const data = {
    pdfFileName: "edital-da-gincana-2026.pdf",
    pages: parsed.numpages || null,
    header,
    intro: introLines.slice(0, 30),
    sections
  };

  cache = { mtimeMs: stat.mtimeMs, data };
  return data;
}

module.exports = { getEditalGincanaFromPdf };

