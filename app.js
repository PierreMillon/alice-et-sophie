async function loadData() {
  const response = await fetch("data.json");
  return response.json();
}

(function initFloatingMenuButton() {
  const toggle = document.getElementById("sidebar-toggle");
  const header = document.querySelector(".site-header");
  if (!toggle || !header) return;
  function update() {
    toggle.classList.toggle("is-floating", window.scrollY > header.offsetHeight);
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function goBack(fallbackHash) {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.hash = fallbackHash;
  }
}

const TITLE_LOGO_EXCLUDED = new Set(["Alice", "Sophie", "Clothilde", "Benjamin"]);

function titleLogoSheet(item, characterSheets) {
  if (!characterSheets || !(item.characters ?? []).length) return null;
  const candidates = item.characters
    .filter((n) => !TITLE_LOGO_EXCLUDED.has(n))
    .map((n) => characterSheets.find((s) => s.name === n))
    .filter((s) => s && s.portrait);
  if (!candidates.length) return null;
  const antagonist = candidates.find((s) => (s.role ?? "").includes("Antagoniste"));
  return antagonist ?? candidates[0];
}

function titleLogo(item, characterSheets) {
  const sheet = titleLogoSheet(item, characterSheets);
  return sheet ? `<img class="title-logo" src="${escapeHtml(sheet.portrait)}" alt="">` : "";
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

function renderParagraphs(content, className = "") {
  const classAttr = className ? ` class="${className}"` : "";
  return (content ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => `<p${classAttr}>${withInlineFlags(escapeHtml(paragraph.trim()))}</p>`)
    .join("");
}

function scrollSectionIntoView(container) {
  const section = container.closest("section") ?? container;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderChangelogEntry(entry) {
  return `<li class="changelog-entry">
    <span class="changelog-version">${escapeHtml(entry.version)}</span>
    <span class="changelog-summary">${escapeHtml(entry.summary)}</span>
  </li>`;
}

function renderArchitectureNote(note, index) {
  return `<li class="architecture-card" id="architecture-note-${index}">
    <h3>${escapeHtml(note.title ?? "Sans titre")}</h3>
    ${note.rawNote ? renderParagraphs(note.rawNote, "architecture-raw") : ""}
    ${note.analysis ? `<p class="architecture-analysis"><strong>Logique extraite :</strong> ${escapeHtml(note.analysis)}</p>` : ""}
  </li>`;
}

function renderStructureNote(note, index) {
  const keyPoints = (note.keyPoints ?? []).map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  const attentionPoints = (note.attentionPoints ?? [])
    .map((point) => `<p class="sheet-flag">⚠️ ${escapeHtml(point)}</p>`)
    .join("");

  return `<li class="sheet-preview structure-card" id="structure-note-${index}">
    <h3>${escapeHtml(note.title ?? "Sans titre")}</h3>
    ${keyPoints ? `<ul class="sheet-traits">${keyPoints}</ul>` : ""}
    ${attentionPoints ? `<div class="sheet-flags">${attentionPoints}</div>` : ""}
  </li>`;
}

function storyHashMap(stories) {
  const map = new Map();
  (stories ?? []).forEach((s, i) => map.set(s.title, `#story-${i}`));
  return map;
}

function checklistLegend(groups) {
  return (groups ?? [])
    .map(
      (g) => `<p class="checklist-legend-item">
        <span class="legend-dot checklist-group-${g.key}"></span>
        <strong>${escapeHtml(g.title)}</strong> — ${escapeHtml(g.source)}
      </p>`
    )
    .join("");
}

function renderSeriesChecklist(checklist, storyHashes) {
  const container = document.getElementById("series-checklist-app");
  if (!checklist || !checklist.rows || checklist.rows.length === 0) {
    container.innerHTML = '<p class="empty-state">Rien à afficher pour le moment.</p>';
    return;
  }

  let prevGroup = null;
  const headerCells = checklist.criteria
    .map((c) => {
      const groupStart = c.group !== prevGroup;
      prevGroup = c.group;
      return `<th class="checklist-group-${c.group}${groupStart ? " group-start" : ""}">${escapeHtml(c.label)}</th>`;
    })
    .join("");

  const rows = checklist.rows
    .map((row) => {
      let prev = null;
      const cells = checklist.criteria
        .map((c) => {
          const groupStart = c.group !== prev;
          prev = c.group;
          const pass = row.checks[c.key];
          return `<td class="${pass ? "check-yes" : "check-no"}${groupStart ? " group-start" : ""}">${pass ? "✓" : "—"}</td>`;
        })
        .join("");
      const href = storyHashes?.get(row.story);
      const label = href
        ? `<a class="checklist-story-link" href="${href}">${escapeHtml(row.story)}</a>`
        : escapeHtml(row.story);
      return `<tr><th scope="row">${label}</th>${cells}</tr>`;
    })
    .join("");

  container.innerHTML = `
    ${checklist.intro ? `<p class="section-intro">${escapeHtml(checklist.intro)}</p>` : ""}
    <div class="checklist-legend">${checklistLegend(checklist.groups)}</div>
    <div class="checklist-scroll">
      <table class="checklist-table">
        <thead><tr><th scope="col"></th>${headerCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="checklist-scroll-hint">↔ Faites glisser le tableau pour voir toutes les colonnes.</p>`;
}

function storyChecklistFor(item, checklist) {
  if (!checklist || !checklist.rows) return "";
  const row = checklist.rows.find((r) => r.story === item.title);
  if (!row) return "";

  const chips = checklist.criteria
    .map((c) => {
      const pass = Boolean(row.checks[c.key]);
      return `<span class="chip chip-group-${c.group} ${pass ? "chip-yes" : "chip-no"}">${pass ? "✓" : "–"} ${escapeHtml(c.label)}</span>`;
    })
    .join("");

  const legend = (checklist.groups ?? [])
    .map(
      (g) => `<span class="chip-legend-item"><span class="legend-dot checklist-group-${g.key}"></span>${escapeHtml(g.title)}</span>`
    )
    .join("");

  return `<div class="story-checklist">
    <p class="story-checklist-title">Checklist de structure</p>
    <div class="chip-list">${chips}</div>
    <div class="chip-legend">${legend}</div>
  </div>`;
}

function comfortArc(peur, maxVal) {
  return peur.map((v) => maxVal - v);
}

function scoreComfortArc(peur) {
  const n = peur.length;
  if (n < 4) return null;
  const checks = [
    { label: "Confort au début", pass: peur[0] <= 2 },
    { label: "Montée progressive dans l'étrange", pass: peur[Math.floor(n / 2)] >= peur[0] },
    { label: "Creux (répit) avant la fin", pass: peur[n - 2] < peur[n - 3] },
    { label: "Remontée subite à la toute fin", pass: peur[n - 1] > peur[n - 2] + 1 },
  ];
  return { score: checks.filter((c) => c.pass).length, total: checks.length, checks };
}

function renderTensionChart(curve, options) {
  const { showTitle = true, showAvis = true, storyHash = null } = options ?? {};
  const w = 280;
  const h = 90;
  const pad = 8;
  const maxVal = 5;
  const series = [
    { key: "peur", cls: "tension-peur" },
    { key: "surprise", cls: "tension-surprise" },
    { key: "nouveaute", cls: "tension-nouveaute" },
    { key: "rythme", cls: "tension-rythme" },
    { key: "confort", cls: "tension-confort" },
  ];
  const n = curve.peur.length;
  const stepX = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const data = { ...curve, confort: comfortArc(curve.peur, maxVal) };

  function points(arr) {
    return (arr ?? []).map((v, i) => `${pad + i * stepX},${h - pad - (v / maxVal) * (h - pad * 2)}`).join(" ");
  }

  const lines = series
    .filter((s) => data[s.key])
    .map((s) => `<polyline points="${points(data[s.key])}" class="tension-line ${s.cls}" />`)
    .join("");

  const cliffhanger = curve.cliffhanger != null
    ? `<p class="tension-cliffhanger">Cliffhanger de fin : ${"🔥".repeat(curve.cliffhanger)}${"·".repeat(Math.max(0, 5 - curve.cliffhanger))}</p>`
    : "";

  const arcScore = scoreComfortArc(curve.peur);
  const arcHtml = arcScore
    ? `<p class="tension-arc-score">Schéma confort → étrange → creux → pic : ${arcScore.score}/${arcScore.total}
        <span class="tension-arc-detail">(${arcScore.checks.map((c) => `${c.pass ? "✓" : "✗"} ${c.label}`).join(" · ")})</span>
      </p>`
    : "";

  const titleText = escapeHtml(curve.story ?? "");
  const titleHtml = showTitle
    ? `<p class="tension-title">${storyHash ? `<a href="${storyHash}">${titleText}</a>` : titleText}</p>`
    : "";

  return `<div class="tension-chart">
    ${titleHtml}
    <svg viewBox="0 0 ${w} ${h}" class="tension-svg" preserveAspectRatio="none">${lines}</svg>
    <div class="tension-legend">
      <span class="legend-dot tension-peur"></span>Peur
      <span class="legend-dot tension-surprise"></span>Surprise
      <span class="legend-dot tension-nouveaute"></span>Nouveauté
      <span class="legend-dot tension-rythme"></span>Rythme
      <span class="legend-dot tension-confort"></span>Confort
    </div>
    ${cliffhanger}
    ${arcHtml}
    ${showAvis && curve.avis ? `<p class="tension-avis">${escapeHtml(curve.avis)}</p>` : ""}
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
        <a href="#character-sheets" class="evening-back">← Retour</a>
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

    container.querySelector(".evening-back").addEventListener("click", (event) => {
      event.preventDefault();
      goBack("#character-sheets");
    });
  }

  function route(isNavigation) {
    const hash = window.location.hash;
    const match = hash.match(/^#sheet-(\d+)$/);
    if (match) {
      showDetail(Number(match[1]));
    } else {
      showList();
    }
    const owns = Boolean(match) || hash === "#character-sheets";
    if (isNavigation && owns) {
      scrollSectionIntoView(container);
    }
  }

  window.addEventListener("hashchange", () => route(true));
  route(false);
}

function initTextCollection(containerId, items, options) {
  const { hashPrefix, sectionHash, backLabel, characterSheets, tensionCurves, seriesChecklist } = options;
  const container = document.getElementById(containerId);

  function tensionChartFor(item) {
    const curve = (tensionCurves ?? []).find((c) => c.story === item.title);
    return curve ? renderTensionChart(curve, { showTitle: false, showAvis: true }) : "";
  }

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="empty-state">Rien à afficher pour le moment.</p>';
    return;
  }

  function explorationNotesFor(item) {
    if (!item.explorationNotes || !item.explorationNotes.length) return "";
    const points = item.explorationNotes.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
    return `<div class="exploration-notes">
      <p class="exploration-notes-title">Pistes à explorer</p>
      <ul class="exploration-notes-list">${points}</ul>
    </div>`;
  }

  function analysisSectionFor(item) {
    const chart = tensionChartFor(item);
    const checklist = storyChecklistFor(item, seriesChecklist);
    if (!chart && !checklist) return "";
    return `<div class="story-analysis">
      <p class="story-analysis-title">Analyse de structure (rythme et checklist)</p>
      <div class="story-analysis-body">
        ${chart}
        ${checklist}
        <a class="story-analysis-compare-link" href="#structure-notes">Voir toutes les histoires comparées →</a>
      </div>
    </div>`;
  }

  function characterLinks(item) {
    if (!characterSheets || !(item.characters ?? []).length) {
      return "";
    }
    const chips = item.characters.map((name) => {
      const idx = characterSheets.findIndex((s) => s.name === name);
      if (idx < 0) return `<span class="story-character-chip">${escapeHtml(name)}</span>`;
      const sheet = characterSheets[idx];
      const portrait = sheet.portrait
        ? `<img class="story-character-portrait" src="${escapeHtml(sheet.portrait)}" alt="">`
        : "";
      return `<a class="story-character-chip" href="#sheet-${idx}">${portrait}<span>${escapeHtml(name)}</span></a>`;
    });
    return `<div class="story-characters">
      <p class="story-characters-title">Personnages de cette histoire</p>
      <div class="story-characters-list">${chips.join("")}</div>
    </div>`;
  }

  function showList() {
    container.innerHTML = `<ul class="evening-list">${items
      .map((item, index) => `
        <li class="evening-preview" data-index="${index}">
          ${item.tone ? `<span class="tone-tag">${escapeHtml(item.tone)}</span>` : ""}
          <h3>${titleLogo(item, characterSheets)}${escapeHtml(item.title ?? "Sans titre")}</h3>
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
        <h3>${titleLogo(item, characterSheets)}${escapeHtml(item.title ?? "Sans titre")}</h3>
        ${item.note ? `<p class="evening-note">${escapeHtml(item.note)}</p>` : ""}
        ${item.warning ? `<p class="evening-warning">⚠️ ${escapeHtml(item.warning)}</p>` : ""}
        <div class="evening-content">${renderParagraphs(item.content)}</div>
        ${characterLinks(item)}
        ${explorationNotesFor(item)}
        ${analysisSectionFor(item)}
      </div>`;

    container.querySelector(".evening-back").addEventListener("click", (event) => {
      event.preventDefault();
      goBack(`#${sectionHash}`);
    });
  }

  function route(isNavigation) {
    const hash = window.location.hash;
    const match = hash.match(new RegExp(`^#${hashPrefix}-(\\d+)$`));
    if (match) {
      showDetail(Number(match[1]));
    } else {
      showList();
    }
    const owns = Boolean(match) || hash === `#${sectionHash}`;
    if (isNavigation && owns) {
      scrollSectionIntoView(container);
    }
  }

  window.addEventListener("hashchange", () => route(true));
  route(false);
}

function initSidebar(stories, characterSheets, architectureNotes, structureNotes) {
  const toggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const closeBtn = document.getElementById("sidebar-close");
  if (!toggle || !sidebar || !overlay || !closeBtn) return;

  function openSidebar() {
    sidebar.classList.add("is-open");
    overlay.classList.add("is-open");
    sidebar.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-open");
    sidebar.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", openSidebar);
  closeBtn.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });

  function fillSublist(id, items, hrefFor) {
    const list = document.getElementById(id);
    if (!list || !items || !items.length) return;
    list.innerHTML = items
      .map((entry, index) => `<li><a href="${hrefFor(entry, index)}">${escapeHtml(entry.title ?? entry.name ?? "Sans titre")}</a></li>`)
      .join("");
  }

  fillSublist("sidebar-stories-list", stories, (_, index) => `#story-${index}`);
  fillSublist("sidebar-characters-list", characterSheets, (_, index) => `#sheet-${index}`);
  fillSublist("sidebar-notes-list", architectureNotes, (_, index) => `#architecture-note-${index}`);
  fillSublist("sidebar-architecture-list", structureNotes, (_, index) => `#structure-note-${index}`);

  sidebar.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", closeSidebar);
  });

  sidebar.querySelectorAll(".sidebar-item-toggle").forEach((toggle) => {
    const sublist = toggle.closest(".sidebar-item")?.nextElementSibling;
    if (!sublist || !sublist.classList.contains("sidebar-sublist")) return;
    toggle.addEventListener("click", () => {
      const isOpen = sublist.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });
}

loadData()
  .then((data) => {
    initTextCollection("stories-app", data.stories, {
      hashPrefix: "story",
      sectionHash: "stories",
      backLabel: "Retour aux histoires",
      characterSheets: data.characterSheets,
      tensionCurves: data.tensionCurves,
      seriesChecklist: data.seriesChecklist,
    });
    initCharacterSheets(data.characterSheets, [
      { items: data.stories, hashPrefix: "story" },
    ]);
    renderList("architecture-notes-list", data.architectureNotes, renderArchitectureNote);
    renderList("structure-notes-list", data.structureNotes, renderStructureNote);
    renderList("changelog-list", data.changelog, renderChangelogEntry);
    const storyHashes = storyHashMap(data.stories);
    renderSeriesChecklist(data.seriesChecklist, storyHashes);
    document.getElementById("tension-charts-app").innerHTML = (data.tensionCurves ?? [])
      .map((c) => renderTensionChart(c, { showTitle: true, showAvis: true, storyHash: storyHashes.get(c.story) }))
      .join("");
    initSidebar(data.stories, data.characterSheets, data.architectureNotes, data.structureNotes);
  })
  .catch((error) => {
    console.error("Impossible de charger data.json :", error);
  });
