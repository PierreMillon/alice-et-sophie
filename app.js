async function loadData() {
  const response = await fetch("data.json");
  return response.json();
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
  return `<li><h3>${story.title ?? "Sans titre"}</h3><p>${story.summary ?? ""}</p></li>`;
}

function renderCharacter(character) {
  return `<li><h3>${character.name ?? "Sans nom"}</h3><p>${character.description ?? ""}</p></li>`;
}

function renderIllustration(illustration) {
  const alt = illustration.title ?? "Illustration";
  return `<li><img src="${illustration.src ?? ""}" alt="${alt}"><p>${alt}</p></li>`;
}

loadData()
  .then((data) => {
    renderList("stories-list", data.stories, renderStory);
    renderList("characters-list", data.characters, renderCharacter);
    renderList("illustrations-list", data.illustrations, renderIllustration);
  })
  .catch((error) => {
    console.error("Impossible de charger data.json :", error);
  });
