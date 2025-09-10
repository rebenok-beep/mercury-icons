import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the generated index.js to get all available icons
const indexPath = path.join(__dirname, "..", "dist", "index.js");
const indexContent = await fs.readFile(indexPath, "utf8");

// Extract all icon exports
const iconExports = indexContent
  .split("\n")
  .filter((line) => line.includes("export {") && line.includes("Svg }"))
  .map((line) => {
    const match = line.match(/export \{ (\w+) as (\w+) \}/);
    if (match) {
      return {
        originalName: match[1],
        exportName: match[2],
      };
    }
    return null;
  })
  .filter(Boolean);

// Group icons by name
const iconGroups = {};
iconExports.forEach(({ originalName, exportName }) => {
  // Extract base name and size from export name (e.g., "ArrowDown24Svg" -> "ArrowDown", "24")
  const match = exportName.match(/^(.+?)(\d+)Svg$/);
  if (match) {
    const [, baseName, size] = match;
    if (!iconGroups[baseName]) {
      iconGroups[baseName] = { sizes: [], exports: [] };
    }
    iconGroups[baseName].sizes.push(parseInt(size));
    iconGroups[baseName].exports.push({
      size: parseInt(size),
      exportName,
      originalName,
    });
  }
});

// Sort sizes and exports
Object.keys(iconGroups).forEach((name) => {
  iconGroups[name].sizes.sort((a, b) => a - b);
  iconGroups[name].exports.sort((a, b) => a.size - b.size);
});

// Generate import statements
const importStatements = iconExports
  .map(({ exportName }) => exportName)
  .join(",\n  ");

// Generate icon data
const iconDataEntries = Object.keys(iconGroups)
  .sort()
  .map((name) => {
    const group = iconGroups[name];
    const functionNames = group.exports.map((exp) => exp.exportName);
    return `  { name: '${name}', sizes: [${group.sizes.join(
      ", "
    )}], functions: [${functionNames.join(", ")}] }`;
  })
  .join(",\n");

// Generate the demo HTML
const demoHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mercury Icons Demo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            color: #333;
            line-height: 1.6;
        }

        .header {
            background: white;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }

        .header h1 {
            color: #2c3e50;
            margin-bottom: 0.5rem;
        }

        .header p {
            color: #7f8c8d;
            font-size: 1.1rem;
        }

        .controls {
            background: white;
            padding: 1.5rem;
            margin: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .control-group {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .control-group label {
            font-weight: 600;
            color: #2c3e50;
        }

        .control-group input, .control-group select {
            padding: 0.5rem;
            border: 2px solid #e1e8ed;
            border-radius: 4px;
            font-size: 1rem;
        }

        .control-group input:focus, .control-group select:focus {
            outline: none;
            border-color: #3498db;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
        }

        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .icon-card {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            text-align: center;
        }

        .icon-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .icon-preview {
            width: 48px;
            height: 48px;
            margin: 0 auto 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border-radius: 6px;
        }

        .icon-name {
            font-size: 0.9rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 0.25rem;
        }

        .icon-size {
            font-size: 0.8rem;
            color: #7f8c8d;
        }

        .search-box {
            flex: 1;
            min-width: 200px;
        }

        .size-selector {
            min-width: 100px;
        }

        .color-input {
            width: 60px;
            height: 40px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .stats {
            background: white;
            padding: 1rem;
            margin: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }

        .stats h3 {
            color: #2c3e50;
            margin-bottom: 0.5rem;
        }

        .no-results {
            text-align: center;
            padding: 3rem;
            color: #7f8c8d;
            font-size: 1.1rem;
        }

        .loading {
            text-align: center;
            padding: 2rem;
            color: #7f8c8d;
        }

        @media (max-width: 768px) {
            .icon-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
            
            .control-group {
                flex-direction: column;
                align-items: stretch;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Mercury Icons</h1>
        <p>Visual icon library with ${
          Object.keys(iconGroups).length
        } icons in 3 sizes</p>
    </div>

    <div class="controls">
        <div class="control-group">
            <label for="search">Search:</label>
            <input type="text" id="search" class="search-box" placeholder="Search icons by name...">
            
            <label for="size">Size:</label>
            <select id="size" class="size-selector">
                <option value="all">All Sizes</option>
                <option value="16">16px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
            </select>
            
            <label for="color">Color:</label>
            <input type="color" id="color" class="color-input" value="#FAFBFB">
        </div>
    </div>

    <div class="stats">
        <h3 id="stats">Loading icons...</h3>
    </div>

    <div class="container">
        <div id="loading" class="loading">Loading icons...</div>
        <div id="iconGrid" class="icon-grid" style="display: none;"></div>
        <div id="noResults" class="no-results" style="display: none;">
            No icons found matching your search criteria.
        </div>
    </div>

    <script type="module">
        // Import all icon functions
        import { 
          ${importStatements}
        } from '../dist/index.js';

        // Icon data
        const iconData = [
${iconDataEntries}
        ];

        let allIcons = [];
        let filteredIcons = [];

        // DOM elements
        const searchInput = document.getElementById('search');
        const sizeSelect = document.getElementById('size');
        const colorInput = document.getElementById('color');
        const iconGrid = document.getElementById('iconGrid');
        const loading = document.getElementById('loading');
        const noResults = document.getElementById('noResults');
        const stats = document.getElementById('stats');

        // Generate all icon combinations
        function generateAllIcons() {
            allIcons = [];
            iconData.forEach(icon => {
                icon.sizes.forEach((size, index) => {
                    allIcons.push({
                        name: icon.name,
                        size: size,
                        function: icon.functions[index],
                        displayName: \`\${icon.name}\${size}\`
                    });
                });
            });
            filteredIcons = [...allIcons];
            updateStats();
        }

        // Filter icons based on search and size
        function filterIcons() {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedSize = sizeSelect.value;
            
            filteredIcons = allIcons.filter(icon => {
                const matchesSearch = icon.name.toLowerCase().includes(searchTerm);
                const matchesSize = selectedSize === 'all' || icon.size.toString() === selectedSize;
                return matchesSearch && matchesSize;
            });
            
            updateStats();
            renderIcons();
        }

        // Update statistics
        function updateStats() {
            const total = allIcons.length;
            const showing = filteredIcons.length;
            stats.textContent = \`Showing \${showing} of \${total} icons\`;
        }

        // Render icons to the grid
        function renderIcons() {
            if (filteredIcons.length === 0) {
                iconGrid.style.display = 'none';
                noResults.style.display = 'block';
                return;
            }

            noResults.style.display = 'none';
            iconGrid.style.display = 'grid';
            
            const color = colorInput.value;
            iconGrid.innerHTML = filteredIcons.map(icon => {
                const svgString = icon.function({ color });
                return \`
                    <div class="icon-card">
                        <div class="icon-preview">
                            \${svgString}
                        </div>
                        <div class="icon-name">\${icon.displayName}</div>
                        <div class="icon-size">\${icon.size}px</div>
                    </div>
                \`;
            }).join('');
        }

        // Event listeners
        searchInput.addEventListener('input', filterIcons);
        sizeSelect.addEventListener('change', filterIcons);
        colorInput.addEventListener('input', renderIcons);

        // Initialize
        generateAllIcons();
        renderIcons();
        loading.style.display = 'none';
    </script>
</body>
</html>`;

// Write the demo file
const demoPath = path.join(__dirname, "..", "demo", "index.html");
await fs.writeFile(demoPath, demoHTML);

console.log(`✅ Generated demo with ${Object.keys(iconGroups).length} icons`);
console.log(`📁 Demo saved to: ${demoPath}`);
console.log(`🌐 Open demo/index.html in your browser to see all icons!`);
