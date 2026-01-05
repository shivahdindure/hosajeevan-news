const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // This regex is important to handle the private key correctly
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();

exports.handler = async (event) => {
  const articleId = event.queryStringParameters.id;
  if (!articleId)
    return { statusCode: 302, headers: { Location: "/index.html" } };

  try {
    const doc = await db.collection("articles").doc(articleId).get();

    // If article not found, go home
    if (!doc.exists)
      return { statusCode: 302, headers: { Location: "/index.html" } };

    const article = doc.data();
    const title = article.title || "ಹೊಸ ಜೀವನ ಸುದ್ದಿ";
    const summary = article.summary || "ಕನ್ನಡ ಸುದ್ದಿ";
    // IMPORTANT: Use the article image if it exists, otherwise banner
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
                <meta property="og:url" content="https://hosajeevandaily.netlify.app/share?id=${articleId}">
                <meta property="og:type" content="article">
                <script>window.location.href = "/article.html?id=${articleId}";</script>
            </head>
            <body><p>Loading article...</p></body>
        </html>`,
    };
  } catch (error) {
    console.error("Function Error:", error);
    return { statusCode: 302, headers: { Location: "/index.html" } };
  }
};
