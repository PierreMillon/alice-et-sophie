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

function renderStory(story) {
  return `<li><h3>${escapeHtml(story.title ?? "Sans titre")}</h3><p>${escapeHtml(story.summary ?? "")}</p></li>`;
}

function renderIllustration(illustration) {
  const alt = illustration.title ?? "Illustration";
  return `<li><img src="${escapeHtml(illustration.src ?? "")}" alt="${escapeHtml(alt)}"><p>${escapeHtml(alt)}</p></li>`;
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

function renderSheet(sheet) {
  const traits = (sheet.traits ?? []).map((trait) => `<li>${escapeHtml(trait)}</li>`).join("");
  const examples = (sheet.examples ?? [])
    .map((example) => `<li>« ${escapeHtml(example.quote ?? "")} »<cite>${escapeHtml(example.source ?? "")}</cite></li>`)
    .join("");
  const flags = (sheet.flags ?? [])
    .map((flag) => `<p class="sheet-flag">⚠️ ${escapeHtml(flag.text ?? "")}</p>`)
    .join("");
  const portrait = sheet.portrait
    ? `<img class="sheet-portrait" src="${escapeHtml(sheet.portrait)}" alt="Portrait de ${escapeHtml(sheet.name ?? "")}">`
    : "";

  return `<li class="sheet-card">
    <div class="sheet-header">
      ${portrait}
      <div>
        <h3>${escapeHtml(sheet.name ?? "Sans nom")}</h3>
        ${sheet.role ? `<p class="sheet-role">${escapeHtml(sheet.role)}</p>` : ""}
      </div>
    </div>
    ${traits ? `<ul class="sheet-traits">${traits}</ul>` : ""}
    ${examples ? `<ul class="sheet-examples">${examples}</ul>` : ""}
    ${flags ? `<div class="sheet-flags">${flags}</div>` : ""}
  </li>`;
}

function renderArchitectureNote(note) {
  return `<li class="architecture-card">
    <h3>${escapeHtml(note.title ?? "Sans titre")}</h3>
    ${note.rawNote ? `<p class="architecture-raw">${escapeHtml(note.rawNote)}</p>` : ""}
    ${note.analysis ? `<p class="architecture-analysis"><strong>Logique extraite :</strong> ${escapeHtml(note.analysis)}</p>` : ""}
  </li>`;
}

function initEveningStories(stories) {
  const container = document.getElementById("evening-stories-app");

  if (!stories || stories.length === 0) {
    container.innerHTML = '<p class="empty-state">Rien à afficher pour le moment.</p>';
    return;
  }

  function showList() {
    container.innerHTML = `<ul class="evening-list">${stories
      .map((story, index) => `
        <li class="evening-preview" data-index="${index}">
          <h3>${escapeHtml(story.title ?? "Sans titre")}</h3>
          ${story.note ? `<p class="evening-note">${escapeHtml(story.note)}</p>` : ""}
          ${story.warning ? `<p class="evening-warning">⚠️ ${escapeHtml(story.warning)}</p>` : ""}
          <span class="evening-read-link">Lire le texte complet →</span>
        </li>`)
      .join("")}</ul>`;

    container.querySelectorAll(".evening-preview").forEach((el) => {
      el.addEventListener("click", () => {
        window.location.hash = `evening-${el.dataset.index}`;
      });
    });
  }

  function showDetail(index) {
    const story = stories[index];
    if (!story) {
      showList();
      return;
    }
    container.innerHTML = `
      <div class="evening-detail">
        <a href="#evening-stories" class="evening-back">← Retour aux histoires du soir</a>
        <h3>${escapeHtml(story.title ?? "Sans titre")}</h3>
        ${story.note ? `<p class="evening-note">${escapeHtml(story.note)}</p>` : ""}
        ${story.warning ? `<p class="evening-warning">⚠️ ${escapeHtml(story.warning)}</p>` : ""}
        <div class="evening-content">${renderParagraphs(story.content)}</div>
      </div>`;
  }

  function route() {
    const match = window.location.hash.match(/^#evening-(\d+)$/);
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
    renderList("stories-list", data.stories, renderStory);
    renderList("character-sheets-list", data.characterSheets, renderSheet);
    renderList("illustrations-list", data.illustrations, renderIllustration);
    renderList("architecture-notes-list", data.architectureNotes, renderArchitectureNote);
    initEveningStories(data.eveningStories);
  })
  .catch((error) => {
    console.error("Impossible de charger data.json :", error);
  });
