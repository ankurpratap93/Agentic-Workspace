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

    // Columns (Sort)
    if (table.headers && table.headers.length > 0) {
      // Pick first 2 headers to test sorting
      table.headers.slice(0, 2).forEach(header => {
        tests.push({
          type: 'data_sort',
          name: `Sort Table by ${header}`,
          description: `Click header "${header}" and verify ordering`,
          severity: 'normal',
          expected_result: 'Rows reordered',
          test_data: { selector: table.selector, header: header, action: 'sort' }
        });
      });
    }
  });

  // 2. Inputs -> Filters / Forms
  const inputs = components.filter(c => c.type === 'input');
  inputs.forEach(input => {
    tests.push({
      type: 'functional',
      name: `Input Interaction - ${input.label}`,
      description: `Interact with input ${input.label}`,
      severity: 'normal',
      expected_result: 'Input accepts value',
      test_data: { selector: input.selector, inputType: input.inputType, action: 'input' }
    });
  });

  // 3. Functional Buttons
  const buttons = components.filter(c => c.type === 'button');
  buttons.slice(0, 5).forEach(btn => {
    tests.push({
      type: 'functional',
      name: `Click Action - ${btn.text}`,
      description: `Click button ${btn.text} and check for errors`,
      severity: 'normal',
      expected_result: 'No console errors',
      test_data: { selector: btn.selector, action: 'click' }
    });
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
