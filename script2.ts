import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  content = content.replace(/bg-gray-200 text-gray-800 hover:bg-gray-200/g, 'bg-gray-200 text-gray-800 hover:bg-gray-300');
  content = content.replace(/bg-gray-200 text-gray-800 py-3 rounded-xl text-sm font-bold hover:bg-gray-200/g, 'bg-gray-200 text-gray-800 py-3 rounded-xl text-sm font-bold hover:bg-gray-300');
  content = content.replace(/bg-gray-200 text-gray-800 text-sm font-bold py-2 rounded-lg hover:bg-gray-200/g, 'bg-gray-200 text-gray-800 text-sm font-bold py-2 rounded-lg hover:bg-gray-300');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(componentsDir, f)));

console.log('Done fixing hover states');
