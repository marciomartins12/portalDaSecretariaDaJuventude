const {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} = require("docx");

function cell(text, { bold = false, color = null } = {}) {
  const run = new TextRun({
    text: String(text ?? ""),
    bold,
    color: color || undefined
  });
  return new TableCell({
    children: [new Paragraph({ children: [run] })]
  });
}

function headCell(text) {
  return cell(text, { bold: true, color: "111827" });
}

function title(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: String(text),
        bold: true,
        size: 34
      })
    ]
  });
}

function subtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: String(text),
        size: 22,
        color: "475569"
      })
    ]
  });
}

function spacer(lines = 1) {
  return new Paragraph({ text: "", spacing: { after: 200 * lines } });
}

function metaLine(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: String(text || ""),
        size: 20,
        color: "475569"
      })
    ]
  });
}

function buildHeaderMeta(heading) {
  const lines = [];
  if (heading?.departmentName) lines.push(metaLine(heading.departmentName));
  if (heading?.exportedAt || heading?.exportedBy) {
    const by = heading?.exportedBy ? ` • Exportado por: ${heading.exportedBy}` : "";
    const at = heading?.exportedAt ? `Emissão: ${heading.exportedAt}` : "Emissão";
    lines.push(metaLine(`${at}${by}`));
  }
  if (lines.length === 0) return [];
  return [...lines, spacer(1)];
}

async function buildCorridaDocx({ heading, rows }) {
  const tableRows = [
    new TableRow({
      children: [
        headCell("Inscrição"),
        headCell("Data"),
        headCell("Nome"),
        headCell("E-mail"),
        headCell("Telefone"),
        headCell("Endereço"),
        headCell("Bairro"),
        headCell("CPF"),
        headCell("Nascimento"),
        headCell("Idade"),
        headCell("Imagem"),
        headCell("Respons."),
        headCell("IP")
      ]
    }),
    ...rows.map((r) =>
      new TableRow({
        children: [
          cell(`#${r.bib}`),
          cell(r.createdAt),
          cell(r.fullName),
          cell(r.email),
          cell(r.phone),
          cell(r.address),
          cell(r.neighborhood),
          cell(r.cpf),
          cell(r.dob),
          cell(r.age ?? ""),
          cell(r.termsImageRelease),
          cell(r.termsResponsibility),
          cell(r.termsIp)
        ]
      })
    )
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...buildHeaderMeta(heading),
          title(heading.title),
          subtitle(heading.subtitle),
          spacer(1),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          })
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}

async function buildGincanaDocx({ heading, teams }) {
  const children = [...buildHeaderMeta(heading), title(heading.title), subtitle(heading.subtitle), spacer(1)];

  for (const team of teams) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Equipe: ${team.teamName}`, bold: true, size: 28 }),
          new TextRun({ text: `  •  Inscrição #${team.id}`, color: "475569", size: 22 })
        ]
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Criado em: ", bold: true, size: 22 }),
          new TextRun({ text: `${team.createdAt}`, size: 22 })
        ]
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Líder: ", bold: true, size: 22 }),
          new TextRun({ text: `${team.captainName} • ${team.captainEmail} • ${team.captainPhone}`, size: 22 })
        ]
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "CPF: ", bold: true, size: 22 }),
          new TextRun({ text: `${team.captainCpf || ""}`, size: 22 }),
          new TextRun({ text: "   Endereço: ", bold: true, size: 22 }),
          new TextRun({ text: `${team.captainAddress || ""}`, size: 22 })
        ]
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Bairro: ", bold: true, size: 22 }),
          new TextRun({ text: `${team.neighborhood}`, size: 22 }),
          new TextRun({ text: "   Nascimento: ", bold: true, size: 22 }),
          new TextRun({ text: `${team.captainDob}`, size: 22 }),
          new TextRun({ text: "   Idade: ", bold: true, size: 22 }),
          new TextRun({ text: String(team.captainAge ?? ""), size: 22 })
        ]
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Participantes informados: ", bold: true, size: 22 }),
          new TextRun({ text: String(team.participantsTotal), size: 22 }),
          new TextRun({ text: "   Imagem: ", bold: true, size: 22 }),
          new TextRun({ text: team.termsImageRelease, size: 22 }),
          new TextRun({ text: "   Respons.: ", bold: true, size: 22 }),
          new TextRun({ text: team.termsResponsibility, size: 22 })
        ]
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "IP: ", bold: true, size: 22 }),
          new TextRun({ text: team.termsIp || "", size: 22 })
        ]
      })
    );

    children.push(spacer(1));

    const tRows = [
      new TableRow({
        children: [headCell("Nome"), headCell("Nascimento"), headCell("Idade"), headCell("CPF"), headCell("Endereço"), headCell("Papel")]
      }),
      ...team.participants.map((p) =>
        new TableRow({
          children: [
            cell(p.fullName),
            cell(p.dob),
            cell(p.age ?? ""),
            cell(p.cpf || ""),
            cell(p.address || ""),
            cell(p.role)
          ]
        })
      )
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tRows
      })
    );

    children.push(spacer(2));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  return Packer.toBuffer(doc);
}

module.exports = { buildCorridaDocx, buildGincanaDocx };
