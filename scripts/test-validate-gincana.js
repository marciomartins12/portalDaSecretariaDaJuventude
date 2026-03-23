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
  const members = [];
  for (let i = 1; i <= 9; i++) {
    members.push({
      name: `Membro ${i}`,
      dob: i % 2 === 0 ? "2002-05-01" : "2004-03-20",
      cpf: i % 2 === 0 ? "529.982.247-25" : "153.509.460-56",
      address: `Rua ${String.fromCharCode(64 + i)}, ${i * 10}`
    });
  }

  const req = mockReq({
    teamName: "Equipe Piaba",
    captainName: "João Silva",
    captainEmail: "joao@example.com",
    captainCpf: "111.444.777-35",
    captainAddress: "Rua A, 123",
    captainDob: "2000-01-10",
    phone: "(98) 98888-7777",
    neighborhood: "Centro",
    termsImageRelease: "1",
    termsResponsibility: "1",
    membersJson: JSON.stringify(members)
  });
  const res = mockRes();
  validateInscricaoGincana(req, res, () => {
    const data = req.inscricaoGincana;
    if (!data) {
      console.error("Missing req.inscricaoGincana");
      process.exit(1);
    }
    if (!Array.isArray(data.members) || data.members.length !== 9) {
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
