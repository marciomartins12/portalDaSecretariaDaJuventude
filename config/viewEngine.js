const { engine } = require("express-handlebars");
const path = require("path");

function configureViewEngine(app) {
  app.engine(
    "handlebars",
    engine({
      extname: "handlebars",
      defaultLayout: "main",
      layoutsDir: path.join(__dirname, "..", "views", "layouts"),
      partialsDir: path.join(__dirname, "..", "views", "partials"),
      helpers: {
        assetVersion() {
          if (String(process.env.CACHE_ENABLED || "").trim() === "1") {
            return "1.0.0"; // Versão fixa em produção se o cache estiver ligado
          }
          return Date.now(); // Cache busting dinâmico (timestamp) se o cache estiver desligado
        },
        eq(a, b) {
          return a === b;
        },
        includes(arr, val) {
          if (!arr) return false;
          try {
            if (typeof arr === "string") return arr.split(",").includes(val);
            if (Array.isArray(arr)) return arr.includes(val);
            return false;
          } catch {
            return false;
          }
        },
        tjLinkEmoji(href, label) {
          const h = String(href || "").toLowerCase();
          const l = String(label || "").toLowerCase();
          if (h.includes("instagram") || l.includes("instagram")) return "📸";
          if (h.includes("whatsapp") || h.includes("wa.me") || l.includes("whatsapp")) return "💬";
          if (h.includes("gov.br") || l.includes("gov") || l.includes("governo")) return "🏛️";
          if (h.includes("forms") || l.includes("formul") || l.includes("inscri")) return "📝";
          if (h.includes("pdf") || l.includes("pdf") || l.includes("arquivo")) return "📄";
          if (h.includes("youtube") || l.includes("youtube")) return "▶️";
          if (h.includes("facebook") || l.includes("facebook")) return "📘";
          if (h.includes("map") || h.includes("maps") || l.includes("mapa")) return "🗺️";
          if (h.startsWith("mailto:") || l.includes("email") || l.includes("e-mail")) return "✉️";
          if (h.startsWith("tel:") || l.includes("telefone") || l.includes("celular")) return "📞";
          return "🔗";
        },
        addOne(n) {
          return Number(n) + 1;
        },
        year() {
          return new Date().getFullYear();
        },
        toJson(value) {
          return JSON.stringify(value);
        }
      }
    })
  );
  app.set("view engine", "handlebars");
  app.set("views", path.join(__dirname, "..", "views"));
}

module.exports = { configureViewEngine };
