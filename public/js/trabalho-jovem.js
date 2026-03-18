(() => {
  const input = document.querySelector("[data-tj-search]");
  const table = document.querySelector("[data-tj-table]");
  if (!input || !table) return;

  const rows = Array.from(table.querySelectorAll("tbody tr")).filter(
    (r) => r.querySelector("[data-tj-name]") || r.querySelector("[data-tj-cpf]")
  );
  const normalize = (v) =>
    String(v || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const getText = (row) => {
    const name = row.querySelector("[data-tj-name]")?.textContent || "";
    const cpf = row.querySelector("[data-tj-cpf]")?.textContent || "";
    return normalize(`${name} ${cpf}`);
  };

  const index = rows.map((r) => ({ row: r, text: getText(r) }));

  input.addEventListener("input", () => {
    const q = normalize(input.value);
    for (const item of index) {
      item.row.style.display = !q || item.text.includes(q) ? "" : "none";
    }
  });
})();
