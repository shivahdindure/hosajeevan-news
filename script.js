// ======== LOAD ARTICLES (with optional category) ========
// ======== LOAD ARTICLES (with optional category) ========
function loadArticles(category = "all") {
  const newsGrid = document.getElementById("newsGrid");
  newsGrid.innerHTML = "<p>Loading articles...</p>";

  // 1. Build Query
  let query = db.collection("articles").where("status", "==", "published");

  // Only apply category filter if it's not "all"
  if (category !== "all" && category !== "Home") {
    query = query.where("category", "==", category);
  }

  // 2. Execute Query
  query
    .get()
    .then((snapshot) => {
      let articles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 3. Sort by createdAt (Client-side sorting to avoid Index errors)
      articles.sort((a, b) => {
        let aTime = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt || 0);
        let bTime = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt || 0);
        return bTime - aTime;
      });

      // 4. Render UI
      newsGrid.innerHTML = "";
      if (articles.length === 0) {
        newsGrid.innerHTML = "<p>No articles available in this category.</p>";
        return;
      }

      articles.forEach((article) => {
        const card = document.createElement("div");
        card.className = "news-card";

        const dateText = article.createdAt?.toDate
          ? article.createdAt.toDate().toLocaleDateString()
          : "Recently";

        const mediaContent = article.image
          ? `<div class="news-image"><img src="${article.image}" alt="news"></div>`
          : `<div class="news-image"><div class="news-icon">${
              article.icon || "📰"
            }</div></div>`;

        card.innerHTML = `
          ${mediaContent}
          <div class="news-content">
            <h3 class="news-title">${article.title || "Untitled"}</h3>
            <p class="news-meta">
              ${article.category || "General"} • ${
          article.author || "Admin"
        } • ${dateText}
            </p>
            <p class="news-summary">${article.summary || ""}</p>
            <div class="news-actions">
              <button class="action-btn" onclick="likeArticle('${
                article.id
              }')">❤️ ${article.likes || 0}</button>
              <button onclick="openArticleInNewTab('${
                article.id
              }')">Read More</button>
            </div>
          </div>
        `;
        newsGrid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Firebase Error:", err);
      // CHECK CONSOLE: If it says "The query requires an index", click the link provided in the error.
      newsGrid.innerHTML = `<p>Error loading articles: ${err.message}</p>`;
    });
}

// ======== OPEN FULL ARTICLE IN NEW TAB ========
function openArticleInNewTab(id) {
  window.open(`article.html?id=${id}`, "_blank");
}

// ======== LIKE ARTICLE ========
function likeArticle(id) {
  const articleRef = db.collection("articles").doc(id);
  articleRef
    .update({
      likes: firebase.firestore.FieldValue.increment(1),
    })
    .then(() => {
      console.log("Liked:", id);
      loadArticles(); // refresh cards
    });
}

// ======== COPY LINK ========
function copyLink(id) {
  const link = `${window.location.origin}/article.html?id=${id}`;
  navigator.clipboard.writeText(link).then(() => {
    alert("🔗 Article link copied!");
  });
}

// ======== SHARE ARTICLE ========
function shareArticle(id) {
  const link = `${window.location.origin}/article.html?id=${id}`;
  if (navigator.share) {
    navigator
      .share({
        title: "Check out this article!",
        url: link,
      })
      .catch(console.error);
  } else {
    copyLink(id); // fallback
  }
}

// ======== TRENDING TOPICS ========
function loadTrending() {
  const trendingList = document.getElementById("trendingList");
  trendingList.innerHTML = "<p>Loading...</p>";

  db.collection("trending")
    .doc("topics")
    .get()
    .then((doc) => {
      trendingList.innerHTML = "";
      if (!doc.exists) {
        trendingList.innerHTML = "<p>No trending topics yet.</p>";
        return;
      }

      const topics = doc.data().topics || [];
      topics.forEach((topic, i) => {
        const div = document.createElement("div");
        div.className = "trending-item";
        div.innerHTML = `${i + 1}. ${topic}`;
        trendingList.appendChild(div);
      });
    })
    .catch((err) => console.error("Error loading trending:", err));
}

// ======== SETTINGS (Hero + Site Info) ========
function loadSettings() {
  db.collection("settings")
    .doc("siteConfig")
    .get()
    .then((doc) => {
      if (!doc.exists) return;
      const s = doc.data();

      if (s.siteName) document.querySelector(".logo").textContent = s.siteName;
      if (s.heroTitle)
        document.querySelector(".hero h1").textContent = s.heroTitle;
      if (s.heroDescription)
        document.querySelector(".hero p").textContent = s.heroDescription;

      if (!s.showBreakingBadge) {
        const badge = document.querySelector(".breaking-badge");
        if (badge) badge.style.display = "none";
      }
    })
    .catch((err) => console.error("Error loading settings:", err));
}

// ======== SEARCH ========
function searchNews() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll(".news-card");
  cards.forEach((card) => {
    const title = card.querySelector("h3").textContent.toLowerCase();
    card.style.display = title.includes(input) ? "block" : "none";
  });
}

// ======== INIT ========
document.addEventListener("DOMContentLoaded", () => {
  loadArticles(); // default load all

  // ✅ Attach listeners to nav menu
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = link.dataset.category;

      // Reset active class
      document
        .querySelectorAll(".nav-links a")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      if (category === "home") {
        loadArticles("all");
      } else {
        // 🔹 Capitalize first letter so it matches Firestore values
        const normalized =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

        loadArticles(normalized);
      }
    });
  });
});

function toggleMenu() {
  const nav = document.getElementById("navLinks");
  nav.classList.toggle("show");
}

function loadAds() {
  const slots = {
    // Index Page
    top: document.getElementById("adTop"),
    mid: document.getElementById("adMid"),
    sidebar: document.getElementById("adSidebar"),
    // Article Page
    artSidebar1: document.getElementById("adArticleSidebar1"),
    artSidebar2: document.getElementById("adArticleSidebar2"),
    artInline: document.getElementById("adInlineContent"),
    container: document.getElementById("adsContainer"),
  };

  db.collection("ads")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) return;

      const ads = snapshot.docs.map((doc) => doc.data());

      // This function returns the HTML that matches your CSS
      const getAdHTML = (ad) => `
      <span class="ad-label">Advertisement</span>
      <a href="${ad.link || "#"}" target="_blank">
        <img src="${ad.image}" alt="Sponsored">
      </a>`;

      // Fill Homepage Slots
      if (slots.top && ads[0]) slots.top.innerHTML = getAdHTML(ads[0]);
      if (slots.sidebar && ads[1]) slots.sidebar.innerHTML = getAdHTML(ads[1]);
      if (slots.mid && ads[2]) slots.mid.innerHTML = getAdHTML(ads[2]);

      // Fill Article Page Slots
      if (slots.artSidebar1 && ads[0])
        slots.artSidebar1.innerHTML = getAdHTML(ads[0]);
      if (slots.artSidebar2 && ads[1])
        slots.artSidebar2.innerHTML = getAdHTML(ads[1]);
      if (slots.artInline && ads[2])
        slots.artInline.innerHTML = getAdHTML(ads[2]);

      // Fill Sponsored Container (Extra ads)
      if (slots.container && ads.length > 3) {
        slots.container.innerHTML = `<h3 class="widget-title">Sponsored</h3>`;
        ads.slice(3).forEach((ad) => {
          const div = document.createElement("div");
          div.style.marginBottom = "15px";
          div.innerHTML = getAdHTML(ad);
          slots.container.appendChild(div);
        });
      }
    });
}

document.addEventListener("DOMContentLoaded", loadAds);
