// ======== FIREBASE CONFIG ========
const firebaseConfig = {
  apiKey: "AIzaSyCPRewTIqKATawCsZjT9BcenXD6aCtiRcY",
  authDomain: "hosajeevannews.firebaseapp.com",
  projectId: "hosajeevannews",
  storageBucket: "hosajeevannews.appspot.com",
  messagingSenderId: "253061123621",
  appId: "1:253061123621:web:b44143a03334db521bb9cc",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get("id");

// ======== LOAD ARTICLE CONTENT ========
async function loadArticle() {
  if (!articleId) return;

  try {
    const doc = await db.collection("articles").doc(articleId).get();
    if (!doc.exists) return;

    const article = doc.data();

    /* ================= META TAGS (ADD THIS PART) ================= */
    document
      .getElementById("metaTitle")
      ?.setAttribute("content", article.title || "News");

    document
      .getElementById("metaDesc")
      ?.setAttribute("content", article.summary || "ಕನ್ನಡ ಸುದ್ದಿ");

    document
      .getElementById("metaImage")
      ?.setAttribute("content", article.image || "banner.jpg");
    /* ============================================================= */

    // Metadata
    document.getElementById("articleCategory").textContent =
      article.category || "General";
    document.getElementById("articleTitle").textContent =
      article.title || "Untitled";
    document.getElementById("articleAuthor").textContent =
      article.author || "Anonymous";

    // Date formatting
    if (article.createdAt) {
      const date = article.createdAt.toDate
        ? article.createdAt.toDate()
        : new Date(article.createdAt);

      document.getElementById("articleDate").textContent =
        date.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    }

    // Image
    const hero = document.getElementById("articleHeroImage");
    hero.innerHTML = article.image
      ? `<img src="${article.image}" alt="news">`
      : `<div class="hero-placeholder">${article.icon || "📰"}</div>`;

    // Body Content
    let bodyHTML = article.summary
      ? `<p class="article-summary"><strong>${article.summary}</strong></p>`
      : "";
    bodyHTML += article.content || "";
    document.getElementById("articleBody").innerHTML = bodyHTML;

    // Position the Inline Ad after 2nd paragraph
    const paragraphs = document.querySelectorAll("#articleBody p");
    if (paragraphs.length > 2) {
      paragraphs[1].after(document.getElementById("adInlineContent"));
    }

    loadRelatedArticles(articleId, article.category);
  } catch (e) {
    console.error("Load Article Error:", e);
  }
}

// ======== LOAD ADS (Flexible) ========
async function loadAds() {
  const slots = {
    side1: document.getElementById("adArticleSidebar1"),
    side2: document.getElementById("adArticleSidebar2"),
    inline: document.getElementById("adInlineContent"),
    container: document.getElementById("adsContainer"),
  };

  try {
    const snap = await db.collection("ads").get();
    if (snap.empty) return;

    const ads = snap.docs.map((doc) => doc.data());
    const getAdHTML = (ad) => `
            <p class="ad-label" style="font-size:10px; color:#999; margin:5px 0; text-align:center;">ADVERTISEMENT</p>
            <a href="${ad.link || "#"}" target="_blank">
                <img src="${
                  ad.image
                }" style="width:100%; border-radius:8px; display:block;">
            </a>`;

    if (ads[0] && slots.side1) slots.side1.innerHTML = getAdHTML(ads[0]);
    if (ads[1] && slots.side2) slots.side2.innerHTML = getAdHTML(ads[1]);
    if (ads[2] && slots.inline) slots.inline.innerHTML = getAdHTML(ads[2]);

    if (ads.length > 3 && slots.container) {
      slots.container.innerHTML = `<h3 class="widget-title">Sponsored</h3>`;
      ads.slice(3).forEach((ad) => {
        const div = document.createElement("div");
        div.style.marginBottom = "15px";
        div.innerHTML = getAdHTML(ad);
        slots.container.appendChild(div);
      });
    }
  } catch (e) {
    console.error("Load Ads Error:", e);
  }
}

// ======== OTHER FEATURES (Ticker, Related, Trending) ========
async function loadBreakingNews() {
  const track = document.getElementById("breakingNews");
  const snap = await db
    .collection("articles")
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();
  track.innerHTML = snap.docs
    .map((doc) => `<a href="article.html?id=${doc.id}">${doc.data().title}</a>`)
    .join(" ⚡ ");
}

async function loadTrendingArticles() {
  const container = document.getElementById("trendingArticles");
  const snap = await db
    .collection("articles")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();
  container.innerHTML = snap.docs
    .map(
      (doc, i) => `
        <div class="trending-item" onclick="location.href='article.html?id=${
          doc.id
        }'">
            <span class="trending-number">${i + 1}</span>
            <div class="trending-content"><h4>${doc.data().title}</h4></div>
        </div>`
    )
    .join("");
}

function loadRelatedArticles(id, cat) {
  db.collection("articles")
    .where("category", "==", cat)
    .limit(4)
    .get()
    .then((snap) => {
      const container = document.getElementById("relatedArticles");
      container.innerHTML = snap.docs
        .filter((d) => d.id !== id)
        .map(
          (doc) => `
            <div class="related-card" onclick="location.href='article.html?id=${
              doc.id
            }'">
                <img src="${doc.data().image || "placeholder.jpg"}">
                <p>${doc.data().title}</p>
            </div>`
        )
        .join("");
    });
}

// ======== SHARE & TRACKING ========
function shareWhatsApp() {
  const title = document.getElementById("articleTitle").textContent;
  const shareUrl = `${window.location.origin}/share?id=${articleId}`;
  const text = encodeURIComponent(`${title}\n${shareUrl}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
}
function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("Copied!");
}

// Initialization
async function init() {
  await loadArticle(); // Must be first
  loadAds();
  loadBreakingNews();
  loadTrendingArticles();
}
init();
