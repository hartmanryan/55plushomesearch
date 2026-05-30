const fs = require('fs');
const file = 'C:/Users/propk/.gemini/antigravity/brain/3cb4deb6-6f1d-49cf-9b01-761a5b05dc0b/.system_generated/steps/697/content.md';
const content = fs.readFileSync(file, 'utf8');

// Find all list items with community links: <li class="si-content-label__link"><a href="/slug/" title="View Name">Name</a></li>
// Or just <a> links with /slug/ and some text inside.
const regex = /<a href="\/([^"\/]+)\/" title="View ([^"]+)">/g;
const communities = [];
let match;
while ((match = regex.exec(content)) !== null) {
  communities.push({
    slug: match[1],
    name: match[2]
  });
}

console.log(`Found ${communities.length} communities:`);
console.log(JSON.stringify(communities.slice(0, 10), null, 2));
console.log('...');
console.log(JSON.stringify(communities.slice(-5), null, 2));
