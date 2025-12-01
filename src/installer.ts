import * as os from "os";
import * as path from "path";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import * as restm from "typed-rest-client/RestClient";
import * as semver from "semver";

const TOOL_NAME = "bab";
const REPO_OWNER = "bab-sh";
const REPO_NAME = "bab";

interface BabRelease {
  tag_name: string;
  prerelease: boolean;
  draft: boolean;
}

interface InstallResult {
  version: string;
  path: string;
}

function getPlatform(): string {
  const platform = os.platform();
  switch (platform) {
    case "linux":
      return "Linux";
    case "darwin":
      return "macOS";
    case "win32":
      return "Windows";
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function getArch(): string {
  const arch = os.arch();
  switch (arch) {
    case "x64":
      return "x86_64";
    case "arm64":
      return "arm64";
    case "arm":
      return "armv7";
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }
}

function getExtension(): string {
  return os.platform() === "win32" ? "zip" : "tar.gz";
}

async function fetchVersions(repoToken: string): Promise<string[]> {
  const options = repoToken
    ? {
        headers: { Authorization: `Bearer ${repoToken}` },
      }
    : {};

  const rest = new restm.RestClient("setup-bab", "", [], options);

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=100`;
  const response = await rest.get<BabRelease[]>(url);

  if (!response.result) {
    throw new Error("Failed to fetch releases from GitHub API");
  }

  return response.result
    .filter((release) => !release.draft && !release.prerelease)
    .map((release) => release.tag_name.replace(/^v/, ""));
}

function normalizeVersion(version: string): string {
  const parts = version.split(".");

  while (parts.length < 3) {
    parts.push("0");
  }

  return parts.slice(0, 3).join(".");
}

async function resolveVersion(
  versionSpec: string,
  repoToken: string,
): Promise<string> {
  if (versionSpec === "latest" || versionSpec === "") {
    const versions = await fetchVersions(repoToken);
    if (versions.length === 0) {
      throw new Error("No releases found");
    }

    const sorted = versions
      .map((v) => ({ original: v, normalized: normalizeVersion(v) }))
      .filter((v) => semver.valid(v.normalized))
      .sort((a, b) => semver.rcompare(a.normalized, b.normalized));

    if (sorted.length === 0) {
      throw new Error("No valid semver releases found");
    }

    core.debug(`Resolved 'latest' to version ${sorted[0].original}`);
    return sorted[0].original;
  }

  let cleanVersion = versionSpec.startsWith("v")
    ? versionSpec.slice(1)
    : versionSpec;

  if (semver.valid(normalizeVersion(cleanVersion))) {
    const versions = await fetchVersions(repoToken);
    const exactMatch = versions.find((v) => v === cleanVersion);
    if (exactMatch) {
      core.debug(`Using exact version ${exactMatch}`);
      return exactMatch;
    }
  }

  if (cleanVersion.endsWith(".x")) {
    cleanVersion = cleanVersion.slice(0, -2);
  }

  const versions = await fetchVersions(repoToken);
  const matchingVersions = versions.filter((v) => v.startsWith(cleanVersion));

  if (matchingVersions.length === 0) {
    throw new Error(`No versions found matching ${versionSpec}`);
  }

  const sorted = matchingVersions
    .map((v) => ({ original: v, normalized: normalizeVersion(v) }))
    .filter((v) => semver.valid(v.normalized))
    .sort((a, b) => semver.rcompare(a.normalized, b.normalized));

  if (sorted.length === 0) {
    throw new Error(`No valid semver versions found matching ${versionSpec}`);
  }

  core.debug(`Resolved '${versionSpec}' to version ${sorted[0].original}`);
  return sorted[0].original;
}

function getDownloadUrl(version: string): string {
  const platform = getPlatform();
  const arch = getArch();
  const ext = getExtension();
  const filename = `${TOOL_NAME}_${version}_${platform}_${arch}.${ext}`;

  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v${version}/${filename}`;
}

async function downloadRelease(version: string): Promise<string> {
  const downloadUrl = getDownloadUrl(version);
  core.info(`Downloading bab from ${downloadUrl}`);

  let downloadPath: string;
  try {
    downloadPath = await tc.downloadTool(downloadUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to download bab ${version}: ${message}`);
  }

  let extractedPath: string;
  const ext = getExtension();

  if (ext === "zip") {
    extractedPath = await tc.extractZip(downloadPath);
  } else {
    extractedPath = await tc.extractTar(downloadPath);
  }

  const binDir = path.join(extractedPath, "bin");
  await io.mkdirP(binDir);

  const binaryName = os.platform() === "win32" ? "bab.exe" : "bab";
  const sourcePath = path.join(extractedPath, binaryName);
  const destPath = path.join(binDir, binaryName);

  try {
    await io.mv(sourcePath, destPath);
  } catch {
    core.debug(`Could not move binary, checking if it exists at ${destPath}`);
  }

  const cachedPath = await tc.cacheDir(extractedPath, TOOL_NAME, version);
  core.debug(`Cached bab at ${cachedPath}`);

  return cachedPath;
}

export async function getBab(
  versionSpec: string,
  repoToken: string,
): Promise<InstallResult> {
  const version = await resolveVersion(versionSpec, repoToken);
  core.info(`Installing bab v${version}`);

  let toolPath = tc.find(TOOL_NAME, version);

  if (toolPath) {
    core.info(`Found bab v${version} in tool cache`);
  } else {
    toolPath = await downloadRelease(version);
  }

  const binPath = path.join(toolPath, "bin");
  core.addPath(binPath);
  core.info(`Added ${binPath} to PATH`);

  return {
    version: `v${version}`,
    path: binPath,
  };
}
