import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  content = content.replace(/bg-gray-200 text-gray-800 font-bold py-4 rounded-xl active:scale-\[0\.98\] transition-transform/g, 'bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold py-4 rounded-xl active:scale-[0.98] transition-all');
  content = content.replace(/bg-gray-200 text-gray-800 font-bold py-4 rounded-xl shadow-md active:scale-\[0\.98\] transition-transform/g, 'bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(componentsDir, f)));

console.log('Done fixing hover states again');
