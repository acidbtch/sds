const fs = require('fs');

const fixPhone = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /const handlePhoneChange = \(e: React\.ChangeEvent<HTMLInputElement>\) => {[\s\S]*?set(?:Phone|EditForm)\(.*?\{.*?\}.*?formatted.*?\) : set(?:Phone|EditForm)\(.*?\);?\s*};/,
    `const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n    let input = e.target.value;\n    if (input.length < 4) input = '+375';\n    let val = input.replace(/[^\\d]/g, '');\n    if (val.startsWith('375')) val = val.substring(3);\n    let formatted = '+375';\n    if (val.length > 0) formatted += ' ' + val.substring(0, 2);\n    if (val.length > 2) formatted += ' ' + val.substring(2, 5);\n    if (val.length > 5) formatted += ' ' + val.substring(5, 7);\n    if (val.length > 7) formatted += ' ' + val.substring(7, 9);\n    ${path.includes('Cabinet') ? 'setEditForm({ ...editForm, phone: formatted });' : 'setPhone(formatted);'}\n  };`
  );
  
  // Actually, regex is hard for this. Let's just use exact replace with flex spacing.
  fs.writeFileSync(path, content);
}

// Just use JS standard replace with simple exact matches but ignoring indentation.
