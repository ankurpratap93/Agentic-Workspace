import fetch from "node-fetch";

export async function estimateTestCount({ url, depth, litellmBaseUrl, litellmApiKey, aiModel = "gpt-4o-mini" }) {
  // Heuristic base counts by depth
  const base = depth === 'exhaustive' ? 220 : depth === 'standard' ? 120 : 60;

  // If LLM available, refine based on quick page fetch (links/forms)
  try {
    const html = await fetch(url, { method: "GET" }).then(r => r.text()).catch(() => "");
    const approxLinks = (html.match(/<a\b/gi) || []).length;
    const approxForms = (html.match(/<form\b/gi) || []).length;
    let adjusted = base + Math.min(approxLinks, 100) * 0.2 + Math.min(approxForms, 50) * 1.0;
    adjusted = Math.round(Math.max(base, Math.min(300, adjusted)));

    if (!litellmBaseUrl || !litellmApiKey) return adjusted;

    const prompt = `Given a site with ~${approxLinks} links and ~${approxForms} forms, estimate a comprehensive number of end-to-end test cases for depth "${depth}" (quick ~60, standard ~120, exhaustive ~200+). Respond with only an integer.`;
    const resp = await fetch(`${litellmBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${litellmApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: "You are a QA estimator. Return only an integer." },
          { role: "user", content: prompt }
        ],
        temperature: 0.0
      })
    });
    if (!resp.ok) return adjusted;
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    const n = parseInt(content || "", 10);
    if (Number.isFinite(n)) return Math.max(base, Math.min(400, n));
    return adjusted;
  } catch {
    return base;
  }
}





