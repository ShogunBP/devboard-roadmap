const fs = require('fs');
const path = require('path');
const http = require('http');

const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');

/**
 * Clean up title from H1 line, removing H1 syntax and leading emoji if present.
 */
function extractTitle(h1Line) {
  const withoutHash = h1Line.replace(/^#\s*/, '').trim();
  // Match optional leading emoji + variation selectors, ZWJ, skin tone modifiers, followed by spaces, and capture the title text
  const match = withoutHash.match(/^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}🐛✨🔧♻️][\u{FE00}-\u{FE0F}\u{1F3FB}-\u{1F3FF}\u{200D}]*\s*)?(.+)$/u);
  if (match) {
    return match[1].trim();
  }
  return withoutHash;
}

/**
 * Helper to check if a section's content is empty or contains only placeholders.
 */
function isContentEmptyOrPlaceholder(text) {
  const lines = text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('#') && !line.startsWith('---'));
  
  if (lines.length === 0) return true;
  
  const placeholderRegex = /^_\(.*\)_$/;
  return lines.every(line => placeholderRegex.test(line));
}

/**
 * Scan a single category directory recursively.
 */
function scanDirectory(dirPath, area, category, tasks) {
  if (!fs.existsSync(dirPath)) return;

  try {
    const folders = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const folder of folders) {
      if (folder.isDirectory()) {
        const folderName = folder.name;
        const folderPath = path.join(dirPath, folderName);

        // Parse folder name for status and slug
        const statusMatch = folderName.match(/^\[([^\]]+)\]-?(.*)$/);
        let status = null;
        let id = folderName;
        if (statusMatch) {
          status = statusMatch[1];
          id = statusMatch[2];
        }

        const readmePath = path.join(folderPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
          console.warn(`[roadmap] Aviso: README.md ausente em ${folderPath}`);
          continue;
        }

        try {
          const content = fs.readFileSync(readmePath, 'utf8');
          const lines = content.split(/\r?\n/);

          // Parse H1 title
          const h1Line = lines.find(l => l.trim().startsWith('# '));
          let title = id; // Default to slug/id
          if (h1Line) {
            title = extractTitle(h1Line);
          }

          // Parse Date
          const dateMatch = content.match(/\*\*Data:\*\*\s*`?([0-9\-]+)`?/i);
          const date = dateMatch ? dateMatch[1].trim() : null;

          // Parse Priority
          const priorityMatch = content.match(/\*\*Prioridade:\*\*\s*`?([a-záéíóúçA-ZÀÉÍÓÚÇ]+)`?/i);
          let priority = null;
          if (priorityMatch) {
            const pVal = priorityMatch[1].trim().toLowerCase();
            if (pVal === 'alta' || pVal === 'baixa') {
              priority = pVal;
            } else if (pVal === 'média' || pVal === 'media' || pVal === 'med') {
              priority = 'média';
            } else {
              priority = pVal;
            }
          }

          // Parse Tags
          const tagsMatch = content.match(/\*\*Tags:\*\*\s*(.+)$/im);
          let tags = [];
          if (tagsMatch) {
            tags = tagsMatch[1]
              .split(',')
              .map(t => t.replace(/`/g, '').trim())
              .filter(t => t.length > 0);
          }

          // Parse Progress
          const completed = (content.match(/- \[[xX]\]/g) || []).length;
          const uncompleted = (content.match(/- \[ \]/g) || []).length;
          const total = completed + uncompleted;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          const progressFraction = { done: completed, total: total };

          // Parse Summary
          const summaryMatch = content.match(/\*\*Resumo:\*\*\s*(.+)$/im);
          let summary = summaryMatch ? summaryMatch[1].trim() : null;

          // Parse Sections (level ##)
          const sections = [];
          const criteriaSections = [];
          const sectionBlocks = content.split(/\r?\n##\s+/);
          for (let i = 1; i < sectionBlocks.length; i++) {
            const block = sectionBlocks[i];
            const lines = block.split(/\r?\n/);
            const rawHeading = lines[0].trim();
            const rawContent = lines.slice(1).join('\n').trim();

            // Clean heading: remove emojis
            const heading = rawHeading.replace(/^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}🐛✨🔧♻️][\u{FE00}-\u{FE0F}\u{1F3FB}-\u{1F3FF}\u{200D}]*\s*)?/u, '').trim();

            const headingLower = heading.toLowerCase();
            // Exclude process sections (review, feedback, decisão)
            if (['review', 'feedback', 'decisão', 'decisao'].includes(headingLower)) {
              continue;
            }

            // Exclude empty or placeholders
            if (isContentEmptyOrPlaceholder(rawContent)) {
              continue;
            }

            // Separate criteria and validation sections into their own array
            const isCriteria = headingLower.includes('critérios') || headingLower.includes('criterios') || headingLower === 'validação' || headingLower === 'validacao';
            if (isCriteria) {
              criteriaSections.push({
                heading,
                content: rawContent
              });
            } else {
              sections.push({
                heading,
                content: rawContent
              });
            }
          }

          // Summary fallback to first section if empty
          if (!summary && sections.length > 0) {
            const firstSec = sections[0];
            let cleanText = firstSec.content
              .replace(/[-*]\s+/g, '')
              .replace(/\[\s*\]|\[[xX]\]/g, '')
              .replace(/###\s*.+/g, '')
              .replace(/`|[*_]/g, '')
              .replace(/\s+/g, ' ')
              .trim();

            if (cleanText.length > 200) {
              cleanText = cleanText.substring(0, 197) + '...';
            }
            summary = cleanText || null;
            if (summary) {
              sections.shift();
            }
          }

          const relativePath = path.relative(projectRoot, folderPath).replace(/\\/g, '/');

          tasks.push({
            id,
            title,
            category,
            status,
            area,
            date,
            priority,
            tags,
            progress,
            progressFraction,
            summary,
            sections,
            criteriaSections,
            path: relativePath
          });
        } catch (err) {
          console.error(`[roadmap] Erro ao processar o arquivo ${readmePath}:`, err);
        }
      }
    }
  } catch (err) {
    console.error(`[roadmap] Erro ao ler a pasta ${dirPath}:`, err);
  }
}

/**
 * Generate data.js and data.json files.
 */
function generateData() {
  const tasks = [];
  const areas = ['active', 'archive'];
  const categories = ['bugs', 'features', 'enhancements', 'refactoring'];

  for (const area of areas) {
    for (const category of categories) {
      const dirPath = path.join(projectRoot, 'docs', area, category);
      scanDirectory(dirPath, area, category, tasks);
    }
  }

  // Write data.json
  const jsonPath = path.join(projectRoot, 'roadmap', 'data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(tasks, null, 2), 'utf8');

  // Write data.js
  const jsPath = path.join(projectRoot, 'roadmap', 'data.js');
  const jsContent = `const ROADMAP_TASKS = ${JSON.stringify(tasks, null, 2)};\n`;
  fs.writeFileSync(jsPath, jsContent, 'utf8');
}

// Watcher debounce setup
let timeoutId = null;
function triggerRebuild() {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => {
    console.log('[roadmap] docs atualizados, gerando data.js/data.json...');
    try {
      generateData();
      console.log('[roadmap] data.js/data.json gerados com sucesso!');
    } catch (err) {
      console.error('[roadmap] Erro ao gerar dados:', err);
    }
  }, 250);
}

// Initial build
console.log('[roadmap] Geração inicial...');
try {
  generateData();
  console.log('[roadmap] Geração inicial concluída com sucesso!');
} catch (err) {
  console.error('[roadmap] Erro na geração inicial:', err);
}

// Recursive watch helper with fallback for other OS
function watchRecursive(dir, callback) {
  try {
    fs.watch(dir, { recursive: true }, callback);
  } catch (err) {
    // Fallback: watch the directory and all existing subdirectories manually
    fs.watch(dir, callback);
    watchSubdirs(dir, callback);
  }
}

function watchSubdirs(dir, callback) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = path.join(dir, entry.name);
        fs.watch(subPath, callback);
        watchSubdirs(subPath, callback);
      }
    }
  } catch (err) {
    // Ignore read errors
  }
}

// Watch active and archive directories
const activeDir = path.join(docsDir, 'active');
const archiveDir = path.join(docsDir, 'archive');

if (fs.existsSync(activeDir)) {
  watchRecursive(activeDir, (eventType, filename) => {
    triggerRebuild();
  });
}
if (fs.existsSync(archiveDir)) {
  watchRecursive(archiveDir, (eventType, filename) => {
    triggerRebuild();
  });
}

console.log('[roadmap] Servidor de monitoramento rodando...');

// --- Servidor HTTP ---
const PORT = 3003;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url === '/' ? '/roadmap.html' : req.url;
  // Remove query strings
  reqPath = reqPath.split('?')[0];
  let filePath = path.join(projectRoot, reqPath);

  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`[roadmap] Servidor HTTP rodando em http://localhost:${PORT}`);
});
