/**
 * @fileoverview Navmesh generation utility
 * @description Generates navigation mesh from GLB files using recast-navigation
 */

const fs = require("fs");
const path = require("path");
const { NodeIO } = require("@gltf-transform/core");
const { ALL_EXTENSIONS } = require("@gltf-transform/extensions");
const { init, getNavMeshPositionsAndIndices } = require("recast-navigation");
const { generateSoloNavMesh } = require("recast-navigation/generators");

/**
 * Navmesh generator class
 * Processes GLB files and generates navigation mesh data using Recast Navigation
 */
class NavmeshGeneratorTool {
  /**
   * NavmeshGenerator constructor
   */
  constructor() {
    this.projectRoot = path.resolve(__dirname, "../..");
    this.dataDirectory = path.join(this.projectRoot, "Data");
    this.inputFile = process.argv[2] || "Navmesh.glb";
    this.outputFile =
      process.argv[3] || this.inputFile.replace(".glb", "_navmesh.glb");
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log("=== Navmesh Generator ===\n");

      const inputPath = path.join(this.dataDirectory, this.inputFile);
      const outputPath = path.join(this.dataDirectory, this.outputFile);

      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      console.log(`Input:  ${this.inputFile}`);
      console.log(`Output: ${this.outputFile}\n`);

      // Initialize recast-navigation
      console.log("Initializing Recast Navigation...");
      await init();

      await this.generateNavmesh(inputPath, outputPath);

      console.log("\n✓ Navmesh generation complete");
    } catch (error) {
      console.error("\n✗ Error:", error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  /**
   * Generate navmesh from GLB file
   * @param {string} inputPath - Input GLB file path
   * @param {string} outputPath - Output GLB file path
   */
  async generateNavmesh(inputPath, outputPath) {
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

    console.log("Loading model...");
    const document = await io.read(inputPath);

    const root = document.getRoot();
    const scene = root.getDefaultScene() || root.listScenes()[0];

    if (!scene) {
      throw new Error("No scene found in GLB file");
    }

    console.log("Extracting geometry...");

    // Collect all geometry from scene
    const positions = [];
    const indices = [];
    let vertexOffset = 0;

    const nodes = scene.listChildren();
    let totalVertices = 0;
    let totalTriangles = 0;

    for (const node of nodes) {
      const mesh = node.getMesh();
      if (!mesh) continue;

      const transform = this.getWorldTransform(node);

      for (const primitive of mesh.listPrimitives()) {
        const positionAccessor = primitive.getAttribute("POSITION");
        const indicesAccessor = primitive.getIndices();

        if (!positionAccessor || !indicesAccessor) continue;

        const posArray = positionAccessor.getArray();
        const indArray = indicesAccessor.getArray();

        // Transform and add vertices
        for (let i = 0; i < posArray.length; i += 3) {
          const x = posArray[i];
          const y = posArray[i + 1];
          const z = posArray[i + 2];

          // Apply transform
          const transformed = this.transformPoint(x, y, z, transform);
          positions.push(transformed[0], transformed[1], transformed[2]);
        }

        // Add indices with offset
        for (let i = 0; i < indArray.length; i++) {
          indices.push(indArray[i] + vertexOffset);
        }

        const vertexCount = posArray.length / 3;
        vertexOffset += vertexCount;
        totalVertices += vertexCount;
        totalTriangles += indArray.length / 3;

        console.log(
          `  ${node.getName()}: ${vertexCount} vertices, ${indArray.length / 3} triangles`,
        );
      }
    }

    console.log(
      `\nTotal geometry: ${totalVertices} vertices, ${totalTriangles} triangles`,
    );

    if (positions.length === 0 || indices.length === 0) {
      throw new Error("No valid geometry found in scene");
    }

    console.log("\nGenerating navmesh with Recast Navigation...");

    const cs = 0.25;
    const ch = 0.25;
    const minRegionArea = 60;

    // Configure navmesh parameters
    const navMeshGeneratorConfig = {
      cs, // cell size
      ch, // cell height
      walkableSlopeAngle: 45, // walkable slope angle in degrees
      walkableHeight: Math.ceil(4 / ch), // agent height
      walkableClimb: Math.ceil(0.25 / ch), // agent max climb
      walkableRadius: Math.ceil(0.5 / ch), // agent radius
      maxEdgeLen: Math.ceil(4 / cs), // max edge length
      maxSimplificationError: 1,
      minRegionArea, // min region area
      mergeRegionArea: minRegionArea * 1, // merge region area
      maxVertsPerPoly: 3, // max verts per poly
      detailSampleDist: 6,
      detailSampleMaxError: 1,
    };

    // Generate navmesh using generateSoloNavMesh
    const { success, navMesh } = generateSoloNavMesh(
      new Float32Array(positions),
      new Uint32Array(indices),
      navMeshGeneratorConfig,
    );

    if (!success || !navMesh) {
      throw new Error("Failed to generate navmesh with Recast Navigation");
    }

    console.log("Navmesh generated successfully!");

    // Export navmesh data using getNavMeshPositionsAndIndices
    const [navMeshVertices, navMeshIndices] =
      getNavMeshPositionsAndIndices(navMesh);

    console.log(`Navmesh vertices: ${navMeshVertices.length / 3}`);
    console.log(`Navmesh triangles: ${navMeshIndices.length / 3}`);

    // Create new document with navmesh geometry
    await this.createNavmeshGLB(
      outputPath,
      navMeshVertices,
      navMeshIndices,
      navMeshGeneratorConfig,
      io,
    );

    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;

    console.log(`\nInput size:  ${this.formatBytes(inputSize)}`);
    console.log(`Output size: ${this.formatBytes(outputSize)}`);
  }

  /**
   * Get world transform matrix for a node
   * @param {Object} node - GLTFTransform node
   * @returns {Array} 4x4 transform matrix
   */
  getWorldTransform(node) {
    const translation = node.getTranslation();
    const rotation = node.getRotation();
    const scale = node.getScale();

    // Simple identity matrix if no transform
    if (
      translation[0] === 0 &&
      translation[1] === 0 &&
      translation[2] === 0 &&
      rotation[0] === 0 &&
      rotation[1] === 0 &&
      rotation[2] === 0 &&
      rotation[3] === 1 &&
      scale[0] === 1 &&
      scale[1] === 1 &&
      scale[2] === 1
    ) {
      return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    // For simplicity, only handle translation
    // Full implementation would need quaternion to matrix conversion
    return [
      scale[0],
      0,
      0,
      0,
      0,
      scale[1],
      0,
      0,
      0,
      0,
      scale[2],
      0,
      translation[0],
      translation[1],
      translation[2],
      1,
    ];
  }

  /**
   * Transform point by matrix
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {Array} matrix - 4x4 transform matrix
   * @returns {Array} Transformed [x, y, z]
   */
  transformPoint(x, y, z, matrix) {
    return [
      x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12],
      x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13],
      x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14],
    ];
  }

  /**
   * Create GLB file with navmesh geometry
   * @param {string} outputPath - Output file path
   * @param {Float32Array} vertices - Navmesh vertices
   * @param {Uint32Array} indices - Navmesh indices
   * @param {Object} config - Navmesh generation config
   * @param {NodeIO} io - GLTFTransform IO instance
   */
  async createNavmeshGLB(outputPath, vertices, indices, config, io) {
    console.log("\nCreating navmesh GLB...");

    const { Document } = require("@gltf-transform/core");
    const document = new Document();
    const buffer = document.createBuffer();
    const scene = document.createScene("NavmeshScene");

    // Create accessors
    const positionAccessor = document
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array(vertices))
      .setBuffer(buffer);

    const indicesAccessor = document
      .createAccessor()
      .setType("SCALAR")
      .setArray(new Uint32Array(indices))
      .setBuffer(buffer);

    // Create primitive
    const primitive = document
      .createPrimitive()
      .setAttribute("POSITION", positionAccessor)
      .setIndices(indicesAccessor)
      .setMode(4); // TRIANGLES

    // Create mesh
    const mesh = document.createMesh("Navmesh").addPrimitive(primitive);

    // Create node
    const node = document.createNode("Navmesh").setMesh(mesh);

    // Add metadata
    node.setExtras({
      navmesh: true,
      generator: "NavmeshGenerator",
      recastNavigation: true,
      config: config,
      timestamp: new Date().toISOString(),
      stats: {
        vertices: vertices.length / 3,
        triangles: indices.length / 3,
      },
    });

    scene.addChild(node);
    document.getRoot().setDefaultScene(scene);

    await io.write(outputPath, document);
    console.log("Navmesh GLB created");
  }

  /**
   * Format bytes to human-readable format
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}

// Run the generator
const generator = new NavmeshGeneratorTool();
generator.run();
