const fs = require('fs');

const replaceInFile = (path, oldStr, newStr) => {
  let content = fs.readFileSync(path, 'utf8');
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(path, content);
    console.log(`Updated ${path}`);
  } else {
    console.log(`Pattern not found in ${path}`);
  }
};

// 1. Fix jumping visual in CustomerOrders
let coContent = fs.readFileSync('D:/Projects/sds/src/components/CustomerOrders.tsx', 'utf8');
coContent = coContent.replace(
  '{ordersToShow.length === 0 ? (',
  `{isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : ordersToShow.length === 0 ? (`
);
fs.writeFileSync('D:/Projects/sds/src/components/CustomerOrders.tsx', coContent);


// 2. Fix Extra Requests in DataContext.tsx
let dcContent = fs.readFileSync('D:/Projects/sds/src/context/DataContext.tsx', 'utf8');
// remove getCarBrands and getRegions from initial load since they aren't needed globally
dcContent = dcContent.replace(
  /dictsApi\.getRegions\(\)\.catch\(\(\) => \[\]\),[\s\n]*dictsApi\.getServiceCategories\(\)\.catch\(\(\) => \[\]\),[\s\n]*dictsApi\.getCarBrands\(\)\.catch\(\(\) => \[\]\),/,
  `// Removed heavy dicts from initial load
          Promise.resolve([]),
          Promise.resolve([]),
          Promise.resolve([]),`
);
fs.writeFileSync('D:/Projects/sds/src/context/DataContext.tsx', dcContent);

// 3. Fix ContractorRegister blinking screen 
// (Already fixed in previous step, but let's double check if we missed something)
let crContent = fs.readFileSync('D:/Projects/sds/src/components/ContractorRegister.tsx', 'utf8');
crContent = crContent.replace(
  "previousView === 'contractor_cabinet' ? 'contractor_cabinet' : 'contractor_menu'",
  "'contractor_menu'"
);
fs.writeFileSync('D:/Projects/sds/src/components/ContractorRegister.tsx', crContent);
