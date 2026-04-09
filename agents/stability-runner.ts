import { spawn } from "child_process";

const MODELS = [
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-v3.2",
  "mistralai/mistral-large-2512",
  "x-ai/grok-4.20-beta",
  "anthropic/claude-3.7-sonnet"
];

async function runBenchmark(model: string) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Starting Stability Benchmark for ${model}...`);
    const cmd = `bun run --env-file agents/.env agents/run-benchmark.ts --model=${model} --runs=100 --tag=Stability --delay=1200`;
    const child = spawn(cmd, { stdio: "inherit", shell: true });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`>>> Finished ${model} successfully.`);
        resolve(true);
      } else {
        console.warn(`>>> ${model} failed with code ${code}.`);
        resolve(false);
      }
    });
  });
}

async function main() {
  for (const model of MODELS) {
    await runBenchmark(model);
    console.log("Waiting 5s before next model...");
    await new Promise(r => setTimeout(r, 5000));
  }
}

main().catch(console.error);
