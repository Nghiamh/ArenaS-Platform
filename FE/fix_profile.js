const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Customer/ProfilePage.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Replace all blue-500, blue-400, blue-600, blue-900 to accent-primary
content = content.replace(/blue-500/g, 'accent-primary');
content = content.replace(/blue-400/g, 'accent-primary');
content = content.replace(/blue-600/g, 'accent-primary');
content = content.replace(/blue-900/g, 'accent-primary');

// Replace all indigo-600, indigo-900, cyan-400 to accent-secondary
content = content.replace(/indigo-600/g, 'accent-secondary');
content = content.replace(/indigo-900/g, 'accent-secondary');
content = content.replace(/cyan-400/g, 'accent-secondary');
content = content.replace(/cyan-500/g, 'accent-secondary');

// Replace hardcoded RGB for shadow glows
content = content.replace(/rgba\(59,130,246,/g, 'rgba(var(--accent-primary-rgb),');
content = content.replace(/rgba\(6,182,212,/g, 'rgba(var(--accent-secondary-rgb),');

// Replace remaining hardcoded dark colors just in case
content = content.replace(/bg-\[\#10111a\]/g, 'bg-white/5');
content = content.replace(/border-\[\#10111a\]/g, 'border-white/10');
content = content.replace(/bg-\[\#141E2B\]/g, 'bg-white/5');

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Đã cập nhật xong màu sắc cho ProfilePage.tsx!');
