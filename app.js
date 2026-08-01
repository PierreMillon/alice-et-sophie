async function loadData() {
  const response = await fetch("data.json");
  return response.json();
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function renderList(containerId, items, renderItem) {
  const container = document.getElementById(containerId);
  if (!items || items.length === 0) {
    container.innerHTML = '<li class="empty-state">Rien à afficher pour le moment.</li>';
    return;
  }
  container.innerHTML = items.map(renderItem).join("");
}

function withInlineFlags(escapedText) {
  return escapedText.replace(/\[\[flag:(.*?)\]\]/g, '<span class="text-flag">⚠️ $1</span>');
}

function renderParagraphs(content) {
  return (content ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${withInlineFlags(escapeHtml(paragraph.trim()))}</p>`)
    .join("");
}

function scrollSectionIntoView(container) {
  const section = container.closest("section") ?? container;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderArchitectureNote(note) {
  return `<li class="architecture-card">
    <h3>${escapeHtml(note.title ?? "Sans titre")}</h3>
    ${note.rawNote ? `<p class="architecture-raw">${escapeHtml(note.rawNote)}</p>` : ""}
    ${note.analysis ? `<p class="architecture-analysis"><strong>Logique extraite :</strong> ${escapeHtml(note.analysis)}</p>` : ""}
  </li>`;
}

function renderStructureNote(note) {
  const keyPoints = (note.keyPoints ?? []).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  const attentionPoints = (note.attentionPoints ?? [])
    .map((point) => `<p class="sheet-flag">⚠️ ${escapeHtml(point)}</p>`)
    .join("");

  return `<li class="sheet-preview structure-card">
    <h3>${escapeHtml(note.title ?? "Sans titre")}</h3>
    ${keyPoints ? `<ul class="sheet-traits">${keyPoints}</ul>` : ""}
    ${attentionPoints ? `<div class="sheet-flags">${attentionPoints}</div>` : ""}
  </li>`;
}

function renderSeriesChecklist(checklist) {
  const container = document.getElementById("series-checklist-app");
  if (!checklist || !checklist.rows || checklist.rows.length === 0) {
    container.innerHTML = '<p class="empty-state">Rien à afficher pour le moment.</p>';
    return;
  }

  const headerCells = checklist.criteria.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const rows = checklist.rows
    .map((row) => {
      const cells = checklist.criteria
        .map((c) => `<td class="${row.checks[c.key] ? "check-yes" : "check-no"}">${row.checks[c.key] ? "✓" : "—"}</td>`)
        .join("");
      return `<tr><th scope="row">${escapeHtml(row.story)}</th>${cells}</tr>`;
    })
    .join("");

  container.innerHTML = `
    ${checklist.intro ? `<p class="section-intro">${escapeHtml(checklist.intro)}</p>` : ""}
    <div class="checklist-scroll">
      <table class="checklist-table">
        <thead><tr><th scope="col"></th>${headerCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderTensionChart(curve) {
  const w = 280;
  const h = 90;
  const pad = 8;
  const maxVal = 5;
  const series = [
    { key: "peur", cls: "tension-peur" },
    { key: "surprise", cls: "tension-surprise" },
    { key: "nouveaute", cls: "tension-nouveaute" },
  ];
  const n = curve.peur.length;
  const stepX = n > 1 ? (w - pad * 2) / (n - 1) : 0;

  function points(arr) {
    return arr.map((v, i) => `${pad + i * stepX},${h - pad - (v / maxVal) * (h - pad * 2)}`).join(" ");
  }

  const lines = series
    .map((s) => `<polyline points="${points(curve[s.key])}" class="tension-line ${s.cls}" />`)
    .join("");

  return `<div class="tension-chart">
    <p class="tension-title">${escapeHtml(curve.story ?? "")}</p>
    <svg viewBox="0 0 ${w} ${h}" class="tension-svg" preserveAspectRatio="none">${lines}</svg>
    <div class="tension-legend">
      <span class="legend-dot tension-peur"></span>Peur
      <span class="legend-dot tension-surprise"></span>Surprise
      <span class="legend-dot tension-nouveaute"></span>Nouveauté
    </div>
  </div>`;
}

function initCharacterSheets(sheets, storyCollections) {
  const container = document.getElementById("character-sheets-app");

  if (!sheets || sheets.length === 0) {
    container.innerHTML = '<p class="empty-state">Rien à afficher pour le moment.</p>';
    return;
  }

  function portraitImg(sheet, className) {
    return sheet.portrait
      ? `<img class="${className}" src="${escapeHtml(sheet.portrait)}" alt="Portrait de ${escapeHtml(sheet.name ?? "")}">`
      : "";
  }

  function previewCard(sheet, index) {
    return `
      <li class="sheet-preview" data-index="${index}">
        ${portraitImg(sheet, "sheet-preview-portrait")}
        <h3>${escapeHtml(sheet.name ?? "Sans nom")}</h3>
        ${sheet.role ? `<p class="sheet-role">${escapeHtml(sheet.role)}</p>` : ""}
      </li>`;
  }

  function showList() {
    const entries = sheets.map((sheet, index) => ({ sheet, index }));
    const recurring = entries.filter((e) => e.sheet.recurring);
    const others = entries.filter((e) => !e.sheet.recurring);

    container.innerHTML = `
      <ul class="sheet-list">${recurring.map((e) => previewCard(e.sheet, e.index)).join("")}</ul>
      ${others.length ? `<p class="sheet-group-label">Autres personnages</p>` : ""}
      <ul class="sheet-list">${others.map((e) => previewCard(e.sheet, e.index)).join("")}</ul>`;

    container.querySelectorAll(".sheet-preview").forEach((el) => {
      el.addEventListener("click", () => {
        window.location.hash = `sheet-${el.dataset.index}`;
      });
    });
  }

  function appearancesFor(name) {
    const links = [];
    storyCollections.forEach(({ items, hashPrefix, label }) => {
      (items ?? []).forEach((item, index) => {
        if ((item.characters ?? []).includes(name)) {
          links.push({ title: item.title, href: `#${hashPrefix}-${index}` });
        }
      });
    });
    return links;
  }

  function showDetail(index) {
    const sheet = sheets[index];
    if (!sheet) {
      showList();
      return;
    }
    const traits = (sheet.traits ?? []).map((trait) => `<li>${escapeHtml(trait)}</li>`).join("");
    const examples = (sheet.examples ?? [])
      .map((example) => `<li>« ${escapeHtml(example.quote ?? "")} »<cite>${escapeHtml(example.source ?? "")}</cite></li>`)
      .join("");
    const flags = (sheet.flags ?? [])
      .map((flag) => `<p class="sheet-flag">⚠️ ${escapeHtml(flag.text ?? "")}</p>`)
      .join("");
    const appearances = appearancesFor(sheet.name);
    const appearsIn = appearances.length
      ? `<p class="cross-links">Apparaît dans : ${appearances
          .map((a) => `<a class="cross-link" href="${a.href}">${escapeHtml(a.title)}</a>`)
          .join(", ")}</p>`
      : "";

    container.innerHTML = `
      <div class="sheet-detail">
        <a href="#character-sheets" class="evening-back">← Retour aux personnages</a>
        <div class="sheet-header">
          ${portraitImg(sheet, "sheet-portrait")}
          <div>
            <h3>${escapeHtml(sheet.name ?? "Sans nom")}</h3>
            ${sheet.role ? `<p class="sheet-role">${escapeHtml(sheet.role)}</p>` : ""}
          </div>
        </div>
        ${traits ? `<ul class="sheet-traits">${traits}</ul>` : ""}
        ${examples ? `<ul class="sheet-examples">${examples}</ul>` : ""}
        ${appearsIn}
        ${flags ? `<div class="sheet-flags">${flags}</div>` : ""}
      </div>`;
  }

  function route(isNavigation) {
    const match = window.location.hash.match(/^#sheet-(\d+)$/);
    if (match) {
      showDetail(Number(match[1]));
    } else {
      showList();
    }
    if (isNavigation) {
      scrollSectionIntoView(container);
    }
  }

  window.addEventListener("hashchange", () => route(true));
  route(false);
}

function initTextCollection(containerId, items, options) {
  const { hashPrefix, sectionHash, backLabel, characterSheets } = options;
  const container = document.getElementById(containerId);

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="empty-state">Rien à afficher pour le moment.</p>';
    return;
  }

  function characterLinks(item) {
    if (!characterSheets || !(item.characters ?? []).length) {
      return "";
    }
    const links = item.characters.map((name) => {
      const idx = characterSheets.findIndex((s) => s.name === name);
      return idx >= 0
        ? `<a class="cross-link" href="#sheet-${idx}">${escapeHtml(name)}</a>`
        : escapeHtml(name);
    });
    return `<p class="cross-links">Personnages : ${links.join(", ")}</p>`;
  }

  function showList() {
    container.innerHTML = `<ul class="evening-list">${items
      .map((item, index) => `
        <li class="evening-preview" data-index="${index}">
          ${item.tone ? `<span class="tone-tag">${escapeHtml(item.tone)}</span>` : ""}
          <h3>${escapeHtml(item.title ?? "Sans titre")}</h3>
          ${item.note ? `<p class="evening-note">${escapeHtml(item.note)}</p>` : ""}
          ${item.warning ? `<p class="evening-warning">⚠️ ${escapeHtml(item.warning)}</p>` : ""}
          <span class="evening-read-link">Lire le texte complet →</span>
        </li>`)
      .join("")}</ul>`;

    container.querySelectorAll(".evening-preview").forEach((el) => {
      el.addEventListener("click", () => {
        window.location.hash = `${hashPrefix}-${el.dataset.index}`;
      });
    });
  }

  function showDetail(index) {
    const item = items[index];
    if (!item) {
      showList();
      return;
    }
    container.innerHTML = `
      <div class="evening-detail">
        <a href="#${sectionHash}" class="evening-back">← ${escapeHtml(backLabel)}</a>
        ${item.tone ? `<span class="tone-tag">${escapeHtml(item.tone)}</span>` : ""}
        <h3>${escapeHtml(item.title ?? "Sans titre")}</h3>
        ${item.note ? `<p class="evening-note">${escapeHtml(item.note)}</p>` : ""}
        ${item.warning ? `<p class="evening-warning">⚠️ ${escapeHtml(item.warning)}</p>` : ""}
        <div class="evening-content">${renderParagraphs(item.content)}</div>
        ${characterLinks(item)}
      </div>`;
  }

  function route(isNavigation) {
    const match = window.location.hash.match(new RegExp(`^#${hashPrefix}-(\\d+)$`));
    if (match) {
      showDetail(Number(match[1]));
    } else {
      showList();
    }
    if (isNavigation) {
      scrollSectionIntoView(container);
    }
  }

  window.addEventListener("hashchange", () => route(true));
  route(false);
}

loadData()
  .then((data) => {
    initTextCollection("stories-app", data.stories, {
      hashPrefix: "story",
      sectionHash: "stories",
      backLabel: "Retour aux histoires",
      characterSheets: data.characterSheets,
    });
    initCharacterSheets(data.characterSheets, [
      { items: data.stories, hashPrefix: "story" },
    ]);
    renderList("architecture-notes-list", data.architectureNotes, renderArchitectureNote);
    renderList("structure-notes-list", data.structureNotes, renderStructureNote);
    renderSeriesChecklist(data.seriesChecklist);
    document.getElementById("tension-charts-app").innerHTML = (data.tensionCurves ?? [])
      .map(renderTensionChart)
      .join("");
  })
  .catch((error) => {
    console.error("Impossible de charger data.json :", error);
  });
