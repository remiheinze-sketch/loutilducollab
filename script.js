const defaultFeeds = [
  "https://www.lemonde.fr/rss/une.xml",
  "https://www.france24.com/fr/rss",
  "https://feeds.bbci.co.uk/news/rss.xml",
  "https://www.theverge.com/rss/index.xml"
];
const feeds = JSON.parse(localStorage.getItem("feeds") || "[]");
if (feeds.length === 0) {
  feeds.push(...defaultFeeds);
  localStorage.setItem("feeds", JSON.stringify(feeds));
}
const listContainer = document.getElementById("articles");
const addBtn = document.getElementById("addFeed");
const refreshBtn = document.getElementById("refresh");
const newFeedInput = document.getElementById("newFeed");
const feedList = document.getElementById("feedList");
const sortSelect = document.getElementById("sortSelect");
const proxy = "https://api.allorigins.win/get?url=";

async function fetchFeed(url) {
  try {
    const r = await fetch(proxy + encodeURIComponent(url));
    const data = await r.json();
    const xml = new DOMParser().parseFromString(data.contents, "text/xml");
    return Array.from(xml.querySelectorAll("item, entry")).map(item => ({
      title: item.querySelector("title")?.textContent || "Sans titre",
      link: item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href"),
      date: item.querySelector("pubDate, updated, published")?.textContent || "",
      source: new URL(url).hostname.replace("www.",""),
      desc: item.querySelector("description, summary, content")?.textContent || ""
    }));
  } catch (e) {
    console.warn("Erreur flux:", url, e);
    return [];
  }
}

async function loadFeeds() {
  listContainer.innerHTML = "<p>Chargement des articles...</p>";
  renderFeedList();
  const results = (await Promise.all(feeds.map(fetchFeed))).flat();
  sortAndRender(results);
}

function sortAndRender(articles) {
  const mode = sortSelect.value;
  if (mode === "date") {
    articles.sort((a,b) => new Date(b.date) - new Date(a.date));
  } else if (mode === "title") {
    articles.sort((a,b) => a.title.localeCompare(b.title));
  } else if (mode === "source") {
    articles.sort((a,b) => a.source.localeCompare(b.source));
  }
  render(articles);
}

function render(articles) {
  listContainer.innerHTML = "";
  if (!articles.length) {
    listContainer.innerHTML = "<p>Aucun article trouvé.</p>";
    return;
  }
  articles.forEach(a => {
    const art = document.createElement("article");
    art.innerHTML = `
      <h2><a href="${a.link}" target="_blank">${a.title}</a></h2>
      <small>${a.source} — ${new Date(a.date).toLocaleString()}</small>
      <p>${a.desc.slice(0, 200)}...</p>
    `;
    listContainer.appendChild(art);
  });
}

function renderFeedList() {
  feedList.innerHTML = "";
  feeds.forEach(url => {
    const li = document.createElement("li");
    const name = new URL(url).hostname.replace("www.","");
    li.innerHTML = `<span>${name}</span> <button data-url="${url}">🗑️</button>`;
    feedList.appendChild(li);
  });
  feedList.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      const url = btn.getAttribute("data-url");
      const idx = feeds.indexOf(url);
      if (idx > -1) feeds.splice(idx,1);
      localStorage.setItem("feeds", JSON.stringify(feeds));
      renderFeedList();
      loadFeeds();
    };
  });
}

addBtn.onclick = () => {
  const url = newFeedInput.value.trim();
  if (!url || feeds.includes(url)) return;
  feeds.push(url);
  localStorage.setItem("feeds", JSON.stringify(feeds));
  newFeedInput.value = "";
  renderFeedList();
  loadFeeds();
};

refreshBtn.onclick = loadFeeds;
sortSelect.onchange = loadFeeds;

loadFeeds();
