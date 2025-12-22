import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { analyzeSite } from "./agents/analysisAgent.js";
import { generateTests } from "./agents/testGenAgent.js";
import { executeTests } from "./agents/executeAgent.js";
import { generateInsights } from "./agents/insightAgent.js";
import { store } from "./store.js";
import { estimateTestCount } from "./agents/estimationAgent.js";

dotenv.config({ path: process.env.DOTENV_PATH || ".env.local" });

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// In-memory progress map (mirrored to store during run)
const progressByRunId = new Map();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/start-test", async (req, res) => {
  const {
    url, username, password, otp,
    framework = "playwright", browser = "chromium",
    depth = "standard", testType = "functional",
    headless = true, aiModel = "gpt-4o-mini"
  } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  const testRunId = uuidv4();
  const runs = store.getRuns();
  runs.push({
    id: testRunId,
    url,
    username: username || null,
    framework, browser, depth,
    headless: headless !== false,
    status: "generating_tests",
    total_tests: 0,
    passed_tests: 0,
    failed_tests: 0,
    execution_time: 0,
    created_at: new Date().toISOString()
  });
  store.setRuns(runs);
  progressByRunId.set(testRunId, { total: 0, passed: 0, failed: 0, pending: 0, status: "generating_tests", currentTest: "" });

  res.json({ testRunId, status: "started" });

  // Background orchestration
  const litellmBaseUrl = process.env.LITELLM_BASE_URL || "";
  const litellmApiKey = process.env.LITELLM_API_KEY || "";
  const browserlessToken = process.env.BROWSERLESS_TOKEN || "";

  try {
    const analysis = await analyzeSite({ url, aiModel, litellmBaseUrl, litellmApiKey, creds: { username, password, otp } });
    // Estimate count and generate test set
    const estCount = await estimateTestCount({ url, depth, litellmBaseUrl, litellmApiKey, aiModel });
    const plan = await generateTests({ url, testType, depth, username, otp, analysis });
    if (plan?.test_cases?.length && estCount && plan.test_cases.length !== estCount) {
      // Adjust to the estimated count by trimming or extending variants
      if (estCount < plan.test_cases.length) {
        plan.test_cases = plan.test_cases.slice(0, estCount);
      } else {
        // duplicate last few with variants
        const baseLen = plan.test_cases.length;
        for (let i = baseLen; i < estCount; i++) {
          const base = plan.test_cases[i % baseLen];
          plan.test_cases.push({
            ...base,
            name: `${base.name} - Variance ${Math.floor(i / baseLen) + 1}`,
            description: `${base.description} (variance)`
          });
        }
      }
    }

    // Update run to executing
    {
      const runsLocal = store.getRuns();
      const run = runsLocal.find(r => r.id === testRunId);
      if (run) {
        run.status = "executing_tests";
        run.total_tests = plan.test_cases.length;
        store.setRuns(runsLocal);
      }
      progressByRunId.set(testRunId, {
        total: plan.test_cases.length, passed: 0, failed: 0, pending: plan.test_cases.length,
        status: "executing_tests", currentTest: "", browser, framework, headless
      });
    }

    const onUpdate = (p) => {
      const prog = progressByRunId.get(testRunId) || {};
      const total = p.total_tests ?? prog.total ?? 0;
      const passed = p.passed_tests ?? 0;
      const failed = p.failed_tests ?? 0;
      progressByRunId.set(testRunId, {
        ...prog,
        total,
        passed,
        failed,
        pending: Math.max(0, total - passed - failed),
        currentTest: p.current_test_name ?? prog.currentTest ?? "",
        status: "executing_tests",
      });
    };

    const { storedTests, passedCount, failedCount, totalTime } = await executeTests({
      testRunId,
      url,
      tests: plan.test_cases,
      browserlessToken,
      onUpdate,
      headless,
      creds: { username, password, otp }
    });

    // Persist tests
    const allCases = store.getCases();
    for (const t of storedTests) {
      allCases.push(t);
    }
    store.setCases(allCases);

    // Create a single recording with steps mapped from tests
    const recId = `${testRunId}-rec-1`;
    const recordings = store.getRecordings();
    recordings.push({
      id: recId,
      test_run_id: testRunId,
      name: `Test Recording - ${url}`,
      description: `Automated run for ${url}`,
      total_steps: storedTests.length,
      duration: totalTime,
      status: "completed",
      created_at: new Date().toISOString()
    });
    store.setRecordings(recordings);

    const steps = store.getSteps();
    storedTests.forEach((t, i) => {
      steps.push({
        id: `${recId}-step-${i + 1}`,
        recording_id: recId,
        test_case_id: t.id,
        step_number: i + 1,
        action_type: t.test_type,
        action_description: t.description || t.test_name,
        screenshot_url: t.screenshot_url,
        expected_result: t.expected_result,
        actual_result: t.status === "passed" ? t.expected_result : t.error_message,
        status: t.status,
        execution_time: t.execution_time
      });
    });
    store.setSteps(steps);

    // Insights
    const insights = store.getInsights();
    const newInsights = generateInsights({ url, tests: storedTests }).map((x, idx) => ({
      id: `${testRunId}-ins-${idx + 1}`,
      test_run_id: testRunId,
      ...x
    }));
    store.setInsights(insights.concat(newInsights));

    // Finalize run
    const runsFinal = store.getRuns();
    const run = runsFinal.find(r => r.id === testRunId);
    if (run) {
      run.status = "completed";
      run.total_tests = storedTests.length;
      run.passed_tests = passedCount;
      run.failed_tests = failedCount;
      run.execution_time = totalTime;
      run.completed_at = new Date().toISOString();
      store.setRuns(runsFinal);
    }
    progressByRunId.set(testRunId, {
      total: storedTests.length,
      passed: passedCount,
      failed: failedCount,
      pending: 0,
      status: "completed",
      currentTest: "",
      browser, framework, headless
    });
  } catch (err) {
    const runsFinal = store.getRuns();
    const run = runsFinal.find(r => r.id === testRunId);
    if (run) {
      run.status = "failed";
      run.completed_at = new Date().toISOString();
      store.setRuns(runsFinal);
    }
    progressByRunId.set(testRunId, {
      total: 0, passed: 0, failed: 0, pending: 0, status: "failed", currentTest: ""
    });
    // eslint-disable-next-line no-console
    console.error("Run failed", err?.message || err);
  }
});

app.get("/api/progress/:runId", (req, res) => {
  const runId = req.params.runId;
  const prog = progressByRunId.get(runId);
  if (!prog) return res.status(404).json({ error: "Not found" });
  res.json(prog);
});

app.get("/api/test_runs", (_req, res) => {
  res.json(store.getRuns());
});
app.get("/api/test_runs/:id", (req, res) => {
  const run = store.getRuns().find(r => r.id === req.params.id);
  if (!run) return res.status(404).json({ error: "Not found" });
  res.json(run);
});

app.get("/api/test_cases", (req, res) => {
  const runId = req.query.test_run_id;
  const all = store.getCases();
  res.json(runId ? all.filter(c => c.test_run_id === runId) : all);
});
app.get("/api/test_insights", (req, res) => {
  const runId = req.query.test_run_id;
  const all = store.getInsights();
  res.json(runId ? all.filter(c => c.test_run_id === runId) : all);
});
app.get("/api/test_recordings", (req, res) => {
  const runId = req.query.test_run_id;
  const all = store.getRecordings();
  res.json(runId ? all.filter(c => c.test_run_id === runId) : all);
});
app.get("/api/test_recording_steps", (req, res) => {
  const recId = req.query.recording_id;
  const all = store.getSteps();
  res.json(recId ? all.filter(c => c.recording_id === recId) : all);
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] Agentic backend listening on http://localhost:${port}`);
});




