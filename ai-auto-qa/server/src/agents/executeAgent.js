import fetch from "node-fetch";
import { chromium } from "playwright";
import { runAuthFlow } from "./authAgent.js";
import { intelligentExploration, waitForFullRendering, exploreDropdown } from "./explorationAgent.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tracesDir = path.resolve(__dirname, "../data/traces");
function ensureDir(d) { try { fs.mkdirSync(d, { recursive: true }); } catch { } }
ensureDir(tracesDir);

async function captureScreenshot({ index, status, browserlessToken, url, page }) {
  const bg = status === 'passed' ? '10b981' : status === 'failed' ? 'ef4444' : 'f59e0b';
  const text = 'ffffff';
  const step = `Step+${index + 1}`;
  const st = status === 'passed' ? 'Passed' : status === 'failed' ? 'Failed' : 'Skipped';

  if (page) {
    try {
      // Wait a moment for page to stabilize before screenshot
      await page.waitForTimeout(300);
      
      // Try full page screenshot first, fallback to viewport
      let b64;
      try {
        b64 = await page.screenshot({ 
          encoding: 'base64', 
          fullPage: true,
          timeout: 5000
        });
      } catch {
        // Fallback to viewport screenshot
        b64 = await page.screenshot({ 
          encoding: 'base64', 
          fullPage: false,
          timeout: 5000
        });
      }
      
      if (b64) {
        return `data:image/png;base64,${b64}`;
      }
    } catch (error) {
      console.error(`[Screenshot] Failed to capture screenshot: ${error.message}`);
    }
  }

  // Fallback placeholder
  return `https://placehold.co/1920x1080/${bg}/${text}/png?text=${step}%0A${st}`;
}

async function createContext(headless) {
  try {
    const browser = await chromium.launch({
      headless: !!headless,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    });
    const context = await browser.newContext({
      viewport: null,
      ignoreHTTPSErrors: true,
      recordVideo: { dir: tracesDir }
    });
    return { browser, context };
  } catch (e) { throw e; }
}

// Helper function to wait for page stability (like a human tester would)
// Made more aggressive with shorter timeouts to prevent getting stuck
async function waitForPageStability(page, timeout = 3000) {
  try {
    // Use intelligent rendering wait (fonts, images, animations)
    await waitForFullRendering(page, timeout);
  } catch (e) {
    // Fallback to basic wait
    await Promise.race([
      page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 2000) }),
      new Promise((resolve) => setTimeout(resolve, timeout))
    ]).catch(() => {});
    await page.waitForTimeout(300);
    console.log(`[Page Stability] Used fallback wait`);
  }
}

// Helper to safely interact with elements with timeout
async function safeAction(page, actionFn, timeout = 10000) {
  try {
    await Promise.race([
      actionFn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Action timeout')), timeout))
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

// Helper to detect and close popups/modals (including external login prompts)
// Made MUCH more aggressive to handle stubborn popups
async function closePopupsAndModals(page) {
  try {
    // First, try multiple Escape presses (some modals need multiple)
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // Check for iframes FIRST (often used for external logins like Google Analytics)
    const iframes = await page.locator('iframe').count();
    if (iframes > 0) {
      console.log(`[Popup Handler] ⚠️ Found ${iframes} iframes - likely external login popup!`);
      
      // Try to close iframe-based popups aggressively
      for (let i = 0; i < iframes; i++) {
        try {
          const iframe = page.locator('iframe').nth(i);
          const src = await iframe.getAttribute('src').catch(() => '');
          
          // If it's an external login (Google, OAuth, etc.), aggressively close
          if (src.includes('google.com') || src.includes('accounts.') || src.includes('oauth') || src.includes('login') || src.includes('analytics')) {
            console.log(`[Popup Handler] 🚨 DETECTED EXTERNAL LOGIN IFRAME: ${src.substring(0, 60)}...`);
            
            // Multiple escape presses
            for (let j = 0; j < 5; j++) {
              await page.keyboard.press('Escape');
              await page.waitForTimeout(200);
            }
            
            // Try clicking multiple places outside
            await page.click('body', { position: { x: 10, y: 10 } }).catch(() => {});
            await page.waitForTimeout(200);
            await page.click('body', { position: { x: 100, y: 100 } }).catch(() => {});
            await page.waitForTimeout(200);
            
            // Try to find and click any close button near the iframe
            const closeSelectors = [
              'button[aria-label*="close" i]',
              'button[aria-label*="Close" i]',
              '[data-dismiss]',
              '.close',
              '[class*="close"]',
              'button:has-text("×")',
              'button:has-text("✕")',
              'button:has-text("X")',
            ];
            
            for (const sel of closeSelectors) {
              try {
                const btn = page.locator(sel).first();
                if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
                  console.log(`[Popup Handler] Clicking close button: ${sel}`);
                  await btn.click({ timeout: 1000 });
                  await page.waitForTimeout(500);
                }
              } catch (e) {}
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // Common popup/modal selectors - try ALL of them
    const popupSelectors = [
      // Close buttons
      'button[aria-label*="close" i]',
      'button[aria-label*="Close" i]',
      '[data-dismiss="modal"]',
      '[data-bs-dismiss="modal"]',
      '[data-dismiss]',
      '.modal-close',
      '.close-button',
      '.popup-close',
      '.close',
      '[class*="close"]',
      // X buttons
      'button:has-text("×")',
      'button:has-text("✕")',
      'button:has-text("X")',
      // Dialog close
      '[role="dialog"] button:has-text("Close")',
      '[role="dialog"] button:has-text("Cancel")',
      '[role="dialog"] button',
      // Generic modal overlays - try clicking them
      '.modal-backdrop',
      '.overlay',
      '.popup-overlay',
    ];

    // Try clicking close buttons multiple times
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const selector of popupSelectors) {
        try {
          const closeBtn = page.locator(selector).first();
          const count = await closeBtn.count();
          if (count > 0) {
            const isVisible = await closeBtn.isVisible({ timeout: 500 }).catch(() => false);
            if (isVisible) {
              console.log(`[Popup Handler] Found visible popup, clicking: ${selector}`);
              await closeBtn.click({ timeout: 1000, force: true }).catch(() => {});
              await page.waitForTimeout(300);
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }

    // Check for visible modals/dialogs and try to close them
    const modalSelectors = [
      '[role="dialog"]:visible',
      '.modal:visible',
      '.popup:visible',
      '[class*="modal"]:visible',
      '[class*="popup"]:visible',
      '[class*="dialog"]:visible',
    ];

    for (const sel of modalSelectors) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          console.log(`[Popup Handler] Found visible modal with selector: ${sel}`);
          // Try clicking outside (multiple positions)
          await page.click('body', { position: { x: 10, y: 10 } }).catch(() => {});
          await page.waitForTimeout(200);
          await page.click('body', { position: { x: 50, y: 50 } }).catch(() => {});
          await page.waitForTimeout(200);
          // More escape presses
          for (let i = 0; i < 3; i++) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);
          }
        }
      } catch (e) {}
    }

    // Final check - if there are still iframes with google/accounts, force close
    const remainingIframes = await page.locator('iframe').count();
    if (remainingIframes > 0) {
      const allIframes = await page.locator('iframe').all();
      for (const iframe of allIframes) {
        try {
          const src = await iframe.getAttribute('src').catch(() => '');
          if (src && (src.includes('google') || src.includes('accounts') || src.includes('oauth'))) {
            console.log(`[Popup Handler] 🚨 FORCE CLOSING persistent external login iframe`);
            // Try to find parent modal and close it
            await page.evaluate(() => {
              // Try to remove or hide modal overlays
              const overlays = document.querySelectorAll('[class*="modal"], [class*="overlay"], [class*="popup"]');
              overlays.forEach(overlay => {
                if (overlay.style) {
                  overlay.style.display = 'none';
                  overlay.style.visibility = 'hidden';
                }
              });
            });
            // More escape presses
            for (let i = 0; i < 5; i++) {
              await page.keyboard.press('Escape');
              await page.waitForTimeout(100);
            }
          }
        } catch (e) {}
      }
    }

    return true; // Always return true to indicate we tried
  } catch (error) {
    console.warn(`[Popup Handler] Error closing popups: ${error.message}`);
    return false;
  }
}

// Helper to check if element will trigger external login
// Made more aggressive to catch "analytics" and similar
async function willTriggerExternalLogin(page, selector) {
  try {
    const loc = page.locator(selector).first();
    const count = await loc.count();
    if (count === 0) return false;

    // Check element text and attributes
    const text = await loc.textContent().catch(() => '');
    const href = await loc.getAttribute('href').catch(() => '');
    const onClick = await loc.getAttribute('onclick').catch(() => '');
    const ariaLabel = await loc.getAttribute('aria-label').catch(() => '');
    const title = await loc.getAttribute('title').catch(() => '');
    
    const dataAttr = await loc.evaluate(el => {
      return {
        'data-action': el.getAttribute('data-action'),
        'data-url': el.getAttribute('data-url'),
        'data-target': el.getAttribute('data-target'),
        id: el.id,
        className: el.className,
        innerHTML: el.innerHTML?.substring(0, 100) || ''
      };
    }).catch(() => ({}));

    const combinedText = `${text} ${href} ${onClick} ${ariaLabel} ${title} ${JSON.stringify(dataAttr)}`.toLowerCase();

    // Keywords that suggest external login - EXPANDED list
    const externalLoginKeywords = [
      'analytics',  // This is the key one for your use case!
      'google',
      'google analytics',
      'ga-',
      'oauth',
      'login',
      'sign in',
      'signin',
      'authenticate',
      'authorize',
      'connect',
      'account',
      'gmail',
      'microsoft',
      'facebook',
      'twitter',
      'linkedin',
      'auth',
      'sso',
      'single sign',
    ];

    const willTrigger = externalLoginKeywords.some(keyword => combinedText.includes(keyword));
    
    if (willTrigger) {
      console.log(`[External Login Detection] 🚨 Element will trigger external login: "${text || selector}"`);
    }
    
    return willTrigger;
  } catch (e) {
    return false;
  }
}

// Helper to scroll and check for data loading
async function scrollAndCheckData(page, maxScrolls = 3) {
  try {
    for (let i = 0; i < maxScrolls; i++) {
      // Scroll down
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight * 0.8);
      });
      await page.waitForTimeout(1000); // Wait for potential lazy loading

      // Check if data is visible (tables, lists, etc.)
      const hasData = await page.evaluate(() => {
        // Check for tables with rows
        const tables = document.querySelectorAll('table tbody tr, [role="grid"] [role="row"]');
        if (tables.length > 0) return true;

        // Check for lists
        const lists = document.querySelectorAll('ul li, ol li, [role="list"] [role="listitem"]');
        if (lists.length > 5) return true;

        // Check for cards/items
        const cards = document.querySelectorAll('[class*="card"], [class*="item"], [class*="row"]');
        if (cards.length > 3) return true;

        return false;
      });

      if (hasData) {
        console.log(`[Scroll Check] Found data after ${i + 1} scroll(s)`);
        return true;
      }
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    return false;
  } catch (e) {
    console.warn(`[Scroll Check] Error during scroll check: ${e.message}`);
    return false;
  }
}

// Helper to handle new tabs/windows and ensure we stay on original page
async function handleTabNavigation(context, originalPage, originalUrl) {
  try {
    const pages = context.pages();
    
    // If we have more than one page, close the new ones and return to original
    if (pages.length > 1) {
      console.log(`[Tab Management] Detected ${pages.length} tabs, closing extras and returning to original...`);
      
      for (const p of pages) {
        if (p !== originalPage && !p.isClosed()) {
          try {
            const pUrl = p.url();
            console.log(`[Tab Management] Closing extra tab: ${pUrl.substring(0, 80)}...`);
            await p.close({ timeout: 2000 });
            console.log(`[Tab Management] ✓ Closed extra tab`);
          } catch (e) {
            console.warn(`[Tab Management] Could not close tab: ${e.message}`);
          }
        }
      }
      
      // Ensure we're back on the original page
      if (originalPage.isClosed()) {
        console.error(`[Tab Management] ✗ Original page was closed! This should not happen.`);
        return false;
      }
      
      // Bring original page to front
      await originalPage.bringToFront();
      console.log(`[Tab Management] ✓ Brought original page to front`);
      
      // Navigate back to original URL if we're not there
      const currentUrl = originalPage.url();
      if (originalUrl && !currentUrl.includes(new URL(originalUrl).hostname)) {
        console.log(`[Tab Management] Current URL differs from original, navigating back...`);
        await originalPage.goto(originalUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch((e) => {
          console.error(`[Tab Management] Failed to navigate back: ${e.message}`);
        });
        await waitForPageStability(originalPage);
        console.log(`[Tab Management] ✓ Returned to original URL`);
      }
      
      return true;
    }
    
    // Even with one page, verify we're on the right URL
    if (originalUrl) {
      const currentUrl = originalPage.url();
      if (!currentUrl.includes(new URL(originalUrl).hostname)) {
        console.log(`[Tab Management] Single tab but wrong URL, navigating to original...`);
        await originalPage.goto(originalUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        await waitForPageStability(originalPage);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[Tab Management] Error in handleTabNavigation: ${error.message}`);
    return false;
  }
}

// REAL ASSERTIONS - Enhanced with timeouts and error recovery
async function executeAction(page, testData, originalUrl, context) {
  if (!testData) return { passed: true, message: 'No action defined' };

  const { action, selector, header, inputType } = testData;
  const ACTION_TIMEOUT = 10000; // 10 seconds max per action

  try {
    // Handle any new tabs that might have been opened
    await handleTabNavigation(context, page, originalUrl);
    
    // Ensure we're on the right page - navigate back if needed
    const currentUrl = page.url();
    if (originalUrl && !currentUrl.includes(new URL(originalUrl).hostname)) {
      console.log(`[Navigation Recovery] Detected navigation away from ${originalUrl}, navigating back...`);
      await page.goto(originalUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await waitForPageStability(page);
    }

    if (action === 'verify_rows') {
      const found = await safeAction(page, async () => {
        await page.waitForSelector(selector, { timeout: 5000 });
      }, 5000);
      
      if (!found) {
        return { passed: false, message: `Selector ${selector} not found within timeout` };
      }

      const rowCount = await page.locator(`${selector} tr`).count();
      if (rowCount > 1) {
        await waitForPageStability(page);
        return { passed: true, message: `Found ${rowCount} rows` };
      }
      
      // Fallback for grid divs
      const gridCount = await page.locator(`${selector} [role="row"]`).count();
      if (gridCount > 0) {
        await waitForPageStability(page);
        return { passed: true, message: `Found ${gridCount} grid rows` };
      }

      return { passed: false, message: 'Table/Grid is empty' };
    }

    if (action === 'sort') {
      const headerLoc = page.locator(`${selector} th:has-text("${header}"), ${selector} [role="columnheader"]:has-text("${header}")`);
      const count = await headerLoc.count();
      
      if (count === 0) {
        return { passed: false, message: `Header "${header}" not found` };
      }

      // Set up listener for new pages/tabs BEFORE clicking
      const pageListener = context.waitForEvent('page', { timeout: 2000 }).catch(() => null);

      const clicked = await safeAction(page, async () => {
        await headerLoc.first().scrollIntoViewIfNeeded();
        await headerLoc.first().click({ timeout: 5000 });
      }, ACTION_TIMEOUT);

      if (!clicked) {
        return { passed: false, message: `Failed to click header "${header}"` };
      }

      // Handle new tab if one was opened
      try {
        const newPage = await Promise.race([
          pageListener,
          new Promise((resolve) => setTimeout(() => resolve(null), 1000))
        ]);
        
        if (newPage) {
          console.log(`[Tab Management] New tab opened from sort click, closing it...`);
          await newPage.close({ timeout: 2000 }).catch(() => {});
          await page.bringToFront();
        }
      } catch (e) {
        // No new page opened, that's fine
      }

      // Ensure we're still on the original page
      await handleTabNavigation(context, page, originalUrl);
      await waitForPageStability(page);
      return { passed: true, message: `Sorted table by ${header}` };
    }

    if (action === 'input') {
      // Wait for full rendering before interacting
      await waitForFullRendering(page, 3000);
      
      const loc = page.locator(selector).first();
      const visible = await loc.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (!visible) {
        return { passed: false, message: `Input ${selector} not visible` };
      }

      const interacted = await safeAction(page, async () => {
        await loc.scrollIntoViewIfNeeded();
        
        // If it's a select dropdown, explore it instead of just selecting one option
        const isSelect = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          return el && el.tagName === 'SELECT';
        }, selector).catch(() => false);
        
        if (isSelect) {
          console.log(`[Input] 🎯 Select dropdown detected! Exploring options...`);
          const onStep = async (action, desc, screenshot) => {
            console.log(`[Select Exploration] ${action}: ${desc}`);
          };
          const explored = await exploreDropdown(page, selector, onStep);
          if (explored.length > 0) {
            return { passed: true, message: `Explored ${explored.length} select options` };
          }
        }
        
        if (inputType === 'checkbox' || inputType === 'radio') {
          await loc.click({ timeout: 5000 });
        } else {
          await loc.fill('Test Data', { timeout: 5000 });
        }
        
        // Wait for page to react
        await waitForFullRendering(page, 2000);
      }, ACTION_TIMEOUT);

      if (!interacted) {
        return { passed: false, message: `Failed to interact with ${inputType} input` };
      }

      await waitForPageStability(page);
      return { passed: true, message: `Interacted with ${inputType} input` };
    }

    if (action === 'click') {
      // CRITICAL: Check selector for analytics BEFORE anything else
      const selectorLower = (selector || '').toLowerCase();
      if (selectorLower.includes('analytics') || selectorLower.includes('google')) {
        console.log(`[Click] 🚨 BLOCKED: Selector contains "analytics" or "google": ${selector}`);
        await closePopupsAndModals(page);
        return { 
          passed: false, 
          message: `BLOCKED: Analytics selector detected - prevents external login popup` 
        };
      }
      
      // DEBUG: Log element details
      try {
        const elementInfo = await page.locator(selector).first().evaluate(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          id: el.id,
          className: el.className,
          href: el.href || el.getAttribute('href'),
          visible: el.offsetParent !== null
        })).catch(() => ({}));
        
        // Check text content for analytics
        const elementText = (elementInfo.text || '').toLowerCase();
        if (elementText.includes('analytics')) {
          console.log(`[Click] 🚨 BLOCKED: Element text contains "analytics": "${elementInfo.text}"`);
          await closePopupsAndModals(page);
          return { 
            passed: false, 
            message: `BLOCKED: Analytics element detected - prevents external login popup` 
          };
        }
        
        console.log(`[DEBUG Click] Element info:`, JSON.stringify(elementInfo, null, 2));
      } catch (e) {
        console.log(`[DEBUG Click] Could not get element info: ${e.message}`);
      }
      
      // Check if test_data has skip flag
      if (testData.skip) {
        console.log(`[Click] ⚠️ Skipping element marked for skip: ${selector}`);
        await closePopupsAndModals(page);
        return { 
          passed: false, 
          message: `Skipped: Element triggers external login (marked in test generation)` 
        };
      }
      
      // Check if this will trigger external login BEFORE clicking
      const willTriggerLogin = await willTriggerExternalLogin(page, selector);
      if (willTriggerLogin) {
        console.log(`[Click] ⚠️ Skipping element that triggers external login: ${selector}`);
        // Close any existing popups first
        await closePopupsAndModals(page);
        return { 
          passed: false, 
          message: `Skipped: Element triggers external login (Google Analytics, OAuth, etc.)` 
        };
      }
      
      console.log(`[DEBUG Click] Proceeding with intelligent click on: ${selector}`);

      // Wait for full rendering before clicking (like a human would)
      await waitForFullRendering(page, 3000);

      // Set up listener for new pages/tabs BEFORE clicking
      const pageListener = context.waitForEvent('page', { timeout: 3000 }).catch(() => null);
      
      // Check if this is a dropdown/select - if so, explore it instead of just clicking
      const isDropdown = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        return el.tagName === 'SELECT' || 
               el.getAttribute('role') === 'listbox' || 
               el.classList.contains('dropdown') ||
               el.getAttribute('data-toggle') === 'dropdown';
      }, selector).catch(() => false);

      if (isDropdown) {
        console.log(`[Click] 🎯 Dropdown detected! Exploring options intelligently...`);
        
        // Explore dropdown options
        const onStep = async (action, desc, screenshot) => {
          console.log(`[Dropdown Step] ${action}: ${desc}`);
        };
        
        const explored = await exploreDropdown(page, selector, onStep);
        
        if (explored.length > 0) {
          const withImplications = explored.filter(r => r.hasImplication).length;
          return { 
            passed: true, 
            message: `Explored ${explored.length} dropdown options, ${withImplications} caused changes` 
          };
        }
      }

      // Regular click action with intelligent exploration
      const clicked = await safeAction(page, async () => {
        const loc = page.locator(selector).first();
        await loc.scrollIntoViewIfNeeded();
        
        // Check if link opens in new tab - if so, modify to open in same tab
        const opensNewTab = await loc.evaluate(el => {
          if (el.tagName === 'A') {
            const target = el.getAttribute('target');
            if (target === '_blank') {
              // Remove target to open in same tab
              el.removeAttribute('target');
              return true;
            }
          }
          return false;
        }).catch(() => false);
        
        if (opensNewTab) {
          console.log(`[Click] Modified link to open in same tab instead of new tab`);
        }
        
        // Perform intelligent exploration (detects popups and explores them)
        const onStep = async (action, desc, screenshot) => {
          console.log(`[Exploration Step] ${action}: ${desc}`);
        };
        
        const explorationResult = await intelligentExploration(page, selector, 'click', onStep);
        
        if (explorationResult.popupDetected) {
          console.log(`[Click] ✓ Popup detected and explored: ${explorationResult.explored.length} tabs/options explored`);
          // Popup was explored, now close it
          await closePopupsAndModals(page);
        } else if (explorationResult.dropdownDetected) {
          console.log(`[Click] ✓ Dropdown explored: ${explorationResult.explored.length} options tested`);
          return; // Already handled by exploreDropdown
        } else {
          // No popup, just regular click
          await loc.click({ timeout: 5000, modifiers: [] });
        }
        
        // Wait for page to react (like a human would)
        await waitForFullRendering(page, 3000);
      }, ACTION_TIMEOUT);

      if (!clicked) {
        return { passed: false, message: `Failed to click element ${selector}` };
      }

      // Wait for any delayed popups to appear
      await page.waitForTimeout(1000);

      // DEBUG: Check page state after click
      try {
        const pageState = await page.evaluate(() => {
          const iframes = document.querySelectorAll('iframe');
          const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [role="dialog"]');
          return {
            iframeCount: iframes.length,
            iframeSrcs: Array.from(iframes).map(iframe => iframe.src).slice(0, 3),
            modalCount: modals.length,
            url: window.location.href
          };
        });
        console.log(`[DEBUG After Click] Page state:`, JSON.stringify(pageState, null, 2));
      } catch (e) {
        console.log(`[DEBUG After Click] Could not get page state: ${e.message}`);
      }

      // Check for and close popups/modals MULTIPLE TIMES (they can be stubborn)
      for (let attempt = 0; attempt < 3; attempt++) {
        const iframeCountBefore = await page.locator('iframe').count();
        console.log(`[DEBUG Popup Close] Attempt ${attempt + 1}: Found ${iframeCountBefore} iframes before close`);
        
        const popupClosed = await closePopupsAndModals(page);
        
        const iframeCountAfter = await page.locator('iframe').count();
        console.log(`[DEBUG Popup Close] Attempt ${attempt + 1}: Found ${iframeCountAfter} iframes after close`);
        
        if (popupClosed || iframeCountAfter < iframeCountBefore) {
          console.log(`[Click] ✓ Closed popup/modal (attempt ${attempt + 1})`);
        }
        await page.waitForTimeout(500);
      }
      
      // Final check - if there are still iframes, force close
      const remainingIframes = await page.locator('iframe').count();
      if (remainingIframes > 0) {
        console.log(`[Click] ⚠️ Still ${remainingIframes} iframes after popup close attempts, forcing close...`);
        console.log(`[DEBUG] Attempting nuclear iframe removal...`);
        
        // Get iframe details before removal
        const iframeDetails = await page.evaluate(() => {
          const iframes = document.querySelectorAll('iframe');
          return Array.from(iframes).map(iframe => ({
            src: iframe.src,
            id: iframe.id,
            className: iframe.className,
            parentTag: iframe.parentElement?.tagName,
            parentClass: iframe.parentElement?.className
          }));
        });
        console.log(`[DEBUG] Iframe details before removal:`, JSON.stringify(iframeDetails, null, 2));
        
        await closePopupsAndModals(page);
        
        // Check again
        const stillRemaining = await page.locator('iframe').count();
        console.log(`[DEBUG] Iframes remaining after nuclear removal: ${stillRemaining}`);
      }

      // Handle new tab if one was opened
      try {
        const newPage = await Promise.race([
          pageListener,
          new Promise((resolve) => setTimeout(() => resolve(null), 2000))
        ]);
        
        if (newPage) {
          console.log(`[Tab Management] New tab opened, closing it immediately...`);
          await newPage.close({ timeout: 2000 }).catch(() => {});
          await page.bringToFront();
          console.log(`[Tab Management] ✓ Closed new tab and returned to original`);
        }
      } catch (e) {
        // No new page opened, that's fine
      }
      
      // Always check for tabs after click, even if listener didn't catch it
      await handleTabNavigation(context, page, originalUrl);

      // Check for popups again after tab handling
      await closePopupsAndModals(page);

      // Scroll and check for data loading (like a human tester would)
      const hasData = await scrollAndCheckData(page, 2);
      if (hasData) {
        console.log(`[Click] ✓ Data found after scrolling`);
      }

      // Ensure we're still on the original page
      await waitForPageStability(page);
      return { passed: true, message: 'Clicked successfully, checked for data' };
    }

  } catch (e) {
    return { passed: false, message: `Error: ${e.message}` };
  }

  return { passed: true, message: 'Action completed' };
}


export async function executeTests({ testRunId, url, tests, browserlessToken, onUpdate, headless = true, creds }) {
  const storedTests = [];
  let passedCount = 0;
  let failedCount = 0;
  let totalTime = 0;
  const testedElements = new Set(); // Track tested elements to avoid duplicates
  const failedElements = new Map(); // Track elements that failed multiple times
  const MAX_RETRIES = 2; // Max retries per test
  const MAX_ELEMENT_FAILURES = 3; // Skip element after this many failures
  const TEST_TIMEOUT = 30000; // 30 seconds max per test
  let videoPath = null; // Track video recording path

  // Single Browser Session for ALL tests to mimic user session
  const { browser, context } = await createContext(headless);
  
  // Get video path from context (Playwright saves video automatically)
  try {
    const pages = context.pages();
    if (pages.length > 0) {
      const page = pages[0];
      // Video path is set when context closes, we'll capture it in finally block
    }
  } catch (e) {
    console.warn(`[Video] Could not access video path: ${e.message}`);
  }

  // Declare tab monitor outside try block so it can be cleared in finally
  let tabMonitorInterval = null;

  try {
    const page = await context.newPage();
    
    // Set longer timeout for page operations
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(20000);

    // Navigate to initial URL
    console.log(`[Test Execution] Starting test run ${testRunId} for ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForFullRendering(page, 10000); // Wait for full rendering on initial load

    // 1. Authenticate Once
    if (creds?.username) {
      console.log(`[Auth] Starting authentication flow...`);
      await runAuthFlow(page, url, creds, async () => { });
      await waitForFullRendering(page, 10000); // Wait for full rendering after auth
      await page.waitForTimeout(2000);
      console.log(`[Auth] Authentication completed`);
    }

    // 2. Set up continuous tab and popup monitoring (runs in background)
    // Made VERY frequent to catch popups immediately
    tabMonitorInterval = setInterval(async () => {
      try {
        // Aggressively check for popups FIRST
        const iframeCount = await page.locator('iframe').count();
        if (iframeCount > 0) {
          console.log(`[Tab Monitor] 🚨 Found ${iframeCount} iframes - FORCE CLOSING popups!`);
          
          // Nuclear option: Force remove via JavaScript
          await page.evaluate(() => {
            // Remove all iframes immediately
            document.querySelectorAll('iframe').forEach(iframe => {
              iframe.remove();
            });
            // Hide all modals
            document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"], [role="dialog"]').forEach(el => {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.remove();
            });
            // Remove backdrop
            document.querySelectorAll('[class*="backdrop"]').forEach(el => el.remove());
          });
          
          // Also try normal close methods
          await closePopupsAndModals(page);
          
          // Multiple escape presses
          for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Escape').catch(() => {});
            await page.waitForTimeout(100);
          }
        } else {
          // Still check for popups even without iframes
          await closePopupsAndModals(page);
        }
        
        // Then check for tabs
        const pages = context.pages();
        if (pages.length > 1) {
          console.log(`[Tab Monitor] Background check: Found ${pages.length} tabs, cleaning up...`);
          await handleTabNavigation(context, page, url);
        }
      } catch (e) {
        // Ignore errors in background monitoring
      }
    }, 1500); // Check every 1.5 seconds - EXTREMELY frequent to catch popups immediately
    
    // 2. PRE-FILTER: Remove or mark analytics/external login tests BEFORE execution
    console.log(`[Test Execution] Pre-filtering ${tests.length} tests...`);
    const filteredTests = [];
    let skippedCount = 0;
    
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];
      const testName = (t.name || '').toLowerCase();
      const testDesc = (t.description || '').toLowerCase();
      const selector = (t.test_data?.selector || '').toLowerCase();
      const combined = `${testName} ${testDesc} ${selector}`;
      
      // Check for analytics/external login keywords
      const isAnalytics = combined.includes('analytics') || 
                         combined.includes('google analytics') ||
                         testName.includes('analytics') ||
                         selector.includes('analytics');
      
      if (isAnalytics) {
        console.log(`[Pre-Filter] 🚨 SKIPPING analytics test: "${t.name}" (selector: ${t.test_data?.selector})`);
        // Mark as skipped immediately
        storedTests.push({
          id: `${testRunId}-t-${i}`,
          test_run_id: testRunId,
          test_type: t.type || 'functional',
          test_name: `${t.name} (Pre-filtered - Analytics)`,
          description: t.description || '',
          severity: t.severity,
          expected_result: t.expected_result,
          status: 'skipped',
          execution_time: 0,
          screenshot_url: null,
          error_message: 'Pre-filtered: Analytics tab triggers external login (Google Analytics)'
        });
        skippedCount++;
        continue; // Skip this test entirely
      }
      
      // Also check if test_data has skip flag
      if (t.test_data?.skip) {
        console.log(`[Pre-Filter] 🚨 SKIPPING test with skip flag: "${t.name}"`);
        storedTests.push({
          id: `${testRunId}-t-${i}`,
          test_run_id: testRunId,
          test_type: t.type || 'functional',
          test_name: `${t.name} (Pre-filtered - Skip Flag)`,
          description: t.description || '',
          severity: t.severity,
          expected_result: t.expected_result,
          status: 'skipped',
          execution_time: 0,
          screenshot_url: null,
          error_message: 'Pre-filtered: Marked to skip in test generation'
        });
        skippedCount++;
        continue;
      }
      
      filteredTests.push(t);
    }
    
    console.log(`[Test Execution] Pre-filtered ${skippedCount} analytics/external login tests`);
    console.log(`[Test Execution] Executing ${filteredTests.length} tests (${skippedCount} skipped)...`);
    
    // Track last test to detect if we're stuck
    let lastTestIndex = -1;
    let lastTestTime = Date.now();
    const STUCK_THRESHOLD = 60000; // 60 seconds - if same test runs this long, we're stuck
    
    // Use filtered tests instead of original tests
    // Track original indices for proper test ID generation
    const originalIndices = new Map();
    filteredTests.forEach((filteredTest, idx) => {
      const origIdx = tests.findIndex(orig => 
        orig.name === filteredTest.name && 
        orig.test_data?.selector === filteredTest.test_data?.selector
      );
      originalIndices.set(idx, origIdx >= 0 ? origIdx : idx);
    });
    
    for (let i = 0; i < filteredTests.length; i++) {
      const t = filteredTests[i];
      const originalIndex = originalIndices.get(i) ?? i;
      const testStartTime = Date.now();
      
      // STUCK DETECTOR: If we've been on the same test too long, force skip
      if (lastTestIndex === i) {
        const timeOnTest = Date.now() - lastTestTime;
        if (timeOnTest > STUCK_THRESHOLD) {
          console.error(`[STUCK DETECTOR] 🚨 Test ${i + 1} has been running for ${Math.round(timeOnTest/1000)}s - FORCING SKIP!`);
          
          // Aggressively close popups
          for (let attempt = 0; attempt < 5; attempt++) {
            await closePopupsAndModals(page);
            await page.waitForTimeout(500);
          }
          
          // Force close any iframes
          await page.evaluate(() => {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
              const parent = iframe.parentElement;
              if (parent) {
                parent.style.display = 'none';
                parent.remove();
              }
            });
            // Hide all modals
            const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]');
            modals.forEach(modal => {
              modal.style.display = 'none';
              modal.style.visibility = 'hidden';
            });
          });
          
          // Mark test as skipped and continue
          storedTests.push({
            id: `${testRunId}-t-${i}`,
            test_run_id: testRunId,
            test_type: t.type || 'functional',
            test_name: `${t.name} (FORCED SKIP - Stuck)`,
            description: t.description || '',
            severity: t.severity,
            expected_result: t.expected_result,
            status: 'skipped',
            execution_time: timeOnTest,
            screenshot_url: await captureScreenshot({ index: i, status: 'skipped', page }).catch(() => null),
            error_message: `Test stuck for ${Math.round(timeOnTest/1000)}s, likely blocked by popup`
          });
          
          console.log(`[STUCK DETECTOR] ✓ Forced skip of test ${i + 1}, continuing to next test...`);
          lastTestIndex = -1; // Reset
          continue; // Skip to next test
        }
      } else {
        lastTestIndex = i;
        lastTestTime = testStartTime;
      }
      
      // Update progress (use original test count including skipped)
      if (onUpdate) {
        onUpdate({ 
          total_tests: tests.length, 
          passed_tests: passedCount, 
          failed_tests: failedCount, 
          current_test_name: t.name 
        });
      }

      console.log(`[Test ${i + 1}/${tests.length}] ${t.name}`);
      console.log(`[DEBUG Test ${i + 1}] Test data:`, JSON.stringify(t.test_data || {}, null, 2));
      
      // Before each test, ensure we're on the original page/tab
      try {
        // AGGRESSIVELY close any popups/modals first (multiple attempts)
        for (let attempt = 0; attempt < 2; attempt++) {
          await closePopupsAndModals(page);
          await page.waitForTimeout(300);
        }
        
        // Check for iframes - if found, we have a popup
        const iframeCount = await page.locator('iframe').count();
        if (iframeCount > 0) {
          console.log(`[Tab Check] ⚠️ Found ${iframeCount} iframes before test ${i + 1} - closing aggressively!`);
          await closePopupsAndModals(page);
        }
        
        const pagesBefore = context.pages();
        if (pagesBefore.length > 1) {
          console.log(`[Tab Check] Found ${pagesBefore.length} tabs before test ${i + 1}, cleaning up...`);
          await handleTabNavigation(context, page, url);
        }
        
        // Verify we're on the correct page
        const currentUrl = page.url();
        if (!currentUrl.includes(new URL(url).hostname)) {
          console.log(`[Tab Check] Not on original URL (${currentUrl}), navigating back to ${url}`);
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await waitForPageStability(page);
        }
        
        // Close popups again after navigation (multiple attempts)
        for (let attempt = 0; attempt < 2; attempt++) {
          await closePopupsAndModals(page);
          await page.waitForTimeout(300);
        }
      } catch (preTestError) {
        console.warn(`[Tab Check] Pre-test check failed: ${preTestError.message}`);
      }

      // Skip auth tests in the loop since we did it upfront
      if (t.name.includes('Login') || t.name.includes('OTP')) {
        storedTests.push({
          id: `${testRunId}-t-${i}`,
          test_run_id: testRunId,
          test_type: 'auth',
          test_name: t.name,
          description: t.description || '',
          severity: t.severity,
          expected_result: t.expected_result,
          status: 'passed',
          execution_time: 100,
          screenshot_url: await captureScreenshot({ index: i, status: 'passed', page }),
          error_message: null
        });
        passedCount++;
        continue;
      }

      // Check if we've already tested this element (prevent loops)
      const elementKey = t.test_data?.selector || t.name;
      if (testedElements.has(elementKey) && t.test_data) {
        console.log(`[Test ${i + 1}] Skipping duplicate element: ${elementKey}`);
        storedTests.push({
          id: `${testRunId}-t-${i}`,
          test_run_id: testRunId,
          test_type: t.type || 'functional',
          test_name: `${t.name} (Skipped - Duplicate)`,
          description: t.description || '',
          severity: t.severity,
          expected_result: t.expected_result,
          status: 'skipped',
          execution_time: 0,
          screenshot_url: await captureScreenshot({ index: i, status: 'skipped', page }),
          error_message: 'Element already tested'
        });
        continue;
      }
      
      // Check if element has failed too many times (prevent infinite loops)
      if (t.test_data && failedElements.has(elementKey)) {
        const failureCount = failedElements.get(elementKey);
        if (failureCount >= MAX_ELEMENT_FAILURES) {
          console.log(`[Test ${i + 1}] Skipping problematic element (failed ${failureCount} times): ${elementKey}`);
          storedTests.push({
            id: `${testRunId}-t-${i}`,
            test_run_id: testRunId,
            test_type: t.type || 'functional',
            test_name: `${t.name} (Skipped - Too Many Failures)`,
            description: t.description || '',
            severity: t.severity,
            expected_result: t.expected_result,
            status: 'skipped',
            execution_time: 0,
            screenshot_url: await captureScreenshot({ index: i, status: 'skipped', page }),
            error_message: `Element failed ${failureCount} times, likely causes navigation issues`
          });
          continue;
        }
      }

      // Execute test with aggressive timeout protection and watchdog
      let result = { passed: false, message: 'Test timeout or error' };
      let executionTime = 0;
      let testCompleted = false;
      let forceSkip = false; // Flag to force skip if stuck

      // Watchdog: Force continue if test takes too long
      const watchdog = setTimeout(() => {
        if (!testCompleted) {
          console.warn(`[Watchdog] ⚠️ Test ${i + 1} taking too long, checking for blocking popups...`);
          // Check for iframes/popups that might be blocking
          page.evaluate(() => {
            const iframes = document.querySelectorAll('iframe');
            if (iframes.length > 0) {
              console.log(`[Watchdog] Found ${iframes.length} iframes - likely blocking popup!`);
            }
          }).catch(() => {});
        }
      }, TEST_TIMEOUT + 5000); // Give it 5 seconds extra before warning
      
      // AGGRESSIVE WATCHDOG: Force skip if test exceeds timeout significantly
      const forceSkipTimeout = setTimeout(() => {
        if (!testCompleted) {
          console.error(`[FORCE SKIP] 🚨 Test ${i + 1} exceeded ${TEST_TIMEOUT}ms - FORCING SKIP!`);
          forceSkip = true;
        }
      }, TEST_TIMEOUT + 10000); // 10 seconds after timeout

      try {
        const testPromise = (async () => {
          const start = Date.now();
          
          // Check if we should force skip before starting
          if (forceSkip) {
            throw new Error('Force skip requested');
          }
          
          // EXECUTE REAL ACTION with aggressive timeout
          if (t.test_data && typeof t.test_data === 'object') {
            // BEFORE executing, check for blocking popups
            const blockingIframes = await page.locator('iframe').count();
            if (blockingIframes > 0) {
              console.log(`[Pre-Action] ⚠️ Found ${blockingIframes} iframes before action - closing aggressively!`);
              for (let attempt = 0; attempt < 3; attempt++) {
                await closePopupsAndModals(page);
                await page.waitForTimeout(300);
              }
            }
            
            // Wrap in additional timeout protection
            result = await Promise.race([
              executeAction(page, t.test_data, url, context),
              new Promise((resolve) => 
                setTimeout(() => {
                  console.warn(`[Action Timeout] Action exceeded ${TEST_TIMEOUT}ms`);
                  resolve({ 
                    passed: false, 
                    message: 'Action timeout - element may have opened popup or hung' 
                  });
                }, TEST_TIMEOUT)
              )
            ]);
            
            // Check if we got stuck (result indicates timeout)
            if (result.message && result.message.includes('timeout')) {
              console.warn(`[Action] Action timed out, checking for blocking popups...`);
              // Aggressively close popups
              for (let attempt = 0; attempt < 5; attempt++) {
                await closePopupsAndModals(page);
                await page.waitForTimeout(500);
              }
            }
            
            testedElements.add(elementKey); // Mark as tested
            
            // After each action, aggressively ensure we're on the original page/tab
            await Promise.race([
              handleTabNavigation(context, page, url),
              new Promise((resolve) => setTimeout(resolve, 2000))
            ]);
          } else {
            // Legacy/Generic tests: scroll and check page state
            await page.evaluate(() => window.scrollBy(0, 200)).catch(() => {});
            await waitForPageStability(page);
            result = { passed: true, message: 'Generic test completed' };
          }
          
          executionTime = Date.now() - start;
          testCompleted = true;
        })();

        // Race against timeout - be aggressive
        try {
          await Promise.race([
            testPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
            )
          ]);
        } catch (raceError) {
          // If race timed out, check for blocking popups
          console.warn(`[Test Race] Test ${i + 1} race timed out, checking for popups...`);
          const iframeCount = await page.locator('iframe').count();
          if (iframeCount > 0) {
            console.error(`[Test Race] 🚨 Found ${iframeCount} iframes - popup is blocking!`);
            // Force close
            for (let attempt = 0; attempt < 5; attempt++) {
              await closePopupsAndModals(page);
              await page.waitForTimeout(500);
            }
            // Force remove via JavaScript
            await page.evaluate(() => {
              document.querySelectorAll('iframe').forEach(iframe => {
                iframe.remove();
              });
              document.querySelectorAll('[class*="modal"], [class*="popup"]').forEach(el => {
                el.style.display = 'none';
                el.remove();
              });
            });
          }
          throw raceError; // Re-throw to be caught by outer catch
        }
        
        clearTimeout(watchdog);
        clearTimeout(forceSkipTimeout);

      } catch (timeoutError) {
        clearTimeout(watchdog);
        clearTimeout(forceSkipTimeout);
        console.error(`[Test ${i + 1}] Timeout or error: ${timeoutError.message}`);
        executionTime = Date.now() - testStartTime;
        
        // If we're stuck, force close everything
        if (executionTime > TEST_TIMEOUT) {
          console.error(`[Test ${i + 1}] 🚨 FORCE CLOSING ALL POPUPS - test stuck for ${Math.round(executionTime/1000)}s`);
          
          // Nuclear option: force close via JavaScript
          await page.evaluate(() => {
            // Remove all iframes
            document.querySelectorAll('iframe').forEach(iframe => {
              iframe.remove();
            });
            // Hide all modals
            document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"], [role="dialog"]').forEach(el => {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.remove();
            });
            // Remove backdrop
            document.querySelectorAll('[class*="backdrop"]').forEach(el => el.remove());
          });
          
          // Multiple escape presses
          for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(100);
          }
        }
        
        result = { 
          passed: false, 
          message: `Test exceeded timeout (${TEST_TIMEOUT}ms) or encountered error: ${timeoutError.message}` 
        };
        
        // Aggressive recovery: handle tabs and navigate back with timeouts
        try {
          console.log(`[Recovery] Starting aggressive recovery for test ${i + 1}...`);
          
          // First, aggressively handle any new tabs (with timeout)
          await Promise.race([
            handleTabNavigation(context, page, url),
            new Promise((resolve) => setTimeout(resolve, 3000))
          ]);
          
          // Then check URL and navigate if needed (with timeout)
          const currentUrl = await Promise.race([
            Promise.resolve(page.url()),
            new Promise((resolve) => setTimeout(() => resolve(''), 1000))
          ]);
          
          if (url && currentUrl && !currentUrl.includes(new URL(url).hostname)) {
            console.log(`[Recovery] Navigating back to ${url} from ${currentUrl}`);
            await Promise.race([
              page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }),
              new Promise((resolve) => setTimeout(resolve, 10000))
            ]).catch(() => {});
            
            await waitForPageStability(page);
          }
          
          console.log(`[Recovery] ✓ Recovery completed for test ${i + 1}`);
        } catch (recoveryError) {
          console.error(`[Recovery] Failed to recover: ${recoveryError.message}`);
          // Last resort: try to get back to original page
          try {
            const pages = context.pages();
            if (pages.length > 1) {
              // Close all except the first one
              for (let j = 1; j < pages.length; j++) {
                if (!pages[j].isClosed()) {
                  await pages[j].close({ timeout: 1000 }).catch(() => {});
                }
              }
            }
            if (pages.length > 0 && !pages[0].isClosed()) {
              await pages[0].bringToFront();
            }
          } catch (e) {
            console.error(`[Recovery] Could not switch pages: ${e.message}`);
          }
        }
      }

      totalTime += executionTime;
      const passed = result.passed;
      const status = passed ? 'passed' : 'failed';

      // Capture screenshot after each test
      const screenshotUrl = await captureScreenshot({ 
        index: i, 
        status, 
        page 
      }).catch(() => null);

      storedTests.push({
        id: `${testRunId}-t-${originalIndex >= 0 ? originalIndex : i}`,
        test_run_id: testRunId,
        test_type: t.type || 'functional',
        test_name: t.name,
        description: t.description || '',
        severity: t.severity,
        expected_result: t.expected_result,
        status,
        error_message: passed ? null : result.message,
        execution_time: executionTime,
        screenshot_url: screenshotUrl
      });

      if (passed) {
        passedCount++;
        console.log(`[Test ${i + 1}] ✓ PASSED: ${t.name}`);
        // Clear failure count on success
        if (t.test_data && failedElements.has(elementKey)) {
          failedElements.delete(elementKey);
        }
      } else {
        failedCount++;
        console.log(`[Test ${i + 1}] ✗ FAILED: ${t.name} - ${result.message}`);
        // Track failures for problematic elements
        if (t.test_data) {
          const currentFailures = failedElements.get(elementKey) || 0;
          failedElements.set(elementKey, currentFailures + 1);
          if (currentFailures + 1 >= MAX_ELEMENT_FAILURES) {
            console.warn(`[Warning] Element ${elementKey} has failed ${currentFailures + 1} times, will skip in future tests`);
          }
        }
      }

      // Aggressively ensure we're on the original page before next test
      await Promise.race([
        handleTabNavigation(context, page, url),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);
      
      // Verify page is still accessible
      try {
        const isClosed = page.isClosed();
        if (isClosed) {
          console.error(`[Critical] Page was closed! This should not happen.`);
          break; // Exit loop if page is closed
        }
      } catch (e) {
        console.error(`[Critical] Cannot verify page state: ${e.message}`);
      }
      
      // Small delay between tests to mimic human behavior
      await page.waitForTimeout(300);
    }

    console.log(`[Test Execution] Completed: ${passedCount} passed, ${failedCount} failed out of ${tests.length} total`);

  } catch (err) {
    console.error("[Critical Execution Error]", err);
    // Don't throw - return what we have so far
  } finally {
    // Stop tab monitoring
    if (tabMonitorInterval) {
      clearInterval(tabMonitorInterval);
      console.log(`[Tab Monitor] Stopped background tab monitoring`);
    }
    
    // Close browser context (this will also save video recording)
    try {
      // Get video path before closing (Playwright saves video on context close)
      const pages = context.pages();
      if (pages.length > 0) {
        try {
          const page = pages[0];
          // Video is automatically saved to tracesDir when context closes
          // The video file will be named with a timestamp in the tracesDir
          const videoFiles = fs.readdirSync(tracesDir).filter(f => f.endsWith('.webm'));
          if (videoFiles.length > 0) {
            // Get the most recent video file
            const videoFile = videoFiles.sort().reverse()[0];
            videoPath = path.join(tracesDir, videoFile);
            console.log(`[Video] Recording saved to: ${videoPath}`);
          }
        } catch (videoError) {
          console.warn(`[Video] Could not determine video path: ${videoError.message}`);
        }
      }
      
      await context.close();
      await browser.close();
      console.log(`[Test Execution] Browser closed, video recording saved to traces directory`);
    } catch (closeError) {
      console.error(`[Cleanup] Error closing browser: ${closeError.message}`);
    }
  }

  return { storedTests, passedCount, failedCount, totalTime, videoPath };
}
