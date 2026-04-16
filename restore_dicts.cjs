const fs = require('fs');
let dcContent = fs.readFileSync('D:/Projects/sds/src/context/DataContext.tsx', 'utf8');

dcContent = dcContent.replace(
  `// Removed heavy dicts from initial load
          Promise.resolve([]),
          Promise.resolve([]),
          Promise.resolve([]),`,
  `dictsApi.getRegions().catch(() => []),
          dictsApi.getServiceCategories().catch(() => []),
          Promise.resolve([]), // Removed getCarBrands() to save initial load`
);
fs.writeFileSync('D:/Projects/sds/src/context/DataContext.tsx', dcContent);
console.log('DataContext updated');
