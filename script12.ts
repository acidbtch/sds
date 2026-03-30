import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  content = content.replace(/hover:bg-gray-100/g, 'hover:bg-[#E8EDF2]');
  content = content.replace(/bg-gray-100/g, 'bg-[#E8EDF2]');

  fs.writeFileSync(filePath, content, 'utf-8');
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(componentsDir, f)));

console.log('Done unifying remaining bg-gray-100');
