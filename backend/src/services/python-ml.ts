import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AllergyCategory } from "@clearaller/shared";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

export type PythonMlSignal = {
  ingredient: string;
  categories: AllergyCategory[];
  confidence: number;
  source: "classifier";
};

function resolvePythonPath() {
  return process.env.ML_PYTHON_PATH || (process.platform === "win32" ? "python.exe" : "python3");
}

function resolvePredictScript() {
  return resolve(repoRoot, "ml", "src", "predict.py");
}

function resolveModelPath() {
  return resolve(repoRoot, "ml", "artifacts", "logistic_ingredient_model.joblib");
}

export function hasPythonMlModel() {
  return existsSync(resolvePredictScript()) && existsSync(resolveModelPath());
}

export async function inferPythonMlSignals(ingredients: string[]): Promise<PythonMlSignal[]> {
  if (!hasPythonMlModel()) {
    return [];
  }

  const payload = JSON.stringify({ ingredients, model_path: resolveModelPath() });
  const { stdout } = await execFileAsync(resolvePythonPath(), [resolvePredictScript(), payload], {
    maxBuffer: 1024 * 1024,
    encoding: "utf8"
  });

  const parsed = JSON.parse(stdout) as { signals?: PythonMlSignal[]; status?: string };
  return parsed.signals ?? [];
}
