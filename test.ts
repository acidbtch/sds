console.log(Object.keys(process.env).filter(k => k.includes('API') || k.includes('URL') || k.includes('HTTP')).map(k => `${k}=${process.env[k]}`).join('\n'));
