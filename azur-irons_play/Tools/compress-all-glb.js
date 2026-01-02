#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

const textureSize = process.argv.includes("--texture")
  ? parseInt(process.argv[process.argv.indexOf("--texture") + 1], 10)
  : 512;

const dataDir = path.resolve(__dirname, "../Data");

function walkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fileList = [];
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      fileList = fileList.concat(walkDir(fullPath));
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const glbFiles = walkDir(dataDir).filter((filePath) => {
  const fileName = path.basename(filePath);
  return fileName.endsWith(".glb") && !fileName.endsWith("_compressed.glb");
});

if (glbFiles.length === 0) {
  console.log("No uncompressed .glb files found in /Data");
  process.exit(0);
}

const npxCmd = os.platform() === "win32" ? "npx.cmd" : "npx";

for (const filePath of glbFiles) {
  const inputFile = filePath;
  const dirName = path.dirname(inputFile);
  const baseName = path.basename(filePath, ".glb");
  const outputFile = path.join(dirName, `${baseName}_compressed.glb`);

  const args = [
    "gltf-transform",
    "optimize",
    inputFile,
    outputFile,
    "--compress",
    "draco",
    "--instance-min",
    "2",
    "--texture-compress",
    "avif",
    "--texture-size",
    String(textureSize),
  ];

  const command = `npx gltf-transform optimize "${inputFile}" "${outputFile}" \
    --compress draco --instance-min 2 --texture-compress avif --texture-size ${textureSize}`;

  try {
    execSync(command, { stdio: "inherit", shell: true });
    console.log(`✅ Saved: ${path.basename(outputFile)}`);
  } catch (error) {
    console.error(
      `❌ Failed: ${path.relative(dataDir, filePath)}, ${error.message}`,
    );
  }
}
