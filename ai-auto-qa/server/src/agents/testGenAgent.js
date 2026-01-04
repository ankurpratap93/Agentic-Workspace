export function generateFallbackTestCases(url, testType, count, username, otp) {
  // Legacy fallback if no analysis provided
  // ... (keep existing simple logic if needed, but we will focus on data driven)
  return [];
}

function generateDataTests(pageModel) {
  const tests = [];
  const components = pageModel.components || [];

  // 1. Tables/Grids -> Sort, Filter, Integrity
  const tables = components.filter(c => c.type === 'table' || c.type === 'grid');
  tables.forEach(table => {
    // Integrity
    tests.push({
      type: 'data_integrity',
      name: `Verify Table Data (${table.id || 'Main'})`,
      description: `Ensure table ${table.selector} loads with data rows`,
      severity: 'critical',
      expected_result: 'Table has > 0 rows',
      test_data: { selector: table.selector, action: 'verify_rows' }
    });

    // Columns (Sort) - Test ALL sortable headers
    if (table.headers && table.headers.length > 0) {
      // Test ALL headers, not just first 2 - human testers test everything
      table.headers.forEach(header => {
        if (!header || header.trim() === '') return; // Skip empty headers
        tests.push({
          type: 'data_sort',
          name: `Sort Table by ${header}`,
          description: `Click header "${header}" and verify rows are reordered correctly`,
          severity: 'normal',
          expected_result: `Rows sorted by ${header} column`,
          test_data: { selector: table.selector, header: header.trim(), action: 'sort' }
        });
      });
    }
  });

  // 2. Inputs -> Filters / Forms - Test ALL inputs systematically
  const inputs = components.filter(c => c.type === 'input' && c.visible !== false);
  inputs.forEach((input, index) => {
    tests.push({
      type: 'functional',
      name: `Input Interaction - ${input.label || `Input ${index + 1}`}`,
      description: `Test ${input.inputType} input "${input.label}" - verify it accepts input, validates correctly, and updates state`,
      severity: 'normal',
      expected_result: `${input.inputType} input accepts value and responds appropriately`,
      test_data: { selector: input.selector, inputType: input.inputType, action: 'input' }
    });
  });

  // 3. Functional Buttons - Test ALL buttons, but skip external login triggers
  const buttons = components.filter(c => c.type === 'button' && c.visible !== false);
  buttons.forEach((btn, index) => {
    // Skip buttons that trigger external logins (analytics, OAuth, etc.)
    const btnText = (btn.text || '').toLowerCase();
    const btnSelector = (btn.selector || '').toLowerCase();
    const combined = `${btnText} ${btnSelector}`;
    
    const externalLoginKeywords = [
      'analytics',
      'google',
      'oauth',
      'login',
      'sign in',
      'authenticate',
      'authorize',
      'connect account',
      'gmail',
      'microsoft',
      'facebook',
      'twitter',
      'linkedin'
    ];
    
    const willTriggerLogin = externalLoginKeywords.some(keyword => combined.includes(keyword));
    
    if (willTriggerLogin) {
      console.log(`[Test Gen] Skipping button that triggers external login: "${btn.text}"`);
      // Still create test but mark it to be skipped
      tests.push({
        type: 'functional',
        name: `Click Action - ${btn.text || `Button ${index + 1}`} (Skipped - External Login)`,
        description: `Skipped: Button "${btn.text || btn.selector}" triggers external login (Google Analytics, OAuth, etc.)`,
        severity: 'low',
        expected_result: 'Skipped - External login prompt',
        test_data: { selector: btn.selector, action: 'click', skip: true }
      });
    } else {
      tests.push({
        type: 'functional',
        name: `Click Action - ${btn.text || `Button ${index + 1}`}`,
        description: `Click button "${btn.text || btn.selector}" and verify response/state change`,
        severity: 'normal',
        expected_result: 'Button clickable, no errors, page responds appropriately',
        test_data: { selector: btn.selector, action: 'click' }
      });
    }
  });

  return tests;
}

export async function generateTests({ url, testType, depth, username, otp, analysis }) {
  let generatedTests = [];

  // 1. Always include Auth tests if creds provided
  if (username) {
    generatedTests.push(
      { type: 'functional', name: 'Login - Valid Credentials', description: 'Login with valid username and password', severity: 'critical', expected_result: 'User logged in successfully', test_data: 'Valid credentials' }
    );
  }
  if (otp) {
    generatedTests.push(
      { type: 'functional', name: 'OTP - Valid Code', description: 'Enter valid OTP code', severity: 'critical', expected_result: 'Authentication successful', test_data: 'Valid 6-digit code' }
    );
  }

  // 2. Data Driven Tests from Analysis
  if (analysis?.pageModel) {
    const dataTests = generateDataTests(analysis.pageModel);
    generatedTests = [...generatedTests, ...dataTests];
  }

  // 3. Fallback/Fill if not enough
  // (Simplified for now, trusting the analysis gives enough)

  return {
    pages: analysis?.pages ?? [],
    workflows: analysis?.workflows ?? [],
    test_cases: generatedTests
  };
}



