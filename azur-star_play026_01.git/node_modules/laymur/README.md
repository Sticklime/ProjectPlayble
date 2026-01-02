<p align="center">
  <h1 align="center">Laymur</h1>
  <p align="center">
      A constraint-based UI library for Three.js mobile advertisements
  </p>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/laymur"><img src="https://img.shields.io/npm/v/laymur.svg" alt="npm version"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-%5E5.8.0-blue" alt="TypeScript"></a>
<a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-%5E0.175.0-green" alt="Three.js"></a>
</p>

⚠️ **Early Alpha / Work in Progress** ⚠️

This library is in early development. APIs may change.

## What it does

A compact UI library designed for Three.js mobile advertisements where bundle size matters. Uses constraint-based positioning to handle responsive layouts across different screen sizes and orientations.

- 📱 Constraint-based layout system
- 🖼️ Basic UI elements (images, text, progress bars)
- 📐 Responsive design for mobile ads
- 🎯 Lightweight animations
- 📦 TypeScript support

Originally built for mobile ad development scenarios where you need to keep the bundle small while supporting various screen configurations.

## Installation

```bash
npm install laymur
```

Requires Three.js ^0.175.0 as a peer dependency.

## Quick Example

```typescript
import { UIFullscreenLayer, UIImage, UIText, UIWidthConstraint } from 'laymur';
import { WebGLRenderer, TextureLoader, Clock } from 'three';

const renderer = new WebGLRenderer();
const layer = new UIFullscreenLayer(1920, 1920);
const clock = new Clock();

const texture = new TextureLoader().load('background.jpg');
const background = new UIImage(layer, texture, { x: 0, y: 0 });
const title = new UIText(layer, 'Mobile Ad Title', {
  x: 100,
  y: 100,
  maxWidth: 800
});

function animate() {
  layer.render(renderer, clock.getDelta());
  requestAnimationFrame(animate);
}

animate();
```

## Basic Components

### Layers
- **UIFullscreenLayer** - Handles browser window scaling
- **UILayer** - Base layer for custom setups

### Elements
- **UIImage** - Display textures
- **UIText** - Text rendering with word wrapping
- **UIScene** - Embed 3D scenes
- **UIProgress** - Progress bars
- **UINineSline** - Scalable UI panels
- **UIAnchor** - Positioning points

### Constraints
- **UIWidthConstraint** / **UIHeightConstraint** - Fixed sizes
- **UIAspectConstraint** - Maintain aspect ratios
- **UIHorizontalDistanceConstraint** / **UIVerticalDistanceConstraint** - Spacing
- **UIHorizontalProportionConstraint** / **UIVerticalProportionConstraint** - Proportional sizing

## Constraint Layout

The constraint system automatically calculates positions and sizes based on relationships you define:

```typescript
import { UIImage, UIHorizontalDistanceConstraint, UIWidthConstraint } from 'laymur';

const sidebar = new UIImage(layer, sidebarTexture, { x: 0, y: 0 });
const content = new UIImage(layer, contentTexture, { x: 0, y: 0 });

// Fixed sidebar width
new UIWidthConstraint(sidebar, { width: 300 });

// 20px spacing between sidebar and content
new UIHorizontalDistanceConstraint(sidebar, content, {
  distance: 20,
  anchorA: 1.0,  // Right edge of sidebar
  anchorB: 0.0   // Left edge of content
});
```

## Responsive Design

Handle different orientations:

```typescript
import { UIOrientation } from 'laymur';

// Different widths for landscape vs portrait
new UIWidthConstraint(sidebar, {
  width: 300,
  orientation: UIOrientation.HORIZONTAL
});

new UIWidthConstraint(sidebar, {
  width: 200,
  orientation: UIOrientation.VERTICAL
});
```

## Text Rendering

```typescript
import { UIText } from 'laymur';

const text = new UIText(layer, [
  { text: 'Download ', style: { fontSize: 24, color: '#333333' } },
  { text: 'Now!', style: { fontSize: 32, color: '#ff0000', fontWeight: 'bold' } }
], {
  maxWidth: 600,
  padding: { top: 10, left: 10, right: 10, bottom: 10 }
});
```

## Micro-Transformations

Apply lightweight animations without affecting the constraint layout:

```typescript
const element = new UIImage(layer, texture);

// Apply transformations for animations
element.micro.x = 10;
element.micro.scaleX = 1.2;
element.micro.rotation = 0.1;
element.micro.anchorX = 0.5;

// Reset transformations
element.micro.reset();
```

## Event Handling

```typescript
import { UIInputEvent, UIMode } from 'laymur';

const button = new UIImage(layer, buttonTexture);
button.mode = UIMode.INTERACTIVE;

button.on(UIInputEvent.CLICK, (x, y, element) => {
  console.log('Button clicked');
});
```

## Live Examples

🎮 **[Live Examples](https://jango-git.github.io/laymur/)** - See constraint-based layouts and responsive components in action.

## Addons

### laymur-animations

Animation library built on GSAP for common UI effects:

- **GitHub**: [https://github.com/jango-git/laymur-animations](https://github.com/jango-git/laymur-animations)
- **NPM**: [https://www.npmjs.com/package/laymur-animations](https://www.npmjs.com/package/laymur-animations)

## Notes

- This was built specifically for mobile ad development where bundle size is important
- The constraint solver is based on Cassowary algorithm via Kiwi.js
- Currently in alpha - expect API changes
- Works best for relatively simple UI layouts

## License

MIT © [jango](https://github.com/jango-git)

Uses [Kiwi.js](https://github.com/lume/kiwi) (BSD-3-Clause) for constraint solving and [Three.js](https://threejs.org/) (MIT) for 3D rendering.
