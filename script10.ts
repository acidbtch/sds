import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace all gray button variations with slate-100
  content = content.replace(/bg-gray-200 text-gray-800 hover:bg-gray-300/g, 'bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8]');
  content = content.replace(/bg-gray-200 text-gray-800/g, 'bg-[#E8EDF2] text-[#0F2846]');
  content = content.replace(/hover:bg-gray-300/g, 'hover:bg-[#D8DFE8]');
  
  content = content.replace(/bg-gray-100 text-gray-800 hover:bg-gray-200/g, 'bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8]');
  content = content.replace(/bg-gray-100 text-gray-800/g, 'bg-[#E8EDF2] text-[#0F2846]');
  content = content.replace(/hover:bg-gray-200/g, 'hover:bg-[#D8DFE8]');
  
  content = content.replace(/bg-gray-100 text-gray-600/g, 'bg-[#E8EDF2] text-[#0F2846]');

  fs.writeFileSync(filePath, content, 'utf-8');
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(componentsDir, f)));

console.log('Done unifying gray buttons to custom color');
