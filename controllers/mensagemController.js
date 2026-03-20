const { pool } = require("../config/db");
const { getIo } = require("../socket");
const whatsappService = require("../services/whatsapp/whatsappService");

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePhone(value) {
  const digits = digitsOnly(value);
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

function getSignatureOrg() {
  return String(process.env.WHATSAPP_SIGNATURE_ORG || "Secretaria da Juventude").trim();
}

function buildAssinatura(adminName) {
  const name = String(adminName || "").trim();
  if (!name) return "";
  return `\n— ${name} (${getSignatureOrg()})`;
}

function extractEvolutionIncoming(payload) {
  const root = payload?.data ?? payload ?? {};

  const whatsappId =
    root?.key?.id ||
    root?.messageId ||
    root?.id ||
    payload?.messageId ||
    payload?.id ||
    null;

  const remoteJid = root?.key?.remoteJid || root?.remoteJid || root?.from || root?.sender || root?.chatId || "";
  const phone = normalizePhone(remoteJid);

  const msg = root?.message || root?.msg || root?.data?.message || null;
  const text =
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    root?.text ||
    root?.message ||
    "";

  const timestampRaw = root?.messageTimestamp || root?.timestamp || payload?.timestamp || null;
  let timestamp = new Date();
  if (timestampRaw) {
    const num = Number(timestampRaw);
    if (Number.isFinite(num) && num > 0) {
      timestamp = new Date(num < 10_000_000_000 ? num * 1000 : num);
    } else {
      const parsed = new Date(String(timestampRaw));
      if (!Number.isNaN(parsed.getTime())) timestamp = parsed;
    }
  }

  const content = String(text || "").trim();
  const finalContent = content ? content : "[Mensagem não textual]";

  return { whatsappId: whatsappId ? String(whatsappId) : null, phone, content: finalContent, timestamp };
}

function getWebhookSecret(req) {
  const header = String(req.headers["x-webhook-secret"] || req.headers["x_whatsapp_webhook_secret"] || "").trim();
  if (header) return header;
  const query = String(req.query?.secret || req.query?.token || "").trim();
  if (query) return query;
  return "";
}

function validateWebhook(req) {
  const expected = String(process.env.WHATSAPP_WEBHOOK_SECRET || "").trim();
  if (!expected) return true;
  const got = getWebhookSecret(req);
  return got && got === expected;
}

async function evolutionWebhook(req, res) {
  if (!validateWebhook(req)) return res.status(401).json({ error: "unauthorized" });

  const incoming = extractEvolutionIncoming(req.body || {});
  if (!incoming.phone) return res.status(400).json({ error: "payload inválido" });

  const connection = await pool.getConnection();
  let atendimentoId = null;
  try {
    await connection.beginTransaction();

    const [openRows] = await connection.execute(
      "SELECT id FROM atendimentos WHERE telefone = ? AND status IN ('aberto', 'em_atendimento') ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [incoming.phone]
    );

    if (openRows.length > 0) {
      atendimentoId = Number(openRows[0].id);
    } else {
      const [ins] = await connection.execute(
        "INSERT INTO atendimentos (telefone, status, data_inicio, last_activity_at, unread_count) VALUES (?, 'aberto', NOW(), NOW(), 0)",
        [incoming.phone]
      );
      atendimentoId = Number(ins.insertId);
    }

    try {
      await connection.execute(
        "INSERT INTO mensagens (atendimento_id, remetente, atendente_id, conteudo, whatsapp_id, status, timestamp) VALUES (?, 'cliente', NULL, ?, ?, 'enviado', ?)",
        [atendimentoId, incoming.content, incoming.whatsappId, incoming.timestamp]
      );
    } catch (err) {
      if (String(err?.code || "") === "ER_DUP_ENTRY") {
        await connection.rollback();
        return res.json({ ok: true, duplicated: true });
      }
      throw err;
    }

    await connection.execute(
      "UPDATE atendimentos SET last_activity_at = NOW(), unread_count = unread_count + 1 WHERE id = ?",
      [atendimentoId]
    );

    await connection.commit();

    const io = getIo();
    if (io) {
      io.emit("atendimento:update", { id: atendimentoId });
      io.to(`atendimento:${atendimentoId}`).emit("mensagem:new", {
        atendimentoId,
        remetente: "cliente",
        conteudo: incoming.content,
        timestamp: incoming.timestamp
      });
    }

    return res.json({ ok: true, atendimentoId });
  } catch (err) {
    try {
      await connection.rollback();
    } catch {}
    process.stderr.write(`Falha no webhook WhatsApp: ${err?.message || String(err)}\n`);
    return res.status(500).json({ error: "Falha ao processar webhook" });
  } finally {
    connection.release();
  }
}

async function apiListMessages(req, res) {
  const atendimentoId = Number(req.params?.id);
  if (!atendimentoId) return res.status(400).json({ error: "Atendimento inválido." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [atRows] = await connection.execute(
      "SELECT id, status FROM atendimentos WHERE id = ? FOR UPDATE",
      [atendimentoId]
    );
    if (atRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Atendimento não encontrado." });
    }

    await connection.execute("UPDATE atendimentos SET unread_count = 0 WHERE id = ?", [atendimentoId]);
    await connection.commit();

    const [rows] = await pool.execute(
      `SELECT id, remetente, atendente_id AS atendenteId, conteudo, status, timestamp
       FROM mensagens
       WHERE atendimento_id = ?
       ORDER BY timestamp ASC, id ASC
       LIMIT 1000`,
      [atendimentoId]
    );

    return res.json({
      items: rows.map((r) => ({
        id: Number(r.id),
        remetente: r.remetente,
        atendenteId: r.atendenteId ? Number(r.atendenteId) : null,
        conteudo: r.conteudo,
        status: r.status,
        timestamp: r.timestamp
      }))
    });
  } catch (err) {
    try {
      await connection.rollback();
    } catch {}
    process.stderr.write(`Falha ao listar mensagens: ${err?.message || String(err)}\n`);
    return res.status(500).json({ error: "Não foi possível carregar as mensagens." });
  } finally {
    connection.release();
  }
}

async function apiSendMessage(req, res) {
  const atendimentoId = Number(req.params?.id);
  if (!atendimentoId) return res.status(400).json({ error: "Atendimento inválido." });

  const messageRaw = String(req.body?.message || req.body?.mensagem || "");
  const message = messageRaw.trim();
  if (!message) return res.status(400).json({ error: "Mensagem vazia." });

  const adminId = Number(req.admin?.id);
  const adminName = String(req.admin?.name || req.admin?.email || "").trim();
  const assinatura = buildAssinatura(adminName);
  const finalText = `${message}${assinatura}`;

  const connection = await pool.getConnection();
  let phone = null;
  let mensagemId = null;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, telefone, status, atendente_id AS atendenteId FROM atendimentos WHERE id = ? FOR UPDATE",
      [atendimentoId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Atendimento não encontrado." });
    }
    const at = rows[0];
    if (String(at.status) === "finalizado") {
      await connection.rollback();
      return res.status(409).json({ error: "Atendimento finalizado." });
    }
    const currentAtendente = at.atendenteId ? Number(at.atendenteId) : null;
    if (!currentAtendente || currentAtendente !== adminId) {
      await connection.rollback();
      return res.status(409).json({ error: "Assuma o atendimento para responder." });
    }

    phone = String(at.telefone || "");

    const [ins] = await connection.execute(
      "INSERT INTO mensagens (atendimento_id, remetente, atendente_id, conteudo, whatsapp_id, status, timestamp) VALUES (?, 'atendente', ?, ?, NULL, 'enviado', NOW())",
      [atendimentoId, adminId, finalText]
    );
    mensagemId = Number(ins.insertId);
    await connection.execute("UPDATE atendimentos SET last_activity_at = NOW() WHERE id = ?", [atendimentoId]);
    await connection.commit();
  } catch (err) {
    try {
      await connection.rollback();
    } catch {}
    process.stderr.write(`Falha ao salvar mensagem: ${err?.message || String(err)}\n`);
    return res.status(500).json({ error: "Não foi possível enviar a mensagem." });
  } finally {
    connection.release();
  }

  let sentOk = false;
  let sendErr = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await whatsappService.sendText({ phone, message: finalText });
      sentOk = true;
      break;
    } catch (err) {
      sendErr = err;
    }
  }

  if (!sentOk) {
    try {
      if (mensagemId) await pool.execute("UPDATE mensagens SET status = 'erro' WHERE id = ? LIMIT 1", [mensagemId]);
    } catch {}

    process.stderr.write(`Falha ao enviar mensagem na Evolution API: ${sendErr?.message || String(sendErr)}\n`);
    return res.status(502).json({ error: "Falha ao enviar mensagem no WhatsApp." });
  }

  const io = getIo();
  if (io) {
    io.emit("atendimento:update", { id: atendimentoId });
    io.to(`atendimento:${atendimentoId}`).emit("mensagem:new", {
      atendimentoId,
      remetente: "atendente",
      conteudo: finalText,
      timestamp: new Date()
    });
  }

  return res.json({ ok: true });
}

async function apiWhatsappQr(req, res) {
  try {
    const data = await whatsappService.getQrCode();
    res.json({ ok: true, data });
  } catch (err) {
    process.stderr.write(`Falha ao obter QR: ${err?.message || String(err)}\n`);
    const detail = String(err?.message || "").trim();
    res.status(500).json({ error: detail ? detail.slice(0, 220) : "Não foi possível obter o QR Code." });
  }
}

async function apiWhatsappConnect(req, res) {
  try {
    const data = await whatsappService.connectWhatsapp();
    res.json({ ok: true, data });
  } catch (err) {
    process.stderr.write(`Falha ao conectar WhatsApp: ${err?.message || String(err)}\n`);
    const detail = String(err?.message || "").trim();
    res.status(500).json({ error: detail ? detail.slice(0, 220) : "Não foi possível iniciar conexão." });
  }
}

async function apiWhatsappStatus(req, res) {
  try {
    const state = await whatsappService.getConnectionState();
    const s = state?.state || state?.status || state?.instance?.state || state?.instance?.status || "";
    const normalized = String(s || "").trim().toLowerCase();
    const connected = ["open", "connected", "online", "ready"].includes(normalized)
      ? true
      : ["close", "closed", "disconnected", "offline", "connecting", "qrcode"].includes(normalized)
        ? false
        : null;
    res.json({ ok: true, connected, state });
  } catch (err) {
    res.json({ ok: true, connected: false, state: null });
  }
}

module.exports = {
  evolutionWebhook,
  apiListMessages,
  apiSendMessage,
  apiWhatsappQr,
  apiWhatsappConnect,
  apiWhatsappStatus
};
