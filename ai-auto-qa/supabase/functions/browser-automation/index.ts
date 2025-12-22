import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testRunId, url, recordingId } = await req.json();
    
    if (!testRunId || !url) {
      throw new Error('testRunId and url are required');
    }

    console.log(`Starting browser automation for test run: ${testRunId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
    
    if (!browserlessToken) {
      throw new Error('BROWSERLESS_TOKEN not configured. Add it in Lovable Cloud secrets for real browser automation.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Start the browser automation in background
    performBrowserAutomation(testRunId, url, recordingId, browserlessToken, supabase)
      .catch(err => console.error('Background automation error:', err));

    return new Response(
      JSON.stringify({ success: true, message: 'Browser automation started' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in browser-automation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function performBrowserAutomation(
  testRunId: string,
  url: string,
  recordingId: string | null,
  browserlessToken: string,
  supabase: any
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  try {
    console.log('Launching browser for:', url);
    
    // Use Browserless.io API to run Puppeteer in the cloud
    const scriptCode = `
      const puppeteer = require('puppeteer');
      
      module.exports = async ({ page, context }) => {
        const screenshots = [];
        const steps = [];
        let stepNumber = 0;
        
        // Navigate to the URL
        console.log('Navigating to:', '${url}');
        await page.goto('${url}', { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Capture initial screenshot
        stepNumber++;
        const screenshot1 = await page.screenshot({ 
          encoding: 'base64',
          fullPage: false
        });
        screenshots.push({
          stepNumber,
          screenshot: screenshot1,
          action: 'navigate',
          description: 'Initial page load'
        });
        
        // Discover interactive elements
        const buttons = await page.$$('button, a, input[type="submit"]');
        console.log(\`Found \${buttons.length} interactive elements\`);
        
        // Interact with first few elements
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
          try {
            stepNumber++;
            const element = buttons[i];
            
            // Get element info
            const tagName = await element.evaluate(el => el.tagName);
            const text = await element.evaluate(el => el.textContent?.trim() || '');
            const href = await element.evaluate(el => el.getAttribute('href'));
            
            console.log(\`Interacting with element \${i + 1}: \${tagName} - \${text}\`);
            
            // Click the element
            await element.click();
            await page.waitForTimeout(2000);
            
            // Capture screenshot after interaction
            const screenshot = await page.screenshot({ 
              encoding: 'base64',
              fullPage: false
            });
            
            screenshots.push({
              stepNumber,
              screenshot,
              action: 'click',
              description: \`Clicked: \${text || href || tagName}\`,
              element: { tagName, text, href }
            });
            
          } catch (error) {
            console.error(\`Error interacting with element \${i}: \${error.message}\`);
          }
        }
        
        // Find and test forms
        const forms = await page.$$('form');
        console.log(\`Found \${forms.length} forms\`);
        
        for (let i = 0; i < Math.min(forms.length, 2); i++) {
          try {
            stepNumber++;
            const form = forms[i];
            
            // Fill form fields with test data
            const inputs = await form.$$('input:not([type="hidden"]):not([type="submit"])');
            for (const input of inputs) {
              const type = await input.evaluate(el => el.type);
              const name = await input.evaluate(el => el.name);
              
              let testValue = '';
              if (type === 'email') testValue = 'test@example.com';
              else if (type === 'password') testValue = 'TestPassword123!';
              else if (type === 'text') testValue = 'Test User';
              else if (type === 'tel') testValue = '+1234567890';
              else testValue = 'test';
              
              await input.type(testValue);
              console.log(\`Filled input "\${name}" with test data\`);
            }
            
            // Capture screenshot after filling form
            const screenshot = await page.screenshot({ 
              encoding: 'base64',
              fullPage: false
            });
            
            screenshots.push({
              stepNumber,
              screenshot,
              action: 'fill_form',
              description: \`Filled form \${i + 1} with test data\`
            });
            
          } catch (error) {
            console.error(\`Error testing form \${i}: \${error.message}\`);
          }
        }
        
        return { screenshots, totalSteps: stepNumber };
      };
    `;
    
    // Execute the browser automation script via Browserless
    const browserlessResponse = await fetch('https://chrome.browserless.io/function', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${browserlessToken}`,
      },
      body: JSON.stringify({
        code: scriptCode,
        context: {},
      }),
    });
    
    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      throw new Error(`Browserless API error: ${browserlessResponse.status} - ${errorText}`);
    }
    
    const result = await browserlessResponse.json();
    console.log(`Browser automation completed. Captured ${result.screenshots?.length || 0} screenshots`);
    
    // Upload screenshots to Supabase Storage
    if (result.screenshots && result.screenshots.length > 0) {
      for (const step of result.screenshots) {
        const fileName = `${testRunId}-step-${step.stepNumber}.png`;
        const screenshotBuffer = Uint8Array.from(atob(step.screenshot), c => c.charCodeAt(0));
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('test-screenshots')
          .upload(fileName, screenshotBuffer, {
            contentType: 'image/png',
            upsert: true,
          });
        
        if (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
          continue;
        }
        
        const screenshotUrl = `${supabaseUrl}/storage/v1/object/public/test-screenshots/${fileName}`;
        
        // Insert step into database if recording exists
        if (recordingId) {
          await supabase.from('test_recording_steps').insert({
            recording_id: recordingId,
            step_number: step.stepNumber,
            action_type: step.action,
            action_description: step.description,
            screenshot_url: screenshotUrl,
            status: 'passed',
            timestamp: new Date().toISOString(),
          });
        }
      }
      
      // Update recording status
      if (recordingId) {
        await supabase
          .from('test_recordings')
          .update({ 
            status: 'completed',
            total_steps: result.totalSteps,
            completed_at: new Date().toISOString(),
          })
          .eq('id', recordingId);
      }
    }
    
    console.log('Browser automation completed successfully');
  } catch (error) {
    console.error('Error in performBrowserAutomation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update recording status to failed if applicable
    if (recordingId) {
      await supabase
        .from('test_recordings')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', recordingId);
    }
    
    throw error;
  }
}
