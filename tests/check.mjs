// Vérifications du site statique, sans dépendance : node tests/check.mjs
// Les deux pages (FR et EN) doivent avoir la même structure, des liens internes valides,
// la liste complète des dépôts et les fonctionnalités récentes. Code de sortie 1 si une règle échoue.
import { readFileSync } from "node:fs";

const pages = {
  fr: { file: "public/index.html", other: "en/", otherLang: "en" },
  en: { file: "public/en/index.html", other: "../", otherLang: "fr" },
};

// Dépôts publics, dans l'ordre de la section « Libre ».
const repos = ["sonnuage", "sonnuage-android", "sonnuage-ios", "sonnuage-desktop", "sonnuage-extension", "sonnuage.github.io"];

// Fonctionnalités que les deux pages doivent citer (voir sonnuage/docs/ROADMAP.md).
const facts = [
  { fr: /fondu enchaîné/i, en: /crossfade/i },
  { fr: /lecture infinie/i, en: /infinite play/i },
  { fr: /titres les plus écoutés/i, en: /most played tracks/i },
  { fr: /suivent (le|votre) compte/i, en: /follow (the|your) account/i },
  { fr: /appli iOS/, en: /iOS app/ },
  { fr: /API Subsonic/, en: /Subsonic API/ },
  { fr: /paroles synchronisées/i, en: /synced lyrics/i },
  { fr: /radios thématiques/i, en: /themed radios/i },
  { fr: /radio météo/i, en: /weather radio/i },
  { fr: /notes de 1 à 5/i, en: /ratings from 1 to 5/i },
];

const voids = new Set(["meta", "link", "img", "br", "input", "source", "hr", "wbr"]);
const parse = (html) => {
  const tags = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>/g;
  for (const m of html.matchAll(re)) {
    if (!m[2]) continue;
    const attrs = Object.fromEntries([...m[3].matchAll(/([^\s=]+)(?:="([^"]*)")?/g)].map((a) => [a[1], a[2] ?? ""]));
    tags.push({ close: m[1] === "/", self: m[4] === "/", name: m[2].toLowerCase(), attrs });
  }
  return tags;
};
const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<[^>]+>/g, " ").replace(/\s+/g, " ");

const errors = [];
const fail = (lang, msg) => errors.push(`[${lang}] ${msg}`);
const skeleton = {};

for (const [lang, p] of Object.entries(pages)) {
  const html = readFileSync(p.file, "utf8");
  const tags = parse(html);
  const ids = new Set(tags.filter((t) => t.attrs.id).map((t) => t.attrs.id));

  // Balises bien imbriquées ; chaque balise sait si un ancêtre est masqué (aria-hidden)
  const stack = [];
  for (const t of tags) {
    t.hidden = "aria-hidden" in t.attrs || stack.some((s) => s.hidden);
    if (voids.has(t.name) || t.self) continue;
    if (!t.close) { stack.push(t); continue; }
    const open = stack.pop();
    if (open?.name !== t.name) { fail(lang, `</${t.name}> ferme <${open?.name}>`); break; }
  }
  if (stack.length) fail(lang, `balises non fermées : ${stack.map((s) => s.name).join(", ")}`);

  if (!new RegExp(`<html lang="${lang}">`).test(html)) fail(lang, `<html lang="${lang}"> attendu`);

  // Liens internes et changement de langue
  for (const t of tags.filter((t) => t.name === "a")) {
    const href = t.attrs.href ?? "";
    if (href.startsWith("#") && !ids.has(href.slice(1))) fail(lang, `ancre sans cible : ${href}`);
  }
  const sw = tags.find((t) => t.name === "a" && t.attrs["data-lang"]);
  if (!sw || sw.attrs.href !== p.other || sw.attrs.hreflang !== p.otherLang || sw.attrs["data-lang"] !== p.otherLang)
    fail(lang, `bouton de langue vers ${p.other} (${p.otherLang}) attendu`);
  for (const [hl, url] of [["fr", "https://sonnuage.github.io/"], ["en", "https://sonnuage.github.io/en/"], ["x-default", "https://sonnuage.github.io/"]])
    if (!tags.some((t) => t.name === "link" && t.attrs.hreflang === hl && t.attrs.href === url)) fail(lang, `hreflang ${hl} → ${url} manquant`);

  // Accessibilité
  for (const t of tags.filter((t) => t.name === "img")) if (!("alt" in t.attrs)) fail(lang, `img sans alt : ${t.attrs.src}`);
  for (const t of tags.filter((t) => t.name === "svg" && !t.close && !t.hidden && !t.attrs.role))
    fail(lang, "svg sans aria-hidden ni rôle");
  for (const t of tags.filter((t) => ["div", "span"].includes(t.name) && t.attrs["aria-label"]))
    if (!t.attrs.role) fail(lang, `aria-label sur <${t.name}> sans rôle : « ${t.attrs["aria-label"]} »`);
  const heads = tags.filter((t) => /^h[1-6]$/.test(t.name) && !t.close).map((t) => Number(t.name[1]));
  if (heads.filter((h) => h === 1).length !== 1) fail(lang, "un seul h1 attendu");
  heads.forEach((h, i) => { if (i && h > heads[i - 1] + 1) fail(lang, `titre h${h} après h${heads[i - 1]}`); });

  // Dépôts
  const links = tags.filter((t) => t.name === "a").map((t) => t.attrs.href);
  for (const r of repos) if (!links.includes(`https://github.com/SonNuage/${r}`)) fail(lang, `lien vers le dépôt ${r} manquant`);

  // Fonctionnalités récentes
  const body = text(html);
  for (const f of facts) if (!f[lang].test(body)) fail(lang, `fonctionnalité absente : ${f[lang]}`);

  // Squelette comparé entre les langues : balises, classes, rôles, liens externes
  skeleton[lang] = tags.map((t) => {
    const href = t.attrs.href ?? "";
    const ext = /^https:\/\/(github\.com|fonts)/.test(href) ? href : "";
    return `${t.close ? "/" : ""}${t.name}.${t.attrs.class ?? ""}#${t.attrs.role ?? ""}${ext}`;
  });
}

// Contraste WCAG AA (4,5:1) des couleurs de texte, sur le fond et sur un panneau (fond + 8 % de blanc)
const css = readFileSync("public/styles.css", "utf8");
const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))[1];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (c) => c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (x, y) => { const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
const bg = rgb(token("bg"));
const panel = bg.map((v) => v + (255 - v) * 0.08);
for (const name of ["text", "muted", "faint"])
  for (const [where, back] of [["fond", bg], ["panneau", panel]]) {
    const r = ratio(rgb(token(name)), back);
    if (r < 4.5) errors.push(`[css] --${name} sur ${where} : contraste ${r.toFixed(2)} < 4,5`);
  }

const [a, b] = [skeleton.fr, skeleton.en];
const at = a.findIndex((x, i) => x !== b[i]);
if (at !== -1 || a.length !== b.length) errors.push(`[fr/en] structures différentes à la balise ${at}: ${a[at]} ≠ ${b[at]}`);

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("site : toutes les vérifications passent");
