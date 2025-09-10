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

2. **Rebuild the package:**

   ```bash
   npm run build
   ```

3. **Publish the update:**
   ```bash
   npm publish
   ```

The build script automatically:

- Processes all SVG files in the `all-icons/` folder
- Generates React components and TypeScript definitions
- Creates multiple output formats (CommonJS, ES Modules)
- Handles colorful icons (preserves original colors)
- Updates all index files

## License

MIT
