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
  selectedTaskId: null,
  serverPort: null, // null quando config.json ainda não foi carregado
  accordionState: {
    backlog: true,       // "Em preparação" inicia ABERTA por padrão
    approved: false,     // "Aprovado" inicia FECHADA por padrão
    "in-progress": false,// "Em Progresso" inicia FECHADA por padrão
    done: false,         // "Concluído" inicia FECHADA por padrão
    cancelled: false     // "Cancelado" inicia FECHADA por padrão
  }
};

let pollingIntervalId = null;

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupEventListeners();
  loadTasks();
  loadProjectConfig();
  renderApp();
  startPolling();
  checkWelcomeModal();
});

// --- INICIALIZAÇÃO DOS DADOS ---
function loadTasks() {
  // Carrega os dados reais do arquivo data.js (ROADMAP_TASKS)
  tasks = typeof ROADMAP_TASKS !== 'undefined' ? JSON.parse(JSON.stringify(ROADMAP_TASKS)) : [];
}

const DEFAULT_CONFIG = {
  projectName: "Devboard",
  projectDescription: "Acompanhe em tempo real o planejamento, progresso e critérios de conclusão de novas features, bugs e refatorações.",
  projectBadge: "Universal Roadmap - 2026"
};

// --- CONFIGURAÇÃO DE IDENTIDADE DO PROJETO ---
async function loadProjectConfig() {
  const identityContainer = document.getElementById("header-identity");
  let cfg = { ...DEFAULT_CONFIG };

  try {
    const res = await fetch('roadmap/config.json?_t=' + Date.now());
    if (res.ok) {
      const config = await res.json();
      if (config.serverPort) {
        state.serverPort = config.serverPort;
      }
      cfg.projectName = config.projectName || cfg.projectName;
      cfg.projectDescription = config.projectDescription || cfg.projectDescription;
      cfg.projectBadge = config.projectBadge || cfg.projectBadge;
    }
  } catch (err) {
    console.warn("[roadmap] Falha ao carregar config.json (usando fallbacks estáticos).");
  } finally {
    updateHeader(cfg.projectName, cfg.projectDescription, cfg.projectBadge);
    updateDynamicServerPortUI();
    
    // Popular inputs do drawer sempre (mesmo em modo estático/file://)
    const inputName = document.getElementById("input-project-name");
    const inputDesc = document.getElementById("input-project-description");
    const inputBadge = document.getElementById("input-project-badge");
    if (inputName) inputName.value = cfg.projectName;
    if (inputDesc) inputDesc.value = cfg.projectDescription;
    if (inputBadge) inputBadge.value = cfg.projectBadge;

    if (identityContainer) {
      identityContainer.classList.remove("opacity-0");
      identityContainer.classList.add("opacity-100");
    }
  }
}

function updateDynamicServerPortUI() {
  const elInstruction = document.getElementById("static-mode-instruction");
  const elTechServer = document.getElementById("tech-server-address");

  if (!isStaticMode && state.serverPort) {
    if (elInstruction) {
      elInstruction.innerHTML = `Rode o comando acima no terminal na raiz do projeto e acesse <span id="static-mode-url" class="font-mono text-primary">http://localhost:${state.serverPort}</span> para reativar o polling automático.`;
    }
    if (elTechServer) {
      elTechServer.textContent = `localhost:${state.serverPort}`;
      elTechServer.className = "font-mono text-green-500 font-medium";
    }
  } else {
    if (elInstruction) {
      elInstruction.textContent = "Rode o comando acima no terminal na raiz do projeto. O endereço para acessar (com a porta configurada) aparecerá no terminal ao iniciar o servidor.";
    }
    if (elTechServer) {
      elTechServer.textContent = isDemoMode ? "Nenhum servidor ativo (Modo Demo)" : "Nenhum servidor ativo (Modo Estático)";
      elTechServer.className = "font-mono text-amber-500/90 italic";
    }
  }
}

function updateHeader(name, desc, badge) {
  const elName = document.getElementById("project-name");
  const elDesc = document.getElementById("project-description");
  const elBadge = document.getElementById("project-badge");
  
  if (elName) elName.innerText = name;
  if (elDesc) elDesc.innerText = desc;
  if (elBadge) {
    elBadge.innerHTML = `<i data-lucide="sparkles" class="h-3.5 w-3.5 text-primary"></i> ${badge}`;
  }

  const mobName = document.getElementById("mobile-project-name");
  const mobBadgeText = document.getElementById("mobile-project-badge-text");
  if (mobName) mobName.innerText = name;
  if (mobBadgeText && badge) mobBadgeText.innerText = badge;

  const tabName = document.getElementById("tablet-project-name");
  const tabBadgeText = document.getElementById("tablet-project-badge-text");
  if (tabName) tabName.innerText = name;
  if (tabBadgeText && badge) tabBadgeText.innerText = badge;

  if (window.lucide) lucide.createIcons();
}

async function saveProjectIdentity() {
  const name = document.getElementById("input-project-name").value;
  const desc = document.getElementById("input-project-description").value;
  const badge = document.getElementById("input-project-badge").value;
  
  const btn = document.getElementById("btn-save-identity");
  const originalText = btn.innerHTML;

  const showBtnFeedback = (text, icon, isError = false) => {
    btn.innerHTML = `<i data-lucide="${icon}" class="h-4 w-4"></i> ${text}`;
    if (isError) {
      btn.style.backgroundColor = "var(--destructive)";
      btn.style.color = "var(--destructive-foreground)";
      btn.style.borderColor = "var(--destructive)";
    } else {
      btn.style.backgroundColor = "var(--status-done)";
      btn.style.color = "#ffffff";
      btn.style.borderColor = "var(--status-done)";
    }
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.backgroundColor = "";
      btn.style.color = "";
      btn.style.borderColor = "";
      if (window.lucide) lucide.createIcons();
    }, 2500);
  };
  
  try {
    const res = await fetch('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: name,
        projectDescription: desc,
        projectBadge: badge
      })
    });
    
    if (res.ok) {
      // Atualiza header imediatamente sem recarregar
      updateHeader(name, desc, badge);
      showBtnFeedback("Salvo!", "check", false);
    } else {
      showBtnFeedback("Somente leitura (demo)", "alert-circle", true);
    }
  } catch (err) {
    console.error(err);
    showBtnFeedback("Somente leitura (demo)", "alert-circle", true);
  }
}

let isStaticMode = false;
let isDemoMode = false;

function setStaticMode(isStatic) {
  const isFileProtocol = window.location.protocol === 'file:';
  const isDemo = isStatic && !isFileProtocol;

  if (isStaticMode === isStatic && isDemoMode === isDemo) return;
  isStaticMode = isStatic;
  isDemoMode = isDemo;

  const staticBadge = document.getElementById("static-mode-badge");
  const mobStaticBadge = document.getElementById("mobile-static-mode-badge");
  const tabStaticBadge = document.getElementById("tablet-static-mode-badge");

  [staticBadge, mobStaticBadge, tabStaticBadge].forEach(badge => {
    if (badge) {
      if (isStatic) {
        badge.classList.remove("hidden");
        badge.classList.add("inline-flex");
        if (isDemo) {
          badge.innerHTML = `<i data-lucide="globe" class="h-3.5 w-3.5"></i> Modo Demo`;
          badge.className = "inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-400";
        } else {
          badge.innerHTML = `<i data-lucide="wifi-off" class="h-3.5 w-3.5"></i> Modo estático`;
          badge.className = "inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500";
        }
      } else {
        badge.classList.add("hidden");
        badge.classList.remove("inline-flex");
      }
    }
  });

  const elTechStatus = document.getElementById("tech-polling-status");
  if (elTechStatus) {
    if (!isStatic) {
      elTechStatus.textContent = "Polling ativo";
      elTechStatus.className = "font-mono text-green-500 font-medium";
    } else if (isDemo) {
      elTechStatus.textContent = "Inativo (Modo Demo / Somente Leitura)";
      elTechStatus.className = "font-mono text-amber-500 font-medium";
    } else {
      elTechStatus.textContent = "Inativo (Modo Estático / Servidor Offline)";
      elTechStatus.className = "font-mono text-amber-500 font-medium";
    }
  }

  // Trava formulário de Identidade do Projeto se estiver no Modo Demo
  const demoNotice = document.getElementById("demo-mode-notice");
  const inputName = document.getElementById("input-project-name");
  const inputDesc = document.getElementById("input-project-description");
  const inputBadge = document.getElementById("input-project-badge");
  const btnSave = document.getElementById("btn-save-identity");

  if (demoNotice) {
    if (isDemo) {
      demoNotice.classList.remove("hidden");
    } else {
      demoNotice.classList.add("hidden");
    }
  }

  [inputName, inputDesc, inputBadge].forEach(el => {
    if (el) {
      if (isDemo) {
        el.disabled = true;
        el.classList.add("opacity-60", "cursor-not-allowed");
      } else {
        el.disabled = false;
        el.classList.remove("opacity-60", "cursor-not-allowed");
      }
    }
  });

  if (btnSave) {
    if (isDemo) {
      btnSave.disabled = true;
      btnSave.innerHTML = `<i data-lucide="lock" class="h-4 w-4"></i> Edição indisponível no modo demo`;
      btnSave.className = "w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none bg-muted text-muted-foreground border border-border/50 opacity-60 cursor-not-allowed h-9 px-4 py-2 gap-1.5 shadow-none";
    } else {
      btnSave.disabled = false;
      btnSave.innerHTML = `<i data-lucide="save" class="h-4 w-4"></i> Salvar identidade do projeto`;
      btnSave.className = "w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md cursor-pointer h-9 px-4 py-2 gap-1.5 font-medium";
    }
  }

  updateDynamicServerPortUI();

  if (window.lucide) lucide.createIcons();
}

// --- POLLING DE DADOS ---
function startPolling() {
  const savedInterval = localStorage.getItem("pollingInterval");
  const interval = savedInterval ? parseInt(savedInterval, 10) : 2500;
  
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    console.log(`[roadmap] Polling timer limpo e recriado com novo valor: ${interval} ms`);
  } else {
    console.log(`[roadmap] Polling inicializado com valor: ${interval} ms`);
  }

  // Sincroniza o select no drawer com o valor atual
  const selectPolling = document.getElementById("select-polling-interval");
  if (selectPolling) selectPolling.value = interval.toString();
  
  const checkData = async () => {
    try {
      // 1. Testa se o servidor Node.js real (roadmap-server.js) está ativo
      const healthRes = await fetch('health?_t=' + Date.now());
      if (!healthRes.ok) {
        setStaticMode(true);
        return;
      }
      const healthData = await healthRes.json();
      if (!healthData || !healthData.server) {
        setStaticMode(true);
        return;
      }

      setStaticMode(false);

      // 2. Servidor ativo: busca dados atualizados em tempo real do data.json
      const res = await fetch('roadmap/data.json?_t=' + Date.now());
      if (res.ok) {
        const newTasks = await res.json();
        if (JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
          tasks = newTasks;
          renderApp();
        }
      }
    } catch (err) {
      setStaticMode(true);
      console.warn("[roadmap] Polling falhou (servidor offline ou modo estático). Fallback estático mantido.");
    }
  };

  checkData();
  pollingIntervalId = setInterval(checkData, interval);
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
  updateViewButtons();

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

  const statsContainer = document.getElementById("stats-container");
  if (statsContainer) {
    statsContainer.innerHTML = `
      ${createStatCard("Tarefas", total)}
      ${createStatCard("Concluídas", done, "done")}
      ${createStatCard("Em execução", progress, "in-progress")}
      ${createStatCard("Progresso médio", `${avg}%`, "primary")}
    `;
  }

  // Mobile stats summary & strip
  const mobSummary = document.getElementById("mobile-stats-summary");
  if (mobSummary) {
    mobSummary.textContent = `${total} tarefas · ${avg}% concluído`;
  }
  const mobTotal = document.getElementById("mobile-stat-total");
  if (mobTotal) mobTotal.textContent = total;
  const mobDone = document.getElementById("mobile-stat-done");
  if (mobDone) mobDone.textContent = done;
  const mobProgress = document.getElementById("mobile-stat-progress");
  if (mobProgress) mobProgress.textContent = progress;
  const mobAvg = document.getElementById("mobile-stat-avg");
  if (mobAvg) mobAvg.textContent = `${avg}%`;

  // Tablet stats summary & strip
  const tabSummary = document.getElementById("tablet-stats-summary");
  if (tabSummary) {
    tabSummary.textContent = `${total} tarefas · ${avg}% concluído`;
  }
  const tabTotal = document.getElementById("tablet-stat-total");
  if (tabTotal) tabTotal.textContent = total;
  const tabDone = document.getElementById("tablet-stat-done");
  if (tabDone) tabDone.textContent = done;
  const tabProgress = document.getElementById("tablet-stat-progress");
  if (tabProgress) tabProgress.textContent = progress;
  const tabAvg = document.getElementById("tablet-stat-avg");
  if (tabAvg) tabAvg.textContent = `${avg}%`;
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

  const html = filters.map(f => `
    <button
      onclick="setPriorityFilter('${f.id}')"
      class="rounded-full border px-2.5 py-0.5 text-xs transition-all duration-150 cursor-pointer ${state.priorityFilter === f.id
      ? 'border-primary bg-primary text-primary-foreground shadow-sm font-medium'
      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/40'
    }"
    >${f.label}</button>
  `).join('');

  const deskContainer = document.getElementById("priority-filters");
  if (deskContainer) deskContainer.innerHTML = html;

  const mobContainer = document.getElementById("mobile-priority-filters");
  if (mobContainer) mobContainer.innerHTML = html;

  const tabContainer = document.getElementById("tablet-priority-filters");
  if (tabContainer) tabContainer.innerHTML = html;
}

function toggleColumnAccordion(colId) {
  if (!state.accordionState) {
    state.accordionState = {};
  }
  state.accordionState[colId] = !state.accordionState[colId];
  renderApp();
}

function renderKanban(filteredTasks) {
  const container = document.getElementById("view-kanban");

  if (state.hideCancelled) {
    container.className = "grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-4";
  } else {
    container.className = "grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5";
  }

  container.innerHTML = COLUMNS.map(col => {
    if (col.id === "cancelled" && state.hideCancelled) return '';
    const colTasks = filteredTasks.filter(t => col.statuses.includes(t.status));
    const isOpen = state.accordionState && state.accordionState[col.id] !== undefined ? state.accordionState[col.id] : (col.id === "backlog");

    return `
      <section
        data-col-id="${col.id}"
        class="kanban-col rounded-xl border bg-card/60 p-3 transition border-border"
      >
        <header
          onclick="toggleColumnAccordion('${col.id}')"
          class="accordion-header flex items-center justify-between p-2 rounded-lg transition-all duration-150 select-none cursor-pointer lg:cursor-default lg:pointer-events-none lg:p-0 lg:bg-transparent lg:border-transparent lg:hover:bg-transparent ${isOpen ? 'mb-2' : 'mb-0 lg:mb-3'}"
        >
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full" style="background: var(--status-${col.id})"></span>
            <h2 class="text-sm font-semibold">${col.title}</h2>
            <span class="inline-flex items-center rounded-md border border-transparent bg-secondary text-secondary-foreground h-5 px-1.5 text-[10px] font-semibold">
              ${colTasks.length}
            </span>
          </div>
          <div class="block lg:hidden text-muted-foreground p-1 hover:text-foreground">
            <i data-lucide="${isOpen ? 'chevron-up' : 'chevron-down'}" class="h-4 w-4"></i>
          </div>
        </header>
        <div class="${isOpen ? 'block' : 'hidden lg:block'} transition-all duration-200">
          <p class="mb-3 px-1 text-[11px] text-muted-foreground">${col.hint}</p>
          <div class="flex flex-col gap-2 min-h-[80px]">
            ${colTasks.map(t => renderTaskCard(t)).join('')}
            ${colTasks.length === 0 ? '<div class="rounded-lg border border-dashed border-border/70 py-6 text-center text-xs text-muted-foreground">Solte tarefas aqui</div>' : ''}
          </div>
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
      <section class="roadmap-col flex-1 min-w-[280px] rounded-xl border bg-card/60 p-3 transition border-border">
        <h3 class="mb-3 text-sm font-semibold flex items-center gap-2 px-1">
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
      const themeClasses = state.visualTheme === "default" ? "card-blueprint-corner" : "";
      return `
                <div class="group relative py-1" onclick="openModal('${t.id}')">
                  <div class="absolute left-[-21px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background ring-1 ring-border/50 transition-colors" style="background: var(--status-${t.status})"></div>
                  
                  <div class="cursor-pointer rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-card)] transition [transition:var(--transition-smooth)] hover:-translate-y-0.5 hover:border-primary/50 ${themeClasses}">
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
      </section>
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
  updateMobileFilterDot();
  renderApp();
}

function updateViewButtons() {
  const isKanban = state.view === "kanban";
  // Desktop
  const btnKanban = document.getElementById("btn-view-kanban");
  const btnRoadmap = document.getElementById("btn-view-roadmap");
  if (btnKanban && btnRoadmap) {
    if (isKanban) {
      btnKanban.className = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 h-8 px-3 gap-1.5 bg-primary text-primary-foreground shadow cursor-pointer active:scale-95";
      btnRoadmap.className = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 hover:bg-muted hover:text-foreground h-8 px-3 gap-1.5 cursor-pointer active:scale-95";
    } else {
      btnRoadmap.className = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 h-8 px-3 gap-1.5 bg-primary text-primary-foreground shadow cursor-pointer active:scale-95";
      btnKanban.className = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 hover:bg-muted hover:text-foreground h-8 px-3 gap-1.5 cursor-pointer active:scale-95";
    }
  }
  // Mobile
  const mBtnKanban = document.getElementById("btn-mobile-view-kanban");
  const mBtnRoadmap = document.getElementById("btn-mobile-view-roadmap");
  if (mBtnKanban && mBtnRoadmap) {
    if (isKanban) {
      mBtnKanban.className = "flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium h-7 gap-1 bg-primary text-primary-foreground shadow cursor-pointer active:scale-95 transition-all duration-150";
      mBtnRoadmap.className = "flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium h-7 gap-1 hover:bg-muted hover:text-foreground cursor-pointer active:scale-95 transition-all duration-150";
    } else {
      mBtnRoadmap.className = "flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium h-7 gap-1 bg-primary text-primary-foreground shadow cursor-pointer active:scale-95 transition-all duration-150";
      mBtnKanban.className = "flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium h-7 gap-1 hover:bg-muted hover:text-foreground cursor-pointer active:scale-95 transition-all duration-150";
    }
  }
  // Tablet
  const tBtnKanban = document.getElementById("btn-tablet-view-kanban");
  const tBtnRoadmap = document.getElementById("btn-tablet-view-roadmap");
  if (tBtnKanban && tBtnRoadmap) {
    if (isKanban) {
      tBtnKanban.className = "inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-3 gap-1 bg-primary text-primary-foreground shadow cursor-pointer active:scale-95 transition-all duration-150";
      tBtnRoadmap.className = "inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-3 gap-1 hover:bg-muted hover:text-foreground cursor-pointer active:scale-95 transition-all duration-150";
    } else {
      tBtnRoadmap.className = "inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-3 gap-1 bg-primary text-primary-foreground shadow cursor-pointer active:scale-95 transition-all duration-150";
      tBtnKanban.className = "inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-3 gap-1 hover:bg-muted hover:text-foreground cursor-pointer active:scale-95 transition-all duration-150";
    }
  }
}

function setView(view) {
  state.view = view;
  updateViewButtons();
  renderApp();
}

function updateMobileFilterDot() {
  const dot = document.getElementById("mobile-filter-dot");
  if (!dot) return;
  const isActive = state.categoryFilter !== "all" || state.areaFilter !== "all" || state.priorityFilter !== "all";
  if (isActive) {
    dot.classList.remove("hidden");
  } else {
    dot.classList.add("hidden");
  }
}

function toggleMobileSearch() {
  const searchBar = document.getElementById("mobile-search-bar");
  if (searchBar) {
    searchBar.classList.toggle("hidden");
    if (!searchBar.classList.contains("hidden")) {
      const input = document.getElementById("input-mobile-search");
      if (input) input.focus();
    }
  }
}

function toggleMobileFilterPanel() {
  const panel = document.getElementById("mobile-filter-panel");
  if (panel) {
    panel.classList.toggle("hidden");
  }
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

  // Settings Drawer Toggle
  document.getElementById("btn-open-settings").addEventListener("click", openSettings);
  document.getElementById("btn-close-settings").addEventListener("click", closeSettings);
  document.getElementById("settings-drawer-backdrop").addEventListener("click", closeSettings);

  const btnTheme = document.getElementById("btn-theme-toggle");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const cycle = { system: "dark", dark: "light", light: "system" };
      state.themeMode = cycle[state.themeMode] || "dark";
      localStorage.setItem("theme", state.themeMode);
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

  const selectPolling = document.getElementById("select-polling-interval");
  if (selectPolling) {
    selectPolling.addEventListener("change", (e) => {
      const val = e.target.value;
      localStorage.setItem("pollingInterval", val);
      startPolling();
    });
  }

  const btnSaveIdentity = document.getElementById("btn-save-identity");
  if (btnSaveIdentity) {
    btnSaveIdentity.addEventListener("click", saveProjectIdentity);
  }

  const inputDeskSearch = document.getElementById("input-search");
  if (inputDeskSearch) {
    inputDeskSearch.addEventListener("input", (e) => {
      state.query = e.target.value;
      const mobInput = document.getElementById("input-mobile-search");
      if (mobInput) mobInput.value = e.target.value;
      const tabInput = document.getElementById("input-tablet-search");
      if (tabInput) tabInput.value = e.target.value;
      renderApp();
    });
  }

  const inputMobSearch = document.getElementById("input-mobile-search");
  if (inputMobSearch) {
    inputMobSearch.addEventListener("input", (e) => {
      state.query = e.target.value;
      if (inputDeskSearch) inputDeskSearch.value = e.target.value;
      const tabInput = document.getElementById("input-tablet-search");
      if (tabInput) tabInput.value = e.target.value;
      renderApp();
    });
  }

  const inputTabSearch = document.getElementById("input-tablet-search");
  if (inputTabSearch) {
    inputTabSearch.addEventListener("input", (e) => {
      state.query = e.target.value;
      if (inputDeskSearch) inputDeskSearch.value = e.target.value;
      const mobInput = document.getElementById("input-mobile-search");
      if (mobInput) mobInput.value = e.target.value;
      renderApp();
    });
  }

  // Filtros de Categoria e Área
  const selectDeskCat = document.getElementById("select-category");
  if (selectDeskCat) {
    selectDeskCat.addEventListener("change", (e) => {
      state.categoryFilter = e.target.value;
      const mobCat = document.getElementById("select-mobile-category");
      if (mobCat) mobCat.value = e.target.value;
      const tabCat = document.getElementById("select-tablet-category");
      if (tabCat) tabCat.value = e.target.value;
      updateMobileFilterDot();
      renderApp();
    });
  }

  const selectMobCat = document.getElementById("select-mobile-category");
  if (selectMobCat) {
    selectMobCat.addEventListener("change", (e) => {
      state.categoryFilter = e.target.value;
      if (selectDeskCat) selectDeskCat.value = e.target.value;
      const tabCat = document.getElementById("select-tablet-category");
      if (tabCat) tabCat.value = e.target.value;
      updateMobileFilterDot();
      renderApp();
    });
  }

  const selectTabCat = document.getElementById("select-tablet-category");
  if (selectTabCat) {
    selectTabCat.addEventListener("change", (e) => {
      state.categoryFilter = e.target.value;
      if (selectDeskCat) selectDeskCat.value = e.target.value;
      const mobCat = document.getElementById("select-mobile-category");
      if (mobCat) mobCat.value = e.target.value;
      updateMobileFilterDot();
      renderApp();
    });
  }

  const selectDeskArea = document.getElementById("select-area");
  if (selectDeskArea) {
    selectDeskArea.addEventListener("change", (e) => {
      state.areaFilter = e.target.value;
      const mobArea = document.getElementById("select-mobile-area");
      if (mobArea) mobArea.value = e.target.value;
      const tabArea = document.getElementById("select-tablet-area");
      if (tabArea) tabArea.value = e.target.value;
      updateMobileFilterDot();
      renderApp();
    });
  }

  const selectMobArea = document.getElementById("select-mobile-area");
  if (selectMobArea) {
    selectMobArea.addEventListener("change", (e) => {
      state.areaFilter = e.target.value;
      if (selectDeskArea) selectDeskArea.value = e.target.value;
      const tabArea = document.getElementById("select-tablet-area");
      if (tabArea) tabArea.value = e.target.value;
      updateMobileFilterDot();
      renderApp();
    });
  }

  const selectTabArea = document.getElementById("select-tablet-area");
  if (selectTabArea) {
    selectTabArea.addEventListener("change", (e) => {
      state.areaFilter = e.target.value;
      if (selectDeskArea) selectDeskArea.value = e.target.value;
      const mobArea = document.getElementById("select-mobile-area");
      if (mobArea) mobArea.value = e.target.value;
      updateMobileFilterDot();
      renderApp();
    });
  }

  // Tablet Import JSON
  const btnTabImport = document.getElementById("btn-tablet-import-json");
  if (btnTabImport) {
    btnTabImport.addEventListener("click", () => {
      const fileInput = document.getElementById("input-file-json");
      if (fileInput) fileInput.click();
    });
  }

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

  // Popover do Modo Estático
  const btnStaticInfo = document.getElementById("btn-static-info");
  const popoverStatic = document.getElementById("static-mode-popover");
  if (btnStaticInfo && popoverStatic) {
    btnStaticInfo.addEventListener("click", (e) => {
      e.stopPropagation();
      popoverStatic.classList.toggle("hidden");
      if (window.lucide) lucide.createIcons();
    });
    document.addEventListener("click", (e) => {
      if (!btnStaticInfo.contains(e.target) && !popoverStatic.contains(e.target)) {
        popoverStatic.classList.add("hidden");
      }
    });
  }

  // Modal de Boas-Vindas (Apresentação e Setup)
  const btnCloseWelcome = document.getElementById("btn-close-welcome");
  if (btnCloseWelcome) {
    btnCloseWelcome.addEventListener("click", () => closeWelcomeModal(false));
  }
  const btnWelcomeLater = document.getElementById("btn-welcome-later");
  if (btnWelcomeLater) {
    btnWelcomeLater.addEventListener("click", () => closeWelcomeModal(false));
  }
  const btnWelcomeConfirm = document.getElementById("btn-welcome-confirm");
  if (btnWelcomeConfirm) {
    btnWelcomeConfirm.addEventListener("click", () => closeWelcomeModal(true));
  }
  const btnWelcomeDismiss = document.getElementById("btn-welcome-dismiss");
  if (btnWelcomeDismiss) {
    btnWelcomeDismiss.addEventListener("click", () => closeWelcomeModal(true));
  }
  const welcomeBackdrop = document.getElementById("welcome-modal-backdrop");
  if (welcomeBackdrop) {
    welcomeBackdrop.addEventListener("click", () => closeWelcomeModal(false));
  }

  // Esc para fechar modal, drawer ou boas-vindas
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const welcomeModal = document.getElementById("welcome-modal");
      if (welcomeModal && !welcomeModal.classList.contains("hidden")) {
        closeWelcomeModal(false);
        return;
      }
      const drawer = document.getElementById("settings-drawer");
      if (drawer && !drawer.classList.contains("hidden")) {
        closeSettings();
        return;
      }
      if (state.selectedTaskId) {
        closeModal();
      }
    }
  });

  // Exportar JSON
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "roadmap_tarefas.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const btnDeskExport = document.getElementById("btn-export-json");
  if (btnDeskExport) {
    btnDeskExport.addEventListener("click", exportJSON);
  }

  const btnTabExport = document.getElementById("btn-tablet-export-json");
  if (btnTabExport) {
    btnTabExport.addEventListener("click", exportJSON);
  }

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

window.openSettings = function() {
  const drawer = document.getElementById("settings-drawer");
  if (!drawer) return;

  const backdrop = document.getElementById("settings-drawer-backdrop");
  const panel = drawer.querySelector(".drawer-content");

  // 1. Tornar visível no DOM
  drawer.classList.remove("hidden");

  // 2. Disparar animação CSS no próximo frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (backdrop) backdrop.classList.add("is-open");
      if (panel) panel.classList.add("is-open");
    });
  });
};

window.closeSettings = function() {
  const drawer = document.getElementById("settings-drawer");
  if (!drawer || drawer.classList.contains("hidden")) return;

  const backdrop = document.getElementById("settings-drawer-backdrop");
  const panel = drawer.querySelector(".drawer-content");

  // 1. Iniciar transição de saída
  if (backdrop) backdrop.classList.remove("is-open");
  if (panel) panel.classList.remove("is-open");

  // 2. Adicionar hidden ao container somente após o término real da transição CSS
  let transitionEnded = false;
  const handleTransitionEnd = (e) => {
    if (e && e.target !== panel) return;
    if (!transitionEnded) {
      transitionEnded = true;
      if (panel) panel.removeEventListener("transitionend", handleTransitionEnd);
      drawer.classList.add("hidden");
    }
  };

  if (panel) {
    panel.addEventListener("transitionend", handleTransitionEnd, { once: true });
    setTimeout(handleTransitionEnd, 350);
  } else {
    drawer.classList.add("hidden");
  }
};

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

// --- CONTROLE DE TEMAS (Sistema / Escuro / Claro e Tema Visual) ---
function initTheme() {
  const storedThemeMode = localStorage.getItem("theme");
  state.themeMode = storedThemeMode || "system";
  
  const savedVisualTheme = localStorage.getItem("visualTheme") || "default";
  state.visualTheme = savedVisualTheme;

  const savedHideCancelled = localStorage.getItem("hideCancelled");
  state.hideCancelled = savedHideCancelled === "true";
  
  applyTheme();
  applyHideCancelledUI();

  // Escutar alterações do SO em tempo real se estiver no modo 'system'
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (state.themeMode === "system") {
        applyTheme();
      }
    });
  }
}

function applyTheme() {
  let isDark;
  if (state.themeMode === "dark") {
    isDark = true;
  } else if (state.themeMode === "light") {
    isDark = false;
  } else {
    // 'system'
    isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  state.dark = isDark;

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  const iconSun = document.getElementById("icon-theme-sun");
  const iconMoon = document.getElementById("icon-theme-moon");
  const iconSystem = document.getElementById("icon-theme-system");
  const textTheme = document.getElementById("text-theme");

  if (iconSun && iconMoon && iconSystem && textTheme) {
    iconSun.classList.add("hidden");
    iconMoon.classList.add("hidden");
    iconSystem.classList.add("hidden");

    if (state.themeMode === "dark") {
      iconMoon.classList.remove("hidden");
      textTheme.textContent = "Escuro";
    } else if (state.themeMode === "light") {
      iconSun.classList.remove("hidden");
      textTheme.textContent = "Claro";
    } else {
      iconSystem.classList.remove("hidden");
      textTheme.textContent = "Sistema";
    }
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

// --- MODAL DE BOAS-VINDAS (CHECKLIST DE SETUP) ---
function checkWelcomeModal() {
  const seen = localStorage.getItem("devboard-welcome-seen");
  if (!seen) {
    openWelcomeModal();
  }
}

function openWelcomeModal() {
  const modal = document.getElementById("welcome-modal");
  if (modal) {
    modal.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
  }
}

function closeWelcomeModal(dontShowAgain = false) {
  const modal = document.getElementById("welcome-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
  if (dontShowAgain) {
    localStorage.setItem("devboard-welcome-seen", "true");
  }
}
