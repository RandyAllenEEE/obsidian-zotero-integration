import builtins from 'builtin-modules';
import esbuild from 'esbuild';
import process from 'process';
import fs from 'fs';
import path from 'path';

const prod = process.argv[2] === 'production';
const buildDir = 'build';

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

const context = await esbuild.context({
  entryPoints: ['./src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/closebrackets',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/comment',
    '@codemirror/fold',
    '@codemirror/gutter',
    '@codemirror/highlight',
    '@codemirror/history',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/matchbrackets',
    '@codemirror/panel',
    '@codemirror/rangeset',
    '@codemirror/rectangular-selection',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/stream-parser',
    '@codemirror/text',
    '@codemirror/tooltip',
    '@codemirror/view',
    'node:*',
    ...builtins,
  ],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: path.join(buildDir, 'main.js'),
  minify: prod,
});

async function copyAssets() {
  try {
    fs.copyFileSync('manifest.json', path.join(buildDir, 'manifest.json'));
    const srcStyle = path.join('src', 'styles.css');
    if (fs.existsSync(srcStyle)) {
      fs.copyFileSync(srcStyle, path.join(buildDir, 'styles.css'));
    } else if (fs.existsSync('styles.css')) {
      fs.copyFileSync('styles.css', path.join(buildDir, 'styles.css'));
    } else {
      fs.writeFileSync(path.join(buildDir, 'styles.css'), '');
    }
  } catch (err) {
    console.error('Error copying assets:', err);
  }
}

if (prod) {
  await context.rebuild();
  await copyAssets();
  process.exit(0);
} else {
  await context.watch();
  await copyAssets();
}
