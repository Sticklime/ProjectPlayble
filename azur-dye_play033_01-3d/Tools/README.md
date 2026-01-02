# Tools

Development tools for MRAID Creative Template 3D project.

## Overview

This directory contains automation tools for asset management and optimization:

- **AssetEnumerator** - Scans project directories and updates asset configuration
- **AssetKeeperGenerator** - Generates type-safe asset accessors
- **ImageCompressor** - Compresses and optimizes image files
- **ModelCompressor** - Compresses and optimizes 3D model files

## Quick Start

Install dependencies:
```bash
npm install
```

Run all tools:
```bash
npm run update-assets            # Update asset configuration
npm run generate-asset-keeper    # Generate asset accessors
npm run compress-images          # Compress images
npm run compress-models          # Compress 3D models
```

## Tools

### AssetEnumerator
Automatically scans project folders (Images, Data, Sounds, Fonts) and updates the Assets section in `Settings/default.json`.

**Features:**
- Automatic asset discovery
- Compressed file prioritization
- Priority asset ordering
- JSON comment preservation

[Read more →](AssetEnumerator/GUIDE.md)

### AssetKeeperGenerator
Generates `App/Generated/AssetKeeper.ts` with type-safe getters for image and 3D model assets.

**Features:**
- Type-safe asset access
- Automatic TypeScript generation
- Fallback handling

### ImageCompressor
Compresses images in the Images directory using Sharp library.

**Features:**
- Automatic transparency detection
- Format conversion (WebP, PNG, JPEG)
- Configurable quality settings
- Size constraints

[Read more →](ImageCompressor/GUIDE.md)

### ModelCompressor
Compresses GLB/GLTF files in the Data directory using glTF-Transform.

**Features:**
- Draco geometry compression
- Texture optimization
- Anchor point extraction
- Multiple optimization methods

[Read more →](ModelCompressor/GUIDE.md)

## Configuration

Each tool uses its own configuration file:

- `ImageCompressor/config.json` - Image compression settings
- `ModelCompressor/config.json` - 3D model compression settings

Configuration files include JSON schema validation for type safety.

## Project Structure

```
Tools/
├── AssetEnumerator/
│   ├── AssetEnumerator.js
│   └── GUIDE.md
├── AssetKeeperGenerator/
│   └── AssetKeeperGenerator.js
├── ImageCompressor/
│   ├── ImageCompressor.js
│   ├── config.json
│   ├── config.schema.json
│   └── GUIDE.md
└── ModelCompressor/
    ├── ModelCompressor.js
    ├── config.json
    ├── config.schema.json
    └── GUIDE.md
```

## Workflow

Typical development workflow:

1. Add new assets to project folders (Images, Data, Sounds, Fonts)
2. Run `npm run compress-images` to optimize images
3. Run `npm run compress-models` to optimize 3D models
4. Run `npm run update-assets` to update configuration
5. Run `npm run generate-asset-keeper` to generate type-safe accessors

## Dependencies

- **sharp** - Image processing
- **@gltf-transform/core** - 3D model processing
- **prettier** - Code formatting
- **jsonc-parser** - JSON with comments parsing
