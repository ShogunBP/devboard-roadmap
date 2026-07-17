// roadmap.js

// Os dados são carregados do arquivo data.js gerado pelo roadmap-server.js.
let tasks = []; // Array que manterá o estado atual das tarefas

// --- CONFIGURAÇÃO DAS COLUNAS (7 STATUS DO PADRONIZATION) ---
const COLUMNS = [
  { id: "preparacao", title: "Em preparação", hint: "Rascunho, revisão ou ajustes", statuses: ["draft", "ready-for-review", "changes-requested"] },
  { id: "approved", title: "Aprovado", hint: "Aprovado para execução", statuses: ["approved"] },
  { id: "in-progress", title: "Em Progresso", hint: "Em desenvolvimento", statuses: ["in-progress"] },
  { id: "done", title: "Concluído", hint: "Validados no archive", statuses: ["done"] },
  { id: "cancelled", title: "Cancelado", hint: "Descartado ou arquivado", statuses: ["cancelled"] }
];

const REAL_STATUS_LABELS = {
  "draft": "Rascunho",
  "ready-for-review": "Em Revisão",
  "changes-requested": "Ajustes Solicitados",
  "approved": "Aprovado",
  "in-progress": "Em Progresso",
  "done": "Concluído",
  "cancelled": "Cancelado"
};

const PRIORITY_LABEL = {
  "baixa": "Baixa",
  "média": "Média",
  "alta": "Alta"
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4", "Sem Data"];

// --- ESTADO DA APLICAÇÃO ---
let state = {
  view: "kanban", // 'kanban' | 'roadmap'
  query: "",
  priorityFilter: "all",
  categoryFilter: "all",
  areaFilter: "all",
  dark: false,
  visualTheme: "default",
  hideCancelled: false,
  selectedTaskId: null
};

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupEventListeners();
  loadTasks();
  renderApp();
  startPolling();
});

// --- INICIALIZAÇÃO DOS DADOS ---
function loadTasks() {
  // Carrega os dados reais do arquivo data.js (ROADMAP_TASKS)
  tasks = typeof ROADMAP_TASKS !== 'undefined' ? JSON.parse(JSON.stringify(ROADMAP_TASKS)) : [];
}

// --- POLLING DE DADOS ---
function startPolling() {
  setInterval(async () => {
    try {
      // Usar cache-buster para evitar que o navegador retorne o JSON desatualizado do cache
      const res = await fetch('roadmap/data.json?_t=' + Date.now());
      if (!res.ok) return;
      const newTasks = await res.json();
      
      // Se houver diferença, atualiza os dados e re-renderiza preservando o scroll
      if (JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
        tasks = newTasks;
        renderApp();
      }
    } catch (err) {
      console.warn("[roadmap] Polling falhou (modo file:// ou servidor offline). Fallback estático mantido.");
    }
  }, 2500); // Poll a cada 2.5 segundos
}

// --- AUXILIAR DE TRIMESTRES (BASEADO NA DATA) ---
function getQuarter(dateStr) {
  if (!dateStr) return "Sem Data";
  const parts = dateStr.split("-");
  const month = parseInt(parts[1], 10);
  if (isNaN(month)) return "Sem Data";
  if (month >= 1 && month <= 3) return "Q1";
  if (month >= 4 && month <= 6) return "Q2";
  if (month >= 7 && month <= 9) return "Q3";
  if (month >= 10 && month <= 12) return "Q4";
  return "Sem Data";
}

// --- AUXILIARES DE CATEGORIAS ---
function getCategoryLabel(category) {
  const labels = {
    bugs: "Bug 🐛",
    features: "Feature ✨",
    enhancements: "Melhoria 🔧",
    refactoring: "Refactoring ♻️"
  };
  return labels[category] || category;
}

function getCategoryBadge(category) {
  const colors = {
    bugs: "bg-red-500/10 text-red-500 border-red-500/20",
    features: "bg-green-500/10 text-green-500 border-green-500/20",
    enhancements: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    refactoring: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  };
  const icons = {
    bugs: "🐛",
    features: "✨",
    enhancements: "🔧",
    refactoring: "♻️"
  };
  const labels = {
    bugs: "Bug",
    features: "Feature",
    enhancements: "Melhoria",
    refactoring: "Refactoring"
  };
  return `
    <span class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${colors[category] || 'bg-muted text-muted-foreground border-border'}">
      <span>${icons[category] || ''}</span>
      <span>${labels[category] || category}</span>
    </span>
  `;
}

// --- FUNÇÕES DE RENDERIZAÇÃO ---
function renderApp() {
  // 1. Capturar estado atual de scroll para não perder a posição no re-render
  const currentScrollY = window.scrollY;
  const colScrolls = {};
  if (state.view === "kanban") {
    document.querySelectorAll('.kanban-col').forEach(col => {
      const colId = col.getAttribute('data-col-id');
      if (colId) colScrolls[colId] = col.scrollTop;
    });
  }
  const modalBody = document.getElementById("modal-body");
  const modalScrollTop = modalBody ? modalBody.scrollTop : 0;

  const filteredTasks = getFilteredTasks();
  renderStats(filteredTasks);
  renderPriorityFilters();

  if (state.view === "kanban") {
    document.getElementById("view-kanban").classList.remove("hidden");
    document.getElementById("view-roadmap").classList.add("hidden");
    renderKanban(filteredTasks);
  } else {
    document.getElementById("view-kanban").classList.add("hidden");
    document.getElementById("view-roadmap").classList.remove("hidden");
    renderRoadmap(filteredTasks);
  }

  if (state.selectedTaskId) {
    const task = tasks.find(t => t.id === state.selectedTaskId);
    if (task) renderModal(task);
    else closeModal();
  }

  // Atualiza ícones do Lucide após modificar o DOM
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. Restaurar estado de scroll após o DOM ser reconstruído
  requestAnimationFrame(() => {
    window.scrollTo(0, currentScrollY);
    if (state.view === "kanban") {
      document.querySelectorAll('.kanban-col').forEach(col => {
        const colId = col.getAttribute('data-col-id');
        if (colId && colScrolls[colId] !== undefined) {
          col.scrollTop = colScrolls[colId];
        }
      });
    }
    const newModalBody = document.getElementById("modal-body");
    if (newModalBody) {
      newModalBody.scrollTop = modalScrollTop;
    }
  });
}

function getFilteredTasks() {
  const q = state.query.trim().toLowerCase();
  return tasks.filter(t => {
    if (state.hideCancelled && t.status === "cancelled") return false;
    if (state.priorityFilter !== "all" && t.priority !== state.priorityFilter) return false;
    if (state.categoryFilter !== "all" && t.category !== state.categoryFilter) return false;
    if (state.areaFilter !== "all" && t.area !== state.areaFilter) return false;

    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  });
}

function renderStats(filteredTasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const progress = tasks.filter(t => t.status === "in-progress").length;
  const avg = total > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / total) : 0;

  document.getElementById("stats-container").innerHTML = `
    ${createStatCard("Tarefas", total)}
    ${createStatCard("Concluídas", done, "done")}
    ${createStatCard("Em execução", progress, "in-progress")}
    ${createStatCard("Progresso médio", `${avg}%`, "primary")}
  `;
}

function createStatCard(label, value, tone) {
  const color = tone === "primary" ? "var(--primary)" :
    tone === "done" ? "var(--status-done)" :
      tone === "in-progress" ? "var(--status-in-progress)" : "var(--muted-foreground)";
  return `
    <div class="rounded-lg border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]">
      <div class="text-[11px] uppercase tracking-wide text-muted-foreground">${label}</div>
      <div class="mt-1 text-2xl font-semibold tabular-nums" style="color: ${color}">${value}</div>
    </div>
  `;
}

function renderPriorityFilters() {
  const filters = [
    { id: "all", label: "Todas" },
    { id: "alta", label: "Alta" },
    { id: "média", label: "Média" },
    { id: "baixa", label: "Baixa" }
  ];

  document.getElementById("priority-filters").innerHTML = filters.map(f => `
    <button
      onclick="setPriorityFilter('${f.id}')"
      class="rounded-full border px-3 py-1 text-xs transition ${state.priorityFilter === f.id
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-card text-muted-foreground hover:text-foreground'
    }"
    >${f.label}</button>
  `).join('');
}

function renderKanban(filteredTasks) {
  const container = document.getElementById("view-kanban");

  if (state.hideCancelled) {
    container.className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  } else {
    container.className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
  }

  container.innerHTML = COLUMNS.map(col => {
    if (col.id === "cancelled" && state.hideCancelled) return '';
    const colTasks = filteredTasks.filter(t => col.statuses.includes(t.status));
    return `
      <section
        data-col-id="${col.id}"
        class="kanban-col rounded-xl border bg-card/60 p-3 transition border-border"
      >
        <header class="mb-3 flex items-center justify-between px-1">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full" style="background: var(--status-${col.id})"></span>
            <h2 class="text-sm font-semibold">${col.title}</h2>
            <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 h-5 px-1.5 text-[10px]">
              ${colTasks.length}
            </span>
          </div>
        </header>
        <p class="mb-3 px-1 text-[11px] text-muted-foreground">${col.hint}</p>
        <div class="flex flex-col gap-2 min-h-[80px]">
          ${colTasks.map(t => renderTaskCard(t)).join('')}
          ${colTasks.length === 0 ? '<div class="rounded-lg border border-dashed border-border/70 py-6 text-center text-xs text-muted-foreground">Solte tarefas aqui</div>' : ''}
        </div>
      </section>
    `;
  }).join('');
}

function renderTaskCard(task) {
  // Custom design for archive items
  const archiveClass = task.area === "archive" ? "bg-muted/40 border-dashed border-border/70" : "";
  const archiveBadge = task.area === "archive" ? `
    <span class="inline-flex items-center rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[9px] font-normal text-muted-foreground">Arquivado</span>
  ` : "";

  const dateLabel = task.date ? new Date(task.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }) : "";
  const priorityColor = task.priority ? `var(--priority-${task.priority})` : "transparent";
  const priorityTitle = task.priority ? `Prioridade ${PRIORITY_LABEL[task.priority]}` : "Sem prioridade";

  const realStatusLabel = REAL_STATUS_LABELS[task.status] || task.status;
  const isPreparacao = ["draft", "ready-for-review", "changes-requested"].includes(task.status);
  const statusBadge = isPreparacao ? `
    <span class="inline-flex items-center rounded-md border border-border bg-muted/30 px-1.5 py-0.5 text-[9px] font-normal" style="color: var(--status-${task.status}); border-color: var(--status-${task.status})">
      ${realStatusLabel}
    </span>
  ` : "";

  const themeClasses = state.visualTheme === "default" ? "card-blueprint-corner" : "";
  const hideDotClass = state.visualTheme === "ficha" ? "hidden" : "";
  const stamp = state.visualTheme === "ficha" && task.priority ? `
    <div class="card-stamp shrink-0 mt-0.5" style="color: var(--priority-${task.priority});">
      ${PRIORITY_LABEL[task.priority]}
    </div>
  ` : "";

  return `
    <article
      onclick="openModal('${task.id}')"
      class="relative group cursor-pointer rounded-lg border border-border bg-card p-3 text-left shadow-[var(--shadow-card)] transition [transition:var(--transition-smooth)] hover:-translate-y-0.5 hover:border-primary/50 ${archiveClass} ${themeClasses}"
    >
      <div class="mb-2 flex items-start justify-between gap-3">
        <h3 class="task-title text-sm font-medium leading-snug group-hover:text-primary">${task.title}</h3>
        <div class="flex items-start gap-2 shrink-0">
          ${stamp}
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full relative z-10 ${hideDotClass}" style="background: ${priorityColor}" title="${priorityTitle}"></span>
        </div>
      </div>
      
      <div class="mt-2 flex flex-wrap gap-1">
        ${getCategoryBadge(task.category)}
        ${statusBadge}
        ${archiveBadge}
      </div>

      <div class="mt-3 flex flex-wrap gap-1">
        ${task.tags.slice(0, 3).map(tag => `
          <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 h-5 px-1.5 text-[10px] font-normal">${tag}</span>
        `).join('')}
      </div>

      <div class="mt-3">
        <div class="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Progresso</span>
          <span class="tabular-nums">${task.progress}%</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-muted">
          <div class="h-full rounded-full transition-all" style="width: ${task.progress}%; background: var(--gradient-primary);"></div>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          ${dateLabel ? `
            <span class="inline-flex items-center gap-0.5">
              <i data-lucide="calendar" class="h-3 w-3"></i>
              ${dateLabel}
            </span>
          ` : ''}
        </span>
        ${task.progressFraction && task.progressFraction.total > 0 ? `
          <span class="inline-flex items-center gap-1 tabular-nums">
            <i data-lucide="check-circle" class="h-3 w-3"></i>
            ${task.progressFraction.done}/${task.progressFraction.total}
          </span>
        ` : ''}
      </div>
    </article>
  `;
}

function renderRoadmap(filteredTasks) {
  const container = document.getElementById("roadmap-quarters");

  container.innerHTML = QUARTERS.map(q => {
    const qTasks = filteredTasks.filter(t => getQuarter(t.date) === q);

    let labelHint = "";
    if (q === "Q1") labelHint = "Jan-Mar";
    else if (q === "Q2") labelHint = "Abr-Jun";
    else if (q === "Q3") labelHint = "Jul-Set";
    else if (q === "Q4") labelHint = "Out-Dez";
    else labelHint = "Sem data registrada";

    return `
      <div class="flex-1 min-w-[280px]">
        <h3 class="mb-4 text-sm font-semibold flex items-center gap-2">
          ${q}
          <span class="text-xs font-normal text-muted-foreground">
            ${labelHint}
          </span>
        </h3>
        <div class="relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-border/60">
          ${qTasks.length === 0 ? '<div class="py-4 text-xs text-muted-foreground italic">Nenhuma tarefa planejada</div>' : ''}
          <div class="flex flex-col gap-3">
            ${qTasks.map((t, idx) => {
      const priorityColor = t.priority ? `var(--priority-${t.priority})` : "transparent";
      const col = COLUMNS.find(c => c.statuses.includes(t.status)) || { title: t.status };
      const archiveBadge = t.area === "archive" ? `
                <span class="inline-flex items-center rounded-md border border-border bg-muted/65 px-1 py-0.2 text-[8px] text-muted-foreground">Arq</span>
              ` : "";
      return `
                <div class="group relative py-1" onclick="openModal('${t.id}')">
                  <div class="absolute left-[-21px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background ring-1 ring-border/50 transition-colors" style="background: var(--status-${t.status})"></div>
                  
                  <div class="cursor-pointer rounded-lg border border-transparent bg-card/40 p-3 transition hover:border-border hover:bg-card hover:shadow-sm">
                    <div class="mb-1.5 flex items-start justify-between gap-2">
                      <h4 class="text-sm font-medium leading-snug group-hover:text-primary">${t.title}</h4>
                      <div class="flex items-center gap-2 shrink-0">
                        ${archiveBadge}
                        <div class="h-1.5 w-1.5 rounded-full" style="background: ${priorityColor}"></div>
                      </div>
                    </div>
                    
                    <div class="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div class="flex items-center gap-1.5">
                        <span class="inline-flex items-center gap-1">
                          ${getCategoryLabel(t.category)}
                        </span>
                      </div>
                      <span class="inline-flex items-center gap-1 font-medium" style="color: var(--status-${t.status})">
                        ${col.title}
                        ${t.status !== 'done' ? `&middot; ${t.progress}%` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --- MODAL ---
window.openModal = function (id) {
  state.selectedTaskId = id;
  renderApp();
  document.getElementById("task-modal").classList.remove("hidden");
}

function closeModal() {
  state.selectedTaskId = null;
  document.getElementById("task-modal").classList.add("hidden");
  renderApp();
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function applyInlineFormatting(text) {
  // Negrito: **texto**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Itálico: *texto* ou _texto_
  formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
  formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");

  // Código inline: `código`
  formatted = formatted.replace(/`(.*?)`/g, '<code class="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">$1</code>');

  return formatted;
}

function convertMarkdownToHtml(content) {
  if (!content) return "";

  // Pre-process: ensure ### sub-headings are their own blocks
  content = content.replace(/(\S)\r?\n(### )/g, '$1\n\n$2');
  content = content.replace(/(### .+)\r?\n(\S)/g, '$1\n\n$2');

  // 1. Dividir em blocos separados por linhas em branco (\n\s*\n)
  const rawBlocks = content.split(/\r?\n\s*\r?\n/);
  const htmlBlocks = [];

  for (const rawBlock of rawBlocks) {
    const trimmedBlock = rawBlock.trim();
    if (!trimmedBlock) continue;

    const lines = trimmedBlock.split(/\r?\n/);
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim();

    // Caso 0: Sub-heading ### (render como h5)
    if (firstLine.startsWith("### ")) {
      const headingText = escapeHtml(firstLine.substring(4).trim());
      const inlineHtml = applyInlineFormatting(headingText);
      htmlBlocks.push(`<h5 class="font-semibold text-foreground text-xs mt-3 mb-1.5">${inlineHtml}</h5>`);
      // If there are more lines after the heading in the same block, process them as a paragraph
      if (lines.length > 1) {
        const restLines = lines.slice(1).map(l => l.trim()).join(" ");
        const restEscaped = escapeHtml(restLines);
        const restFormatted = applyInlineFormatting(restEscaped);
        htmlBlocks.push(`<p class="leading-relaxed text-muted-foreground text-xs md:text-sm mb-3">${restFormatted}</p>`);
      }
      continue;
    }

    // Caso 1: Checkbox lista (- [x] ou - [ ])
    if (firstLine.startsWith("- [x]") || firstLine.startsWith("- [ ]") || firstLine.startsWith("- [X]")) {
      let listHtml = '<ul class="space-y-1.5">';
      for (const line of lines) {
        const trimmedLine = line.trim();
        const escapedText = escapeHtml(trimmedLine.substring(5).trim());
        const inlineHtml = applyInlineFormatting(escapedText);
        
        if (trimmedLine.toLowerCase().startsWith("- [x]")) {
          listHtml += `
            <li class="flex items-start gap-2 text-muted-foreground line-through">
              <i data-lucide="check-square" class="h-4 w-4 text-emerald-500 mt-0.5 shrink-0"></i>
              <span>${inlineHtml}</span>
            </li>`;
        } else {
          listHtml += `
            <li class="flex items-start gap-2">
              <i data-lucide="square" class="h-4 w-4 text-muted-foreground mt-0.5 shrink-0"></i>
              <span>${inlineHtml}</span>
            </li>`;
        }
      }
      listHtml += "</ul>";
      htmlBlocks.push(listHtml);
    }
    // Caso 2: Lista simples (- )
    else if (firstLine.startsWith("- ")) {
      let listHtml = '<ul class="list-disc pl-5 space-y-1">';
      for (const line of lines) {
        const trimmedLine = line.trim();
        const escapedText = escapeHtml(trimmedLine.substring(2).trim());
        const inlineHtml = applyInlineFormatting(escapedText);
        listHtml += `<li>${inlineHtml}</li>`;
      }
      listHtml += "</ul>";
      htmlBlocks.push(listHtml);
    }
    // Caso 3: Lista ordenada (1. )
    else if (/^\d+\.\s+/.test(firstLine)) {
      let listHtml = '<ol class="list-decimal pl-5 space-y-1">';
      for (const line of lines) {
        const trimmedLine = line.trim();
        const contentMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);
        const text = contentMatch ? contentMatch[1] : trimmedLine;
        const escapedText = escapeHtml(text.trim());
        const inlineHtml = applyInlineFormatting(escapedText);
        listHtml += `<li>${inlineHtml}</li>`;
      }
      listHtml += "</ol>";
      htmlBlocks.push(listHtml);
    }
    // Caso 4: Parágrafo normal
    else {
      const boldTitleMatch = firstLine.match(/^\*\*(.+)\*\*$/);
      if (boldTitleMatch && lines.length > 1) {
        const titleText = escapeHtml(boldTitleMatch[1]);
        const bodyTextJoined = lines.slice(1).map(l => l.trim()).join(" ");
        const bodyTextEscaped = escapeHtml(bodyTextJoined);
        const bodyTextFormatted = applyInlineFormatting(bodyTextEscaped);
        htmlBlocks.push(`
          <div class="mb-4">
            <h4 class="font-semibold text-foreground text-sm mb-1">${titleText}</h4>
            <p class="leading-relaxed text-muted-foreground text-xs md:text-sm">${bodyTextFormatted}</p>
          </div>`);
      } else {
        const joinedParagraph = lines.map(l => l.trim()).join(" ");
        const escapedText = escapeHtml(joinedParagraph);
        const inlineHtml = applyInlineFormatting(escapedText);
        htmlBlocks.push(`<p class="leading-relaxed text-muted-foreground text-xs md:text-sm mb-3">${inlineHtml}</p>`);
      }
    }
  }

  return htmlBlocks.join("\n\n");
}

function renderModal(task) {
  const col = COLUMNS.find(c => c.statuses.includes(task.status)) || { title: task.status };
  const priorityLabel = task.priority ? PRIORITY_LABEL[task.priority] : "Sem prioridade";
  const priorityColor = task.priority ? `var(--priority-${task.priority})` : "transparent";
  const realStatusLabel = REAL_STATUS_LABELS[task.status] || task.status;
  const dateStr = task.date ? new Date(task.date).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Não especificada";
  const fractionLabel = task.progressFraction && task.progressFraction.total > 0
    ? `${task.progressFraction.done}/${task.progressFraction.total} critérios`
    : '';

  // Header Badges + Info button
  document.getElementById("modal-header-badges").innerHTML = `
    <div class="flex items-center gap-2 flex-wrap">
      <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 gap-1.5 px-2 font-medium">
        <div class="h-2 w-2 rounded-full" style="background: ${priorityColor}"></div>
        Prioridade ${priorityLabel}
      </div>
      <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 gap-1.5 px-2 font-medium">
        ${getCategoryLabel(task.category)}
      </div>
      <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 gap-1.5 px-2 font-medium">
        Área: ${task.area === "active" ? "Ativo" : "Arquivado"}
      </div>
    </div>
  `;

  // Info popover content
  const infoTooltip = document.getElementById("info-tooltip");
  if (infoTooltip) {
    infoTooltip.innerHTML = `
      <p class="text-xs text-muted-foreground leading-relaxed">
        Este item é gerado de forma estática com base na pasta <code class="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">${task.path}</code>.
        Para marcar progresso ou atualizar o conteúdo, edite o arquivo <code class="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">README.md</code> correspondente no repositório.
      </p>
    `;
  }

  // --- TAB: Conteúdo ---
  let tabConteudo = '';
  if (task.sections && task.sections.length > 0) {
    tabConteudo = `
      <div class="space-y-5">
        ${task.sections.map(sec => `
          <div>
            <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
              ${sec.heading}
            </h3>
            <div class="pl-3 text-xs md:text-sm">
              ${convertMarkdownToHtml(sec.content)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    tabConteudo = '<p class="text-sm text-muted-foreground italic py-6 text-center">Nenhuma informação disponível</p>';
  }

  // --- TAB: Critérios ---
  let tabCriterios = '';
  if (task.criteriaSections && task.criteriaSections.length > 0) {
    tabCriterios = `
      <div class="space-y-5">
        ${task.criteriaSections.map(sec => `
          <div>
            <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
              ${sec.heading}
            </h3>
            <div class="pl-3 text-xs md:text-sm">
              ${convertMarkdownToHtml(sec.content)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    tabCriterios = '<p class="text-sm text-muted-foreground italic py-6 text-center">Nenhuma informação disponível</p>';
  }

  // --- TAB: Detalhes ---
  const tabDetalhes = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
        <div>
          <div class="text-[11px] font-medium text-muted-foreground">ID do Item (Slug)</div>
          <div class="mt-1 text-sm font-mono truncate" title="${task.id}">
            ${task.id}
          </div>
        </div>
        <div>
          <div class="text-[11px] font-medium text-muted-foreground">Data Registro</div>
          <div class="mt-1 flex items-center gap-2 text-sm">
            <i data-lucide="calendar" class="h-4 w-4 text-muted-foreground"></i>
            ${dateStr}
          </div>
        </div>
        <div>
          <div class="text-[11px] font-medium text-muted-foreground">Status Atual</div>
          <div class="mt-1 flex flex-col gap-0.5">
            <div class="flex items-center gap-2 text-sm font-medium" style="color: var(--status-${task.status})">
              ${col.title}
            </div>
            <div class="text-[10px] text-muted-foreground">
              Status real: ${realStatusLabel}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 class="mb-2 text-xs font-semibold text-muted-foreground">Tags</h4>
        <div class="flex flex-wrap gap-2">
          ${task.tags.length > 0 ? task.tags.map(t => `
            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 font-normal">
              ${t}
            </span>
          `).join('') : '<span class="text-xs text-muted-foreground italic">Nenhuma tag registrada</span>'}
        </div>
      </div>

      <div class="text-xs text-muted-foreground font-mono bg-muted/20 p-2 rounded border">
        <strong>Caminho do arquivo:</strong> ${task.path}/README.md
      </div>
    </div>
  `;

  // Body
  document.getElementById("modal-body").innerHTML = `
    <!-- Topo com Título e Resumo -->
    <div class="mb-5">
      <h2 class="text-2xl font-semibold tracking-tight">${task.title}</h2>
      ${task.summary ? `<p class="mt-3 text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-3 bg-muted/20 py-2 pr-2 rounded-r-md">${task.summary}</p>` : ''}
    </div>

    <!-- Progresso Compacto (sempre visível, fora das abas) -->
    <div class="mb-5 border-t border-border/50 pt-4">
      <div class="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Progresso${fractionLabel ? ` · ${fractionLabel}` : ''}</span>
        <span class="font-semibold tabular-nums">${task.progress}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-muted">
        <div class="h-full rounded-full transition-all" style="width: ${task.progress}%; background: var(--gradient-primary);"></div>
      </div>
    </div>

    <!-- Sistema de Abas -->
    <div class="mb-5">
      <div class="modal-tabs flex border-b border-border/50">
        <button class="modal-tab active" data-tab="conteudo" onclick="switchTab('conteudo')">
          <i data-lucide="file-text" class="h-3.5 w-3.5"></i>
          Conteúdo
        </button>
        <button class="modal-tab" data-tab="criterios" onclick="switchTab('criterios')">
          <i data-lucide="check-square" class="h-3.5 w-3.5"></i>
          Critérios
        </button>
        <button class="modal-tab" data-tab="detalhes" onclick="switchTab('detalhes')">
          <i data-lucide="info" class="h-3.5 w-3.5"></i>
          Detalhes
        </button>
      </div>
    </div>

    <!-- Painéis das Abas -->
    <div id="tab-panel-conteudo" class="tab-panel">
      ${tabConteudo}
    </div>
    <div id="tab-panel-criterios" class="tab-panel hidden">
      ${tabCriterios}
    </div>
    <div id="tab-panel-detalhes" class="tab-panel hidden">
      ${tabDetalhes}
    </div>
  `;

  // Footer simplificado (só ID + data)
  document.getElementById("modal-footer").innerHTML = `
    <div class="text-[11px] text-muted-foreground font-mono truncate" title="${task.id}">
      ${task.id}
    </div>
    <div class="text-[11px] text-muted-foreground flex items-center gap-1">
      <i data-lucide="calendar" class="h-3 w-3"></i>
      ${dateStr}
    </div>
  `;
}

window.switchTab = function(tabName) {
  // Hide all panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  // Deactivate all tabs
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  // Show selected panel
  const panel = document.getElementById(`tab-panel-${tabName}`);
  if (panel) panel.classList.remove('hidden');
  // Activate selected tab
  const tab = document.querySelector(`.modal-tab[data-tab="${tabName}"]`);
  if (tab) tab.classList.add('active');
  // Re-create Lucide icons in the newly visible panel
  if (window.lucide) lucide.createIcons();
}


window.setPriorityFilter = function (p) {
  state.priorityFilter = p;
  renderApp();
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  document.getElementById("btn-view-kanban").addEventListener("click", () => {
    state.view = "kanban";
    updateViewButtons();
    renderApp();
  });

  document.getElementById("btn-view-roadmap").addEventListener("click", () => {
    state.view = "roadmap";
    updateViewButtons();
    renderApp();
  });

  const btnTheme = document.getElementById("btn-theme-toggle");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      state.dark = !state.dark;
      localStorage.setItem("theme", state.dark ? "dark" : "light");
      applyTheme();
    });
  }

  const selectVisualTheme = document.getElementById("select-visual-theme");
  if (selectVisualTheme) {
    selectVisualTheme.addEventListener("change", (e) => {
      state.visualTheme = e.target.value;
      localStorage.setItem("visualTheme", state.visualTheme);
      applyTheme();
      renderApp();
    });
  }

  const btnToggleCancelled = document.getElementById("btn-toggle-cancelled");
  if (btnToggleCancelled) {
    btnToggleCancelled.addEventListener("click", () => {
      state.hideCancelled = !state.hideCancelled;
      localStorage.setItem("hideCancelled", state.hideCancelled);
      applyHideCancelledUI();
      renderApp();
    });
  }

  document.getElementById("input-search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderApp();
  });

  // Novos seletores de Filtro
  document.getElementById("select-category").addEventListener("change", (e) => {
    state.categoryFilter = e.target.value;
    renderApp();
  });

  document.getElementById("select-area").addEventListener("change", (e) => {
    state.areaFilter = e.target.value;
    renderApp();
  });

  document.getElementById("btn-close-modal").addEventListener("click", closeModal);
  document.getElementById("task-modal-backdrop").addEventListener("click", closeModal);

  // Info popover toggle
  const btnInfo = document.getElementById("btn-info-modal");
  const infoTooltip = document.getElementById("info-tooltip");
  if (btnInfo && infoTooltip) {
    btnInfo.addEventListener("click", (e) => {
      e.stopPropagation();
      infoTooltip.classList.toggle("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!btnInfo.contains(e.target) && !infoTooltip.contains(e.target)) {
        infoTooltip.classList.add("hidden");
      }
    });
  }

  // Esc para fechar modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.selectedTaskId) {
      closeModal();
    }
  });

  // Exportar JSON
  document.getElementById("btn-export-json").addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "roadmap_tarefas.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Importar JSON (Apenas visualização em sessão)
  const fileInput = document.getElementById("input-file-json");
  document.getElementById("btn-import-json").addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target.result);
        if (Array.isArray(importedTasks)) {
          tasks = importedTasks;
          renderApp();
          alert("Dados importados com sucesso para visualização da sessão!");
        } else {
          alert("O arquivo JSON não contém um array de tarefas válido.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
        console.error(err);
      }
      fileInput.value = "";
    };
    reader.readAsText(file);
  });
}

function updateViewButtons() {
  const btnK = document.getElementById("btn-view-kanban");
  const btnR = document.getElementById("btn-view-roadmap");

  if (state.view === "kanban") {
    btnK.classList.remove("bg-transparent", "text-foreground");
    btnK.classList.add("bg-primary", "text-primary-foreground", "shadow");

    btnR.classList.remove("bg-primary", "text-primary-foreground", "shadow");
    btnR.classList.add("bg-transparent", "text-foreground");
  } else {
    btnR.classList.remove("bg-transparent", "text-foreground");
    btnR.classList.add("bg-primary", "text-primary-foreground", "shadow");

    btnK.classList.remove("bg-primary", "text-primary-foreground", "shadow");
    btnK.classList.add("bg-transparent", "text-foreground");
  }
}

// --- CONTROLE DE TEMAS (Claro/Escuro e Tema Visual) ---
function initTheme() {
  const storedThemeMode = localStorage.getItem("theme");
  const isDark = storedThemeMode === "dark" || !storedThemeMode;
  state.dark = isDark;
  
  const savedVisualTheme = localStorage.getItem("visualTheme") || "default";
  state.visualTheme = savedVisualTheme;
  
  applyTheme();
}

function applyTheme() {
  if (state.dark) {
    document.documentElement.classList.add("dark");
    document.getElementById("icon-theme-moon").classList.remove("hidden");
    document.getElementById("icon-theme-sun").classList.add("hidden");
    document.getElementById("text-theme").textContent = "Escuro";
  } else {
    document.documentElement.classList.remove("dark");
    document.getElementById("icon-theme-sun").classList.remove("hidden");
    document.getElementById("icon-theme-moon").classList.add("hidden");
    document.getElementById("text-theme").textContent = "Claro";
  }
  
  document.documentElement.dataset.theme = state.visualTheme;
  const selectTheme = document.getElementById("select-visual-theme");
  if (selectTheme) selectTheme.value = state.visualTheme;
}

function applyHideCancelledUI() {
  const btnText = document.getElementById("text-cancelled");
  const iconOff = document.getElementById("icon-cancelled-off");
  const iconOn = document.getElementById("icon-cancelled-on");

  if (btnText && iconOff && iconOn) {
    if (state.hideCancelled) {
      btnText.textContent = "Mostrar cancelados";
      iconOff.classList.add("hidden");
      iconOn.classList.remove("hidden");
    } else {
      btnText.textContent = "Ocultar cancelados";
      iconOff.classList.remove("hidden");
      iconOn.classList.add("hidden");
    }
  }
}
