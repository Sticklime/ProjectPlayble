# AssetEnumerator Guide

## Overview

`AssetEnumerator.js` updates the Assets section in `Settings/default.json` by scanning project directories for resources (images, 3D models, sounds, fonts).

## Features

- Asset discovery from project directories
- Folder-based organization  
- Compressed file prioritization (_compressed suffix)
- Prettier formatting
- Priority asset ordering

## Usage

### Command Line

```bash
npm run update-assets
```

## Directory Structure

Expected project folder structure:

```
project/
├── Images/          # Images (.jpg, .jpeg, .png, .webp)
├── Data/            # 3D models (.glb)
├── Sounds/          # Audio files (.mp3, .wav)
├── Fonts/           # Fonts (.css)
└── Settings/
    └── default.json # Configuration file
```

## Priority Assets

These assets are always placed first in the Assets section:

- `background-loading`
- `banner-icon`
- `banner-star`
- `close-button`
- `icon`
- `logotype`

## How It Works

### Compressed File Handling

If both files exist:
- `texture.png`
- `texture_compressed.png`

Only the compressed version is included in configuration.

### Images.glb Special Handling

If `Images.glb` exists in the Data folder (containing all images as textures), individual image files from the Images folder are excluded from configuration.

### Asset Sorting

Assets are sorted in this order:
1. Priority assets (in defined order)
2. Other assets by type: images → 3D models → sounds → fonts
3. Within each type - alphabetically

## Output Format

```json
{
  "Assets": {
    "background-loading": {
      "type": "image",
      "url": "Images/background-loading.png"
    },
    "close-button": {
      "type": "image",
      "url": "Images/close-button_compressed.png"
    },
    "character": {
      "type": "glb",
      "url": "Data/character_compressed.glb"
    },
    "click-sound": {
      "type": "sound",
      "url": "Sounds/click-sound.mp3"
    },
    "main-font": {
      "type": "web-font",
      "url": "Fonts/main-font.css"
    }
  }
}
```

## Error Handling

The tool will exit with error code if:

1. **JSON parsing error** - `default.json` contains syntax errors
2. **Missing Assets section** - configuration lacks "Assets" section
3. **File access error** - unable to read/write files

## Best Practices

1. **Regular execution** - run after adding new assets
2. **File naming** - use clear names without special characters
3. **Asset compression** - add `_compressed` suffix to optimized files
4. **Backup** - tool overwrites `default.json`

## Troubleshooting

### Asset not appearing in configuration

**Check:**
1. File is in correct folder
2. File extension is supported
3. Filename contains no invalid characters

### Supported file extensions

- **Images**: .jpg, .jpeg, .png, .webp
- **3D Models**: .glb  
- **Audio**: .mp3, .wav
- **Fonts**: .css
