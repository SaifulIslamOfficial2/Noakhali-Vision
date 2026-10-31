export function setSEO({ title = "Noakhali Vision", description = "Noakhali's First AI-Powered Digital News Platform" } = {}) {
  document.title = title;
  let m = document.querySelector('meta[name="description"]');
  if (!m) {
    m = document.createElement("meta");
    m.name = "description";
    document.head.appendChild(m);
  }
  m.content = description;
}
