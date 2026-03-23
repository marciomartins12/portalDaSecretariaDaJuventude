const { validateInscricaoGincana } = require("../middlewares/validateInscricaoGincana");

function mockReq(body) {
  return { body };
}

function mockRes() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    render(view, payload) {
      console.error("Render called with errors:", payload?.errors || {});
      console.error("View:", view);
      process.exit(1);
    }
  };
}

function run() {
  const req = mockReq({
    teamName: "Equipe Piaba",
    captainName: "João Silva",
    captainEmail: "joao@example.com",
    captainCpf: "123.456.789-09",
    captainAddress: "Rua A, 123",
    captainDob: "2000-01-10",
    phone: "(98) 98888-7777",
    neighborhood: "Centro",
    termsImageRelease: "1",
    termsResponsibility: "1",
    membersJson: JSON.stringify([
      { name: "Maria Souza", dob: "2002-05-01", cpf: "987.654.321-00", address: "Rua B, 200" },
      { name: "Carlos Lima", dob: "2004-03-20", cpf: "321.654.987-00", address: "Rua C, 50" }
    ])
  });
  const res = mockRes();
  validateInscricaoGincana(req, res, () => {
    const data = req.inscricaoGincana;
    if (!data) {
      console.error("Missing req.inscricaoGincana");
      process.exit(1);
    }
    if (!Array.isArray(data.members) || data.members.length !== 2) {
      console.error("Members not parsed:", data.members);
      process.exit(1);
    }
    for (const m of data.members) {
      if (!m.cpf || !m.address) {
        console.error("Missing cpf/address in member:", m);
        process.exit(1);
      }
    }
    if (!data.captainCpf || !data.captainAddress) {
      console.error("Missing captain cpf/address:", { cpf: data.captainCpf, address: data.captainAddress });
      process.exit(1);
    }
    console.log("OK");
    process.exit(0);
  });
}

run();

