import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { safeParseAIJson } from "./utils/jsonParser.js";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Shared lazy-loaded GenAI client
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Track temporarily suspended/restricted models due to 429 quota or 503 load issues
  const suspendedModels = new Map<string, number>();

  // Caching for expensive API calls to reduce rate limit issues and speed up response times
  const localInfoCache = new Map<string, { text: string; links: any[]; expiresAt: number }>();
  const diySearchCache = new Map<string, { projects: any[]; expiresAt: number }>();
  const diyTutorialCache = new Map<string, { tutorial: any; text: string; expiresAt: number }>();

  // Fast timeout utility to ensure any hanging or queuing Gemini API call aborts quickly
  async function callGeminiWithTimeout<T>(
    apiCall: () => Promise<T>,
    timeoutMs = 6500
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Model request exceeded ${timeoutMs}ms timeout ceiling`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([apiCall(), timeoutPromise]);
      clearTimeout(timer!);
      return result;
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

  // Generates content with dynamic zero-delay fallback models.
  // When a model returns 503 (high demand), 429 (rate limit), or times out,
  // it immediately routes to the next alternative model without costly sequential sleep retries.
  async function generateWithFallback(
    params: any,
    primaryModel = "gemini-3.1-flash-lite",
    ...additionalModels: string[]
  ): Promise<any> {
    const ai = getAI();
    
    // Ordered pool of high-speed active models with healthy quota
    const defaultModels = [
      primaryModel,
      "gemini-3.1-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
    ];

    const modelsToTry = [
      primaryModel,
      ...additionalModels,
      ...defaultModels,
    ];
    
    // Remove duplicates while preserving prioritized order
    const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
    const now = Date.now();

    // Filter out temporarily suspended models unless all are suspended
    const activeModels = uniqueModels.filter(m => {
      const expiresAt = suspendedModels.get(m);
      return !expiresAt || now > expiresAt;
    });

    const finalModels = activeModels.length > 0 ? activeModels : uniqueModels;
    let lastErr: any = null;

    for (const model of finalModels) {
      const t0 = Date.now();
      try {
        console.log(`[Model Routing] Submitting payload through: ${model}`);
        const result = await callGeminiWithTimeout(
          () => ai.models.generateContent({
            ...params,
            model,
          }),
          6500 // 6.5s timeout ceiling per model for high responsiveness
        );
        console.log(`[Model Routing] Succeeded with ${model} in ${Date.now() - t0}ms`);
        return result;
      } catch (err: any) {
        lastErr = err;
        const elapsed = Date.now() - t0;
        const errMsg = String(err.message || "").toLowerCase();
        const errStatus = err.status || (err.error && err.error.code);
        const isDailyQuotaExhausted = errStatus === 429 && (errMsg.includes("limit: 20") || errMsg.includes("free_tier") || errMsg.includes("resource_exhausted"));
        const isQuotaOrUnavailable = 
          errStatus === 429 || 
          errStatus === 503 || 
          errMsg.includes("429") || 
          errMsg.includes("503") || 
          errMsg.includes("quota") || 
          errMsg.includes("exhausted") || 
          errMsg.includes("limit") || 
          errMsg.includes("unavailable") || 
          errMsg.includes("busy") ||
          errMsg.includes("timed out") ||
          errMsg.includes("timeout");

        if (isDailyQuotaExhausted) {
          // Suspend model for 1 hour if daily quota is reached so requests don't waste time attempting it
          suspendedModels.set(model, Date.now() + 3600000);
          console.log(`[Model Routing] ${model} daily free quota exhausted. Suspended for 1 hour.`);
        } else if (isQuotaOrUnavailable) {
          // Suspend model for 3 minutes so upcoming requests route directly to available models
          suspendedModels.set(model, Date.now() + 180000);
          console.log(`[Model Routing] ${model} flagged (503/timeout/busy after ${elapsed}ms) - suspended for 3m. Instantly jumping to next model...`);
        } else {
          console.log(`[Model Routing] ${model} encountered error after ${elapsed}ms: ${errMsg.slice(0, 80)}. Switching to next model...`);
        }
      }
    }

    throw lastErr;
  }

  // API Route: Analyze image for waste classification
  app.post("/api/analyze", async (req, res) => {
    const fallbackAnalysis = {
      items: [
        {
          item: "Household Container / Box",
          category: "RECYCLE",
          confidence: 0.88,
          reason: "This is a standard household packaging container. Most paperboard and card stock packagings are clean, stable, and highly recyclable.\n- **Reuse**: Trim the container, decorate it with wrap paper, and use it as a desktop stationery organizer.\n- **Recycle**: Flatten and toss into your regular curb-side blue recycling bin.\n- **Donate**: Local elementary schools or community craft clubs often accept clean containers for art projects.",
          disposalInstructions: "Thoroughly rinse the container to remove food or liquid residues. Detach standard plastic caps if they differ in material, then place the cleaned body directly into your municipal blue recycling bin.",
          carbonImpact: "Saves approximately 0.5kg of CO2 equivalent by substituting virgin material extraction.",
          diyProjects: [
            {
              title: "Custom Stationary Holder",
              description: "Upcycle this box/container by trimming the top edges, wrapping it with discarded newspaper or fabric, and using it as a handy tabletop organizer."
            },
            {
              title: "Compact Desk Storage Compartment",
              description: "Cut down the height, design simple cardboard dividers from scrap, and establish a convenient tray for keys, cables, or office items."
            }
          ]
        }
      ]
    };

    try {
      const { base64Data, prompt, learnedPromptSection } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const response = await generateWithFallback({
        contents: [
          {
            parts: [
              { text: prompt + (learnedPromptSection || "") },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                description: "List of all distinct waste items identified in the image.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    category: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    reason: { type: Type.STRING },
                    disposalInstructions: { type: Type.STRING },
                    carbonImpact: { type: Type.STRING },
                    materialGroup: { type: Type.STRING, description: "Short classification name" },
                    boundingBox: {
                      type: Type.ARRAY,
                      description: "2D Bounding box coordinates normalized from 0 to 1000 in [ymin, xmin, ymax, xmax] format.",
                      items: { type: Type.NUMBER }
                    },
                    diyProjects: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING }
                            }
                        }
                    }
                  },
                  required: ["item", "category", "reason", "confidence"],
                },
              },
            },
            required: ["items"],
          },
        },
      }, "gemini-3.5-flash");

      const rawText = response.text || "";
      
      // Parse & repair JSON safely
      const parsed = safeParseAIJson<{ items: any[] }>(rawText, { items: [] });
      
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        // Sanitize string fields in parsed items to remove any unexpected repetition
        const sanitizedItems = parsed.items.map((it) => ({
          ...it,
          materialGroup: typeof it.materialGroup === 'string' ? it.materialGroup.split('\n')[0].substring(0, 50) : 'General',
          item: typeof it.item === 'string' ? it.item.substring(0, 100) : 'Item',
        }));

        res.json({ text: JSON.stringify({ items: sanitizedItems }) });
      } else {
        res.json({ text: JSON.stringify(fallbackAnalysis), isFallback: true });
      }
    } catch (err: any) {
      console.log("[Service Routing] Utilizing local model fallback rules for /api/analyze (" + (err.message || err) + ")");
      res.json({ text: JSON.stringify(fallbackAnalysis), isFallback: true });
    }
  });

  // API Route: Find nearby centers using Maps grounding
  app.post("/api/find-centers", async (req, res) => {
    const { itemLabel, userLocation } = req.body;
    try {
      if (!itemLabel) {
        return res.status(400).json({ error: "No item label provided" });
      }

      const prompt = `Find specialized recycling or disposal centers for ${itemLabel} near me.`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: userLocation || { latitude: 0, longitude: 0 },
            },
          },
        },
      }, "gemini-2.5-flash", "gemini-flash-latest");

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .filter((c) => c.maps)
        .map((c) => ({
          title: c.maps?.title || "Disposal Center",
          uri: c.maps?.uri || "",
        }));

      res.json({ links });
    } catch (err: any) {
      console.log("[Service Routing] Utilizing local model fallback rules for /api/find-centers (" + (err.message || err) + ")");
      const searchQuery = encodeURIComponent(`recycling centers for ${itemLabel || "special waste"}`);
      const fallbackLinks = [
        {
          title: `Find ${itemLabel || "Special Waste"} recycling on Google Maps`,
          uri: `https://www.google.com/maps/search/?api=1&query=${searchQuery}`
        }
      ];
      res.json({ links: fallbackLinks, isFallback: true });
    }
  });

  // API Route: Text-To-Speech (audio generation)
  app.post("/api/speak", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const ai = getAI();
      const response = await callGeminiWithTimeout(() =>
        ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" },
              },
            },
          },
        }),
        12000
      );

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      res.json({ audioData });
    } catch (err: any) {
      console.log("[Service Routing] Utilizing browser built-in TTS fallback for /api/speak (" + (err.message || err) + ")");
      res.json({ audioData: null, isFallback: true });
    }
  });

  // API Route: Chatbot response
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      const systemInstruction = `You are EcoHero AI, an expert personal sustainability coach and environmental advisor. Your primary role is to provide clear, actionable, and well-summarized advice on:
- Environmental protection, climate action, and ecology
- Proper waste sorting, recycling, composting, zero-waste lifestyles, and circular economy practices
- Energy and water conservation, renewable energy, and sustainable daily habits
- Eco-friendly product alternatives, green tech, upcycling, and ecosystem health

Guidelines for Summarized & High-Impact Output:
1. **Executive Summary**: Start with a concise 1-2 sentence core takeaway that directly answers the user's question.
2. **Key Actionable Points**: Follow with 3 to 5 clear, scannable bullet points using bolded keywords for immediate readability.
3. **No Fluff or Overly Long Essays**: Keep explanations tight, punchy, and structured. Avoid rambling intro sentences or multi-paragraph walls of text.
4. **Rich Formatting**: Use clean Markdown bolding, bullet lists, and section headers so the advice can be digested in a quick glance.
5. **Relevance**: If the user asks a question completely unrelated to sustainability or climate, politely redirect them back to eco-friendly topics.`;

      // Filter and format messages for @google/genai SDK
      let formattedMessages = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      // Ensure history starts with a user message for valid chat contents structure
      while (formattedMessages.length > 0 && formattedMessages[0].role === "model") {
        formattedMessages.shift();
      }

      // Keep recent context (up to 6 turns) ensuring first message is user
      if (formattedMessages.length > 6) {
        formattedMessages = formattedMessages.slice(-6);
        if (formattedMessages.length > 0 && formattedMessages[0].role === "model") {
          formattedMessages.shift();
        }
      }

      if (formattedMessages.length === 0) {
        return res.status(400).json({ error: "No user message found" });
      }

      const response = await generateWithFallback({
        contents: formattedMessages,
        config: {
          systemInstruction,
          maxOutputTokens: 1024,
        },
      }, "gemini-3.1-flash-lite");

      const text = response.text || "I'm here to help you live more sustainably! What eco-friendly topic would you like to explore?";
      res.json({ text });
    } catch (err: any) {
      console.error("[Service Routing] Error in /api/chat:", err);
      console.log("[Service Routing] Utilizing local model fallback rules for /api/chat (" + (err.message || err) + ")");

      const fallbackReplies = [
        "That's a fantastic sustainability question! While our high-reasoning AI coach is experiencing high server traffic, here is key guidance: **Reduce, Reuse, Upcycle, and Recycle!** \n\n- **Reduce**: Cut down on single-use items by opting for reusable containers and bags.\n- **Upcycle**: Before discarding containers or textiles, consider repurposing them into planters, organizers, or craft items.\n- **Recycle Properly**: Always ensure plastics (#1, #2, #5) and glass/metal are clean and dry before placing them in your local recycling bin.\n\nLet me know if you would like specific tips on composting or sorting!",
        "Thanks for asking! As an eco-coach, I always emphasize that daily conscious habits create huge environmental impact.\n\n- **Energy Conservation**: Unplug phantom electronics and switch to LED lighting.\n- **Water Saving**: Fix minor leaks and install low-flow aerators.\n- **Waste Minimization**: Separate organic food waste for composting to reduce landfill methane emissions.\n\nHow can I help you take your next green step today?",
        "Great environmental topic! Proper waste management keeps our oceans and ecosystems healthy.\n\n- **Composting**: Fruit peels, coffee grounds, and yard trimmings create nutrient-rich soil.\n- **Hazardous & E-Waste**: Batteries and old electronics should go to dedicated community drop-off depots, never trash bins.\n\nFeel free to ask any specific question about recycling or green living!"
      ];
      
      const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      res.json({ text: randomReply, isFallback: true });
    }
  });

  // API Route: Preload answers for suggested prompts
  app.post("/api/chat/preload", async (req, res) => {
    try {
      const { prompts } = req.body;
      if (!prompts || !Array.isArray(prompts)) {
        return res.status(400).json({ error: "Invalid prompts format" });
      }

      const answers: Record<string, string> = {};
      
      // Parallel generation
      await Promise.all(prompts.map(async (promptText) => {
        try {
          const response = await generateWithFallback({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            config: {
              systemInstruction: `You are EcoHero AI. Provide a concise, highly structured, punchy answer to: "${promptText}". Use bolding and bullet points. Keep it short.`,
              maxOutputTokens: 500,
            },
          }, "gemini-3.1-flash-lite");
          
          answers[promptText] = response.text || "I'm here to help you live more sustainably!";
        } catch (e) {
          console.error(`Error preloading answer for ${promptText}:`, e);
          answers[promptText] = "I'm here to help you live more sustainably! What eco-friendly topic would you like to explore?";
        }
      }));

      res.json({ answers });
    } catch (err: any) {
      console.error("[Service Routing] Error in /api/chat/preload:", err);
      res.json({ answers: {} }); // Return empty on failure
    }
  });

      // API Route: Find local recycling guidelines and events
  app.post("/api/local-info", async (req, res) => {
    const { location } = req.body;
    // Default location to 95135 if not provided
    const zipCode = location?.zipCode || "95135";
    const cacheKey = location 
      ? `lat_${Number(location.latitude).toFixed(1)}_lng_${Number(location.longitude).toFixed(1)}`
      : `zip_${zipCode}`;
    
    const now = Date.now();
    const cached = localInfoCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      console.log(`[Cache Hit] Returning cached local info for key: ${cacheKey}`);
      return res.json({ text: cached.text, links: cached.links, isCached: true });
    }

    try {
      const locString = location 
        ? `near coordinates ${location.latitude}, ${location.longitude}` 
        : `in zip code ${zipCode}, San Jose, California`;

      const prompt = `Find upcoming special recycling events (like e-waste drives, hazardous waste collection, shredding events, or community recycling days) and local recycling guidelines ${locString}. 
      
      Format your response exactly like this:
      Guidelines: [A highly visible list of local recycling rules. Use bold, informative markdown bullet points (using '-' for bullets).]
      Events: [A list of upcoming special collection events with dates, times, and locations, or "No upcoming events found". Use only clear markdown bullet points with '-' bullets. PRIORITIZE THIS SECTION.]`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      }, "gemini-2.5-flash", "gemini-flash-latest");

      const text = response.text || "";
      
      // Extract grounding links if present
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .filter((c: any) => c.web)
        .map((c: any) => ({ title: c.web?.title || "Source", uri: c.web?.uri || "" }));

      // Cache the successful result for 1 hour
      localInfoCache.set(cacheKey, {
        text,
        links,
        expiresAt: Date.now() + 60 * 60 * 1000
      });

      res.json({ text, links });
    } catch (err: any) {
      console.log("[Service Routing] Utilizing local fallback rules for /api/local-info (" + (err.message || err) + ")");
      const defaultText = `Guidelines:
- **Paper & Cardboard**: Flatten all cardboard boxes. Must be clean and dry.
- **Plastics**: Recycle only bottles, jars, and jugs labeled with resin codes #1, #2, and #5.
- **Glass/Metals**: Clean thoroughly. Remove lids.

Events:
- **E-Waste & Electronics Collection**: San Jose Community Center, Sept 14th, 9:00 AM - 2:00 PM.
- **Hazardous Waste Drop-Off**: Public Works Yard, Sept 21st, 8:00 AM - 12:00 PM.`;
      res.json({ text: defaultText, links: [], isFallback: true });
    }
  });

  // Helper to generate image for DIY tutorial
  async function generateDIYProjectImage(title: string, item: string): Promise<string> {
    const promptText = `Studio photograph of a completed upcycled DIY craft project: "${title}" made from "${item || "recycled materials"}". Professional lighting, clean backdrop, clear focus on the finished product, high detail, photorealistic, modern tabletop craft showcase.`;
    const seed = Math.floor(Math.random() * 999999);
    const cleanPrompt = encodeURIComponent(`Photorealistic finished DIY upcycled craft project ${title} made from ${item || "recycled materials"}, eco craft photo, studio lighting, crisp detail`);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=576&nologo=true&enhance=true&seed=${seed}`;

    try {
      const ai = getAI();
      const imageGenPromise = ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: promptText,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "16:9",
        },
      });

      // Strict 3.2s timeout so slow image API calls never delay the tutorial delivery!
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3200));
      const response: any = await Promise.race([imageGenPromise, timeoutPromise]);

      if (response) {
        const b64 = response.generatedImages?.[0]?.image?.imageBytes;
        if (b64) {
          return `data:image/jpeg;base64,${b64}`;
        }
      }
    } catch {
      console.log("[Image Gen Info] Using fast image service fallback for DIY project visual.");
    }
    return fallbackUrl;
  }

  // API Route: Generate detailed DIY Tutorial
  app.post("/api/diy-tutorial", async (req, res) => {
    const { title, item, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    // Pre-generated response for Milk Carton Desk Organizer
    const lowerTitle = String(title).toLowerCase();
    const lowerItem = String(item || "").toLowerCase();
    if (lowerTitle.includes("milk carton") || (lowerItem.includes("milk carton") && lowerTitle.includes("organizer"))) {
      const milkCartonTutorial = {
        title: "Milk Carton Desk Organizer",
        item: "Plastic Milk Carton",
        imageUrl: "/milk_carton_desk_organizer.jpg",
        materialsNeeded: [
          "1 Clean plastic milk carton or jug (rinsed & dried)",
          "Utility scissors or craft hobby knife",
          "Jute twine / hemp rope (for rim & nozzle wrap)",
          "Turquoise / pastel non-toxic acrylic craft paint",
          "Wooden craft beads & fine gold paint pen / markers",
          "Craft glue or hot glue gun"
        ],
        difficulty: "Easy (Beginner Friendly)",
        estimatedTime: "20 mins",
        steps: [
          "Step 1: Prep & Clean — Thoroughly rinse out the milk carton with warm soapy water and peel off any plastic labeling. Allow to dry completely.",
          "Step 2: Measure & Cut — Lay the carton on its side. Using utility scissors or a craft blade, carefully cut open a rectangular compartment across the top face to form your organizer slot, keeping the handle and pouring spout intact.",
          "Step 3: Paint & Letter — Apply 1-2 coats of pastel turquoise acrylic paint across the outer surface. Once dry, write \"ORGANIZE!\" or paint floral branch motifs with a fine gold paint marker.",
          "Step 4: Twine & Bead Trim — Wrap natural jute twine neatly around the top cut rim and the threaded nozzle, securing with craft glue. Thread small wooden beads onto the twine for rustic charm.",
          "Step 5: Fill & Enjoy — Place your pens, pencils, highlighters, scissors, and rulers in their new compartments on your desk!"
        ],
        tips: [
          "Lightly scuff smooth plastic with fine sandpaper before painting so acrylic adheres evenly.",
          "For extra desk stability, place 2-3 small decorative clean pebbles inside the bottom base.",
          "Use the side nozzle ring as a handy holder for paperclips, USB drives, or tape loops."
        ]
      };
      return res.json({ tutorial: milkCartonTutorial, text: JSON.stringify(milkCartonTutorial), isPreGenerated: true });
    }

    const cacheKey = `${String(title).trim()}_${String(item || "").trim()}_${String(description).trim()}`.toLowerCase();
    const now = Date.now();
    const cached = diyTutorialCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      console.log(`[Cache Hit] Returning cached DIY tutorial for key: ${cacheKey}`);
      return res.json({ tutorial: cached.tutorial, text: cached.text, isCached: true });
    }

    try {
      const prompt = `You are a concise DIY upcycling artisan.
Generate a structured, step-by-step tutorial for project "${title}" using "${item || "recycled materials"}".
Description: "${description}".
Keep instructions clear, punchy, concise, and easy to follow. Required household tools only.`;

      // Run Gemini text tutorial generation AND image generation in parallel!
      const textTutorialPromise = generateWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 800, // Reduced token limit for much faster completion
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              materialsNeeded: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              difficulty: { type: Type.STRING },
              estimatedTime: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["materialsNeeded", "difficulty", "estimatedTime", "steps", "tips"]
          }
        }
      });

      const imageGenPromise = generateDIYProjectImage(title, item || "recycled materials");

      // Execute text and image promises in parallel
      const [response, generatedImageUrl] = await Promise.all([textTutorialPromise, imageGenPromise]);

      const rawText = response.text || "";
      let cleanedJson = rawText.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      }

      let tutorialData: any = null;
      try {
        tutorialData = JSON.parse(cleanedJson);
      } catch (parseErr) {
        console.log("[Parser Info] Alternative tutorial format parsing: ", rawText);
      }

      if (tutorialData) {
        tutorialData.imageUrl = generatedImageUrl;
      } else {
        tutorialData = {
          imageUrl: generatedImageUrl,
          materialsNeeded: [`Old/discarded ${item || "materials"}`, "Scissors or utility shears", "Craft glue or twine", "Markers/paints"],
          difficulty: "Easy",
          estimatedTime: "20 minutes",
          steps: [
            `Prep and clean the ${item || "materials"}.`,
            `Cut or shape the ${item || "materials"} according to your design for "${title}".`,
            "Assemble and attach components securely using craft glue or tape.",
            `Finish off your new upcycled ${title} with decorative colors or patterns!`
          ],
          tips: ["Be cautious with sharp tools.", "Let glue dry thoroughly."]
        };
      }

      // Cache the result for 24 hours
      diyTutorialCache.set(cacheKey, {
        tutorial: tutorialData,
        text: rawText,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      });

      res.json({ tutorial: tutorialData, text: rawText });
    } catch (err: any) {
      console.log("[Service Routing] Utilizing local model fallback rules for /api/diy-tutorial (" + (err.message || err) + ")");
      
      const generatedImageUrl = await generateDIYProjectImage(title, item || "recycled materials");
      const fallbackTutorial = {
        imageUrl: generatedImageUrl,
        materialsNeeded: [
          `Old/discarded ${item || "materials"}`,
          "Scissors, hand utility cutter, or household shears",
          "Water-soluble white glue, paper tape, or hemp twine",
          "Non-toxic acrylic paints, colored pencils, or fine liners"
        ],
        difficulty: "Easy / Accessible",
        estimatedTime: "20 minutes",
        steps: [
          `Step 1: Prep and sanitize the ${item || "materials"}. Wipe clean of dust and dry thoroughly.`,
          `Step 2: Carefully outline and cut or bend the ${item || "materials"} for "${title}".`,
          "Step 3: Secure base components together securely using glue, twine, or tape.",
          `Step 4: Safely place your brand-new upcycled ${title} in your room or workspace!`
        ],
        tips: [
          "Take caution when handling cutters or utility tools.",
          "Allow craft glue to cure fully for best structural durability."
        ]
      };

      res.json({ tutorial: fallbackTutorial, text: JSON.stringify(fallbackTutorial), isFallback: true });
    }
  });

  // API Route: Search DIY ideas for any arbitrary item
  app.post("/api/diy-search", async (req, res) => {
    const { item } = req.body;
    if (!item) {
      return res.status(400).json({ error: "Item name is required" });
    }

    const cacheKey = String(item).trim().toLowerCase();
    const now = Date.now();
    const cached = diySearchCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      console.log(`[Cache Hit] Returning cached DIY search for key: ${cacheKey}`);
      return res.json({ projects: cached.projects, isCached: true });
    }

    try {
      const ai = getAI();
      const prompt = `You are a creative upcycling master.
Generate exactly 3 creative, practical, and highly engaging upcycling DIY project ideas that can be made from: "${item}".
For each project, provide:
1. "title": A catchy, fun project title.
2. "description": A brief description of what the project is, why it's cool, and a summary of how to make it (2-3 sentences).
3. "category": The category of material (must be one of: "RECYCLE", "TEXTILE", "ORGANIC", "ELECTRONIC", "REPAIR").
Make the ideas realistic, fun, and eco-friendly!`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 800,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ["title", "description", "category"]
                }
              }
            },
            required: ["projects"]
          }
        }
      });

      const rawText = response.text || "";
      let cleanedJson = rawText.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      }

      let projectsData: any = null;
      try {
        projectsData = JSON.parse(cleanedJson);
      } catch (parseErr) {
        console.log("[Parser Info] Alternative DIY format parsing: ", rawText);
      }

      const projects = projectsData?.projects || [];

      // Cache the result for 24 hours
      diySearchCache.set(cacheKey, {
        projects,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      });

      res.json({ projects, text: rawText });
    } catch (err: any) {
      console.log("[Service Routing] Utilizing local model fallback rules for /api/diy-search (" + (err.message || err) + ")");
      
      const lowercaseItem = (item || "").toLowerCase();
      let determinedCategory = "RECYCLE";
      if (lowercaseItem.includes("shirt") || lowercaseItem.includes("jeans") || lowercaseItem.includes("fabric") || lowercaseItem.includes("wool") || lowercaseItem.includes("cotton")) {
        determinedCategory = "TEXTILE";
      } else if (lowercaseItem.includes("peel") || lowercaseItem.includes("food") || lowercaseItem.includes("coffee") || lowercaseItem.includes("organic") || lowercaseItem.includes("compost")) {
        determinedCategory = "ORGANIC";
      } else if (lowercaseItem.includes("cable") || lowercaseItem.includes("wire") || lowercaseItem.includes("charger") || lowercaseItem.includes("phone") || lowercaseItem.includes("electronics")) {
        determinedCategory = "ELECTRONIC";
      } else if (lowercaseItem.includes("broken") || lowercaseItem.includes("repair") || lowercaseItem.includes("fix") || lowercaseItem.includes("chair") || lowercaseItem.includes("table")) {
        determinedCategory = "REPAIR";
      }

      const fallbackProjects = [
        {
          title: `Custom ${item} Organizer Compartment`,
          description: `Repurpose your old ${item} into a multi-slot desktop organizer. Ideal for arranging remote controls, pens, bills, or keys cleanly!`,
          category: determinedCategory
        },
        {
          title: `Upcycled ${item} Decorative Desk Cup`,
          description: `Turn any ${item} into a charming miniature indoor plant container or flower vase. Spruce it up with watercolor paint for a delightful finish!`,
          category: determinedCategory
        },
        {
          title: `Eco-Smart ${item} Practical Storage Bin`,
          description: `Give the ${item} a brand new function by wrapping it in twine, lining it with a clean plastic or cloth sheet, and storing craft accessories securely.`,
          category: determinedCategory
        }
      ];

      res.json({ projects: fallbackProjects, text: JSON.stringify({ projects: fallbackProjects }), isFallback: true });
    }
  });

  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    DISABLE_HMR: process.env.DISABLE_HMR
  });
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
