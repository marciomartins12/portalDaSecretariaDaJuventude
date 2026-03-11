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
        eq(a, b) {
          return a === b;
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
