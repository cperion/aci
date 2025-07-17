#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const outDir = "dist/executables";

// Create output directory
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

async function main() {
  const platform = process.platform;
  const arch = process.arch;
  const ext = platform === "win32" ? ".exe" : "";
  const outputPath = join(outDir, `aci-${platform}-${arch}${ext}`);
  
  console.log(`Building standalone executable for ${platform}-${arch}...`);
  
  try {
    // Use simpler approach without specifying target
    await $`bun build ./src/cli.ts --compile --outfile ${outputPath}`;
    console.log(`✓ Built ${outputPath}`);
    
    // Make it executable on Unix-like systems
    if (platform !== "win32") {
      await $`chmod +x ${outputPath}`;
    }
    
    console.log(`\nTo use the executable:`);
    console.log(`  ${outputPath} --help`);
  } catch (error) {
    console.error(`✗ Failed to build:`, error.message);
    console.error("\nTrying with bundling first...");
    
    // Alternative approach: bundle first, then compile
    try {
      const bundlePath = join(outDir, "aci-bundle.js");
      await $`bun build ./src/cli.ts --outdir ${outDir} --outfile aci-bundle.js --target node`;
      await $`bun build ${bundlePath} --compile --outfile ${outputPath}`;
      
      if (platform !== "win32") {
        await $`chmod +x ${outputPath}`;
      }
      
      console.log(`✓ Built ${outputPath} (via bundle)`);
    } catch (bundleError) {
      console.error(`✗ Bundle approach also failed:`, bundleError.message);
      console.error("\nNote: The ArcGIS REST JS packages have some compatibility issues with Bun's bundler.");
      console.error("Consider using the regular build process for now: bun run build");
    }
  }
}

main().catch(console.error);