const { normalizeInscricaoCorrida } = require("../services/inscricaoService");
const { createGincanaInscricao } = require("../models/gincanaInscricaoModel");
const { createCorridaInscricao } = require("../models/corridaInscricaoModel");
const { sendGincanaConfirmationEmail } = require("../services/mailService");

async function reviewGincana(req, res) {
  res.render("inscricao-gincana-revisar", {
    title: "Revisar inscrição — Gincana",
    data: req.inscricaoGincana
  });
}

async function editGincana(req, res) {
  res.render("inscricao", {
    title: "Inscrição — Gincana da Juventude",
    gincana: require("../services/contentService").gincana,
    success: false,
    form: {
      teamName: req.inscricaoGincana.teamName,
      captainName: req.inscricaoGincana.captainName,
      captainEmail: req.inscricaoGincana.captainEmail,
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
  } catch {
    res.status(500).render("inscricao", {
      title: "Inscrição — Gincana da Juventude",
      gincana: require("../services/contentService").gincana,
      success: false,
      form: {
        teamName: req.inscricaoGincana.teamName,
        captainName: req.inscricaoGincana.captainName,
        captainEmail: req.inscricaoGincana.captainEmail,
        captainDob: req.inscricaoGincana.captainDob,
        phone: req.inscricaoGincana.phone,
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
    await createCorridaInscricao({ ...payload, termsIp: req.ip });
    res.redirect("/inscricoes/corrida?success=1");
  } catch {
    res.status(500).render("inscricao-corrida", {
      title: "Inscrição — Corrida da Juventude",
      success: false,
      form: {
        fullName: String(req.body?.fullName || ""),
        email: String(req.body?.email || ""),
        phone: String(req.body?.phone || ""),
        neighborhood: String(req.body?.neighborhood || ""),
        age: String(req.body?.age || ""),
        termsImageRelease: Boolean(req.body?.termsImageRelease),
        termsResponsibility: Boolean(req.body?.termsResponsibility)
      },
      errors: {
        form: "Tente novamente. Se o problema continuar, entre em contato com a Secretaria."
      }
    });
  }
}

module.exports = { reviewGincana, editGincana, submitGincana, submitCorrida };
