#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const TARGETS = {
  "darwin-x64": "bun-darwin-x64",
  "darwin-arm64": "bun-darwin-arm64", 
  "linux-x64": "bun-linux-x64",
  "linux-arm64": "bun-linux-arm64",
  "windows-x64": "bun-windows-x64"
};

const currentPlatform = `${process.platform}-${process.arch}`;
const outDir = "dist/executables";

// Create output directory
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

async function buildExecutable(target) {
  const [platform, arch] = target.split("-");
  const ext = platform === "windows" ? ".exe" : "";
  const outputPath = join(outDir, `aci-${target}${ext}`);
  
  console.log(`Building for ${target}...`);
  
  try {
    // Add --external flag for optional dependencies that might not be installed
    await $`bun build src/cli.ts --compile --target=${TARGETS[target]} --outfile ${outputPath} --external react-devtools-core`;
    console.log(`✓ Built ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to build for ${target}:`, error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Build for current platform only
    console.log(`Building executable for current platform (${currentPlatform})...`);
    await buildExecutable(currentPlatform);
  } else if (args[0] === "--all") {
    // Build for all platforms
    console.log("Building executables for all platforms...");
    for (const target of Object.keys(TARGETS)) {
      await buildExecutable(target);
    }
  } else {
    // Build for specific targets
    for (const target of args) {
      if (TARGETS[target]) {
        await buildExecutable(target);
      } else {
        console.error(`Unknown target: ${target}`);
        console.log(`Available targets: ${Object.keys(TARGETS).join(", ")}`);
      }
    }
  }
}

main().catch(console.error);