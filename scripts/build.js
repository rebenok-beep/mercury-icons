#!/usr/bin/env node

import fs from "fs-extra";
import { glob } from "glob";
import path from "path";
import { fileURLToPath } from "url";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const iconsDir = path.join(projectRoot, "all-icons");
const distDir = path.join(projectRoot, "dist");

// Configuration
const SIZES = ["16", "20", "24"];

/**
 * Extract SVG content (keep as-is)
 */
function extractSvgContent(svgContent) {
  // Remove the outer <svg> tags to get just the inner content
  return svgContent
    .replace(/<svg[^>]*>/, "")
    .replace("</svg>", "")
    .trim();
}

/**
 * Extract SVG attributes (width, height, viewBox)
 */
function extractSvgAttributes(svgContent) {
  const widthMatch = svgContent.match(/width="(\d+)"/);
  const heightMatch = svgContent.match(/height="(\d+)"/);
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);

  return {
    width: widthMatch ? parseInt(widthMatch[1]) : 24,
    height: heightMatch ? parseInt(heightMatch[1]) : 24,
    viewBox: viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24",
  };
}

/**
 * Convert kebab-case to PascalCase
 */
function toPascalCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Generate React component template
 */
function generateReactComponent(iconName, svgContent, size, iconDirName) {
  const attributes = extractSvgAttributes(svgContent);
  const svgInnerContent = extractSvgContent(svgContent);
  const isColorful = iconDirName.startsWith("colorful-");

  const processedSvgContent = isColorful
    ? svgInnerContent
    : svgInnerContent.replace(/fill="#[^"]*"/g, `fill="\${color}"`);

  return `import React from 'react';

export const ${iconName} = ({ 
  ${isColorful ? "// color = '#FAFBFB'," : "color = '#FAFBFB',"}
  className,
  style 
}) => {
  return React.createElement('svg', {
    width: ${size},
    height: ${size},
    viewBox: "${attributes.viewBox}",
    xmlns: "http://www.w3.org/2000/svg",
    className: className,
    style: style,
    dangerouslySetInnerHTML: { __html: \`${processedSvgContent.replace(
      /`/g,
      "\\`"
    )}\` }
  });
};

export default ${iconName};
`;
}

/**
 * Process a single icon directory
 */
async function processIcon(iconDir) {
  const iconName = path.basename(iconDir);
  const pascalName = toPascalCase(iconName);

  console.log(`Processing ${iconName}...`);

  // Read SVG files for each size
  const svgFiles = {};
  for (const size of SIZES) {
    const svgPath = path.join(iconDir, `${size}.svg`);
    if (await fs.pathExists(svgPath)) {
      svgFiles[size] = await fs.readFile(svgPath, "utf-8");
    }
  }

  if (Object.keys(svgFiles).length === 0) {
    console.warn(`No SVG files found in ${iconDir}`);
    return null;
  }

  // Create icon directory in dist
  const distIconDir = path.join(distDir, "icons", iconName);
  await fs.ensureDir(distIconDir);

  // Generate React components for each size
  for (const [size, svgContent] of Object.entries(svgFiles)) {
    const componentName = `${pascalName}${size}`;
    const reactComponent = generateReactComponent(
      componentName,
      svgContent,
      size,
      iconName
    );

    // Write React component
    await fs.writeFile(path.join(distIconDir, `${size}.js`), reactComponent);
  }

  return {
    name: iconName,
    pascalName,
    sizes: Object.keys(svgFiles),
  };
}

/**
 * Generate main index files
 */
async function generateIndexFiles(icons) {
  console.log("Generating index files...");

  // Generate ES modules index (SVG functions only for NPM compatibility)
  const esmImports = icons
    .map((icon) => {
      const imports = [];

      // Export React components
      for (const size of icon.sizes) {
        imports.push(
          `export { ${icon.pascalName}${size} } from './icons/${icon.name}/${size}.js';`
        );
      }

      return imports.join("\n");
    })
    .join("\n");

  const esmIndex = `${esmImports}
`;

  // Generate TypeScript definitions (React components)
  const typeExports = icons
    .map((icon) => {
      const exports = [];

      // Export React components
      for (const size of icon.sizes) {
        exports.push(
          `export declare const ${icon.pascalName}${size}: React.FC<${icon.pascalName}${size}Props>;`
        );
      }

      return exports.join("\n");
    })
    .join("\n");

  // Generate interface definitions
  const interfaceExports = icons
    .map((icon) => {
      const exports = [];

      // Export React component props interfaces
      for (const size of icon.sizes) {
        exports.push(
          `export interface ${icon.pascalName}${size}Props extends IconProps {}`
        );
      }

      return exports.join("\n");
    })
    .join("\n");

  const typeDefinitions = `import React from 'react';

export interface IconProps {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}


${interfaceExports}

${typeExports}
`;

  // Write files
  await fs.writeFile(path.join(distDir, "index.js"), esmIndex);
  await fs.writeFile(path.join(distDir, "index.d.ts"), typeDefinitions);
}

/**
 * Main build function
 */
async function build() {
  console.log("Starting build process...");

  // Clean dist directory
  await fs.remove(distDir);
  await fs.ensureDir(distDir);

  // Find all icon directories
  const iconDirs = await glob("*/", { cwd: iconsDir });
  console.log(`Found ${iconDirs.length} icon directories`);

  // Process each icon
  const icons = [];
  for (const iconDir of iconDirs) {
    const fullPath = path.join(iconsDir, iconDir);
    const result = await processIcon(fullPath);
    if (result) {
      icons.push(result);
    }
  }

  // Generate index files
  await generateIndexFiles(icons);

  console.log(`Build complete! Generated ${icons.length} icons`);
  console.log(`Output directory: ${distDir}`);
}

/**
 * Watch mode
 */
async function watch() {
  console.log("Starting watch mode...");

  // Initial build
  await build();

  // Watch for changes
  const watcher = chokidar.watch(iconsDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  });

  watcher.on("change", async (filePath) => {
    console.log(`File changed: ${filePath}`);
    const iconDir = path.dirname(filePath);
    const iconName = path.basename(iconDir);
    console.log(`Rebuilding ${iconName}...`);

    // Rebuild just this icon
    const result = await processIcon(iconDir);
    if (result) {
      console.log(`Rebuilt ${iconName}`);
    }
  });

  console.log("Watching for changes...");
}

// Main execution
const args = process.argv.slice(2);
const isWatchMode = args.includes("--watch");

if (isWatchMode) {
  watch().catch(console.error);
} else {
  build().catch(console.error);
}
