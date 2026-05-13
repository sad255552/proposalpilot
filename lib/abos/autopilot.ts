import { POST as generateAssets } from "@/app/api/abos/assets/generate/route";
import { POST as generateReport } from "@/app/api/abos/report/route";
import { POST as runAbos } from "@/app/api/abos/run/route";
import { POST as scanMarket } from "@/app/api/abos/scan/route";
import { errorMessage } from "@/lib/abos/db";

type JsonObject = Record<string, unknown>;

export type AutopilotResult = {
  success: boolean;
  opportunities_created: number;
  run_id: string | null;
  tasks_created: number;
  report_id: string | null;
  assets_created: number;
  warnings: string[];
  error?: string;
  step?: string;
};

async function responseJson(response: Response): Promise<JsonObject> {
  const payload = (await response.json()) as unknown;
  return typeof payload === "object" && payload !== null && !Array.isArray(payload) ? payload as JsonObject : {};
}

function arrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function collectWarnings(result: JsonObject, warnings: string[]) {
  if (Array.isArray(result.warnings)) {
    warnings.push(...result.warnings.map((warning) => String(warning)));
  }
}

async function runStep(name: string, action: () => Promise<Response>, warnings: string[]) {
  const response = await action();
  const json = await responseJson(response);
  collectWarnings(json, warnings);

  if (!response.ok) {
    throw new Error(`${name} failed: ${String(json.error || response.statusText || "Unknown error")}`);
  }

  return json;
}

export async function runAbosAutopilot(): Promise<AutopilotResult> {
  const warnings: string[] = [];
  const result: AutopilotResult = {
    success: false,
    opportunities_created: 0,
    run_id: null,
    tasks_created: 0,
    report_id: null,
    assets_created: 0,
    warnings
  };

  try {
    const scan = await runStep("Scan market", scanMarket, warnings);
    result.opportunities_created = arrayCount(scan.opportunities);

    const run = await runStep("Run ABOS", runAbos, warnings);
    const runRow = typeof run.run === "object" && run.run !== null ? run.run as JsonObject : {};
    result.run_id = typeof runRow.id === "string" ? runRow.id : null;
    result.tasks_created += arrayCount(run.tasks);

    const report = await runStep("Generate report", generateReport, warnings);
    const reportRow = typeof report.report === "object" && report.report !== null ? report.report as JsonObject : {};
    result.report_id = typeof reportRow.id === "string" ? reportRow.id : null;

    const assets = await runStep("Generate SaaS assets", generateAssets, warnings);
    result.assets_created = arrayCount(assets.assets);
    result.tasks_created += arrayCount(assets.tasks);

    result.success = true;
    return result;
  } catch (error) {
    return {
      ...result,
      success: false,
      error: errorMessage(error, "Autopilot failed.")
    };
  }
}
