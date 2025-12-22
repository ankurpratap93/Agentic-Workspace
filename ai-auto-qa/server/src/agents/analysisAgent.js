import fetch from "node-fetch";
import { chromium } from "playwright";
import { runAuthFlow } from "./authAgent.js";

// Helper to sanitize text
function cleanText(text) {
  return text?.replace(/\s+/g, ' ').trim().slice(0, 100) || "";
}

async function captureDashboardState(url, creds) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Auth if needed
    if (creds?.username && creds?.password) {
      const loggedIn = await runAuthFlow(page, url, creds, async () => { });
      if (loggedIn) {
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
        // specific wait for jumpiq dashboard
        await page.waitForTimeout(5000);
      }
    }

    // Extract Semantic Structure
    const structure = await page.evaluate(() => {
      const getAttributes = (el) => {
        const attrs = {};
        for (const a of el.attributes) {
          if (['id', 'name', 'type', 'role', 'placeholder', 'aria-label', 'data-testid'].includes(a.name) || a.name.startsWith('data-')) {
            attrs[a.name] = a.value;
          }
        }
        return attrs;
      };

      const dataComponents = [];

      // 1. Tables
      document.querySelectorAll('table').forEach((el, idx) => {
        const headers = Array.from(el.querySelectorAll('th')).map(th => th.innerText.trim());
        dataComponents.push({
          type: 'table',
          id: el.id || `table-${idx}`,
          selector: el.id ? `#${el.id}` : `table:nth-of-type(${idx + 1})`,
          headers,
          rowCount: el.querySelectorAll('tr').length - 1
        });
      });

      // 2. Grids (div based)
      document.querySelectorAll('[role="grid"]').forEach((el, idx) => {
        const headers = Array.from(el.querySelectorAll('[role="columnheader"]')).map(h => h.innerText.trim());
        dataComponents.push({
          type: 'grid',
          id: el.id || `grid-${idx}`,
          selector: el.id ? `#${el.id}` : `[role="grid"]:nth-of-type(${idx + 1})`,
          headers
        });
      });

      // 3. Filters / Inputs
      document.querySelectorAll('input, select').forEach((el) => {
        // Skip hidden or tiny inputs
        if (el.type === 'hidden' || el.offsetWidth < 10) return;
        const label = document.querySelector(`label[for="${el.id}"]`)?.innerText || el.placeholder || el.name || el.id;
        dataComponents.push({
          type: 'input',
          inputType: el.tagName.toLowerCase() === 'select' ? 'select' : el.type,
          label: label,
          selector: el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}[name="${el.name}"]`,
          attributes: getAttributes(el)
        });
      });

      // 4. Buttons (Primary Actions)
      document.querySelectorAll('button').forEach((el) => {
        if (el.innerText.length > 20 || el.innerText.length < 2) return;
        dataComponents.push({
          type: 'button',
          text: el.innerText.trim(),
          selector: el.id ? `#${el.id}` : `button:has-text("${el.innerText.trim()}")`
        });
      });

      return dataComponents;
    });

    return structure;

  } catch (e) {
    console.error("Dashboard extraction failed:", e);
    return [];
  } finally {
    await browser.close().catch(() => { });
  }
}

export async function analyzeSite(config) {
  const { url, aiModel = "gpt-4o-mini", litellmBaseUrl, litellmApiKey, creds } = config;

  let heuristicComponents = [];

  // 1. Deep Crawl if credentials exist
  if (creds) {
    heuristicComponents = await captureDashboardState(url, creds);
  }

  // 2. LLM Analysis (Optional Enhancement)
  // If we found tables, we can ask LLM to infer the "Entity" (e.g. "This is an Invoice Table")
  // For now, heuristic mapping is quite strong. 

  // 3. Construct Page Model
  const pageModel = {
    url,
    title: "Dashboard", // Assumed after login
    type: "dashboard",
    components: heuristicComponents
  };

  // Convert to legacy format for compatibility but include new detailed model
  // We will pass `dataComponents` in the return for `testGenAgent` to use.

  return {
    summary: `Analyzed ${url}. Found ${heuristicComponents.length} interactive components.`,
    pages: [pageModel],
    workflows: [{ name: "Dashboard Interaction", steps: ["Login", "Interact with Data"], priority: "high" }],
    // The key new field:
    pageModel: pageModel
  };
}
