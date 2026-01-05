const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "hosajeevannews", // Your project ID
  });
}
const db = admin.firestore();

exports.handler = async (event) => {
  const articleId = event.queryStringParameters.id;
  if (!articleId)
    return { statusCode: 302, headers: { Location: "/index.html" } };

  try {
    const doc = await db.collection("articles").doc(articleId).get();
    if (!doc.exists)
      return { statusCode: 302, headers: { Location: "/index.html" } };

    const article = doc.data();
    const title = article.title || "ಹೊಸ ಜೀವನ ಸುದ್ದಿ";
    const summary = article.summary || "ಕನ್ನಡ ಸುದ್ದಿ";
    const image =
      article.image || "https://hosajeevandaily.netlify.app/banner.jpg";

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
                <meta property="og:url" content="https://hosajeevandaily.netlify.app/article.html?id=${articleId}">
                <meta property="og:type" content="article">
                <script>window.location.href = "/article.html?id=${articleId}";</script>
            </head>
            <body><p>Loading article...</p></body>
        </html>`,
    };
  } catch (error) {
    return { statusCode: 302, headers: { Location: "/index.html" } };
  }
};
