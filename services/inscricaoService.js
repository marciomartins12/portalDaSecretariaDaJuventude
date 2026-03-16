function normalizeInscricao(body) {
  const safe = {
    teamName: String(body?.teamName || "").trim(),
    leaderName: String(body?.leaderName || "").trim(),
    phone: String(body?.phone || "").trim(),
    neighborhood: String(body?.neighborhood || "").trim(),
    age: Number(String(body?.age || "").trim()),
    participantsCount: Number(String(body?.participantsCount || "").trim()),
    members: String(body?.members || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  };

  return safe;
}

function normalizeInscricaoCorrida(body) {
  const safe = {
    fullName: String(body?.fullName || "").trim(),
    email: String(body?.email || "").trim().toLowerCase(),
    phone: String(body?.phone || "").trim(),
    address: String(body?.address || "").trim(),
    neighborhood: String(body?.neighborhood || "").trim(),
    cpf: String(body?.cpf || "").trim(),
    dob: String(body?.dob || "").trim()
  };

  return safe;
}

module.exports = { normalizeInscricao, normalizeInscricaoCorrida };
