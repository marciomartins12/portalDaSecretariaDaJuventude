const express = require("express");

const mensagemController = require("../controllers/mensagemController");

const router = express.Router();

router.post("/whatsapp/evolution", mensagemController.evolutionWebhook);

module.exports = router;
