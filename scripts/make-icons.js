const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

// Just create empty placeholder files for now
[16, 48, 128].forEach(size => {
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), '');
});

console.log('Placeholder icons created.');
