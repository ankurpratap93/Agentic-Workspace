import { URL } from "url";

async function safeClick(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 4000 });
    await page.click(selector);
    return true;
  } catch {
    return false;
  }
}
async function safeFill(page, selector, value) {
  try {
    await page.waitForSelector(selector, { timeout: 4000 });
    await page.fill(selector, value);
    return true;
  } catch {
    return false;
  }
}

export async function handleGenericLogin(page, creds, recordStep) {
  const { username, password } = creds || {};
  if (!username || !password) return false;
  // common selectors
  const userSelectors = ['input[name="username"]', 'input[name="email"]', 'input#username', 'input#email'];
  const passSelectors = ['input[name="password"]', 'input#password', 'input[type="password"]'];
  const loginSelectors = ['button[type="submit"]', 'button:has-text("Sign in")', 'button:has-text("Log in")', 'button:has-text("Login")'];
  // try fill
  for (const sel of userSelectors) {
    if (await safeFill(page, sel, username)) {
      await recordStep('fill_form', `Filled username ${sel}`);
      break;
    }
  }
  for (const sel of passSelectors) {
    if (await safeFill(page, sel, password)) {
      await recordStep('fill_form', `Filled password ${sel}`);
      break;
    }
  }
  // enable + click submit
  for (const sel of loginSelectors) {
    if (await safeClick(page, sel)) {
      await recordStep('click', `Clicked submit ${sel}`);
      return true;
    }
  }
  return false;
}

// Site-specific flow: valueinsightpro.jumpiq.com
export async function handleJumpIQLogin(page, creds, recordStep) {
  // 1) Fill user/pass (site sometimes uses "userid")
  const okUser =
    await safeFill(page, 'input#company-email', creds?.username || '') ||
    await safeFill(page, 'input[data-testid="company-email-input"]', creds?.username || '') ||
    await safeFill(page, 'input[name="userid"], input#userid', creds?.username || '') ||
    await safeFill(page, 'input[placeholder*="User ID" i]', creds?.username || '') ||
    await safeFill(page, 'input[name="username"], input#username', creds?.username || '') ||
    await safeFill(page, 'input[name="email"], input#email', creds?.username || '');
  const okPass =
    await safeFill(page, 'input[name="password"], input#password', creds?.password || '') ||
    await safeFill(page, 'input[placeholder*="Password" i]', creds?.password || '');
  if (okUser) await recordStep('fill_form', 'Filled username');
  if (okPass) await recordStep('fill_form', 'Filled password');

  // 2) Ensure Sign in is enabled: toggle radios/checkboxes as required
  const enableControls = [
    'input[type="radio"]',
    '[role="radio"]',
    'label:has(input[type="radio"])',
    'input[type="checkbox"]',
    'label:has(input[type="checkbox"])'
  ];
  const signInButtonSelector = 'button:has-text("Sign in"), button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]';
  try {
    await page.waitForSelector(signInButtonSelector, { timeout: 5000 });
    let enabled = await page.isEnabled(signInButtonSelector).catch(() => false);
    if (!enabled) {
      for (const sel of enableControls) {
        const elements = await page.$$(sel);
        for (const el of elements) {
          try {
            await el.click();
            await recordStep('click', `Toggled ${sel}`);
          } catch { }
          enabled = await page.isEnabled(signInButtonSelector).catch(() => false);
          if (enabled) break;
        }
        if (enabled) break;
      }
    }
    // 3) Click Sign in
    await page.click(signInButtonSelector, { timeout: 8000 });
    await recordStep('click', 'Clicked Sign in');
  } catch { }

  // 4) Wait OTP page, fill OTP
  if (creds?.otp) {
    // common OTP inputs (single input or multiple)
    await page.waitForTimeout(1500);
    const singleOtp = await safeFill(page, 'input[name="otp"], input#otp, input[autocomplete="one-time-code"]', String(creds.otp));
    if (!singleOtp) {
      // attempt split 5-digit inputs
      // try within frames too
      let inputs = await page.$$('input[type="text"][maxlength="1"], input[aria-label*="digit" i], input[aria-label*="otp" i]');
      if (!inputs?.length) {
        for (const frame of page.frames()) {
          try {
            const cand = await frame.$$('input[type="text"][maxlength="1"], input[aria-label*="digit" i], input[aria-label*="otp" i]');
            if (cand?.length) { inputs = cand; break; }
          } catch { }
        }
      }
      if (inputs?.length >= String(creds.otp).length) {
        const digits = String(creds.otp).split('');
        for (let i = 0; i < digits.length; i++) {
          try { await inputs[i].fill(digits[i]); } catch { }
        }
        await recordStep('fill_form', 'Filled split OTP inputs');
      }
    } else {
      await recordStep('fill_form', 'Filled OTP input');
    }
    const verifyClicked =
      await safeClick(page, 'button:has-text("Verify"), button:has-text("Continue"), button:has-text("Submit"), button:has-text("Sign in"), button[type="submit"]');
    if (verifyClicked) await recordStep('click', 'Clicked OTP Verify');
  }
  return true;
}

export async function runAuthFlow(page, url, creds, recordStep) {
  const hostname = new URL(url).hostname;
  if (hostname.includes('jumpiq.com')) {
    return handleJumpIQLogin(page, creds, recordStep);
  }
  // fallback generic
  return handleGenericLogin(page, creds, recordStep);
}


