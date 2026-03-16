const nodemailer = require("nodemailer");

function boolFromEnv(value, fallback) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return String(value).trim() === "1" || String(value).trim().toLowerCase() === "true";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateBr(isoDate) {
  const s = String(isoDate || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function maskCpf(cpfDigits) {
  const d = String(cpfDigits || "").replace(/\D/g, "");
  if (d.length !== 11) return d;
  return `***.***.${d.slice(6, 9)}-${d.slice(9)}`;
}

function buildGincanaConfirmationEmail(data, site) {
  const participants = [
    {
      name: data.captainName,
      dob: data.captainDob,
      cpf: data.captainCpf,
      address: data.captainAddress,
      tag: "Capitão"
    },
    ...data.members.map((m) => ({
      name: m.name,
      dob: m.dob,
      cpf: m.cpf,
      address: m.address,
      tag: ""
    }))
  ];

  const participantsRows = participants
    .map((p) => {
      const tag = p.tag
        ? `<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#0b1020;border:1px solid rgba(255,255,255,0.14);font-size:11px;font-weight:700;">${escapeHtml(p.tag)}</span>`
        : "";
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.10);">
            <div style="font-weight:800;color:rgba(248,250,252,0.96)">${escapeHtml(p.name)}${tag}</div>
            <div style="font-size:11px;color:rgba(148,163,184,0.9);margin-top:4px;">
              CPF: ${escapeHtml(maskCpf(p.cpf))} • ${escapeHtml(p.address)}
            </div>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.10);color:rgba(148,163,184,0.95);font-weight:700;vertical-align:top;">
            ${escapeHtml(formatDateBr(p.dob))}
          </td>
        </tr>
      `;
    })
    .join("");

  const subject = `Confirmação de inscrição — ${escapeHtml(data.teamName)} (${data.participantsTotal} participantes)`;

  const html = `
    <div style="margin:0;padding:0;background:#0b1020;color:rgba(248,250,252,0.96);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <div style="max-width:720px;margin:0 auto;padding:26px 18px;">
        <div style="padding:18px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:800;color:rgba(148,163,184,0.95);">
            ${escapeHtml(site?.departmentName || "Secretaria Municipal da Juventude")}
          </div>
          <h1 style="margin:10px 0 0;font-size:22px;letter-spacing:-0.01em;">
            Inscrição recebida com sucesso
          </h1>
          <p style="margin:10px 0 0;color:rgba(148,163,184,0.95);line-height:1.7;font-weight:650;">
            Olá, ${escapeHtml(data.captainName)}. Esta é a confirmação da inscrição da sua equipe na Gincana Celebra Peri Mirim.
          </p>
        </div>

        <div style="height:14px"></div>

        <div style="padding:18px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Equipe</div>
              <div style="margin-top:6px;font-weight:900;">${escapeHtml(data.teamName)}</div>
            </div>
            <div>
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Participantes</div>
              <div style="margin-top:6px;font-weight:900;">${escapeHtml(String(data.participantsTotal))}</div>
            </div>
            <div>
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Telefone</div>
              <div style="margin-top:6px;font-weight:800;">${escapeHtml(data.phone)}</div>
            </div>
            <div>
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">CPF</div>
              <div style="margin-top:6px;font-weight:800;">${escapeHtml(maskCpf(data.captainCpf))}</div>
            </div>
          </div>
        </div>

        <div style="height:14px"></div>

        <div style="padding:18px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">
            Lista da equipe
          </div>
          <div style="height:10px"></div>
          <table style="width:100%;border-collapse:collapse;border-radius:18px;overflow:hidden;">
            <thead>
              <tr>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.12);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(248,250,252,0.86);">Participante</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.12);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(248,250,252,0.86);">Nascimento</th>
              </tr>
            </thead>
            <tbody>
              ${participantsRows}
            </tbody>
          </table>

          <p style="margin:14px 0 0;color:rgba(148,163,184,0.95);line-height:1.7;font-weight:650;">
            Se você notar alguma informação incorreta, responda este e-mail ou entre em contato com a Secretaria.
          </p>
        </div>

        <div style="height:14px"></div>

        <div style="padding:14px 18px;border-radius:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:rgba(148,163,184,0.95);font-weight:650;line-height:1.7;">
          <div style="font-weight:900;color:rgba(248,250,252,0.92);">
            ${escapeHtml(site?.municipalityName || "Prefeitura Municipal")}
          </div>
          <div style="margin-top:6px;">
            ${escapeHtml(site?.departmentName || "Secretaria Municipal da Juventude")}
          </div>
          <div style="margin-top:10px;font-size:12px;">
            Este e-mail foi enviado automaticamente. Não compartilhe informações sensíveis.
          </div>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

function buildCorridaConfirmationEmail({ data, corrida, bibNumber }, site) {
  const subject = `Confirmação de inscrição — Corrida da Juventude (#${escapeHtml(bibNumber)})`;

  const html = `
    <div style="margin:0;padding:0;background:#0b1020;color:rgba(248,250,252,0.96);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <div style="max-width:720px;margin:0 auto;padding:26px 18px;">
        <div style="padding:18px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:800;color:rgba(148,163,184,0.95);">
            ${escapeHtml(site?.departmentName || "Secretaria Municipal da Juventude")}
          </div>
          <h1 style="margin:10px 0 0;font-size:22px;letter-spacing:-0.01em;">
            Inscrição confirmada
          </h1>
          <p style="margin:10px 0 0;color:rgba(148,163,184,0.95);line-height:1.7;font-weight:650;">
            Olá, ${escapeHtml(data.fullName)}. Esta é a confirmação da sua inscrição na Corrida da Juventude.
          </p>
        </div>

        <div style="height:14px"></div>

        <div style="padding:18px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
          <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:stretch;">
            <div style="flex:1 1 260px;min-width:240px;padding:14px;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Seu número</div>
              <div style="margin-top:6px;font-weight:900;font-size:28px;letter-spacing:0.06em;">${escapeHtml(bibNumber)}</div>
            </div>
            <div style="flex:2 1 340px;min-width:260px;padding:14px;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Evento</div>
              <div style="margin-top:6px;font-weight:900;">${escapeHtml(corrida?.title || "Corrida da Juventude")}</div>
              <div style="margin-top:8px;color:rgba(148,163,184,0.95);font-weight:650;line-height:1.6;">
                ${escapeHtml(corrida?.dateLabel || "")}${corrida?.location ? ` • ${escapeHtml(corrida.location)}` : ""}
              </div>
            </div>
          </div>
        </div>

        <div style="height:14px"></div>

        <div style="padding:18px;border-radius:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">E-mail</div>
              <div style="margin-top:6px;font-weight:800;">${escapeHtml(data.email)}</div>
            </div>
            <div>
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Telefone</div>
              <div style="margin-top:6px;font-weight:800;">${escapeHtml(data.phone)}</div>
            </div>
            <div>
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Bairro</div>
              <div style="margin-top:6px;font-weight:800;">${escapeHtml(data.neighborhood)}</div>
            </div>
            <div>
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Nascimento</div>
              <div style="margin-top:6px;font-weight:800;">${escapeHtml(formatDateBr(String(data.dob || "")))}</div>
            </div>
            <div style="grid-column:1/-1;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:900;color:rgba(148,163,184,0.95);">Endereço</div>
              <div style="margin-top:6px;font-weight:800;">${escapeHtml(data.address)}</div>
            </div>
          </div>

          <p style="margin:14px 0 0;color:rgba(148,163,184,0.95);line-height:1.7;font-weight:650;">
            Guarde este e-mail. Se precisar corrigir algum dado, responda esta mensagem ou entre em contato com a Secretaria.
          </p>
        </div>

        <div style="height:14px"></div>

        <div style="padding:14px 18px;border-radius:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:rgba(148,163,184,0.95);font-weight:650;line-height:1.7;">
          <div style="font-weight:900;color:rgba(248,250,252,0.92);">
            ${escapeHtml(site?.municipalityName || "Prefeitura Municipal")}
          </div>
          <div style="margin-top:6px;">
            ${escapeHtml(site?.departmentName || "Secretaria Municipal da Juventude")}
          </div>
          <div style="margin-top:10px;font-size:12px;">
            Este e-mail foi enviado automaticamente. Não compartilhe informações sensíveis.
          </div>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

function createTransportFromEnv() {
  const enabled = boolFromEnv(process.env.EMAIL_ENABLED, false);
  if (!enabled) return null;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const secure = boolFromEnv(process.env.SMTP_SECURE, port === 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

async function sendGincanaConfirmationEmail({ to, data, site }) {
  const transport = createTransportFromEnv();
  if (!transport) return { skipped: true };

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || site?.departmentName || "Secretaria Municipal da Juventude";
  const replyTo = process.env.SMTP_REPLY_TO || fromEmail;

  const { subject, html } = buildGincanaConfirmationEmail(data, site);

  await transport.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    replyTo,
    subject,
    html
  });

  return { skipped: false };
}

async function sendCorridaConfirmationEmail({ to, data, corrida, bibNumber, site }) {
  const transport = createTransportFromEnv();
  if (!transport) return { skipped: true };

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || site?.departmentName || "Secretaria Municipal da Juventude";
  const replyTo = process.env.SMTP_REPLY_TO || fromEmail;

  const { subject, html } = buildCorridaConfirmationEmail({ data, corrida, bibNumber }, site);

  await transport.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    replyTo,
    subject,
    html
  });

  return { skipped: false };
}

module.exports = { sendGincanaConfirmationEmail, sendCorridaConfirmationEmail };
