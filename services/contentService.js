const gincana = {
  title: "Gincana da Juventude de Peri Mirim",
  subtitle: "Energia, cooperação e protagonismo jovem em um só evento.",
  dateISO: "2026-07-28T18:00:00-03:00",
  dateLabel: "28 de julho de 2026",
  location: "Praça da Matriz — Peri Mirim (MA)",
  prize: "Premiação para as 3 melhores equipes + reconhecimentos especiais"
};

const news = [
  {
    id: "1",
    title: "Oficina de liderança jovem abre inscrições",
    excerpt: "Encontros práticos para fortalecer comunicação, projeto de vida e participação comunitária.",
    image: "/public/assets/news-1.svg",
    date: "Mar/2026"
  },
  {
    id: "2",
    title: "Mutirão: juventude e cidadania no bairro",
    excerpt: "Ação integrada com serviços, cultura e esporte para aproximar oportunidades de quem mais precisa.",
    image: "/public/assets/news-2.svg",
    date: "Fev/2026"
  },
  {
    id: "3",
    title: "Feirinha do Povo acontece dia 30 de março",
    excerpt: "Um encontro para valorizar a comunidade, produtos locais e cultura, com entrada gratuita.",
    image: "/public/assets/gallery-1.svg",
    date: "30/Mar/2026"
  }
];

const edital = {
  objective:
    "Promover integração, liderança e participação da juventude, por meio de desafios culturais, esportivos e comunitários.",
  rules: [
    "Equipes com mínimo de 3 participantes e máximo de 50.",
    "Respeito, inclusão e conduta ética são obrigatórios em todas as provas.",
    "Pontuações e critérios são divulgados antes de cada etapa.",
    "Provas podem envolver atividades físicas leves e desafios criativos."
  ],
  timeline: [
    { title: "Inscrições", desc: "Até 10/07/2026" },
    { title: "Confirmação das equipes", desc: "11/07/2026" },
    { title: "Congresso técnico", desc: "15/07/2026" },
    { title: "Realização do evento", desc: "28/07/2026" }
  ],
  requirements: [
    "Idade mínima recomendada: 12 anos (com autorização do responsável quando necessário).",
    "Informar líder e contatos válidos.",
    "Lista de membros completa no ato da inscrição."
  ],
  prizes: [
    "1º lugar: troféu + kit esportivo + brindes",
    "2º lugar: troféu + brindes",
    "3º lugar: medalhas + brindes",
    "Destaques: reconhecimento para participação, criatividade e fair play"
  ]
};

module.exports = { gincana, news, edital };
