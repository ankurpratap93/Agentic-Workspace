import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(dataDir);

const runsFile = path.join(dataDir, "test_runs.json");
const casesFile = path.join(dataDir, "test_cases.json");
const insightsFile = path.join(dataDir, "test_insights.json");
const recordingsFile = path.join(dataDir, "test_recordings.json");
const stepsFile = path.join(dataDir, "test_recording_steps.json");

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const text = fs.readFileSync(file, "utf-8");
    return JSON.parse(text || "[]");
  } catch {
    return fallback;
  }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export const store = {
  getRuns() { return readJson(runsFile, []); },
  setRuns(value) { writeJson(runsFile, value); },

  getCases() { return readJson(casesFile, []); },
  setCases(value) { writeJson(casesFile, value); },

  getInsights() { return readJson(insightsFile, []); },
  setInsights(value) { writeJson(insightsFile, value); },

  getRecordings() { return readJson(recordingsFile, []); },
  setRecordings(value) { writeJson(recordingsFile, value); },

  getSteps() { return readJson(stepsFile, []); },
  setSteps(value) { writeJson(stepsFile, value); },
};




