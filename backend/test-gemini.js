import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "YOUR_API_KEY";
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

async function testGemini() {
  console.log("==========================================");
  console.log("      GEMINI API DIAGNOSTIC UTILITY       ");
  console.log("==========================================\n");
  console.log(`Using Key: ${apiKey ? apiKey.substring(0, 10) + "..." : "None"}`);
  console.log(`Using Model: ${model}\n`);

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    console.error("❌ ERROR: No API key provided! Please set GEMINI_API_KEY in backend/.env");
    return;
  }

  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log("Step 1: Authenticating key & listing available models...");
    const response = await axios.get(listUrl, { timeout: 10000 });
    console.log("✅ Authentication Successful!");

    let availableModels = [];
    if (response.data && response.data.models) {
      availableModels = response.data.models.map((m) => m.name.replace("models/", ""));
      console.log(`\nFound ${availableModels.length} models. Supported models include:`);
      availableModels.slice(0, 10).forEach((m) => console.log(`  - ${m}`));
      if (availableModels.length > 10) console.log("  ... and more.");
    }

    // Step 2: Test content generation with selected model
    const testModel = availableModels.includes(model) ? model : availableModels[0] || model;
    console.log(`\nStep 2: Testing text generation with model: '${testModel}'...`);

    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`;
    const generateResponse = await axios.post(
      generateUrl,
      {
        contents: [
          {
            parts: [{ text: "Hello! Reply with exactly 'Gemini is fully operational!'" }],
          },
        ],
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      },
    );

    const reply = generateResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log("\n✅ Content Generation Success!");
    console.log(`Gemini Reply: "${reply}"`);
    console.log("\n🎉 The Gemini API integration is fully functional and ready!");
  } catch (error) {
    console.error("\n❌ API Call Failed!");
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      console.error(`Status Code: ${status}`);

      if (status === 403) {
        const msg = data?.error?.message || "";
        if (msg.includes("leaked")) {
          console.error("\n========================================================");
          console.error("🔴 CRITICAL: YOUR GEMINI API KEY WAS BLOCKED AS LEAKED!");
          console.error("Google automatically deactivates keys found in public repos.");
          console.error("========================================================");
          console.error("\nHOW TO RECTIFY:");
          console.error("1. Go to Google AI Studio: https://aistudio.google.com/");
          console.error("2. Sign in and create a new API Key.");
          console.error("3. Open the file 'backend/.env' in your editor.");
          console.error("4. Update 'GEMINI_API_KEY' with your new key.");
          console.error("5. Restart your docker containers: docker compose up -d --build");
          console.error("========================================================\n");
        } else {
          console.error(`Permission Denied (403): ${msg}`);
          console.error(
            "Please verify that the Generative Language API is enabled on your API key.",
          );
        }
      } else if (status === 404) {
        console.error(`Model Not Found (404): ${data?.error?.message}`);
        console.error(
          "The selected model is deprecated or invalid for your region. Try setting GEMINI_MODEL=gemini-1.5-flash",
        );
      } else {
        console.error("Error Response Body:", JSON.stringify(data, null, 2));
      }
    } else {
      console.error(`Connection Error: ${error.message}`);
      console.error("Please verify your internet connection or check proxy settings.");
    }
  }
}

testGemini();
