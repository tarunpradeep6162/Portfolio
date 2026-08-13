/**
 * Stops only the CI-created preview server/container this phase's own
 * scripts started - never touches an unrelated process. Two modes:
 *   --pid-file <path>   kill the process whose PID is recorded in the file
 *                        (written by whichever script started `next start`)
 *   --compose <project>  `docker compose -p <project> down -v` for the
 *                        compose.ci.yml stack, identified by its unique
 *                        CI project name, never the default/unscoped one.
 */
import { readFileSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const pidFileIndex = args.indexOf("--pid-file");
const composeIndex = args.indexOf("--compose");

if (pidFileIndex !== -1) {
  const pidFile = args[pidFileIndex + 1];
  if (!existsSync(pidFile)) {
    console.log(`No pid file at ${pidFile} - nothing to clean up.`);
  } else {
    const pid = Number(readFileSync(pidFile, "utf8").trim());
    if (Number.isInteger(pid) && pid > 1) {
      try {
        process.kill(pid, "SIGTERM");
        console.log(`Sent SIGTERM to CI-owned process ${pid} (from ${pidFile}).`);
      } catch (err) {
        console.log(`Process ${pid} already gone (${err.code ?? err}).`);
      }
    }
    rmSync(pidFile, { force: true });
  }
}

if (composeIndex !== -1) {
  const projectName = args[composeIndex + 1];
  if (!projectName) {
    console.error("--compose requires a project name");
    process.exit(1);
  }
  execFileSync(
    "docker",
    ["compose", "-p", projectName, "-f", "compose.ci.yml", "down", "-v", "--remove-orphans"],
    { stdio: "inherit" },
  );
  console.log(`Tore down compose project "${projectName}".`);
}

if (pidFileIndex === -1 && composeIndex === -1) {
  console.log("Nothing to clean up (no --pid-file or --compose given).");
}
