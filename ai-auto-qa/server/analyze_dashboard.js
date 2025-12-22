import { chromium } from 'playwright';

async function analyzeDashboard() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Navigating...');
        await page.goto('https://valueinsightpro.jumpiq.com/auth/login?redirect=/', { waitUntil: 'networkidle' });

        console.log('Filling credentials...');
        // Login with known working selectors
        await page.fill('input#company-email', 'mohit');
        await page.fill('input#password', 'mohit@1501');

        console.log('Clicking Sign in...');
        await page.click('button:has-text("Sign in"), button:has-text("Login"), button[type="submit"]');

        console.log('Waiting for OTP...');
        await page.waitForTimeout(5000);

        // OTP
        const otpInput = await page.$('input#otp, input[name="otp"], input[autocomplete="one-time-code"]');
        if (otpInput) {
            console.log('Found OTP input, filling...');
            await otpInput.fill('99999');
            await page.click('button:has-text("Verify"), button:has-text("Continue"), button:has-text("Submit")');
        } else {
            console.log('Checking for split OTP...');
            const inputs = await page.$$('input[type="text"][maxlength="1"]');
            if (inputs.length >= 5) {
                console.log(`Found ${inputs.length} split inputs. Filling...`);
                const code = '99999'.split('');
                for (let i = 0; i < code.length; i++) await inputs[i].fill(code[i]);
                await page.click('button:has-text("Verify"), button:has-text("Continue"), button:has-text("Submit")');
            } else {
                console.log('Could not find OTP input! Dumping inputs for debug later if needed.');
            }
        }

        console.log('Waiting for Dashboard...');
        // Wait for URL change or critical element
        await page.waitForTimeout(5000);
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        console.log('Page Title:', title);

        // Extract critical semantic elements
        const structure = await page.evaluate(() => {
            const getTagSummary = (sel) => {
                return Array.from(document.querySelectorAll(sel)).map(el => ({
                    tag: el.tagName,
                    text: el.innerText?.slice(0, 50).replace(/\n/g, ' '),
                    classes: el.className,
                    // attributes: Array.from(el.attributes).map(a => `${a.name}=${a.value}`).join(' ')
                }));
            };

            return {
                tables: getTagSummary('table'),
                grids: getTagSummary('[role="grid"]'),
                headers: getTagSummary('h1, h2, h3'),
                buttons: getTagSummary('button').length,
                links: getTagSummary('a').length,
                inputs: getTagSummary('input, select, textarea').length,
                dataComponents: getTagSummary('[data-component], [data-testid]').slice(0, 20)
            };
        });

        console.log('DASHBOARD STRUCTURE:', JSON.stringify(structure, null, 2));

    } catch (e) {
        console.error('Analysis error:', e);
    } finally {
        await browser.close();
    }
}

analyzeDashboard();
