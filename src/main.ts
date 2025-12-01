import * as core from "@actions/core";
import * as installer from "./installer";

async function run(): Promise<void> {
  try {
    const version = core.getInput("version") || "latest";
    const repoToken = core.getInput("repo-token");

    core.info(`Setting up bab version: ${version}`);

    const result = await installer.getBab(version, repoToken);

    core.setOutput("version", result.version);
    core.setOutput("path", result.path);

    core.info(`Successfully installed bab ${result.version}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unexpected error occurred");
    }
  }
}

run();
