# Mercury Icons

## Install

```bash
npm install mercury-icons
```

## Use

### React Components

```jsx
import { ArrowDown24, Heart20, Star16 } from "mercury-icons";

function App() {
  return (
    <div>
      <ArrowDown24 color="#ff0000" />
      <Heart20 />
      <Star16 color="#gold" />
    </div>
  );
}
```

### SVG Strings

```javascript
import { ArrowDown24Svg, Heart20Svg } from "mercury-icons";

const svgString = ArrowDown24Svg({ color: "#ff0000" });
document.body.innerHTML = svgString;
```

## Props

- `color`: string (default: '#FAFBFB') - _disabled for colorful icons_
- `className`: string
- `style`: object

## Colorful Icons

Icons starting with `colorful-` (like flags, social media) keep their original colors and don't accept the `color` prop

## For Designers: Updating Icons

When you have new or updated icons to add to the package:

1. **Replace the all-icons folder:**

   - Delete the existing `all-icons/` folder
   - Place your updated `all-icons/` folder in the project root

2. **Rebuild and publish:**

   ```bash
   # For new icons (minor version update)
   npm run release:minor

   # For bug fixes (patch version update)
   npm run release:patch
   ```

## For Developers: Version Management

This package uses automated version management with semantic versioning (SemVer):

### Release Commands

```bash
# Patch release (1.0.0 → 1.0.1) - Bug fixes
npm run release:patch

# Minor release (1.0.0 → 1.1.0) - New icons, new features
npm run release:minor

# Major release (1.0.0 → 2.0.0) - Breaking changes
npm run release:major

# Pre-release versions
npm run release:beta   # 1.0.0 → 1.0.1-beta.0
npm run release:alpha  # 1.0.0 → 1.0.1-alpha.0
```

### Version Guidelines

- **Patch** (`1.0.0 → 1.0.1`): Bug fixes, documentation updates
- **Minor** (`1.0.0 → 1.1.0`): New icons, new features, backward compatible changes
- **Major** (`1.0.0 → 2.0.0`): Breaking changes, API changes, removing features

### Build Process

The build script automatically:

- Processes all SVG files in the `all-icons/` folder
- Generates React components and TypeScript definitions
- Creates ES modules and SVG string functions
- Handles colorful icons (preserves original colors)
- Updates all index files
- Supports tree-shaking

## License

MIT
