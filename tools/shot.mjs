// Screenshot a local HTML page with headless Chrome.
// usage: node shot.mjs <html> <out.png> [width=1280] [height=2400]
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [src, out, w = '1280', h = '2400'] = process.argv.slice(2);
const url = 'file:///' + path.resolve(src).replace(/\\/g, '/');

execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--window-size=${w},${h}`, '--force-device-scale-factor=1',
  '--virtual-time-budget=4000',
  `--screenshot=${path.resolve(out)}`, url,
], { stdio: 'pipe', timeout: 120000 });
console.log('wrote', out);
