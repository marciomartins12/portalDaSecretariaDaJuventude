const { normalizeInscricaoCorrida } = require("../services/inscricaoService");
const { createGincanaInscricao } = require("../models/gincanaInscricaoModel");
const { createCorridaInscricao } = require("../models/corridaInscricaoModel");
const { createSorteioInscricao } = require("../models/sorteioPiscicultoresModel");
const { sendGincanaConfirmationEmail, sendCorridaConfirmationEmail, sendSorteioConfirmationEmail } = require("../services/mailService");

async function reviewGincana(req, res) {
  res.render("inscricao-gincana-revisar", {
    title: "Revisar inscrição — Gincana",
    data: req.inscricaoGincana
  });
}

async function editGincana(req, res) {
  res.render("inscricao", {
    title: "Inscrição — Gincana Celebra Peri Mirim",
    gincana: require("../services/contentService").gincana,
    success: false,
    form: {
      teamName: req.inscricaoGincana.teamName,
      captainName: req.inscricaoGincana.captainName,
      captainEmail: req.inscricaoGincana.captainEmail,
      captainCpf: req.inscricaoGincana.captainCpf,
      captainAddress: req.inscricaoGincana.captainAddress,
      captainDob: req.inscricaoGincana.captainDob,
      phone: req.inscricaoGincana.phone,
      neighborhood: req.inscricaoGincana.neighborhood,
      membersJson: JSON.stringify(req.inscricaoGincana.members),
      termsImageRelease: req.inscricaoGincana.termsImageRelease,
      termsResponsibility: req.inscricaoGincana.termsResponsibility
    },
    errors: {}
  });
}

async function submitGincana(req, res) {
  try {
    await createGincanaInscricao({
      ...req.inscricaoGincana,
      termsIp: req.ip
    });

    try {
      await sendGincanaConfirmationEmail({
        to: req.inscricaoGincana.captainEmail,
        data: req.inscricaoGincana,
        site: res.locals?.site
      });
    } catch (err) {
      process.stderr.write(`Falha ao enviar e-mail de confirmação: ${err?.message || String(err)}\n`);
    }

    res.redirect("/inscricoes/gincana?success=1");
  } catch (err) {
    process.stderr.write(`Falha ao enviar inscrição de gincana: ${err?.message || String(err)}\n`);
    if (err?.code === "DUPLICATE_CONTACT" || err?.code === "ER_DUP_ENTRY") {
      return res.status(400).render("inscricao", {
        title: "Inscrição — Gincana Celebra Peri Mirim",
        gincana: require("../services/contentService").gincana,
        success: false,
        form: {
          teamName: req.inscricaoGincana.teamName,
          captainName: req.inscricaoGincana.captainName,
          captainEmail: req.inscricaoGincana.captainEmail,
          captainCpf: req.inscricaoGincana.captainCpf,
          captainAddress: req.inscricaoGincana.captainAddress,
          captainDob: req.inscricaoGincana.captainDob,
          phone: String(req.body?.phone || ""),
          neighborhood: req.inscricaoGincana.neighborhood,
          membersJson: JSON.stringify(req.inscricaoGincana.members),
          termsImageRelease: req.inscricaoGincana.termsImageRelease,
          termsResponsibility: req.inscricaoGincana.termsResponsibility
        },
        errors: {
          captainEmail: "Este e-mail já está cadastrado nesta inscrição.",
          phone: "Este telefone já está cadastrado nesta inscrição."
        }
      });
    }

    res.status(500).render("inscricao", {
      title: "Inscrição — Gincana Celebra Peri Mirim",
      gincana: require("../services/contentService").gincana,
      success: false,
      form: {
        teamName: req.inscricaoGincana.teamName,
        captainName: req.inscricaoGincana.captainName,
        captainEmail: req.inscricaoGincana.captainEmail,
        captainCpf: req.inscricaoGincana.captainCpf,
        captainAddress: req.inscricaoGincana.captainAddress,
        captainDob: req.inscricaoGincana.captainDob,
        phone: String(req.body?.phone || ""),
        neighborhood: req.inscricaoGincana.neighborhood,
        membersJson: JSON.stringify(req.inscricaoGincana.members),
        termsImageRelease: req.inscricaoGincana.termsImageRelease,
        termsResponsibility: req.inscricaoGincana.termsResponsibility
      },
      errors: {
        form: "Tente novamente. Se o problema continuar, entre em contato com a Secretaria."
      }
    });
  }
}

async function submitCorrida(req, res) {
  try {
    const payload = req.inscricaoCorrida || normalizeInscricaoCorrida(req.body);
    const { id, bibNumber } = await createCorridaInscricao({ ...payload, termsIp: req.ip });

    try {
      await sendCorridaConfirmationEmail({
        to: payload.email,
        data: payload,
        bibNumber,
        corrida: require("../services/contentService").corrida,
        site: res.locals?.site
      });
    } catch (err) {
      process.stderr.write(`Falha ao enviar e-mail de confirmação: ${err?.message || String(err)}\n`);
    }

    res.redirect(`/inscricoes/corrida?success=1&id=${encodeURIComponent(String(id))}`);
  } catch (err) {
    process.stderr.write(`Falha ao enviar inscrição de corrida: ${err?.message || String(err)}\n`);
    if (
      err?.code === "DUPLICATE_EMAIL" ||
      err?.code === "DUPLICATE_PHONE" ||
      err?.code === "DUPLICATE_CPF" ||
      err?.code === "ER_DUP_ENTRY"
    ) {
      const errors = {};
      if (err?.code === "DUPLICATE_EMAIL") errors.email = "Este e-mail já está cadastrado.";
      if (err?.code === "DUPLICATE_PHONE") errors.phone = "Este telefone já está cadastrado.";
      if (err?.code === "DUPLICATE_CPF") errors.cpf = "Este CPF já está cadastrado.";
      if (err?.code === "ER_DUP_ENTRY") errors.form = "Já existe uma inscrição com este e-mail, telefone ou CPF.";

      return res.status(400).render("inscricao-corrida", {
        title: "Inscrição — Corrida Celebra Peri Mirim",
        success: false,
        form: {
          fullName: String(req.body?.fullName || ""),
          email: String(req.body?.email || ""),
          phone: String(req.body?.phone || ""),
          address: String(req.body?.address || ""),
          neighborhood: String(req.body?.neighborhood || ""),
          cpf: String(req.body?.cpf || ""),
          dob: String(req.body?.dob || ""),
          termsImageRelease: Boolean(req.body?.termsImageRelease),
          termsResponsibility: Boolean(req.body?.termsResponsibility)
        },
        errors
      });
    }

    res.status(500).render("inscricao-corrida", {
      title: "Inscrição — Corrida Celebra Peri Mirim",
      success: false,
      form: {
        fullName: String(req.body?.fullName || ""),
        email: String(req.body?.email || ""),
        phone: String(req.body?.phone || ""),
        address: String(req.body?.address || ""),
        neighborhood: String(req.body?.neighborhood || ""),
        cpf: String(req.body?.cpf || ""),
        dob: String(req.body?.dob || ""),
        termsImageRelease: Boolean(req.body?.termsImageRelease),
        termsResponsibility: Boolean(req.body?.termsResponsibility)
      },
      errors: {
        form: "Tente novamente. Se o problema continuar, entre em contato com a Secretaria."
      }
    });
  }
}

async function submitSorteio(req, res) {
  try {
    const payload = req.inscricaoSorteio;
    const { id, ticketNumber } = await createSorteioInscricao(payload);

    try {
      await sendSorteioConfirmationEmail({
        to: payload.email,
        data: payload,
        sorteio: require("../services/contentService").sorteio,
        ticketNumber,
        site: res.locals?.site
      });
    } catch (err) {
      process.stderr.write(`Falha ao enviar e-mail de confirmação (sorteio): ${err?.message || String(err)}\n`);
    }

    res.redirect(`/inscricoes/piscicultores?success=1&id=${encodeURIComponent(String(id))}`);
  } catch (err) {
    process.stderr.write(`Falha ao enviar inscrição do sorteio: ${err?.message || String(err)}\n`);
    if (
      err?.code === "DUPLICATE_EMAIL" ||
      err?.code === "DUPLICATE_PHONE" ||
      err?.code === "DUPLICATE_CPF" ||
      err?.code === "ER_DUP_ENTRY"
    ) {
      const errors = {};
      if (err?.code === "DUPLICATE_EMAIL") errors.email = "Este e-mail já está cadastrado.";
      if (err?.code === "DUPLICATE_PHONE") errors.phone = "Este telefone já está cadastrado.";
      if (err?.code === "DUPLICATE_CPF") errors.cpf = "Este CPF já está cadastrado.";
      if (err?.code === "ER_DUP_ENTRY") errors.form = "Já existe uma inscrição com este e-mail, telefone ou CPF.";

      return res.status(400).render("inscricao-sorteio", {
        title: "Inscrição — Sorteio para Piscicultores",
        success: false,
        sorteio: require("../services/contentService").sorteio,
        form: {
          fullName: String(req.body?.fullName || ""),
          email: String(req.body?.email || ""),
          phone: String(req.body?.phone || ""),
          address: String(req.body?.address || ""),
          cpf: String(req.body?.cpf || ""),
          caf: String(req.body?.caf || "")
        },
        errors
      });
    }

    res.status(500).render("inscricao-sorteio", {
      title: "Inscrição — Sorteio para Piscicultores",
      success: false,
      sorteio: require("../services/contentService").sorteio,
      form: {
        fullName: String(req.body?.fullName || ""),
        email: String(req.body?.email || ""),
        phone: String(req.body?.phone || ""),
        address: String(req.body?.address || ""),
        cpf: String(req.body?.cpf || ""),
        caf: String(req.body?.caf || "")
      },
      errors: {
        form: "Tente novamente. Se o problema continuar, entre em contato com a Secretaria."
      }
    });
  }
}

module.exports = { reviewGincana, editGincana, submitGincana, submitCorrida, submitSorteio };
