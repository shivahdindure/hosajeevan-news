// ======== FIREBASE INITIALIZATION ========
const firebaseConfig = {
  apiKey: "AIzaSyCPRewTIqKATawCsZjT9BcenXD6aCtiRcY",
  authDomain: "hosajeevannews.firebaseapp.com",
  projectId: "hosajeevannews",
  storageBucket: "hosajeevannews.appspot.com",
  messagingSenderId: "253061123621",
  appId: "1:253061123621:web:b44143a03334db521bb9cc",
  measurementId: "G-78SK654J2G",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =================== GLOBAL STATE ===================
let newsData = [];
let trendingTopics = [];
let isUploading = false; // Tracks Cloudinary status

// =================== INIT ===================
document.addEventListener("DOMContentLoaded", function () {
  loadArticlesTable();
  loadTrendingTopics();
  loadSettings();
  loadAds();
  setupFormValidation();
  setupAdsForm();
  showSection("dashboard");
});

// =================== CLOUDINARY CONFIG ===================
const CLOUD_NAME = "dtbckoerz";
const UPLOAD_PRESET = "hosajeevan";

// Generic Cloudinary Upload Function
async function uploadToCloudinary(
  file,
  statusLabelId,
  hiddenInputId,
  previewImgId,
  previewContainerId
) {
  const statusLabel = document.getElementById(statusLabelId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const previewImg = document.getElementById(previewImgId);
  const previewContainer = document.getElementById(previewContainerId);

  isUploading = true;
  statusLabel.innerHTML = "⏳ Uploading...";
  statusLabel.style.color = "orange";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();

    if (data.secure_url) {
      hiddenInput.value = data.secure_url;
      if (previewImg) previewImg.src = data.secure_url;
      if (previewContainer) previewContainer.style.display = "block";

      statusLabel.innerHTML = "✅ Upload Successful!";
      statusLabel.style.color = "green";
      showToast("Image ready!", "success");
    } else {
      throw new Error("Upload Failed");
    }
  } catch (error) {
    statusLabel.innerHTML = "❌ Upload Failed";
    statusLabel.style.color = "red";
    console.error(error);
  } finally {
    isUploading = false;
  }
}

// Handler for Article Image
async function handleImageUpload(input) {
  if (input.files && input.files[0]) {
    await uploadToCloudinary(
      input.files[0],
      "uploadStatusLabel",
      "articleImage",
      "imagePreview",
      "imagePreviewContainer"
    );
  }
}

// =================== ARTICLES LOGIC ===================
function loadArticlesTable() {
  const tbody = document.getElementById("articlesTableBody");
  if (!tbody) return;
  tbody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";

  db.collection("articles")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      newsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      updateDashboardStats();
      tbody.innerHTML = "";

      newsData.forEach((article) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${article.title}</td>
        <td>${article.category}</td>
        <td><span class="status-badge status-${article.status}">${
          article.status
        }</span></td>
        <td>${article.views || 0}</td>
        <td>${
          article.createdAt
            ? article.createdAt.toDate().toLocaleDateString()
            : "N/A"
        }</td>
        <td>
          <button class="btn btn-danger" onclick="deleteArticle('${
            article.id
          }')">Delete</button>
        </td>
      `;
        tbody.appendChild(row);
      });
    });
}

function updateDashboardStats() {
  document.getElementById("totalArticles").textContent = newsData.length;
  document.getElementById("publishedArticles").textContent = newsData.filter(
    (a) => a.status === "published"
  ).length;
  document.getElementById("draftArticles").textContent = newsData.filter(
    (a) => a.status === "draft"
  ).length;
}

function deleteArticle(id) {
  if (confirm("Are you sure you want to delete this article?")) {
    db.collection("articles")
      .doc(id)
      .delete()
      .then(() => {
        showToast("Article deleted!", "success");
        loadArticlesTable();
      });
  }
}

function setupFormValidation() {
  const articleForm = document.getElementById("articleForm");
  if (articleForm) {
    articleForm.addEventListener("submit", handleArticleSubmit);
  }
}

async function handleArticleSubmit(e) {
  e.preventDefault();
  if (isUploading) return showToast("Please wait for image upload...", "error");

  const formData = new FormData(e.target);
  const imageUrl = document.getElementById("articleImage").value;
  const icon = document.getElementById("articleIcon").value;

  const article = {
    title: formData.get("title"),
    category: formData.get("category"),
    summary: formData.get("summary"),
    content: formData.get("content"),
    author: formData.get("author"),
    status: formData.get("status"),
    image: imageUrl || null,
    icon: imageUrl ? null : icon,
    breaking: formData.get("breaking") === "on",
    likes: 0,
    views: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  db.collection("articles")
    .add(article)
    .then(() => {
      showToast("Article Published!", "success");
      e.target.reset();
      resetUploadUI();
      loadArticlesTable();
    });
}

function saveAsDraft() {
  const form = document.getElementById("articleForm");
  const formData = new FormData(form);
  const imageUrl = document.getElementById("articleImage").value;

  const draft = {
    title: formData.get("title") || "Untitled Draft",
    category: formData.get("category") || "General",
    summary: formData.get("summary") || "",
    content: formData.get("content") || "",
    author: formData.get("author") || "Admin",
    status: "draft",
    image: imageUrl || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  db.collection("articles")
    .add(draft)
    .then(() => {
      showToast("Draft Saved!", "success");
      form.reset();
      resetUploadUI();
      loadArticlesTable();
    });
}

function resetUploadUI() {
  document.getElementById("articleImage").value = "";
  document.getElementById("imagePreviewContainer").style.display = "none";
  document.getElementById("uploadStatusLabel").innerHTML = "No file chosen";
  document.getElementById("uploadStatusLabel").style.color = "#555";
}

// =================== ADS LOGIC ===================
function setupAdsForm() {
  const adsForm = document.getElementById("adsForm");
  if (!adsForm) return;

  adsForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const imageUrl = document.getElementById("adImage").value;
    const linkUrl = document.getElementById("adLink").value;

    if (!imageUrl) return showToast("Please provide an ad image URL", "error");

    db.collection("ads")
      .add({
        image: imageUrl,
        link: linkUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        showToast("Advertisement added!", "success");
        adsForm.reset();
        loadAds();
      });
  });
}

function loadAds() {
  const adsList = document.getElementById("adsList");
  if (!adsList) return;

  db.collection("ads")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      adsList.innerHTML = "";
      snapshot.forEach((doc) => {
        const ad = doc.data();
        const div = document.createElement("div");
        div.className = "trending-item";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.innerHTML = `
        <img src="${
          ad.image
        }" style="width: 100px; height: 50px; object-fit: cover; border-radius: 4px;">
        <span style="font-size: 12px; overflow: hidden; max-width: 200px;">${
          ad.link || "No Link"
        }</span>
        <button class="btn btn-danger" onclick="deleteAd('${
          doc.id
        }')">Remove</button>
      `;
        adsList.appendChild(div);
      });
    });
}

function deleteAd(id) {
  if (confirm("Delete this ad?")) {
    db.collection("ads")
      .doc(id)
      .delete()
      .then(() => {
        showToast("Ad removed!", "success");
        loadAds();
      });
  }
}

// =================== TRENDING TOPICS ===================
function loadTrendingTopics() {
  const container = document.getElementById("trendingTopicsList");
  if (!container) return;

  db.collection("trending")
    .doc("topics")
    .get()
    .then((doc) => {
      container.innerHTML = "";
      if (doc.exists) {
        trendingTopics = doc.data().topics || [];
        trendingTopics.forEach((topic, index) => {
          const div = document.createElement("div");
          div.className = "trending-item";
          div.innerHTML = `
          <span>${index + 1}. ${topic}</span>
          <button class="btn btn-danger" onclick="removeTrendingTopic(${index})">Remove</button>
        `;
          container.appendChild(div);
        });
      }
    });
}

function addTrendingTopic() {
  const input = document.getElementById("newTrendingTopic");
  const topic = input.value.trim();
  if (!topic) return;

  trendingTopics.push(topic);
  db.collection("trending")
    .doc("topics")
    .set({ topics: trendingTopics })
    .then(() => {
      showToast("Topic added!", "success");
      input.value = "";
      loadTrendingTopics();
    });
}

function removeTrendingTopic(index) {
  trendingTopics.splice(index, 1);
  db.collection("trending")
    .doc("topics")
    .set({ topics: trendingTopics })
    .then(() => {
      showToast("Topic removed!", "success");
      loadTrendingTopics();
    });
}

// =================== SETTINGS ===================
function loadSettings() {
  db.collection("settings")
    .doc("siteConfig")
    .get()
    .then((doc) => {
      if (doc.exists) {
        const s = doc.data();
        document.getElementById("siteName").value = s.siteName || "";
        document.getElementById("siteTagline").value = s.siteTagline || "";
        document.getElementById("siteDescription").value =
          s.siteDescription || "";
      }
    });
}

function saveSettings() {
  const settings = {
    siteName: document.getElementById("siteName").value,
    siteTagline: document.getElementById("siteTagline").value,
    siteDescription: document.getElementById("siteDescription").value,
  };

  db.collection("settings")
    .doc("siteConfig")
    .set(settings)
    .then(() => {
      showToast("Settings saved!", "success");
    });
}

// =================== UI HELPERS ===================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toastMessage");
  msg.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function previewSite() {
  window.open("index.html", "_blank");
}

function logout() {
  alert("Logging out...");
  // Add Firebase Auth logout here if used
}
