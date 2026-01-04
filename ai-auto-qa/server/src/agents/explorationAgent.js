/**
 * Intelligent Exploration Agent
 * 
 * This agent behaves like a human tester:
 * - Detects and explores pop-ups/modals when tabs are clicked
 * - Waits for proper rendering (fonts, animations, content)
 * - Tries different dropdown options systematically
 * - Observes changes before proceeding
 * - Explores all available tabs/options in pop-ups
 */

import { chromium } from "playwright";

/**
 * Wait for page to be fully rendered (fonts, images, animations)
 * More sophisticated than basic networkidle
 */
export async function waitForFullRendering(page, timeout = 10000) {
  try {
    // Wait for fonts to load
    await page.evaluate(() => {
      return document.fonts.ready;
    }).catch(() => {});

    // Wait for images to load
    await page.evaluate(() => {
      const images = Array.from(document.images);
      return Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails
            setTimeout(resolve, 2000); // Max 2s per image
          });
        })
      );
    }).catch(() => {});

    // Wait for CSS animations to complete
    await page.waitForTimeout(500);

    // Wait for network to be idle
    await Promise.race([
      page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 5000) }),
      new Promise(resolve => setTimeout(resolve, timeout))
    ]).catch(() => {});

    // Small delay for any remaining animations
    await page.waitForTimeout(300);

    return true;
  } catch (e) {
    console.warn(`[Rendering] Could not wait for full rendering: ${e.message}`);
    return false;
  }
}

/**
 * Detect if a pop-up/modal appeared after an action
 */
export async function detectPopup(page, beforeState = null) {
  try {
    const currentState = await page.evaluate(() => {
      const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"], [class*="dialog"]');
      const iframes = document.querySelectorAll('iframe');
      const overlays = document.querySelectorAll('[class*="overlay"], [class*="backdrop"]');
      
      return {
        modalCount: modals.length,
        iframeCount: iframes.length,
        overlayCount: overlays.length,
        visibleModals: Array.from(modals).filter(m => {
          const style = window.getComputedStyle(m);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }).length,
        visibleIframes: Array.from(iframes).filter(i => {
          const style = window.getComputedStyle(i);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }).length
      };
    });

    // Compare with before state
    if (beforeState) {
      const modalAppeared = currentState.visibleModals > beforeState.visibleModals;
      const iframeAppeared = currentState.visibleIframes > beforeState.visibleIframes;
      const overlayAppeared = currentState.overlayCount > beforeState.overlayCount;

      if (modalAppeared || iframeAppeared || overlayAppeared) {
        console.log(`[Popup Detection] ✓ Popup detected: ${currentState.visibleModals} modals, ${currentState.visibleIframes} iframes`);
        return { detected: true, state: currentState };
      }
    } else {
      // No before state, check if any popup exists
      if (currentState.visibleModals > 0 || currentState.visibleIframes > 0) {
        return { detected: true, state: currentState };
      }
    }

    return { detected: false, state: currentState };
  } catch (e) {
    console.warn(`[Popup Detection] Error: ${e.message}`);
    return { detected: false, state: null };
  }
}

/**
 * Get all tabs/options in a pop-up/modal
 */
export async function getPopupTabs(page) {
  try {
    const tabs = await page.evaluate(() => {
      const results = [];
      
      // Find the active modal/popup
      const modals = Array.from(document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]'))
        .filter(m => {
          const style = window.getComputedStyle(m);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });

      if (modals.length === 0) return results;

      const modal = modals[0]; // Focus on first visible modal

      // Find tabs (common patterns)
      const tabSelectors = [
        '[role="tab"]',
        '.tab',
        '[class*="tab"]',
        '[data-tab]',
        'button[aria-controls]',
        'a[role="tab"]',
        '.nav-tabs button',
        '.nav-tabs a',
        '.tab-list button',
        '.tab-list a'
      ];

      for (const selector of tabSelectors) {
        const elements = modal.querySelectorAll(selector);
        elements.forEach((el, idx) => {
          const text = el.textContent?.trim() || el.getAttribute('aria-label') || el.title || '';
          const isActive = el.getAttribute('aria-selected') === 'true' || 
                          el.classList.contains('active') || 
                          el.classList.contains('selected');
          
          if (text || el.id) {
            results.push({
              text,
              selector: el.id ? `#${el.id}` : `${selector}:nth-of-type(${idx + 1})`,
              isActive,
              element: el.tagName.toLowerCase(),
              attributes: {
                id: el.id,
                'aria-label': el.getAttribute('aria-label'),
                'data-tab': el.getAttribute('data-tab'),
                class: el.className
              }
            });
          }
        });
      }

      // Also check for dropdown/select options within modal
      const selects = modal.querySelectorAll('select, [role="listbox"]');
      selects.forEach((select, idx) => {
        const options = select.querySelectorAll('option, [role="option"]');
        options.forEach((opt, optIdx) => {
          const text = opt.textContent?.trim() || opt.getAttribute('aria-label') || '';
          if (text && !opt.disabled) {
            results.push({
              text,
              selector: select.id ? `#${select.id} option:nth-of-type(${optIdx + 1})` : `select:nth-of-type(${idx + 1}) option:nth-of-type(${optIdx + 1})`,
              isActive: opt.selected,
              element: 'option',
              parentSelector: select.id ? `#${select.id}` : `select:nth-of-type(${idx + 1})`
            });
          }
        });
      });

      return results;
    });

    return tabs;
  } catch (e) {
    console.warn(`[Popup Tabs] Error: ${e.message}`);
    return [];
  }
}

/**
 * Explore a pop-up by clicking through all tabs/options
 */
export async function explorePopup(page, popupState, onStep) {
  const explored = [];
  
  try {
    // Wait for popup to be fully rendered
    await waitForFullRendering(page, 5000);

    // Get all tabs/options
    const tabs = await getPopupTabs(page);
    console.log(`[Popup Exploration] Found ${tabs.length} tabs/options to explore`);

    if (tabs.length === 0) {
      // No tabs found, but popup exists - try to interact with any buttons/inputs
      const interactiveElements = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]:not([style*="display: none"]), .modal:not([style*="display: none"])');
        if (!modal) return [];

        const buttons = Array.from(modal.querySelectorAll('button, [role="button"], a[role="button"]'))
          .filter(b => {
            const text = b.textContent?.trim() || '';
            return text && !text.toLowerCase().includes('close') && !text.toLowerCase().includes('cancel');
          })
          .slice(0, 5); // Limit to 5 buttons

        return buttons.map((b, idx) => ({
          text: b.textContent?.trim(),
          selector: b.id ? `#${b.id}` : `button:nth-of-type(${idx + 1})`
        }));
      });

      for (const element of interactiveElements) {
        try {
          console.log(`[Popup Exploration] Clicking interactive element: ${element.text}`);
          await page.locator(element.selector).first().click({ timeout: 3000 });
          await waitForFullRendering(page, 3000);
          
          if (onStep) {
            const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false }).catch(() => null);
            await onStep('explore_popup', `Explored: ${element.text}`, screenshot ? `data:image/png;base64,${screenshot}` : null);
          }

          explored.push({ type: 'button', text: element.text, action: 'clicked' });
          await page.waitForTimeout(500);
        } catch (e) {
          console.warn(`[Popup Exploration] Could not click ${element.text}: ${e.message}`);
        }
      }

      return explored;
    }

    // Explore each tab/option
    for (const tab of tabs) {
      try {
        // Skip if already active
        if (tab.isActive) {
          console.log(`[Popup Exploration] Tab "${tab.text}" is already active, skipping`);
          continue;
        }

        console.log(`[Popup Exploration] Clicking tab/option: ${tab.text}`);

        // Click the tab
        const clicked = await page.locator(tab.selector).first().click({ timeout: 5000 }).catch(() => false);
        
        if (!clicked) {
          // Try parent selector if it's an option
          if (tab.parentSelector) {
            await page.locator(tab.parentSelector).first().selectOption(tab.text, { timeout: 5000 }).catch(() => {});
          }
        }

        // Wait for content to load
        await waitForFullRendering(page, 5000);

        // Capture screenshot
        if (onStep) {
          const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false }).catch(() => null);
          await onStep('explore_popup', `Explored tab: ${tab.text}`, screenshot ? `data:image/png;base64,${screenshot}` : null);
        }

        // Observe what changed
        const content = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"]:not([style*="display: none"]), .modal:not([style*="display: none"])');
          if (!modal) return null;

          return {
            hasTable: modal.querySelector('table') !== null,
            hasForm: modal.querySelector('form') !== null,
            hasList: modal.querySelector('ul, ol') !== null,
            buttonCount: modal.querySelectorAll('button').length,
            inputCount: modal.querySelectorAll('input, select, textarea').length
          };
        });

        explored.push({
          type: tab.element === 'option' ? 'dropdown_option' : 'tab',
          text: tab.text,
          selector: tab.selector,
          content: content,
          action: 'explored'
        });

        // Small delay between tabs
        await page.waitForTimeout(800);

      } catch (e) {
        console.warn(`[Popup Exploration] Error exploring tab "${tab.text}": ${e.message}`);
      }
    }

    console.log(`[Popup Exploration] ✓ Explored ${explored.length} tabs/options`);
    return explored;

  } catch (e) {
    console.error(`[Popup Exploration] Critical error: ${e.message}`);
    return explored;
  }
}

/**
 * Get all options in a dropdown/select element
 */
export async function getDropdownOptions(page, selector) {
  try {
    const options = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return [];

      if (element.tagName === 'SELECT') {
        return Array.from(element.options).map((opt, idx) => ({
          text: opt.textContent?.trim(),
          value: opt.value,
          index: idx,
          disabled: opt.disabled,
          selected: opt.selected
        }));
      }

      // For custom dropdowns (div-based)
      if (element.getAttribute('role') === 'listbox' || element.classList.contains('dropdown')) {
        const options = element.querySelectorAll('[role="option"], .dropdown-item, .option');
        return Array.from(options).map((opt, idx) => ({
          text: opt.textContent?.trim(),
          value: opt.getAttribute('data-value') || opt.textContent?.trim(),
          index: idx,
          disabled: opt.hasAttribute('disabled') || opt.classList.contains('disabled'),
          selected: opt.getAttribute('aria-selected') === 'true' || opt.classList.contains('selected')
        }));
      }

      return [];
    }, selector);

    return options.filter(opt => !opt.disabled && opt.text); // Only enabled, non-empty options
  } catch (e) {
    console.warn(`[Dropdown Options] Error: ${e.message}`);
    return [];
  }
}

/**
 * Explore dropdown by trying different options and observing results
 */
export async function exploreDropdown(page, selector, onStep) {
  const results = [];
  
  try {
    console.log(`[Dropdown Exploration] Exploring dropdown: ${selector}`);

    // Get all options
    const options = await getDropdownOptions(page, selector);
    console.log(`[Dropdown Exploration] Found ${options.length} options`);

    if (options.length === 0) {
      return results;
    }

    // Get current state before changes
    const initialState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasTable: document.querySelector('table') !== null,
        hasForm: document.querySelector('form') !== null,
        dataCount: document.querySelectorAll('table tbody tr, [role="grid"] [role="row"]').length
      };
    });

    // Try each option (limit to 10 to avoid too many iterations)
    const optionsToTry = options.slice(0, 10);
    
    for (const option of optionsToTry) {
      try {
        // Skip if already selected
        if (option.selected) {
          console.log(`[Dropdown Exploration] Option "${option.text}" already selected, skipping`);
          continue;
        }

        console.log(`[Dropdown Exploration] Trying option: ${option.text}`);

        // Select the option
        if (selector.includes('select')) {
          // Native select
          await page.locator(selector).first().selectOption(option.value || option.text, { timeout: 5000 });
        } else {
          // Custom dropdown - click to open, then click option
          await page.locator(selector).first().click({ timeout: 5000 });
          await page.waitForTimeout(500); // Wait for dropdown to open
          
          const optionSelector = `[role="option"]:has-text("${option.text}"), .dropdown-item:has-text("${option.text}")`;
          await page.locator(optionSelector).first().click({ timeout: 5000 });
        }

        // Wait for page to react (like a human would)
        await waitForFullRendering(page, 5000);

        // Observe what changed
        const newState = await page.evaluate(() => {
          return {
            url: window.location.href,
            hasTable: document.querySelector('table') !== null,
            hasForm: document.querySelector('form') !== null,
            dataCount: document.querySelectorAll('table tbody tr, [role="grid"] [role="row"]').length,
            visibleElements: document.querySelectorAll('button:not([style*="display: none"]), input:not([style*="display: none"])').length
          };
        });

        // Compare states
        const urlChanged = newState.url !== initialState.url;
        const dataChanged = newState.dataCount !== initialState.dataCount;
        const elementsChanged = newState.visibleElements !== initialState.visibleElements;

        const hasImplication = urlChanged || dataChanged || elementsChanged;

        // Capture screenshot
        if (onStep) {
          const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false }).catch(() => null);
          await onStep('explore_dropdown', 
            `Selected: ${option.text}${hasImplication ? ' (Changed page/data)' : ' (No change)'}`, 
            screenshot ? `data:image/png;base64,${screenshot}` : null
          );
        }

        results.push({
          option: option.text,
          value: option.value,
          hasImplication,
          changes: {
            urlChanged,
            dataChanged,
            elementsChanged
          },
          newState
        });

        // If this option caused significant change, wait a bit longer
        if (hasImplication) {
          console.log(`[Dropdown Exploration] ✓ Option "${option.text}" caused changes - URL: ${urlChanged}, Data: ${dataChanged}`);
          await page.waitForTimeout(1000);
        } else {
          await page.waitForTimeout(500);
        }

      } catch (e) {
        console.warn(`[Dropdown Exploration] Error trying option "${option.text}": ${e.message}`);
      }
    }

    // Reset to original option if possible
    if (options.length > 0 && options[0].selected !== true) {
      try {
        await page.locator(selector).first().selectOption(options[0].value || options[0].text, { timeout: 3000 }).catch(() => {});
        await waitForFullRendering(page, 3000);
      } catch (e) {
        // Ignore reset errors
      }
    }

    console.log(`[Dropdown Exploration] ✓ Explored ${results.length} options`);
    return results;

  } catch (e) {
    console.error(`[Dropdown Exploration] Critical error: ${e.message}`);
    return results;
  }
}

/**
 * Main exploration function - detects popups and explores them intelligently
 */
export async function intelligentExploration(page, actionSelector, actionType, onStep) {
  try {
    // Capture state before action
    const beforeState = await detectPopup(page);

    // Perform the action
    if (actionType === 'click' && actionSelector) {
      console.log(`[Intelligent Exploration] Clicking: ${actionSelector}`);
      await page.locator(actionSelector).first().click({ timeout: 5000 });
    }

    // Wait for any popup to appear (like a human would wait)
    await page.waitForTimeout(1000);

    // Check if popup appeared
    const popupResult = await detectPopup(page, beforeState.state);

    if (popupResult.detected) {
      console.log(`[Intelligent Exploration] 🎯 Popup detected! Exploring...`);
      
      // Explore the popup
      const explored = await explorePopup(page, popupResult.state, onStep);
      
      return {
        popupDetected: true,
        explored,
        action: 'popup_exploration'
      };
    }

    // No popup, but check if it's a dropdown that we should explore
    if (actionSelector) {
      const isDropdown = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        return el.tagName === 'SELECT' || 
               el.getAttribute('role') === 'listbox' || 
               el.classList.contains('dropdown') ||
               el.getAttribute('data-toggle') === 'dropdown';
      }, actionSelector);

      if (isDropdown) {
        console.log(`[Intelligent Exploration] 🎯 Dropdown detected! Exploring options...`);
        const explored = await exploreDropdown(page, actionSelector, onStep);
        return {
          popupDetected: false,
          dropdownDetected: true,
          explored,
          action: 'dropdown_exploration'
        };
      }
    }

    return {
      popupDetected: false,
      dropdownDetected: false,
      explored: [],
      action: 'none'
    };

  } catch (e) {
    console.error(`[Intelligent Exploration] Error: ${e.message}`);
    return {
      popupDetected: false,
      dropdownDetected: false,
      explored: [],
      action: 'error',
      error: e.message
    };
  }
}
