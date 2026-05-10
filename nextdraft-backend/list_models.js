const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function main() {
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: older generative-ai SDK might not have listModels exposed in the client directly if it's very old.
    // Let's use the fetch API directly against the REST endpoint to be safe
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("AVAILABLE MODELS:", data.models.map(m => m.name).join(", "));
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

main();
