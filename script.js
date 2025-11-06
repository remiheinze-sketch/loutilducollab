const feeds = JSON.parse(localStorage.getItem("feeds") || "[]").length
  ? JSON.parse(localStorage.getItem("feeds"))
  : [
      "https://www.lemonde.fr/rss/une.xml",
      "https://www.france24.com/fr/rss",
      "https://feeds.bbci.co.uk/news/rss.xml",
      "https://www.theverge.com/rss/index.xml"
    ];

const listContainer = document.getElementById("articles");
const addBtn = document.getElementById("addFeed");
const refreshBtn = document.getElementById("refresh");
const newFeedInput = document.getElementById("newFeed");
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
  const results = (await Promise.all(feeds.map(fetchFeed))).flat();
  results.sort((a,b) => new Date(b.date) - new Date(a.date));
  render(results);
}

function render(articles) {
  listContainer.innerHTML = "";
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

addBtn.onclick = () => {
  const url = newFeedInput.value.trim();
  if (!url || feeds.includes(url)) return;
  feeds.push(url);
  localStorage.setItem("feeds", JSON.stringify(feeds));
  newFeedInput.value = "";
  loadFeeds();
};

refreshBtn.onclick = loadFeeds;

loadFeeds();