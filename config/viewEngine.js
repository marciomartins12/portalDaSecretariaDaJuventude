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
