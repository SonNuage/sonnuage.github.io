(() => {
  const en = document.documentElement.lang === "en";

  // Langue : le choix fait avec le bouton FR/EN est retenu ; sans choix, un navigateur qui ne parle pas
  // français arrivant sur la page française est envoyé vers la version anglaise.
  const store = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch { return null; } };
  for (const a of document.querySelectorAll("a[data-lang]")) a.addEventListener("click", () => store("lang", a.dataset.lang));
  if (!en) {
    const chosen = store("lang");
    const prefersFrench = (navigator.languages ?? [navigator.language]).some((l) => /^fr\b/i.test(l));
    if (chosen === "en" || (!chosen && !prefersFrench)) { location.replace("en/"); return; }
  }

  // Aperçus : le panneau d'une fonctionnalité glisse depuis la droite. Sans ce script, les liens des cartes
  // suffisent (:target dans la feuille de style) ; ici on évite le saut de page et on ajoute le clavier :
  // Échap ferme, les flèches passent à l'aperçu voisin, le focus revient sur la carte d'origine.
  const previews = [...document.querySelectorAll(".preview")];
  let opener = null;
  const current = () => previews.find((p) => p.classList.contains("open"));

  const close = () => {
    const shown = current();
    if (!shown) return;
    shown.classList.remove("open");
    document.body.classList.remove("preview-open");
    if (location.hash === "#" + shown.id) history.replaceState(null, "", location.pathname + location.search);
    opener?.focus({ preventScroll: true });
    opener = null;
  };

  const open = (id, from) => {
    const target = document.getElementById(id);
    if (!target) return;
    const shown = current();
    if (!shown) opener = from ?? document.activeElement;
    shown?.classList.remove("open");
    target.classList.add("open");
    document.body.classList.add("preview-open");
    target.querySelector(".preview-panel").scrollTop = 0;
    target.querySelector(".preview-close").focus({ preventScroll: true });
  };

  for (const link of document.querySelectorAll("a[data-preview]"))
    link.addEventListener("click", (e) => {
      e.preventDefault();
      open(link.dataset.preview, link.closest(".preview") ? null : link);
    });
  for (const link of document.querySelectorAll(".preview-close, .preview-scrim"))
    link.addEventListener("click", (e) => { e.preventDefault(); close(); });

  addEventListener("keydown", (e) => {
    const shown = current();
    if (!shown) return;
    if (e.key === "Escape") close();
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (step) open(previews[(previews.indexOf(shown) + step + previews.length) % previews.length].id);
  });

  // Lien direct vers un aperçu (#preview-…) : on l'ouvre comme un clic, sans laisser l'ancre dans l'adresse.
  const linked = previews.find((p) => "#" + p.id === location.hash);
  if (linked) {
    history.replaceState(null, "", location.pathname + location.search);
    open(linked.id, document.querySelector(`a.tour-card[data-preview="${linked.id}"]`));
  }
})();
