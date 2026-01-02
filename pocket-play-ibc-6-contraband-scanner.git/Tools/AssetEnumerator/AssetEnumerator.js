/**
 * @fileoverview Asset enumeration utility
 * @description Scans project directories for assets and updates Assets section in Settings/default.json
 */

const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const {
  parseTree,
  findNodeAtLocation,
  printParseErrorCode,
} = require("jsonc-parser");

/**
 * AssetUpdater handles asset discovery and configuration updates
 * @class
 */
class AssetEnumerator {
  /**
   * Creates AssetUpdater instance
   * @param {string} projectRoot - Project root directory path
   */
  constructor(projectRoot) {
    this.projectRoot = path.resolve(projectRoot);
    this.settingsPath = path.join(this.projectRoot, "Settings", "default.json");

    /**
     * File extension to asset type mapping
     * @type {Object.<string, string>}
     */
    this.assetTypes = {
      ".glb": "glb", // 3D model files
      ".mp3": "sound", // Audio files (MP3)
      ".wav": "sound", // Audio files (WAV)
      ".jpg": "image", // Image files (JPEG)
      ".jpeg": "image", // Image files (JPEG)
      ".png": "image", // Image files (PNG)
      ".webp": "image", // Image files (WebP)
      ".css": "web-font", // Font description files
    };

    /**
     * Folder name to allowed asset types mapping
     * @type {Object.<string, string[]>}
     */
    this.folders = {
      Images: ["image"], // Images folder contains image assets
      Data: ["glb"], // Data folder contains 3D model assets
      Sounds: ["sound"], // Sounds folder contains audio assets
      Fonts: ["web-font"], // Fonts folder contains font assets
    };

    /**
     * Order for asset types in configuration
     * @type {string[]}
     */
    this.assetOrder = ["image", "glb", "sound", "web-font"];

    /**
     * Asset keys that should appear first in configuration
     * @type {Set<string>}
     */
    this.priorityKeys = new Set([
      "background-loading",
      "banner-icon",
      "banner-star",
      "close-button",
      "icon",
      "logotype",
    ]);
  }

  /**
   * Main update method that scans assets and updates configuration
   * @async
   * @returns {Promise<void>}
   * @throws {Error} If file reading or writing fails
   */
  async update() {
    // Collect all assets from project directories
    const { priority, rest } = this.collectAssets();
    const combined = { ...priority, ...rest };

    // Read current settings file
    const raw = fs.readFileSync(this.settingsPath, "utf-8");

    // Replace Assets block while preserving comments
    const updatedRaw = this.replaceAssetsBlock(raw, combined);
    fs.writeFileSync(this.settingsPath, updatedRaw, "utf-8");
    console.log("✅ Assets updated in default.json (comments preserved)");

    // Format file with Prettier
    const prettierConfig = await prettier.resolveConfig(this.settingsPath);
    const formatted = await prettier.format(updatedRaw, {
      ...prettierConfig,
      filepath: this.settingsPath,
    });
    fs.writeFileSync(this.settingsPath, formatted, "utf8");
    console.log("✨ Format with Prettier.");
  }

  /**
   * Collects assets from project directories and organizes them
   * @returns {{priority: Object, rest: Object}} Separated priority and regular assets
   */
  collectAssets() {
    const all = new Map();
    let hasImagesGlb = false;

    // Scan each configured folder
    for (const [folder, allowedTypes] of Object.entries(this.folders)) {
      const absFolder = path.join(this.projectRoot, folder);
      if (!fs.existsSync(absFolder)) continue;

      const files = this.walkFiles(absFolder);
      for (const filePath of files) {
        const ext = path.extname(filePath).toLowerCase();
        const type = this.assetTypes[ext];

        // Skip if file type not recognized or not allowed in this folder
        if (!type || !allowedTypes.includes(type)) continue;

        // Create relative path with forward slashes
        const relPath = path
          .relative(this.projectRoot, filePath)
          .replace(/\\/g, "/");
        const baseName = path.basename(filePath, ext);

        // Check if Images.glb exists (contains all images as textures)
        if (type === "glb" && baseName === "Images") {
          hasImagesGlb = true;
        }

        // Handle compressed variants - prefer compressed over uncompressed
        const isCompressed = baseName.endsWith("_compressed");
        const key = isCompressed
          ? baseName.replace(/_compressed$/, "")
          : baseName;

        // Add to map if doesn't exist or if this is compressed version
        if (!all.has(key) || isCompressed) {
          all.set(key, { type, url: relPath });
        }
      }
    }

    // Separate priority assets from others
    const priority = {};
    const restEntries = [];

    for (const [key, value] of all.entries()) {
      if (this.priorityKeys.has(key)) {
        priority[key] = value;
      } else if (!(hasImagesGlb && value.type === "image")) {
        // Exclude individual images if Images.glb exists
        restEntries.push([key, value]);
      }
    }

    // Sort non-priority assets by type order, then alphabetically
    restEntries.sort(([k1, a1], [k2, a2]) => {
      const o1 = this.assetOrder.indexOf(a1.type);
      const o2 = this.assetOrder.indexOf(a2.type);
      if (o1 !== o2) return o1 - o2;
      return k1.localeCompare(k2);
    });

    const rest = Object.fromEntries(restEntries);

    return { priority, rest };
  }

  /**
   * Recursively walks directory and returns all file paths
   * @param {string} dir - Directory to walk
   * @returns {string[]} Array of absolute file paths
   */
  walkFiles(dir) {
    const out = [];
    const recurse = (folder) => {
      const entries = fs.readdirSync(folder, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) recurse(full);
        else out.push(full);
      }
    };
    recurse(dir);
    return out;
  }

  /**
   * Replaces Assets block in JSON while preserving comments
   * @param {string} raw - Original settings file content
   * @param {Object} newAssets - New assets object to insert
   * @returns {string} Updated file content with new assets
   * @throws {Error} If parsing fails or Assets section not found
   */
  replaceAssetsBlock(raw, newAssets) {
    const errors = [];
    // Parse as JSONC to handle comments
    const root = parseTree(raw, errors, { allowTrailingComma: true });

    if (errors.length > 0) {
      for (const err of errors) {
        console.error("❌ Parsing error:", printParseErrorCode(err.error));
      }
      process.exit(1);
    }

    // Find Assets node in JSON tree
    const node = findNodeAtLocation(root, ["Assets"]);
    if (!node) {
      console.error("❌ Cannot find `Assets` in default.json");
      process.exit(1);
    }

    // Replace only Assets value, preserving everything else
    const start = node.offset;
    const end = node.offset + node.length;
    const json = JSON.stringify(newAssets, null, 2);
    const before = raw.slice(0, start);
    const after = raw.slice(end);
    return before + json + after;
  }
}

const updater = new AssetEnumerator(path.join(__dirname, "../.."));
updater.update().catch(console.error);
