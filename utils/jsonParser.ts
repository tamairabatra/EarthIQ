/**
 * Safely parses JSON string from AI responses, repairing unclosed brackets/quotes,
 * markdown fences, and hallucinated repetition loops.
 */
export function safeParseAIJson<T>(rawText: string, fallback: T): T {
  if (!rawText || typeof rawText !== "string") return fallback;

  let str = rawText.trim();

  // Strip markdown code fences
  if (str.startsWith("```")) {
    str = str.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  }

  // 1. Try direct JSON.parse
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object") return parsed as T;
  } catch {
    // Proceed to repair
  }

  // 2. Extract substring between first '{' and last '}'
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = str.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed as T;
    } catch {
      // Proceed
    }
  }

  // 3. Handle runaway / truncated string
  if (firstBrace !== -1) {
    let candidate = str.substring(firstBrace);

    // Truncate repetitive hallucination loops (e.g., repeating pattern > 6 times)
    candidate = candidate.replace(/(?:\b[\w\s&']+\b\.?\s*){8,}/gi, (match) => {
      return match.substring(0, 40);
    });

    // Fix unescaped newlines inside strings
    candidate = candidate.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n");

    // Try closing quotes, brackets, and braces systematically
    let inString = false;
    let isEscaped = false;
    const stack: string[] = [];
    const cleanChars: string[] = [];

    for (let i = 0; i < candidate.length; i++) {
      const char = candidate[i];

      if (char === '\\' && !isEscaped) {
        isEscaped = true;
        cleanChars.push(char);
        continue;
      }

      if (char === '"' && !isEscaped) {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{' || char === '[') {
          stack.push(char === '{' ? '}' : ']');
        } else if (char === '}' || char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
          }
        }
      }

      cleanChars.push(char);
      isEscaped = false;
    }

    // If still inside string at cutoff, close string
    if (inString) {
      cleanChars.push('"');
    }

    // Close remaining open brackets and braces in reverse order
    while (stack.length > 0) {
      cleanChars.push(stack.pop()!);
    }

    const repaired = cleanChars.join("");
    try {
      const parsed = JSON.parse(repaired);
      if (parsed && typeof parsed === "object") return parsed as T;
    } catch {
      // Proceed to regex item extraction
    }
  }

  // 4. Regex extraction for individual items if full object structure broke
  try {
    const itemMatches = str.match(/\{[^{}]*"item"\s*:\s*"[^"]*"[^{}]*\}/g);
    if (itemMatches && itemMatches.length > 0) {
      const items = itemMatches
        .map((m) => {
          try {
            return JSON.parse(m);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (items.length > 0) {
        return { items } as unknown as T;
      }
    }
  } catch {
    // Ignore
  }

  return fallback;
}
