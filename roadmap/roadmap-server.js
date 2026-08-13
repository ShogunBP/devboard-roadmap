const fs = require('fs');
const path = require('path');
const http = require('http');

const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');

function formatTimestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function logServer(msg) {
  console.log(`[roadmap] ${formatTimestamp()} - ${msg}`);
}

function logWarn(msg) {
  console.warn(`[roadmap] ${formatTimestamp()} - Aviso: ${msg}`);
}

function logError(msg, err) {
  if (err) {
    console.error(`[roadmap] ${formatTimestamp()} - Erro: ${msg}`, err);
  } else {
    console.error(`[roadmap] ${formatTimestamp()} - Erro: ${msg}`);
  }
}

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
        const relFolderPath = path.relative(projectRoot, folderPath).replace(/\\/g, '/');
        const relReadmePath = path.relative(projectRoot, readmePath).replace(/\\/g, '/');

        if (!fs.existsSync(readmePath)) {
          logWarn(`${relFolderPath} sem README.md`);
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
          } else {
            logWarn(`${relReadmePath} sem H1 - usando slug "${id}" como título`);
          }

          // Parse Date
          const dateMatch = content.match(/\*\*Data:\*\*\s*`?([0-9\-]+)`?/i);
          const date = dateMatch ? dateMatch[1].trim() : null;
          if (!date) {
            logWarn(`${relReadmePath} sem campo Data`);
          }

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
          } else {
            logWarn(`${relReadmePath} sem campo Prioridade - item listado com prioridade nula`);
          }

          // Parse Tags
          const tagsMatch = content.match(/\*\*Tags:\*\*\s*(.+)$/im);
          let tags = [];
          if (tagsMatch) {
            tags = tagsMatch[1]
              .split(',')
              .map(t => t.replace(/`/g, '').trim())
              .filter(t => t.length > 0);
          } else {
            logWarn(`${relReadmePath} sem campo Tags`);
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
          logError(`Erro ao processar o arquivo ${relReadmePath}:`, err);
        }
      }
    }
  } catch (err) {
    logError(`Erro ao ler a pasta ${dirPath}:`, err);
  }
}

/**
 * Generate data.js and data.json files.
 */
function generateData() {
  const startTime = Date.now();
  const tasks = [];
  const areas = ['active', 'archive'];
  const categories = ['bugs', 'features', 'enhancements', 'refactoring'];

  logServer('Reprocessando /docs...');

  for (const area of areas) {
    for (const category of categories) {
      const dirPath = path.join(projectRoot, 'docs', area, category);
      scanDirectory(dirPath, area, category, tasks);
    }
  }

  const activeCount = tasks.filter(t => t.area === 'active').length;
  const archiveCount = tasks.filter(t => t.area === 'archive').length;
  logServer(`${tasks.length} itens encontrados (${activeCount} active, ${archiveCount} archive)`);

  // Write data.json
  const jsonPath = path.join(projectRoot, 'roadmap', 'data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(tasks, null, 2), 'utf8');

  // Write data.js
  const jsPath = path.join(projectRoot, 'roadmap', 'data.js');
  const jsContent = `var ROADMAP_TASKS = ${JSON.stringify(tasks, null, 2)};\n`;
  fs.writeFileSync(jsPath, jsContent, 'utf8');

  const elapsed = Date.now() - startTime;
  logServer(`data.js e data.json atualizados (${tasks.length} tarefas, ${elapsed}ms)`);
}

// Watcher debounce setup
let timeoutId = null;
let lastTriggeredFile = null;

function triggerRebuild(filename) {
  if (filename) {
    const relFile = path.relative(projectRoot, path.isAbsolute(filename) ? filename : path.join(docsDir, filename)).replace(/\\/g, '/');
    lastTriggeredFile = relFile;
  }
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => {
    if (lastTriggeredFile) {
      logServer(`Mudança detectada: ${lastTriggeredFile}`);
      lastTriggeredFile = null;
    } else {
      logServer(`Mudança detectada em /docs`);
    }
    try {
      generateData();
    } catch (err) {
      logError('Erro ao gerar dados:', err);
    }
  }, 250);
}

// Initial build
logServer('Geração inicial...');
try {
  generateData();
  logServer('Geração inicial concluída com sucesso!');
} catch (err) {
  logError('Erro na geração inicial:', err);
}

// Recursive watch helper with fallback for other OS
function watchRecursive(dir, callback) {
  try {
    const watcher = fs.watch(dir, { recursive: true }, callback);
    return {
      close: () => {
        try { watcher.close(); } catch (e) {}
      }
    };
  } catch (err) {
    // Fallback: watch the directory and all existing subdirectories manually
    const watchers = [];
    try {
      const main = fs.watch(dir, callback);
      watchers.push(main);
      watchSubdirs(dir, callback, watchers);
    } catch (e) {}
    return {
      close: () => {
        watchers.forEach(w => {
          try { w.close(); } catch (e) {}
        });
      }
    };
  }
}

function watchSubdirs(dir, callback, watchers) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = path.join(dir, entry.name);
        try {
          const w = fs.watch(subPath, callback);
          watchers.push(w);
        } catch (e) {}
        watchSubdirs(subPath, callback, watchers);
      }
    }
  } catch (err) {
    // Ignore read errors
  }
}

// Dynamic watcher management for active and archive directories
const activeDir = path.join(docsDir, 'active');
const archiveDir = path.join(docsDir, 'archive');

let activeFSWatcher = null;
let archiveFSWatcher = null;

function checkAndMountWatchers() {
  const relActive = path.relative(projectRoot, activeDir).replace(/\\/g, '/');
  const relArchive = path.relative(projectRoot, archiveDir).replace(/\\/g, '/');

  // Check activeDir
  const activeExists = fs.existsSync(activeDir);
  if (activeExists && !activeFSWatcher) {
    activeFSWatcher = watchRecursive(activeDir, (eventType, filename) => {
      const fullPath = filename ? path.join(activeDir, filename) : activeDir;
      triggerRebuild(fullPath);
    });
    logServer(`Pasta encontrada e watcher ativado: ${relActive}`);
    triggerRebuild();
  } else if (!activeExists && activeFSWatcher) {
    activeFSWatcher.close();
    activeFSWatcher = null;
    logServer(`Pasta removida, watcher desativado: ${relActive}`);
  }

  // Check archiveDir
  const archiveExists = fs.existsSync(archiveDir);
  if (archiveExists && !archiveFSWatcher) {
    archiveFSWatcher = watchRecursive(archiveDir, (eventType, filename) => {
      const fullPath = filename ? path.join(archiveDir, filename) : archiveDir;
      triggerRebuild(fullPath);
    });
    logServer(`Pasta encontrada e watcher ativado: ${relArchive}`);
    triggerRebuild();
  } else if (!archiveExists && archiveFSWatcher) {
    archiveFSWatcher.close();
    archiveFSWatcher = null;
    logServer(`Pasta removida, watcher desativado: ${relArchive}`);
  }
}

// Initial check & mount
checkAndMountWatchers();

// Periodic check every 3 seconds to auto-detect folder creation or removal
setInterval(checkAndMountWatchers, 3000);

logServer('Servidor de monitoramento rodando...');

// --- Servidor HTTP ---
const PORT = 3003;

function syncConfigPort() {
  const configPath = path.join(projectRoot, 'roadmap', 'config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}
  }
  if (config.serverPort !== PORT) {
    config.serverPort = PORT;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  }
}

syncConfigPort();

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

  // Route GET /health (Health check para detecção de servidor ativo)
  if (req.method === 'GET' && reqPath === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ server: true, port: PORT }));
    return;
  }

  // Route POST /config
  if (req.method === 'POST' && reqPath === '/config') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (typeof payload.projectName !== 'string' ||
            typeof payload.projectDescription !== 'string' ||
            typeof payload.projectBadge !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Campos inválidos.' }));
          return;
        }

        payload.serverPort = PORT;
        if (!payload.updatedAt) {
          payload.updatedAt = new Date().toISOString();
        }
        const configPath = path.join(projectRoot, 'roadmap', 'config.json');
        fs.writeFileSync(configPath, JSON.stringify(payload, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, config: payload }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload JSON inválido.' }));
      }
    });
    return;
  }

  // Route POST /log-error
  if (req.method === 'POST' && reqPath === '/log-error') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const msg = typeof payload.message === 'string' ? payload.message : JSON.stringify(payload.message);
        const ctx = payload.context ? `[${payload.context}] ` : '';
        logServer(`[navegador] ${ctx}${msg}`);

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload JSON inválido.' }));
      }
    });
    return;
  }

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
