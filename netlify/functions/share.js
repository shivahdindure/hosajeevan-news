const admin = require("firebase-admin");

if (!admin.apps.length) {
  // Safe check for environment variables
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKey) {
    console.error(
      "CRITICAL ERROR: FIREBASE_PRIVATE_KEY is missing from Netlify env vars!"
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Use optional chaining (?.) and a fallback to prevent the 'replace' crash
      privateKey: privateKey ? privateKey.replace(/\\n/g, "\n") : undefined,
    }),
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
