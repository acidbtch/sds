import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');
const appFile = path.join(process.cwd(), 'src', 'App.tsx');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Upgrade shadows
  content = content.replace(/shadow-md/g, 'shadow-lg');
  content = content.replace(/shadow-sm/g, 'shadow-md');
  
  // Upgrade back buttons (top left)
  content = content.replace(/absolute left-4 p-2 -ml-2 text-gray-700 hover:bg-gray-100/g, 'absolute left-4 p-2 -ml-2 bg-gray-100 text-gray-800 hover:bg-gray-200');
  content = content.replace(/absolute left-4 p-2 -ml-2 text-slate-300 hover:bg-slate-800/g, 'absolute left-4 p-2 -ml-2 bg-slate-800 text-slate-200 hover:bg-slate-700');
  
  // Upgrade back buttons (bottom / generic)
  content = content.replace(/bg-gray-100 text-gray-700/g, 'bg-gray-200 text-gray-800');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(componentsDir, f)));

processFile(appFile);

console.log('Done replacing styles');
