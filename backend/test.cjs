const axios = require("axios");
axios
  .post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=YOUR_API_KEY",
    {
      contents: [{ parts: [{ text: 'You are an AI. Return JSON: {"summary": "test"}' }] }],
      generationConfig: { response_mime_type: "application/json", maxOutputTokens: 4096 },
    },
  )
  .then((res) => console.log("success:", res.data.candidates[0].content.parts[0].text))
  .catch((err) => console.error(err.response?.data || err.message));
