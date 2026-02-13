#!/usr/bin/env node

/**
 * Wiki Management Script
 * 
 * This script helps manage the wiki for the AI Code Mentor project.
 * It can be used to:
 * - List wiki pages
 * - Validate wiki structure
 * - Generate a wiki index
 * 
 * Usage:
 *   node scripts/wiki-manager.js [command]
 * 
 * Commands:
 *   list      - List all wiki pages
 *   validate  - Validate wiki structure
 *   index     - Generate wiki index
 */

const fs = require('fs');
const path = require('path');

const WIKI_DIR = path.join(__dirname, '../wiki');
const DEEPWIKI_BASE_URL = 'https://deepwiki.com/JantonioFC/ai-code-mentor-beta-test';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function listWikiPages() {
  log('\n📚 Wiki Pages:', 'blue');
  
  if (!fs.existsSync(WIKI_DIR)) {
    log('❌ Wiki directory not found!', 'red');
    return;
  }

  const files = fs.readdirSync(WIKI_DIR)
    .filter(file => file.endsWith('.md'))
    .sort();

  if (files.length === 0) {
    log('No wiki pages found.', 'yellow');
    return;
  }

  files.forEach(file => {
    const filePath = path.join(WIKI_DIR, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    log(`  ✓ ${file} (${size} KB)`, 'green');
  });

  log(`\nTotal: ${files.length} pages`, 'blue');
}

function validateWikiStructure() {
  log('\n🔍 Validating Wiki Structure...', 'blue');
  
  const requiredFiles = ['Home.md', 'README.md'];
  let isValid = true;

  // Check if wiki directory exists
  if (!fs.existsSync(WIKI_DIR)) {
    log('❌ Wiki directory not found!', 'red');
    return false;
  }

  // Check required files
  requiredFiles.forEach(file => {
    const filePath = path.join(WIKI_DIR, file);
    if (fs.existsSync(filePath)) {
      log(`  ✓ ${file} exists`, 'green');
    } else {
      log(`  ❌ ${file} is missing`, 'red');
      isValid = false;
    }
  });

  // Check for broken links
  const files = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith('.md'));
  files.forEach(file => {
    const filePath = path.join(WIKI_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Simple link checker (relative links)
    const relativeLinks = content.match(/\[.*?\]\(((?!http).*?\.md)\)/g) || [];
    relativeLinks.forEach(link => {
      const linkPath = link.match(/\((.*?)\)/)[1];
      
      // Skip external relative links (those starting with ../)
      if (linkPath.startsWith('../')) {
        return;
      }
      
      // Resolve the target path properly
      const targetPath = path.resolve(WIKI_DIR, linkPath);
      
      if (!fs.existsSync(targetPath)) {
        log(`  ⚠️  Broken link in ${file}: ${linkPath}`, 'yellow');
      }
    });
  });

  if (isValid) {
    log('\n✅ Wiki structure is valid!', 'green');
  } else {
    log('\n❌ Wiki structure has issues!', 'red');
  }

  return isValid;
}

function generateWikiIndex() {
  log('\n📋 Generating Wiki Index...', 'blue');
  
  if (!fs.existsSync(WIKI_DIR)) {
    log('❌ Wiki directory not found!', 'red');
    return;
  }

  const files = fs.readdirSync(WIKI_DIR)
    .filter(file => file.endsWith('.md') && file !== 'README.md')
    .sort();

  let index = '# Wiki Index\n\n';
  index += '## 📚 Available Pages\n\n';

  files.forEach(file => {
    const filePath = path.join(WIKI_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
    
    // Extract description from first paragraph
    const descMatch = content.match(/^[^#\n].*$/m);
    const description = descMatch ? descMatch[0].substring(0, 100) : '';
    
    const slug = file.replace('.md', '').toLowerCase().replace(/\s+/g, '-');
    
    index += `### [${title}](${file})\n`;
    if (description) {
      index += `${description}...\n`;
    }
    index += `- 🔗 [Ver en DeepWiki](${DEEPWIKI_BASE_URL}/${slug})\n\n`;
  });

  index += '\n---\n\n';
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  index += `**Última actualización:** ${dateStr}\n`;

  const indexPath = path.join(WIKI_DIR, 'Index.md');
  fs.writeFileSync(indexPath, index);
  
  log(`✅ Index generated: ${indexPath}`, 'green');
  log(`   Total pages indexed: ${files.length}`, 'blue');
}

function showHelp() {
  console.log(`
📚 Wiki Manager - AI Code Mentor

Usage:
  node scripts/wiki-manager.js [command]

Commands:
  list      List all wiki pages
  validate  Validate wiki structure
  index     Generate wiki index
  help      Show this help message

Examples:
  node scripts/wiki-manager.js list
  node scripts/wiki-manager.js validate
  node scripts/wiki-manager.js index

DeepWiki:
  View interactive documentation at:
  ${DEEPWIKI_BASE_URL}
  `);
}

// Main execution
const command = process.argv[2] || 'help';

switch (command) {
  case 'list':
    listWikiPages();
    break;
  case 'validate':
    validateWikiStructure();
    break;
  case 'index':
    generateWikiIndex();
    break;
  case 'help':
  default:
    showHelp();
    break;
}
