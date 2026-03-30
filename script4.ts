import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace big buttons
  content = content.replace(/bg-gray-200 text-gray-800 hover:bg-gray-300/g, 'bg-gray-100 text-gray-800 hover:bg-gray-200');
  
  // Replace other bg-gray-200 text-gray-800 instances
  content = content.replace(/bg-gray-200 text-gray-800/g, 'bg-gray-100 text-gray-800');
  
  // Replace hover:bg-gray-300 that might be left over
  content = content.replace(/hover:bg-gray-300/g, 'hover:bg-gray-200');

  // Replace bg-gray-100 text-gray-600 with text-gray-800 to unify
  content = content.replace(/bg-gray-100 text-gray-600/g, 'bg-gray-100 text-gray-800');

  fs.writeFileSync(filePath, content, 'utf-8');
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(componentsDir, f)));

console.log('Done unifying gray buttons');
