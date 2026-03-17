const { Admin } = require("./Admin");
const { GincanaInscricao } = require("./GincanaInscricao");
const { GincanaParticipante } = require("./GincanaParticipante");
const { CorridaInscricao } = require("./CorridaInscricao");

GincanaInscricao.hasMany(GincanaParticipante, {
  foreignKey: "inscricaoId",
  sourceKey: "id",
  as: "participants"
});
GincanaParticipante.belongsTo(GincanaInscricao, {
  foreignKey: "inscricaoId",
  targetKey: "id",
  as: "inscricao"
});

module.exports = {
  Admin,
  GincanaInscricao,
  GincanaParticipante,
  CorridaInscricao
};
