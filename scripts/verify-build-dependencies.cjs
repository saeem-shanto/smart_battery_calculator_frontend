#!/usr/bin/env node
/** Validate that npm has installed React runtime + type-checking dependencies. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const packages = [
  'next',
  'react',
  'react-dom',
  'typescript',
  '@types/react',
  '@types/react-dom',
  '@types/node',
];
const missing = [];
for (const name of packages) {
  const manifest = path.join(root, 'node_modules', ...name.split('/'), 'package.json');
  if (!fs.existsSync(manifest)) missing.push(name);
}
const reactTypes = path.join(root, 'node_modules', '@types', 'react', 'index.d.ts');
if (!fs.existsSync(reactTypes) || !fs.readFileSync(reactTypes, 'utf8').includes('ReactNode')) {
  missing.push('@types/react/index.d.ts (ReactNode declarations)');
}
if (missing.length) {
  console.error(`\nIncomplete frontend install. Missing: ${[...new Set(missing)].join(', ')}.`);
  console.error('Run: rm -rf node_modules .next tsconfig.tsbuildinfo && npm ci --include=dev');
  console.error('For Vercel, use Install Command: npm ci --include=dev, then Redeploy without build cache.\n');
  process.exit(1);
}
console.log('Frontend runtime and TypeScript declaration packages are present.');
