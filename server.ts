/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Material Auto-Completion and AI Copilot Suggestions
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, activeFile, activeContent } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
      }

      const client = getGeminiClient();

      const systemInstruction = `You are "QuoteCopilot", an expert manufacturing and sheet metal fabrication quoting engineer integrated as a VS Code assistant.
Your goal is to help designers, fabricators, and contractors write valid, high-quality, cost-effective Material Quotations.

Our quotation system stores quotes in a structured JSON schema file (.quote.json) with these main parameters:
- "quoteName": string
- "customerName": string
- "creatorName": string
- "status": "Draft" | "Approved" | "Sent" | "Expired"
- "globalMarkup": number (e.g. 1.25 represents 25% markup)
- "taxRate": number (e.g. 0.08 is 8% tax)
- "shippingCost": number
- "laborRatePerHour": number
- "laborAssemblyHours": number
- "parts": array of part items with:
  - "partId": unique alphanumeric string
  - "name": display string
  - "materialId": one of ["al_6061_t6", "ss_304", "brass_c360", "steel_a36", "ti_gr5", "delrin_pom", "polycarb", "acrylic", "carbon_fiber", "garolite_g10", "oak_red", "baltic_birch"]
  - "form": "Block" | "Sheet" | "Cylinder" | "Custom"
  - "dimensions": e.g. { "length": 250, "width": 120, "thickness": 3 } or { "diameter": 20, "length": 150 } or { "weightGrams": 450 }
  - "quantity": number
  - "processes": array of e.g. { "processId": "cnc_mill_3" | "cnc_lathe" | "laser_cutting" | "waterjet" | "fdm_3d_print" | "anodize" | "powder_coat", ... }
- "hardware": array of e.g. { "id": "m3_screw", "name": "M3 Bolt", "unitCost": 0.05, "quantity": 100 }

When the user asks you to:
1. Create a quote from scratch or a prompt, generate the full quote JSON with standard parameters matching our catalog, and reply with helpful manufacturing advice. Always output the raw quote file contained cleanly within a markdown code block \`\`\`json.
2. Troubleshoot or optimize an existing quote (the active file name is: "${activeFile || 'unknown.quote.json'}" and its text contents are: ${activeContent ? JSON.stringify(activeContent) : 'empty'}), analyze the engineering trade-offs, identify excessive machining operations, and propose material substitutions. Include the updated quote in a markdown code block \`\`\`json.
3. If they ask standard metal/material selection or machining questions, answer with clear engineering reasoning.

Ensure your code blocks are clean, valid JSON, and strictly labeled with \`\`\`json. Our VS Code editor contains a "One-click Apply Code" tool which will allow users to directly save your JSON into their current editor view! Add a "suggestedAction" to application models where appropriate.`;

      // Structure chat contents
      const contents = messages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2
        }
      });

      const responseText = response.text || "No response generated.";

      // Check if response contains a JSON code block that we can parse as a "suggested action" reference
      let suggestedAction: any = undefined;
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = responseText.match(jsonRegex);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1].trim());
          // If we could successfully parse it, let's create a suggested action to apply it
          suggestedAction = {
            type: "apply_code",
            filePath: activeFile || "quote_generated.quote.json",
            code: JSON.stringify(parsed, null, 2),
            label: "Update active quote file"
          };
        } catch (je) {
          // ignore parsing error
        }
      }

      res.json({
        content: responseText,
        suggestedAction: suggestedAction
      });

    } catch (err: any) {
      console.error("Gemini Copilot Error:", err);
      res.status(500).json({ error: err.message || "Failed to communicate with AI Copilot" });
    }
  });

  // Client-Side static and Dev serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite proxy...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Material Quoting IDE] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Fatal startup error:", e);
  process.exit(1);
});
