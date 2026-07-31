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

function renderCharacter(character) {
  return `<li><h3>${escapeHtml(character.name ?? "Sans nom")}</h3><p>${escapeHtml(character.description ?? "")}</p></li>`;
}

function renderIllustration(illustration) {
  const alt = illustration.title ?? "Illustration";
  return `<li><img src="${escapeHtml(illustration.src ?? "")}" alt="${escapeHtml(alt)}"><p>${escapeHtml(alt)}</p></li>`;
}

function renderParagraphs(content) {
  return (content ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
    .join("");
}

function renderEveningStory(story) {
  const note = story.note ? `<p class="evening-note">${escapeHtml(story.note)}</p>` : "";
  const warning = story.warning ? `<p class="evening-warning">⚠️ ${escapeHtml(story.warning)}</p>` : "";
  return `<li class="evening-story">
    <h3>${escapeHtml(story.title ?? "Sans titre")}</h3>
    ${note}
    ${warning}
    <div class="evening-content">${renderParagraphs(story.content)}</div>
  </li>`;
}

loadData()
  .then((data) => {
    renderList("stories-list", data.stories, renderStory);
    renderList("characters-list", data.characters, renderCharacter);
    renderList("illustrations-list", data.illustrations, renderIllustration);
    renderList("evening-stories-list", data.eveningStories, renderEveningStory);
  })
  .catch((error) => {
    console.error("Impossible de charger data.json :", error);
  });
