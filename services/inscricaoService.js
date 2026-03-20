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

module.exports = { normalizeInscricaoCorrida };
