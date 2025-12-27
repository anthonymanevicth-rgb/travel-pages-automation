/**
 * render.js
 * Usage:
 *   node render.js --template index.template.html --out dist/index.html --runId RUN123 --location Prague
 *
 * It replaces placeholders:
 * {{TITLE}}, {{INTRO}}, {{RUN_ID}}, {{LOCATION}}, {{IMAGES_JSON}}, {{ATTRACTIONS_JSON}}
 */

const fs = require("fs");
const path = require("path");

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  return val ?? fallback;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function escapeForTemplateText(s) {
  // Safe for putting into HTML text nodes + JS string placeholders (we set textContent later anyway)
  return String(s ?? "").replaceAll("\r\n", "\n");
}

function buildDefaultImages(location) {
  const q = encodeURIComponent(location || "travel");
  return [
    `https://source.unsplash.com/featured/?${q}&sig=1`,
    `https://source.unsplash.com/featured/?${q}&sig=2`,
    `https://source.unsplash.com/featured/?${q}&sig=3`,
  ];
}

function main() {
  const templatePath = getArg("template", "index.template.html");
  const outPath = getArg("out", "dist/index.html");

  const runId = getArg("runId", `run-${Date.now()}`);
  const location = getArg("location", "Prague");
  const title = getArg("title", `Discover ${location}`);
  const intro = getArg(
    "intro",
    `${location} is a great place to explore. Here are some highlights and an interactive map.`
  );

  // You can pass JSON strings via CLI too, otherwise it will use defaults:
  const imagesJsonArg = getArg("imagesJson", null);
  const attractionsJsonArg = getArg("attractionsJson", null);

  const images = imagesJsonArg ? JSON.parse(imagesJsonArg) : buildDefaultImages(location);

  const attractions = attractionsJsonArg
    ? JSON.parse(attractionsJsonArg)
    : [
        { name: "Sample Place 1", description: "Example attraction", lat: 50.0865, lon: 14.4114 },
        { name: "Sample Place 2", description: "Example attraction", lat: 50.0909, lon: 14.4005 },
        { name: "Sample Place 3", description: "Example attraction", lat: 50.0870, lon: 14.4205 },
      ];

  // Validate minimums
  const safeImages = Array.isArray(images) ? images.slice(0, 3) : buildDefaultImages(location);
  while (safeImages.length < 3) safeImages.push(buildDefaultImages(location)[safeImages.length]);

  const safeAttractions = (Array.isArray(attractions) ? attractions : []).filter(
    (a) => a && isFinite(Number(a.lat)) && isFinite(Number(a.lon)) && a.name
  );

  const imagesJson = JSON.stringify(safeImages);
  const attractionsJson = JSON.stringify(safeAttractions);

  const tpl = fs.readFileSync(templatePath, "utf8");

  // Important: replace JSON placeholders FIRST (no quotes around them in template)
  let html = tpl
    .replaceAll("{{IMAGES_JSON}}", imagesJson)
    .replaceAll("{{ATTRACTIONS_JSON}}", attractionsJson)
    .replaceAll("{{RUN_ID}}", escapeForTemplateText(runId))
    .replaceAll("{{LOCATION}}", escapeForTemplateText(location))
    .replaceAll("{{TITLE}}", escapeForTemplateText(title))
    .replaceAll("{{INTRO}}", escapeForTemplateText(intro));

  ensureDir(outPath);
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`✅ Wrote: ${outPath}`);
  console.log(`RunId: ${runId}`);
  console.log(`Location: ${location}`);
  console.log(`Images: ${safeImages.length}, Attractions: ${safeAttractions.length}`);
}

main();
