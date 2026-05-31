import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '../src/assets/logo.svg');
const iconsDir = path.join(__dirname, '../src-tauri/icons');

const svgContent = fs.readFileSync(svgPath, 'utf-8');

const sizes = [
  { name: 'icon.png', size: 512 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
  { name: '32x32.png', size: 32 },
  { name: 'Square30x30Logo.png', size: 30 },
  { name: 'Square44x44Logo.png', size: 44 },
  { name: 'Square71x71Logo.png', size: 71 },
  { name: 'Square89x89Logo.png', size: 89 },
  { name: 'Square107x107Logo.png', size: 107 },
  { name: 'Square142x142Logo.png', size: 142 },
  { name: 'Square150x150Logo.png', size: 150 },
  { name: 'Square284x284Logo.png', size: 284 },
  { name: 'Square310x310Logo.png', size: 310 },
  { name: 'StoreLogo.png', size: 50 },
];

async function generate() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  for (const { name, size } of sizes) {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: ${size}px; height: ${size}px; background: transparent; }
          img { width: ${size}px; height: ${size}px; }
        </style>
      </head>
      <body>
        <img src="data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}"/>
      </body>
      </html>
    `);
    await new Promise(r => setTimeout(r, 100));

    const buf = await page.screenshot({ type: 'png', omitBackground: true });
    const outPath = path.join(iconsDir, name);
    fs.writeFileSync(outPath, buf);
    console.log(`Generated ${name} (${size}x${size})`);
  }

  await browser.close();
  console.log('Done!');
}

generate().catch(console.error);
