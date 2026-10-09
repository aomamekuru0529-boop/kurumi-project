import { build } from 'esbuild';
import { mkdir, copyFile, rm, cp, access } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['app.js'], bundle: true, external: ['./config.js'], minify: true, format: 'esm', target: ['safari15', 'chrome100'], outfile: 'dist/app.js', legalComments: 'eof' });
for (const file of ['index.html', 'styles.css', 'design.css', 'config.js']) await copyFile(file, `dist/${file}`);
await copyFile('node_modules/three/LICENSE', 'dist/three.LICENSE.txt');
await copyFile('vendor/qrcode.LICENSE.txt', 'dist/qrcode.LICENSE.txt');
await copyFile('vendor/dijkstrajs.LICENSE.txt', 'dist/dijkstrajs.LICENSE.txt');
try { await access('assets'); await cp('assets', 'dist/assets', { recursive: true }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
console.log('Production files generated in dist/');
try { await access('downloads'); await cp('downloads', 'dist/downloads', { recursive: true }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
