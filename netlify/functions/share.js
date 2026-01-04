const admin = require("firebase-admin");

// Initialize Firebase Admin (Required to read your news from Firestore)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "hosajeevannews",
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  const articleId = event.queryStringParameters.id;

  if (!articleId) {
    return { statusCode: 302, headers: { Location: "/index.html" } };
  }

  try {
    const doc = await db.collection("articles").doc(articleId).get();

    if (!doc.exists) {
      return { statusCode: 302, headers: { Location: "/index.html" } };
    }

    const article = doc.data();
    const title = article.title || "ಹೊಸ ಜೀವನ ಸುದ್ದಿ";
    const summary = article.summary || "ಇಂದಿನ ಪ್ರಮುಖ ಸುದ್ದಿಗಳು";
    const image = article.image || "https://your-domain.com/banner.jpg";

    // Return HTML to the WhatsApp Bot
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <meta property="og:title" content="${title}">
                <meta property="og:description" content="${summary}">
                <meta property="og:image" content="${image}">
                <meta property="og:type" content="article">
                <script>window.location.href = "/article.html?id=${articleId}";</script>
            </head>
            <body><p>Loading article...</p></body>
        </html>
      `,
    };
  } catch (error) {
    return { statusCode: 302, headers: { Location: "/index.html" } };
  }
};
