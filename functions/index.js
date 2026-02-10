const { onRequest } = require("firebase-functions/v2/https");
const fetch = require("node-fetch");
const { parseStringPromise } = require("xml2js");

exports.getPodcast = onRequest({ cors: true }, async (req, res) => {
  const rssUrl = "https://anchor.fm/s/f7a13dec/podcast/rss";

  try {
    const response = await fetch(rssUrl);
    const xmlData = await response.text(); // Henter feeden som tekst/XML
    
    // Oversetter XML til JSON
    const jsonData = await parseStringPromise(xmlData, { explicitArray: false });
    
    res.status(200).send(jsonData);
  } catch (error) {
    console.error("Feil:", error);
    res.status(500).send({ error: "Kunne ikke hente eller oversette feeden" });
  }
});