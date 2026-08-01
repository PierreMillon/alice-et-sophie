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

function initCharacterSheets(sheets) {
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

  function showList() {
    container.innerHTML = `<ul class="sheet-list">${sheets
      .map((sheet, index) => `
        <li class="sheet-preview" data-index="${index}">
          ${portraitImg(sheet, "sheet-preview-portrait")}
          <h3>${escapeHtml(sheet.name ?? "Sans nom")}</h3>
          ${sheet.role ? `<p class="sheet-role">${escapeHtml(sheet.role)}</p>` : ""}
        </li>`)
      .join("")}</ul>`;

    container.querySelectorAll(".sheet-preview").forEach((el) => {
      el.addEventListener("click", () => {
        window.location.hash = `sheet-${el.dataset.index}`;
      });
    });
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
        ${flags ? `<div class="sheet-flags">${flags}</div>` : ""}
      </div>`;
  }

  function route() {
    const match = window.location.hash.match(/^#sheet-(\d+)$/);
    if (match) {
      showDetail(Number(match[1]));
    } else {
      showList();
    }
  }

  window.addEventListener("hashchange", route);
  route();
}

function initTextCollection(containerId, items, options) {
  const { hashPrefix, sectionHash, backLabel } = options;
  const container = document.getElementById(containerId);

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="empty-state">Rien à afficher pour le moment.</p>';
    return;
  }

  function showList() {
    container.innerHTML = `<ul class="evening-list">${items
      .map((item, index) => `
        <li class="evening-preview" data-index="${index}">
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
        <h3>${escapeHtml(item.title ?? "Sans titre")}</h3>
        ${item.note ? `<p class="evening-note">${escapeHtml(item.note)}</p>` : ""}
        ${item.warning ? `<p class="evening-warning">⚠️ ${escapeHtml(item.warning)}</p>` : ""}
        <div class="evening-content">${renderParagraphs(item.content)}</div>
      </div>`;
  }

  function route() {
    const match = window.location.hash.match(new RegExp(`^#${hashPrefix}-(\\d+)$`));
    if (match) {
      showDetail(Number(match[1]));
    } else {
      showList();
    }
  }

  window.addEventListener("hashchange", route);
  route();
}

loadData()
  .then((data) => {
    initTextCollection("stories-app", data.stories, {
      hashPrefix: "story",
      sectionHash: "stories",
      backLabel: "Retour aux histoires",
    });
    initCharacterSheets(data.characterSheets);
    renderList("architecture-notes-list", data.architectureNotes, renderArchitectureNote);
    renderList("structure-notes-list", data.structureNotes, renderStructureNote);
    initTextCollection("evening-stories-app", data.eveningStories, {
      hashPrefix: "evening",
      sectionHash: "evening-stories",
      backLabel: "Retour aux histoires du soir",
    });
    initTextCollection("alice-fugues-app", data.aliceFugues, {
      hashPrefix: "fugue",
      sectionHash: "alice-fugues",
      backLabel: "Retour aux Fugues d'Alice",
    });
  })
  .catch((error) => {
    console.error("Impossible de charger data.json :", error);
  });
