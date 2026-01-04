#!/usr/bin/env node
/**
 * Debug script to test the execution agent with detailed logging
 * Usage: node debug-test.js
 */

import { executeTests } from './src/agents/executeAgent.js';
import { analyzeSite } from './src/agents/analysisAgent.js';
import { generateTests } from './src/agents/testGenAgent.js';
import { estimateTestCount } from './src/agents/estimationAgent.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TEST_URL = 'https://valueinsightpro.jumpiq.com';
const TEST_CREDS = {
  username: process.env.TEST_USERNAME || '',
  password: process.env.TEST_PASSWORD || '',
  otp: process.env.TEST_OTP || ''
};

async function debugTest() {
  console.log('='.repeat(80));
  console.log('DEBUG TEST RUN - ValueInsights');
  console.log('='.repeat(80));
  console.log(`URL: ${TEST_URL}`);
  console.log(`Username: ${TEST_CREDS.username ? '***' : 'Not provided'}`);
  console.log('='.repeat(80));
  console.log('');

  const testRunId = `debug-${Date.now()}`;
  const litellmBaseUrl = process.env.LITELLM_BASE_URL || '';
  const litellmApiKey = process.env.LITELLM_API_KEY || '';
  const browserlessToken = process.env.BROWSERLESS_TOKEN || '';

  try {
    // Step 1: Analyze site
    console.log('[STEP 1] Analyzing site...');
    const analysis = await analyzeSite({
      url: TEST_URL,
      aiModel: 'hackathon-gemini-2.5-flash',
      litellmBaseUrl,
      litellmApiKey,
      creds: TEST_CREDS
    });
    console.log(`[STEP 1] ✓ Found ${analysis.pageModel?.components?.length || 0} components`);
    console.log('');

    // Step 2: Generate tests
    console.log('[STEP 2] Generating tests...');
    const estCount = await estimateTestCount({
      url: TEST_URL,
      depth: 'standard',
      litellmBaseUrl,
      litellmApiKey,
      aiModel: 'hackathon-gemini-2.5-flash'
    });
    console.log(`[STEP 2] Estimated ${estCount} tests`);

    const plan = await generateTests({
      url: TEST_URL,
      testType: 'functional',
      depth: 'standard',
      username: TEST_CREDS.username,
      otp: TEST_CREDS.otp,
      analysis
    });
    console.log(`[STEP 2] ✓ Generated ${plan.test_cases.length} test cases`);
    
    // Filter out analytics tests for debugging
    const analyticsTests = plan.test_cases.filter(t => 
      t.name?.toLowerCase().includes('analytics') || 
      t.test_data?.selector?.toLowerCase().includes('analytics')
    );
    console.log(`[STEP 2] Found ${analyticsTests.length} analytics-related tests`);
    analyticsTests.forEach(t => {
      console.log(`  - ${t.name} (${t.test_data?.selector})`);
    });
    console.log('');

    // Step 3: Execute tests
    console.log('[STEP 3] Executing tests...');
    console.log('='.repeat(80));
    
    const onUpdate = (progress) => {
      console.log(`[PROGRESS] ${progress.passed_tests || 0} passed, ${progress.failed_tests || 0} failed, ${progress.pending || 0} pending`);
      if (progress.current_test_name) {
        console.log(`[PROGRESS] Current: ${progress.current_test_name}`);
      }
    };

    const result = await executeTests({
      testRunId,
      url: TEST_URL,
      tests: plan.test_cases,
      browserlessToken,
      onUpdate,
      headless: false, // Run in headed mode for debugging
      creds: TEST_CREDS
    });

    // Step 4: Results
    console.log('');
    console.log('='.repeat(80));
    console.log('[RESULTS]');
    console.log('='.repeat(80));
    console.log(`Total tests: ${result.storedTests.length}`);
    console.log(`Passed: ${result.passedCount}`);
    console.log(`Failed: ${result.failedCount}`);
    console.log(`Total time: ${Math.round(result.totalTime / 1000)}s`);
    console.log('');

    // Show failed/skipped tests
    const failed = result.storedTests.filter(t => t.status === 'failed');
    const skipped = result.storedTests.filter(t => t.status === 'skipped');
    
    if (failed.length > 0) {
      console.log('Failed tests:');
      failed.forEach(t => {
        console.log(`  - ${t.test_name}: ${t.error_message}`);
      });
      console.log('');
    }
    
    if (skipped.length > 0) {
      console.log('Skipped tests:');
      skipped.forEach(t => {
        console.log(`  - ${t.test_name}: ${t.error_message || 'No reason'}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('[ERROR]');
    console.error('='.repeat(80));
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

debugTest();

