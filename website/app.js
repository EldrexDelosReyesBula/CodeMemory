import {
  h,
  state,
  computed,
  div,
  h1,
  h2,
  h3,
  h4,
  p,
  span,
  button,
  input,
  header as Header,
  nav as Nav,
  footer as Footer,
  pre,
  code,
  mount,
} from './cairn.js';
import { EMBEDDED_DOCS } from './docs-data.js';

const img = (...args) => h('img', ...args);
const a = (...args) => h('a', ...args);

// --- Environment Detection ---
// Local CodeMemory Server only runs when served on port 3737 (via `codememory web`)
const isLocalCodeMemoryServer = typeof window !== 'undefined' && (
  window.location.port === '3737'
);
const isLocalEnvironment = isLocalCodeMemoryServer;

// --- Robust SVG Icon Engine ---
function createSvgIcon(pathD, size = 18, strokeWidth = 2) {
  const paths = Array.isArray(pathD) ? pathD : [pathD];
  const pathsHtml = paths.map((d) => `<path d="${d}"></path>`).join('');
  return h('span', {
    class: 'cairn-icon-wrapper',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${size}px`,
      height: `${size}px`,
      lineHeight: '1',
      verticalAlign: 'middle',
      flexShrink: '0',
    },
    innerHTML: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="display:block;width:100%;height:100%;">${pathsHtml}</svg>`,
  });
}

const Icons = {
  home: (size = 18) => createSvgIcon(['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'], size),
  book: (size = 18) => createSvgIcon(['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'], size),
  network: (size = 18) => createSvgIcon('M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98', size),
  brain: (size = 18) => createSvgIcon('M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z', size),
  bot: (size = 18) => createSvgIcon('M12 8V4H8M12 2v2M2 14h2M20 14h2M15 13v2M9 13v2M5 10h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', size),
  shield: (size = 20) => createSvgIcon('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', size),
  zap: (size = 20) => createSvgIcon('M13 2L3 14h9l-1 8 10-12h-9l1-8z', size),
  search: (size = 18) => createSvgIcon('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', size),
  activity: (size = 20) => createSvgIcon('M22 12h-4l-3 9L9 3l-3 9H2', size),
  terminal: (size = 18) => createSvgIcon('M4 17l6-6-6-6M12 19h8', size),
  copy: (size = 14) => createSvgIcon(['M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.414A2 2 0 0 0 19.414 6L16 2.586A2 2 0 0 0 14.586 2H10a2 2 0 0 0-2 2z', 'M4 8v12a2 2 0 0 0 2 2h8'], size),
  check: (size = 14) => createSvgIcon('M20 6L9 17l-5-5', size),
  arrowRight: (size = 16) => createSvgIcon(['M5 12h14', 'M12 5l7 7-7 7'], size),
  arrowLeft: (size = 16) => createSvgIcon(['M19 12H5', 'M12 19l-7-7 7-7'], size),
  github: (size = 16) => createSvgIcon('M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22', size),
  menu: (size = 20) => createSvgIcon(['M3 12h18', 'M3 6h18', 'M3 18h18'], size),
  close: (size = 20) => createSvgIcon(['M18 6L6 18', 'M6 6l12 12'], size),
  clock: (size = 14) => createSvgIcon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'], size),
  help: (size = 18) => createSvgIcon('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01', size),
  scale: (size = 18) => createSvgIcon('M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4', size),
  folder: (size = 16) => createSvgIcon('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z', size),
  external: (size = 14) => createSvgIcon(['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14L21 3'], size),
  flame: (size = 16) => createSvgIcon('M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z', size),
  refresh: (size = 14) => createSvgIcon(['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'], size),
  list: (size = 16) => createSvgIcon(['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'], size),
  grid: (size = 16) => createSvgIcon(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'], size),
  filter: (size = 16) => createSvgIcon('M22 3H2l8 9.46V19l4 2v-8.54L22 3z', size),
  settings: (size = 16) => createSvgIcon(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'], size),
};

// --- Documentation Catalog ---
const DOC_ENTRIES_CATALOG = [
  { id: 'quick-start', title: 'Quick Start Guide', category: 'Getting Started', path: 'docs/getting-started/quick-start.md' },
  { id: 'installation', title: 'Installation Guide', category: 'Getting Started', path: 'docs/getting-started/installation.md' },
  { id: 'token-optimization', title: 'Optimize AI Token Usage', category: 'How-To Guides', path: 'docs/how-to/token-optimization.md' },
  { id: 'local-ollama-setup', title: 'Local Embeddings with Ollama', category: 'How-To Guides', path: 'docs/how-to/local-ollama-setup.md' },
  { id: 'ide-copilot-setup', title: 'Connect VS Code & Cursor', category: 'How-To Guides', path: 'docs/how-to/ide-copilot-setup.md' },
  { id: 'ci-cd-integration', title: 'GitHub Actions & CI/CD', category: 'How-To Guides', path: 'docs/how-to/ci-cd-integration.md' },
  { id: 'cli-reference', title: 'CLI Command Reference', category: 'CLI & Config', path: 'docs/api/cli-reference.md' },
  { id: 'mcp-protocol', title: 'Model Context Protocol (MCP)', category: 'MCP & AI Agents', path: 'docs/api/mcp-protocol.md' },
  { id: 'ide-integration', title: 'Local IDE Agent Integration', category: 'MCP & AI Agents', path: 'docs/api/ide-integration.md' },
  { id: 'domain-model', title: 'Domain Model Architecture', category: 'Architecture & Persistence', path: 'docs/api/domain-model.md' },
  { id: 'plugins', title: 'Plugin Extensibility Engine', category: 'Architecture & Persistence', path: 'docs/api/plugins.md' },
  { id: 'skills-guide', title: 'Skills.md & Agent Rules', category: 'Agent Skills', path: 'docs/api/skills-guide.md' },
  { id: 'troubleshooting', title: 'Troubleshooting & FAQ', category: 'Help & FAQ', path: 'docs/help/troubleshooting.md' },
  { id: 'performance-tuning', title: 'Performance & Benchmarks', category: 'Help & FAQ', path: 'docs/help/performance-tuning.md' },
  { id: 'privacy-policy', title: 'Privacy Policy & Local Guarantee', category: 'Legal & Privacy', path: 'docs/legal/privacy-policy.md' },
  { id: 'security-governance', title: 'Security & Governance Policy', category: 'Legal & Privacy', path: 'docs/legal/security-governance.md' },
  { id: 'contributing', title: 'Contributing Guide', category: 'Legal & Privacy', path: 'docs/legal/contributing.md' },
  { id: 'code-of-conduct', title: 'Code of Conduct', category: 'Legal & Privacy', path: 'docs/legal/code-of-conduct.md' },
  { id: 'license', title: 'MIT License', category: 'Legal & Privacy', path: 'docs/legal/license.md' },
  { id: 'readme', title: 'CodeMemory Overview', category: 'Project Codex', path: 'README.md' },
  { id: 'skills', title: 'Project SKILLS.md', category: 'Project Codex', path: 'SKILLS.md' }
];

// --- Reactive State ---
const activeTab = state('home'); // 'home' | 'explorer' | 'docs'
const isMobileMenuOpen = state(false);
const isMobileDocsMenuOpen = state(false);
const isSearchModalOpen = state(false);
const isLocalLaunchModalOpen = state(false); // Modal for Vercel users requesting Architecture Explorer
const globalSearchQuery = state('');
const initialDocs = (Array.isArray(EMBEDDED_DOCS) && EMBEDDED_DOCS.length > 0)
  ? EMBEDDED_DOCS
  : DOC_ENTRIES_CATALOG.map((d) => ({ ...d, content: '' }));

const docsList = state(initialDocs);
const selectedDocId = state('quick-start');
const docsSearchQuery = state('');
const copyNotice = state('');
const activeHeading = state('');
const feedbackGiven = state({});
const docContentCache = {};

// Pre-fill cache from embedded docs
for (const d of initialDocs) {
  if (d.content) {
    docContentCache[d.id] = d.content;
  }
}

// --- Architecture & Memory Explorer State (Active Only on CodeMemory CLI Server port 3737) ---
const archNodes = state([]);
const archEdges = state([]);
const archMetrics = state(null);
const recentChanges = state([]);
const hotspotsList = state([]);
const timelineHistory = state([]);
const selectedTimelineDayIndex = state(0);
const explorerDisplayMode = state('flow'); // 'flow' | 'grid'
const selectedNode = state(null);
const selectedNodeDetails = state(null);
const archSearchQuery = state('');
const archLanguageFilter = state('all');
const archHotspotFilter = state(false);
const contextTaskPrompt = state('');
const contextBudget = state('3500');
const contextResult = state(null);
const isGeneratingContext = state(false);
const contextCopied = state(false);

// Asynchronously load markdown content
async function fetchDocumentContent(doc) {
  if (!doc) return '';
  if (doc.content) {
    return doc.content;
  }
  if (docContentCache[doc.id]) {
    return docContentCache[doc.id];
  }

  // 1. Try fetching from /api/docs?id= if available
  if (isLocalCodeMemoryServer) {
    try {
      const apiRes = await fetch(`/api/docs?id=${encodeURIComponent(doc.id)}`);
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.content) {
          docContentCache[doc.id] = data.content;
          updateDocContentInState(doc.id, data.content);
          return data.content;
        }
      }
    } catch (e) {}
  }

  return `# ${doc.title}\n\nDocumentation content loaded.`;
}

function updateDocContentInState(id, content) {
  docsList.value = docsList.value.map((d) => (d.id === id ? { ...d, content } : d));
}

// Fetch live architecture graph and codebase memory (LOCAL ONLY)
async function loadArchitectureMemory() {
  if (!isLocalEnvironment) return;

  try {
    const res = await fetch('/api/architecture');
    if (res.ok) {
      const data = await res.json();
      if (data.nodes) archNodes.value = data.nodes;
      if (data.edges) archEdges.value = data.edges;
      if (data.metrics) archMetrics.value = data.metrics;
    }
  } catch (e) {}

  try {
    const changesRes = await fetch('/api/changes?limit=40');
    if (changesRes.ok) {
      const data = await changesRes.json();
      if (Array.isArray(data)) recentChanges.value = data;
    }
  } catch (e) {}

  try {
    const hotRes = await fetch('/api/hotspots?limit=15');
    if (hotRes.ok) {
      const data = await hotRes.json();
      if (Array.isArray(data)) hotspotsList.value = data;
    }
  } catch (e) {}

  try {
    const timeRes = await fetch('/api/timeline');
    if (timeRes.ok) {
      const data = await timeRes.json();
      if (data.timeline && Array.isArray(data.timeline)) {
        timelineHistory.value = data.timeline;
      }
    }
  } catch (e) {}
}

// Inspect a specific file node in depth (LOCAL ONLY)
async function inspectNode(node) {
  if (!isLocalEnvironment) return;

  if (typeof node === 'string') {
    const found = archNodes.value.find((n) => n.path === node || n.id === node);
    if (found) {
      node = found;
    } else {
      node = { path: node, language: 'typescript', size_bytes: 0, symbols: [] };
    }
  }

  selectedNode.value = node;
  selectedNodeDetails.value = { loading: true };
  const cleanPath = (node.path || '').replace(/\\/g, '/');
  const shortName = cleanPath.split('/').pop() || cleanPath;
  contextTaskPrompt.value = `Refactor and test ${shortName}`;
  contextResult.value = null;

  try {
    const [depRes, symRes, annoRes] = await Promise.all([
      fetch(`/api/dependencies?file=${encodeURIComponent(node.path)}`),
      fetch(`/api/symbols?query=${encodeURIComponent(node.path)}`),
      fetch(`/api/annotations?file=${encodeURIComponent(node.path)}`),
    ]);

    const depData = depRes.ok ? await depRes.json() : { dependencies: [], dependents: [] };
    const symData = symRes.ok ? await symRes.json() : [];
    const annoData = annoRes.ok ? await annoRes.json() : [];

    selectedNodeDetails.value = {
      dependencies: depData.dependencies || [],
      dependents: depData.dependents || [],
      symbols: Array.isArray(symData) ? symData : (node.symbols || []),
      annotations: Array.isArray(annoData) ? annoData : (node.annotations || []),
      loading: false,
    };
  } catch (e) {
    selectedNodeDetails.value = {
      dependencies: [],
      dependents: [],
      symbols: node.symbols || [],
      annotations: node.annotations || [],
      loading: false,
    };
  }
}

// Generate test AI Context slice (LOCAL ONLY)
async function generateContextSlice() {
  if (!isLocalEnvironment) return;

  isGeneratingContext.value = true;
  try {
    const fileParam = selectedNode.value ? `&file=${encodeURIComponent(selectedNode.value.path)}` : '';
    const res = await fetch(
      `/api/context?task=${encodeURIComponent(contextTaskPrompt.value)}&budget=${encodeURIComponent(contextBudget.value)}${fileParam}`
    );
    if (res.ok) {
      contextResult.value = await res.json();
    }
  } catch (e) {
  } finally {
    isGeneratingContext.value = false;
  }
}

// Load initial documentation
async function loadInitialData() {
  if (isLocalEnvironment) {
    try {
      const docsRes = await fetch('/api/docs');
      if (docsRes.ok) {
        const d = await docsRes.json();
        if (d.docs && d.docs.length > 0) {
          docsList.value = d.docs;
          for (const doc of d.docs) {
            if (doc.content) {
              docContentCache[doc.id] = doc.content;
            }
          }
        }
      }
    } catch (err) {}

    loadArchitectureMemory();

    // Setup Server-Sent Events (SSE) for live watcher changes
    if (typeof window !== 'undefined' && window.EventSource) {
      try {
        const sse = new EventSource('/ws/updates');
        sse.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            loadArchitectureMemory();
          } catch (e) {}
        };
      } catch (e) {}
    }
  }

  const current = docsList.value.find((d) => d.id === selectedDocId.value) || docsList.value[0];
  if (current) {
    await fetchDocumentContent(current);
  }
}

loadInitialData();

// Check URL hash on initial load
if (typeof window !== 'undefined' && window.location && window.location.hash) {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'home' || hash === 'docs') {
    activeTab.value = hash;
  } else if (hash === 'explorer') {
    if (isLocalEnvironment) {
      activeTab.value = 'explorer';
    } else {
      activeTab.value = 'home';
      isLocalLaunchModalOpen.value = true;
    }
  } else if (DOC_ENTRIES_CATALOG.some((d) => d.id === hash)) {
    activeTab.value = 'docs';
    selectedDocId.value = hash;
  }
}

// Setup Reading Progress Bar & ScrollSpy
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    const progressBar = document.getElementById('reading-progress-bar');
    if (progressBar) {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      progressBar.style.width = `${scrolled}%`;
    }

    // ScrollSpy for TOC
    const headings = Array.from(document.querySelectorAll('.markdown-body h2, .markdown-body h3'));
    if (headings.length > 0) {
      let currentActive = headings[0].textContent;
      for (const hEl of headings) {
        const rect = hEl.getBoundingClientRect();
        if (rect.top <= 120) {
          currentActive = hEl.textContent;
        }
      }
      if (currentActive && activeHeading.value !== currentActive) {
        activeHeading.value = currentActive;
      }
    }
  }, { passive: true });

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      isSearchModalOpen.value = !isSearchModalOpen.value;
    }
    if (e.key === 'Escape') {
      if (isSearchModalOpen.value) isSearchModalOpen.value = false;
      if (isMobileDocsMenuOpen.value) isMobileDocsMenuOpen.value = false;
      if (isLocalLaunchModalOpen.value) isLocalLaunchModalOpen.value = false;
    }
  });
}

// Filtered Documentation computed signal
const filteredDocs = computed(() => {
  const q = docsSearchQuery.value.toLowerCase().trim();
  if (!q) return docsList.value;
  return docsList.value.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.path.toLowerCase().includes(q)
  );
});

// Filtered Architecture Nodes computed signal (Local Only)
const filteredArchNodes = computed(() => {
  let list = archNodes.value;
  const q = archSearchQuery.value.toLowerCase().trim();
  const lang = archLanguageFilter.value;
  const hotOnly = archHotspotFilter.value;

  if (q) {
    list = list.filter((n) => n.path.toLowerCase().includes(q) || (n.language && n.language.toLowerCase().includes(q)));
  }
  if (lang !== 'all') {
    list = list.filter((n) => n.language && n.language.toLowerCase() === lang.toLowerCase());
  }
  if (hotOnly) {
    list = list.filter((n) => n.is_hotspot);
  }
  return list;
});

// Global Search Results computed signal
const globalSearchResults = computed(() => {
  const q = globalSearchQuery.value.toLowerCase().trim();
  if (!q) {
    return docsList.value.slice(0, 8).map((d) => ({
      ...d,
      snippet: `Explore ${d.title} in ${d.category}.`,
    }));
  }

  const results = [];
  for (const doc of docsList.value) {
    const rawContent = doc.content || docContentCache[doc.id] || '';
    const titleMatch = doc.title.toLowerCase().includes(q);
    const catMatch = doc.category.toLowerCase().includes(q);
    const contentIdx = rawContent.toLowerCase().indexOf(q);

    if (titleMatch || catMatch || contentIdx !== -1) {
      let snippet = '';
      if (contentIdx !== -1) {
        const start = Math.max(0, contentIdx - 40);
        const end = Math.min(rawContent.length, contentIdx + q.length + 50);
        snippet = (start > 0 ? '...' : '') + rawContent.slice(start, end).replace(/\n/g, ' ') + (end < rawContent.length ? '...' : '');
      } else {
        snippet = `Matches in ${doc.category} — ${doc.title}`;
      }
      results.push({
        ...doc,
        snippet,
        score: titleMatch ? 100 : (catMatch ? 50 : 20),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
});

// Selected Document computed signal
const activeDoc = computed(() => {
  const found = docsList.value.find((d) => d.id === selectedDocId.value);
  const target = found || docsList.value[0] || null;
  if (target && !target.content && !docContentCache[target.id]) {
    fetchDocumentContent(target);
  }
  return target;
});

// Navigation helper
function navigateTo(tabName, docId = null) {
  if (tabName === 'explorer' && !isLocalEnvironment) {
    isLocalLaunchModalOpen.value = true;
    return;
  }

  activeTab.value = tabName;
  if (tabName === 'explorer') {
    loadArchitectureMemory();
  }
  if (docId) {
    selectedDocId.value = docId;
    const doc = docsList.value.find((d) => d.id === docId);
    if (doc) {
      fetchDocumentContent(doc);
      if (typeof document !== 'undefined') {
        document.title = `${doc.title} — CodeMemory Docs`;
      }
    }
  } else if (tabName === 'home') {
    if (typeof document !== 'undefined') {
      document.title = 'CodeMemory — The Persistent Engineering Context Layer for AI Agents';
    }
  } else if (tabName === 'explorer') {
    if (typeof document !== 'undefined') {
      document.title = 'Architecture & Memory Explorer — CodeMemory';
    }
  }
  isMobileMenuOpen.value = false;
  isMobileDocsMenuOpen.value = false;
  isSearchModalOpen.value = false;
  if (typeof window !== 'undefined' && window.location) {
    window.location.hash = docId || tabName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Clipboard helper
function copyToClipboard(text, label = 'Copied to clipboard!') {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
    copyNotice.value = label;
    setTimeout(() => {
      copyNotice.value = '';
    }, 2200);
  }
}

// Reading time calculator
function calculateReadingTime(text) {
  if (!text) return '1 min read';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

// Language color helper
function getLanguageColor(lang) {
  switch ((lang || '').toLowerCase()) {
    case 'typescript': return '#38bdf8';
    case 'javascript': return '#facc15';
    case 'python': return '#34d399';
    case 'rust': return '#fb923c';
    case 'go': return '#22d3ee';
    case 'sql': return '#a78bfa';
    case 'markdown': return '#94a3b8';
    default: return '#64748b';
  }
}

// --- Header Navbar ---

function renderHeader() {
  return Header(
    { class: 'header' },
    div(
      { class: 'brand', onclick: () => navigateTo('home') },
      img({
        src: './assets/codememory-logo.png',
        alt: 'CodeMemory Logo',
        class: 'logo',
        onerror: (e) => {
          if (!e.target.dataset.tried) {
            e.target.dataset.tried = 'true';
            e.target.src = '../assets/codememory-logo.png';
          }
        },
      }),
      div(
        { class: 'brand-title' },
        'CodeMemory',
        span({ class: 'badge' }, 'v1.0.0')
      )
    ),
    Nav(
      { class: 'main-nav' },
      button([Icons.home(16), 'Home'], {
        variant: 'custom',
        class: () => (activeTab.value === 'home' ? 'nav-link-btn active' : 'nav-link-btn'),
        onclick: () => navigateTo('home'),
      }),
      // Only show Architecture Explorer in local environment
      isLocalEnvironment
        ? button([Icons.network(16), 'Architecture Explorer'], {
            variant: 'custom',
            class: () => (activeTab.value === 'explorer' ? 'nav-link-btn active' : 'nav-link-btn'),
            onclick: () => navigateTo('explorer'),
          })
        : null,
      button([Icons.book(16), 'Documentation'], {
        variant: 'custom',
        class: () => (activeTab.value === 'docs' ? 'nav-link-btn active' : 'nav-link-btn'),
        onclick: () => navigateTo('docs'),
      })
    ),
    div(
      { class: 'nav-actions' },
      button(
        [
          Icons.search(15),
          span({ class: 'search-trigger-text' }, 'Search docs...'),
          span({ class: 'search-kbd' }, '⌘K'),
        ],
        {
          variant: 'custom',
          class: 'search-trigger-btn',
          title: 'Search documentation (⌘K / Ctrl+K)',
          onclick: () => (isSearchModalOpen.value = true),
        }
      ),
      a(
        {
          href: 'https://github.com/EldrexDelosReyesBula/CodeMemory',
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'github-btn',
          title: 'View source code on GitHub',
        },
        [Icons.github(16), span({ class: 'github-btn-text' }, 'GitHub')]
      ),
      button(
        () => (isMobileMenuOpen.value ? Icons.close(20) : Icons.menu(20)),
        {
          variant: 'custom',
          class: 'mobile-menu-btn',
          title: 'Toggle Menu',
          onclick: () => (isMobileMenuOpen.value = !isMobileMenuOpen.value),
        }
      )
    )
  );
}

function renderMobileDrawer() {
  return div(
    { class: () => (isMobileMenuOpen.value ? 'mobile-nav-drawer open' : 'mobile-nav-drawer') },
    button([Icons.home(18), 'Home'], {
      variant: 'custom',
      class: () => (activeTab.value === 'home' ? 'nav-link-btn active' : 'nav-link-btn'),
      onclick: () => navigateTo('home'),
    }),
    isLocalEnvironment
      ? button([Icons.network(18), 'Architecture Explorer'], {
          variant: 'custom',
          class: () => (activeTab.value === 'explorer' ? 'nav-link-btn active' : 'nav-link-btn'),
          onclick: () => navigateTo('explorer'),
        })
      : null,
    button([Icons.book(18), 'Documentation Hub'], {
      variant: 'custom',
      class: () => (activeTab.value === 'docs' ? 'nav-link-btn active' : 'nav-link-btn'),
      onclick: () => navigateTo('docs'),
    }),
    button([Icons.search(18), 'Search Docs & Guides (⌘K)'], {
      variant: 'custom',
      class: 'nav-link-btn',
      onclick: () => {
        isMobileMenuOpen.value = false;
        isSearchModalOpen.value = true;
      },
    })
  );
}

// --- Local Launch Modal for Vercel Visitors ---

function renderLocalLaunchModal() {
  return () => {
    if (!isLocalLaunchModalOpen.value) return null;

    return div(
      {
        class: 'local-launch-modal-backdrop',
        onclick: (e) => {
          if (e.target.classList.contains('local-launch-modal-backdrop')) {
            isLocalLaunchModalOpen.value = false;
          }
        },
      },
      div(
        { class: 'local-launch-modal' },
        div(
          { class: 'local-launch-header' },
          div(
            { style: { display: 'flex', alignItems: 'center', gap: '0.6rem' } },
            div({ class: 'local-launch-icon-box' }, Icons.shield(20)),
            h3({ style: { color: '#fff', fontSize: '1.2rem', margin: '0' } }, 'Self-Hosted Local Architecture Explorer')
          ),
          button([Icons.close(18)], {
            variant: 'custom',
            class: 'modal-close-btn',
            onclick: () => (isLocalLaunchModalOpen.value = false),
          })
        ),
        div(
          { class: 'local-launch-body' },
          p(
            { style: { fontSize: '0.925rem', color: 'var(--vp-c-text-2)', lineHeight: '1.6', marginBottom: '1.25rem' } },
            'For absolute privacy and security, your interactive codebase architecture graph runs ',
            span({ style: { color: 'var(--vp-c-brand)', fontWeight: '700' } }, '100% locally on your machine'),
            '. No code, symbols, or graphs are ever uploaded to cloud servers or Vercel.'
          ),
          div(
            { class: 'local-launch-instruction-box' },
            span({ class: 'instruction-label' }, 'To launch the interactive visualizer for your repository:'),
            div(
              {
                class: 'local-launch-code-box',
                onclick: () => copyToClipboard('npx @eldrex/codememory web --open', 'Command copied!'),
              },
              span({ style: { color: '#64748b' } }, '$'),
              'npx @eldrex/codememory web --open',
              span({ class: 'copy-icon-wrap' }, () =>
                copyNotice.value ? [Icons.check(14), 'Copied'] : [Icons.copy(14)]
              )
            )
          ),
          div(
            { class: 'local-launch-features-list' },
            div({ class: 'feat-item' }, Icons.check(14), span('Interactive node flowchart & dependency traversal')),
            div({ class: 'feat-item' }, Icons.check(14), span('Daily change timeline & hotspot overlays')),
            div({ class: 'feat-item' }, Icons.check(14), span('Zero telemetry — strictly stored in local SQLite WAL database'))
          ),
          div(
            { style: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' } },
            button(['Browse Documentation', Icons.arrowRight(14)], {
              variant: 'custom',
              class: 'btn-secondary',
              onclick: () => {
                isLocalLaunchModalOpen.value = false;
                navigateTo('docs', 'quick-start');
              },
            }),
            button(['Got It', Icons.check(14)], {
              variant: 'custom',
              class: 'btn-primary',
              onclick: () => (isLocalLaunchModalOpen.value = false),
            })
          )
        )
      )
    );
  };
}

// --- Mobile Docs Drawer Modal ---

function renderMobileDocsModal() {
  return () => {
    if (!isMobileDocsMenuOpen.value) return null;

    return div(
      {
        class: 'mobile-docs-modal-backdrop',
        onclick: (e) => {
          if (e.target.classList.contains('mobile-docs-modal-backdrop')) {
            isMobileDocsMenuOpen.value = false;
          }
        },
      },
      div(
        { class: 'mobile-docs-modal' },
        div(
          { class: 'mobile-docs-modal-header' },
          span({ style: { fontWeight: '700', fontSize: '1rem', color: '#fff' } }, 'Select Document'),
          button([Icons.close(18)], {
            variant: 'custom',
            style: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' },
            onclick: () => (isMobileDocsMenuOpen.value = false),
          })
        ),
        div(
          { class: 'mobile-docs-modal-body' },
          renderDocsSidebar()
        )
      )
    );
  };
}

// --- Global Search Modal ---

function renderSearchModal() {
  return () => {
    if (!isSearchModalOpen.value) return null;

    return div(
      {
        class: 'vp-search-modal-backdrop',
        onclick: (e) => {
          if (e.target.classList.contains('vp-search-modal-backdrop')) {
            isSearchModalOpen.value = false;
          }
        },
      },
      div(
        { class: 'vp-search-modal' },
        div(
          { class: 'vp-search-input-box' },
          Icons.search(18),
          input({
            value: () => globalSearchQuery.value,
            oninput: (e) => (globalSearchQuery.value = e.target.value),
            placeholder: 'Search documentation, guides, and APIs...',
            autofocus: true,
          }),
          button([Icons.close(16)], {
            variant: 'custom',
            style: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' },
            onclick: () => (isSearchModalOpen.value = false),
          })
        ),
        div(
          { class: 'vp-search-results-list' },
          () => {
            const results = globalSearchResults.value;
            if (results.length === 0) {
              return div(
                { style: { padding: '1.5rem', textAlign: 'center', color: 'var(--vp-c-text-mute)' } },
                'No documents found matching your search.'
              );
            }
            return results.map((item) =>
              div(
                {
                  class: 'vp-search-result-item',
                  onclick: () => navigateTo('docs', item.id),
                },
                div(
                  { class: 'vp-search-result-header' },
                  span({ class: 'vp-search-result-title' }, item.title),
                  span({ class: 'vp-search-result-cat' }, item.category)
                ),
                div({ class: 'vp-search-result-snippet' }, item.snippet)
              )
            );
          }
        )
      )
    );
  };
}

// --- Landing Page View ---

function renderLandingPage() {
  return div(
    { class: 'landing-container' },
    div({ class: 'landing-bg-glow' }),

    // Hero Section
    div(
      { class: 'landing-hero' },
      div({ class: 'hero-pill' }, [Icons.zap(15), 'Local-First Context Engine for AI Coding Agents']),
      h1(
        { class: 'hero-title' },
        'The Persistent Memory Layer ',
        span({ class: 'gradient-text' }, 'for Your Codebase')
      ),
      p(
        { class: 'hero-subtitle' },
        'CodeMemory watches your repository in real-time, indexes multi-language AST symbols & dependency graphs, and serves change-aware context slices directly to AI agents over native MCP.'
      ),
      div(
        { class: 'hero-actions' },
        button(['Get Started', Icons.arrowRight(16)], {
          variant: 'custom',
          class: 'btn-primary',
          onclick: () => navigateTo('docs', 'quick-start'),
        }),
        button(['Architecture Overview', Icons.network(16)], {
          variant: 'custom',
          class: 'btn-secondary',
          onclick: () => {
            if (isLocalEnvironment) {
              navigateTo('explorer');
            } else {
              isLocalLaunchModalOpen.value = true;
            }
          },
        }),
        div(
          {
            class: 'install-command-badge',
            onclick: () => copyToClipboard('npx @eldrex/codememory init', 'Command copied!'),
          },
          span({ style: { color: '#64748b' } }, '$'),
          'npx @eldrex/codememory init',
          span({ style: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#38bdf8' } }, () =>
            copyNotice.value ? [Icons.check(14), 'Copied'] : [Icons.copy(14)]
          )
        )
      ),

      // Terminal Preview
      div(
        { class: 'terminal-window' },
        div(
          { class: 'terminal-header' },
          div(
            { class: 'terminal-dots' },
            span({ class: 'dot red' }),
            span({ class: 'dot yellow' }),
            span({ class: 'dot green' })
          ),
          span({ class: 'terminal-title' }, [Icons.terminal(14), '@eldrex/codememory — mcp context query'])
        ),
        div(
          { class: 'terminal-body' },
          div({ style: { color: '#64748b' } }, '$ codememory context --task "Refactor Stripe webhook handler" --budget 4000'),
          div({ style: { color: '#38bdf8', marginTop: '0.5rem' } }, 'CodeMemory Change-Aware Context Pack:'),
          div({ style: { color: '#94a3b8' } }, '├── Focus File: src/services/PaymentService.ts (Modified 2m ago, Hotspot: 0.92)'),
          div({ style: { color: '#94a3b8' } }, '├── Callers: src/api/webhooks.ts -> PaymentService.handleEvent()'),
          div({ style: { color: '#94a3b8' } }, '├── Security Annotations: [security-scanner] PCI DSS safe, Stripe secret masked'),
          div({ style: { color: '#94a3b8' } }, '└── Skill Rules: SKILLS.md 3.2: "Always verify idempotency before capture"'),
          div({ style: { color: '#10b981', marginTop: '0.5rem' } }, '✓ Change-aware payload prepared (940 tokens — focused context slice)')
        )
      )
    ),

    // Feature Bento Grid
    div(
      { class: 'features-section' },
      div(
        { class: 'section-header' },
        h2('Engineered for Next-Generation AI Pair Programming'),
        p('Everything your AI agent needs to understand the architecture, conventions, and evolution of your codebase.')
      ),
      div(
        { class: 'bento-grid' },
        div(
          {
            class: 'bento-card',
            onclick: () => {
              if (isLocalEnvironment) {
                navigateTo('explorer');
              } else {
                isLocalLaunchModalOpen.value = true;
              }
            },
            style: { cursor: 'pointer' },
          },
          div({ class: 'bento-icon-box' }, Icons.network(22)),
          h3('Live Architecture Explorer'),
          p('Visual flowchart, symbol breakdowns, caller graphs, and daily change timeline running 100% locally on your machine.')
        ),
        div(
          { class: 'bento-card', onclick: () => navigateTo('docs', 'privacy-policy'), style: { cursor: 'pointer' } },
          div({ class: 'bento-icon-box' }, Icons.shield(22)),
          h3('100% Local & Private'),
          p('Zero telemetry and zero external network calls. All structural graphs and historical diffs are stored strictly in your local SQLite WAL database.')
        ),
        div(
          { class: 'bento-card', onclick: () => navigateTo('docs', 'token-optimization'), style: { cursor: 'pointer' } },
          div({ class: 'bento-icon-box' }, Icons.zap(22)),
          h3('Targeted Token Budgeting'),
          p('Avoid flooding LLM context windows with entire files. CodeMemory ranks and serves only task-relevant symbols, callers, and recent changes.')
        ),
        div(
          { class: 'bento-card', onclick: () => navigateTo('docs', 'cli-reference'), style: { cursor: 'pointer' } },
          div({ class: 'bento-icon-box' }, Icons.search(22)),
          h3('Multi-Language AST Analysis'),
          p('Native extraction of classes, interfaces, methods, functions, and imports across TypeScript, JavaScript, Python, Rust, Go, SQL, and C++.')
        ),
        div(
          { class: 'bento-card', onclick: () => navigateTo('docs', 'quick-start'), style: { cursor: 'pointer' } },
          div({ class: 'bento-icon-box' }, Icons.activity(22)),
          h3('Real-Time Live Watcher'),
          p('Sub-100ms debounced file watcher synchronizes codebase intelligence immediately upon saving files while honoring .gitignore rules.')
        ),
        div(
          { class: 'bento-card', onclick: () => navigateTo('docs', 'mcp-protocol'), style: { cursor: 'pointer' } },
          div({ class: 'bento-icon-box' }, Icons.bot(22)),
          h3('Native MCP Protocol Server'),
          p('Connect VS Code Copilot, Cursor AI, Claude Desktop, Antigravity, and custom agent sidecars via official Model Context Protocol tools.')
        )
      )
    ),

    // 3-Step Setup Section
    div(
      { class: 'steps-section' },
      div(
        { class: 'section-header' },
        h2('Get Up and Running in Seconds'),
        p('Three simple commands to supercharge your AI coding workflows.')
      ),
      div(
        { class: 'steps-grid' },
        div(
          { class: 'step-card' },
          span({ class: 'step-num' }, 'Step 01'),
          h4('Initialize Repository'),
          p('Index symbols, extract AST structures, and initialize SQLite WAL store.'),
          div({ class: 'step-code' }, 'npx @eldrex/codememory init')
        ),
        div(
          { class: 'step-card' },
          span({ class: 'step-num' }, 'Step 02'),
          h4('Start Live Watcher'),
          p('Keep codebase memory automatically synchronized as you write code.'),
          div({ class: 'step-code' }, 'npx @eldrex/codememory watch')
        ),
        div(
          { class: 'step-card' },
          span({ class: 'step-num' }, 'Step 03'),
          h4('Launch Local Explorer'),
          p('Inspect architecture, symbols, and change timeline in your browser.'),
          div({ class: 'step-code' }, 'npx @eldrex/codememory web --open')
        )
      )
    )
  );
}

// --- Cyber-Industrial Role & Status Helpers ---
function getFileRoleInfo(path) {
  const p = (path || '').toLowerCase();
  if (p.includes('api') || p.includes('gateway') || p.includes('entry') || p.includes('main') || p.includes('index') || p.includes('cli')) {
    return { role: 'ENTRY', dotColor: '#4fdbc8', roleClass: 'role-entry' };
  }
  if (p.includes('controller') || p.includes('handler') || p.includes('route')) {
    return { role: 'CONTROLLER', dotColor: '#ffb690', roleClass: 'role-controller' };
  }
  if (p.includes('middleware') || p.includes('guard') || p.includes('auth') || p.includes('security')) {
    return { role: 'MIDDLEWARE', dotColor: '#4fdbc8', roleClass: 'role-middleware' };
  }
  if (p.includes('service') || p.includes('client') || p.includes('provider') || p.includes('engine') || p.includes('generator')) {
    return { role: 'SERVICE', dotColor: '#ffb690', roleClass: 'role-service' };
  }
  if (p.includes('model') || p.includes('schema') || p.includes('type') || p.includes('entity')) {
    return { role: 'MODEL', dotColor: '#c7bfff', roleClass: 'role-model' };
  }
  if (p.includes('util') || p.includes('helper') || p.includes('format') || p.includes('common')) {
    return { role: 'UTILS', dotColor: '#4fdbc8', roleClass: 'role-utils' };
  }
  if (p.includes('db') || p.includes('database') || p.includes('store') || p.includes('repo')) {
    return { role: 'DATABASE', dotColor: '#ec6a06', roleClass: 'role-db' };
  }
  return { role: 'MODULE', dotColor: '#928e9f', roleClass: 'role-module' };
}

const explorerNavTab = state('explorer'); // 'explorer' | 'filters' | 'timeline' | 'settings'
const cyZoomLevel = state(100);
const cyActiveLayout = state('breadthfirst'); // 'breadthfirst' | 'cose' | 'concentric' | 'circle'
let cyInstance = null;

function renderCytoscapeGraph() {
  if (typeof window.cytoscape === 'undefined') return;
  const container = document.getElementById('cy-canvas');
  if (!container) return;

  const nodes = filteredArchNodes.value;
  const edges = archEdges.value;
  if (nodes.length === 0) return;

  const nodeMap = new Set(nodes.map((n) => n.path));
  const cyElements = [];

  for (const node of nodes) {
    const cleanPath = (node.path || '').replace(/\\/g, '/');
    const roleInfo = getFileRoleInfo(cleanPath);
    const shortName = cleanPath.split('/').pop() || cleanPath;
    cyElements.push({
      group: 'nodes',
      data: {
        id: node.path,
        label: `${roleInfo.role}\n${shortName}`,
        fullPath: node.path,
        fileName: shortName,
        role: roleInfo.role,
        dotColor: roleInfo.dotColor,
        language: node.language || 'unknown',
        isHotspot: Boolean(node.is_hotspot),
        symbolsCount: node.symbols_count || 1,
      },
    });
  }

  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      cyElements.push({
        group: 'edges',
        data: {
          id: `${edge.source}->${edge.target}`,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'import',
        },
      });
    }
  }

  try {
    if (cyInstance) {
      cyInstance.destroy();
    }

    const currentLayoutName = cyActiveLayout.value;
    let layoutConfig = {
      name: 'breadthfirst',
      directed: true,
      padding: 40,
      spacingFactor: 1.6,
      animate: false,
    };

    if (currentLayoutName === 'cose') {
      layoutConfig = {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
        nodeRepulsion: () => 600000,
        idealEdgeLength: () => 220,
        edgeElasticity: () => 60,
        nestingFactor: 1.2,
        gravity: 0.1,
        numIter: 1000,
        componentSpacing: 160,
      };
    } else if (currentLayoutName === 'concentric') {
      layoutConfig = {
        name: 'concentric',
        minNodeSpacing: 60,
        concentric: (node) => (node.data('isHotspot') ? 10 : node.data('symbolsCount') || 1),
        levelWidth: () => 2,
        animate: false,
      };
    } else if (currentLayoutName === 'circle') {
      layoutConfig = {
        name: 'circle',
        padding: 40,
        animate: false,
      };
    }

    cyInstance = window.cytoscape({
      container,
      elements: cyElements,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'round-rectangle',
            'background-color': '#1b1a26',
            'border-width': 1.5,
            'border-color': '#292935',
            'label': 'data(label)',
            'color': '#e3e0f1',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '10px',
            'font-weight': 600,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '135px',
            'width': 155,
            'height': 52,
            'overlay-opacity': 0,
            'transition-property': 'background-color, border-color, border-width, box-shadow',
            'transition-duration': '0.15s',
          },
        },
        {
          selector: 'node[?isHotspot]',
          style: {
            'border-color': '#ffb4ab',
            'border-width': 2,
            'shadow-blur': 12,
            'shadow-color': 'rgba(255, 180, 171, 0.4)',
            'shadow-opacity': 0.8,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#c7bfff',
            'border-width': 2.5,
            'background-color': '#1f1e2a',
            'shadow-blur': 18,
            'shadow-color': 'rgba(142, 127, 255, 0.6)',
            'shadow-opacity': 1,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(124, 108, 240, 0.55)',
            'target-arrow-color': '#8e7fff',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.0,
            'transition-property': 'line-color, width, target-arrow-color',
            'transition-duration': '0.15s',
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 3.5,
            'line-color': '#c7bfff',
            'target-arrow-color': '#c7bfff',
          },
        },
      ],
      layout: layoutConfig,
    });

    cyInstance.on('zoom', () => {
      cyZoomLevel.value = Math.round(cyInstance.zoom() * 100);
    });

    cyInstance.on('tap', 'node', (evt) => {
      const path = evt.target.data('fullPath');
      inspectNode(path);
    });
  } catch (err) {}
}

function runCyLayout(layoutName) {
  cyActiveLayout.value = layoutName;
  if (!cyInstance) return;
  let layoutConfig = {
    name: layoutName,
    directed: true,
    padding: 40,
    spacingFactor: 1.6,
    animate: true,
    animationDuration: 500,
  };

  if (layoutName === 'cose') {
    layoutConfig = {
      name: 'cose',
      animate: true,
      animationDuration: 500,
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: () => 600000,
      idealEdgeLength: () => 220,
      edgeElasticity: () => 60,
      nestingFactor: 1.2,
      gravity: 0.1,
      numIter: 1000,
      componentSpacing: 160,
    };
  } else if (layoutName === 'concentric') {
    layoutConfig = {
      name: 'concentric',
      minNodeSpacing: 60,
      concentric: (node) => (node.data('isHotspot') ? 10 : node.data('symbolsCount') || 1),
      levelWidth: () => 2,
      animate: true,
      animationDuration: 500,
    };
  } else if (layoutName === 'circle') {
    layoutConfig = {
      name: 'circle',
      padding: 40,
      animate: true,
      animationDuration: 500,
    };
  }

  cyInstance.layout(layoutConfig).run();
}

// --- Interactive Architecture & Memory Explorer View (Local Only) ---

function renderArchitectureExplorer() {
  if (!isLocalEnvironment) {
    return div(
      { class: 'explorer-container', style: { textAlign: 'center', padding: '5rem 1.5rem' } },
      Icons.shield(48),
      h2({ style: { marginTop: '1rem', color: '#fff' } }, 'Local-Only Visualization'),
      p({ style: { color: 'var(--vp-c-text-3)', maxWidth: '500px', margin: '0.75rem auto 1.5rem' } },
        'The Architecture Explorer runs 100% locally on your machine to protect your codebase privacy. Run `npx @eldrex/codememory web` in your terminal to start it.'
      ),
      button(['Back to Documentation', Icons.arrowRight(14)], {
        variant: 'custom',
        class: 'btn-primary',
        onclick: () => navigateTo('docs'),
      })
    );
  }

  return div(
    { class: 'cyber-explorer-shell' },

    // Left Tactical Subnav Sidebar
    div(
      { class: 'cyber-sidebar' },
      div({ class: 'cyber-sidebar-heading' }, 'Architecture Explorer'),
      div(
        { class: 'cyber-nav-group' },
        button(
          [Icons.network(16), 'Explorer'],
          {
            variant: 'custom',
            class: () => (explorerNavTab.value === 'explorer' ? 'cyber-nav-item active' : 'cyber-nav-item'),
            onclick: () => (explorerNavTab.value = 'explorer'),
          }
        ),
        button(
          [Icons.filter(16), 'Filters'],
          {
            variant: 'custom',
            class: () => (explorerNavTab.value === 'filters' ? 'cyber-nav-item active' : 'cyber-nav-item'),
            onclick: () => (explorerNavTab.value = 'filters'),
          }
        ),
        button(
          [Icons.clock(16), 'Timeline'],
          {
            variant: 'custom',
            class: () => (explorerNavTab.value === 'timeline' ? 'cyber-nav-item active' : 'cyber-nav-item'),
            onclick: () => (explorerNavTab.value = 'timeline'),
          }
        )
      ),

      // Mini Metrics in Left Sidebar
      div(
        { class: 'cyber-sidebar-metrics' },
        div({ class: 'cyber-metric-row' },
          span({ class: 'lbl' }, 'Files Tracked'),
          span({ class: 'val' }, () => (archMetrics.value ? archMetrics.value.totalFiles : archNodes.value.length))
        ),
        div({ class: 'cyber-metric-row' },
          span({ class: 'lbl' }, 'AST Symbols'),
          span({ class: 'val' }, () => (archMetrics.value ? archMetrics.value.totalSymbols : '—'))
        ),
        div({ class: 'cyber-metric-row' },
          span({ class: 'lbl' }, 'Dependencies'),
          span({ class: 'val' }, () => (archMetrics.value ? archMetrics.value.totalDependencies : archEdges.value.length))
        ),
        div({ class: 'cyber-metric-row' },
          span({ class: 'lbl' }, 'Hotspots'),
          span({ class: 'val', style: { color: 'var(--tertiary)' } }, () => hotspotsList.value.length)
        )
      )
    ),

    // Center Stage: Canvas & Controls
    div(
      { class: 'cyber-stage' },

      // Stage Header Bar
      div(
        { class: 'cyber-stage-header' },
        div(
          { class: 'cyber-stage-search' },
          Icons.search(16),
          input({
            value: () => archSearchQuery.value,
            oninput: (e) => (archSearchQuery.value = e.target.value),
            placeholder: 'Search codebase symbols or files (⌘K)...',
          })
        ),
        div(
          { class: 'cyber-stage-actions' },
          button(
            [Icons.network(14), 'Flowchart'],
            {
              variant: 'custom',
              class: () => (explorerDisplayMode.value === 'flow' ? 'cyber-btn active' : 'cyber-btn'),
              title: 'Interactive Flowchart View with Dependency Arrows',
              onclick: () => {
                explorerDisplayMode.value = 'flow';
                setTimeout(renderCytoscapeGraph, 30);
              },
            }
          ),
          () => {
            if (explorerDisplayMode.value !== 'flow') return null;
            return div(
              { style: { display: 'flex', gap: '0.25rem', alignItems: 'center' } },
              button(
                ['Tree / DAG'],
                {
                  variant: 'custom',
                  class: () => (cyActiveLayout.value === 'breadthfirst' ? 'cyber-btn active' : 'cyber-btn'),
                  title: 'Hierarchical Tree Layout',
                  onclick: () => runCyLayout('breadthfirst'),
                }
              ),
              button(
                ['Force'],
                {
                  variant: 'custom',
                  class: () => (cyActiveLayout.value === 'cose' ? 'cyber-btn active' : 'cyber-btn'),
                  title: 'Physics Force Layout',
                  onclick: () => runCyLayout('cose'),
                }
              ),
              button(
                ['Cluster'],
                {
                  variant: 'custom',
                  class: () => (cyActiveLayout.value === 'concentric' ? 'cyber-btn active' : 'cyber-btn'),
                  title: 'Concentric Cluster Layout',
                  onclick: () => runCyLayout('concentric'),
                }
              )
            );
          },
          button(
            [Icons.grid(14), 'Grid'],
            {
              variant: 'custom',
              class: () => (explorerDisplayMode.value === 'grid' ? 'cyber-btn active' : 'cyber-btn'),
              title: 'Modular Grid Card View',
              onclick: () => (explorerDisplayMode.value = 'grid'),
            }
          ),
          button(
            [Icons.refresh(14)],
            {
              variant: 'custom',
              class: 'cyber-btn',
              title: 'Refresh Memory',
              onclick: () => loadArchitectureMemory(),
            }
          )
        )
      ),

      // Conditional Sub-Tabs (Filters, Timeline, Settings)
      () => {
        if (explorerNavTab.value === 'filters') {
          return div(
            { class: 'cyber-filter-bar' },
            span({ style: { fontSize: '0.8rem', color: 'var(--outline)', fontWeight: '600' } }, 'Filter By Language:'),
            ['all', 'typescript', 'javascript', 'python', 'markdown'].map((lang) =>
              button([lang.toUpperCase()], {
                variant: 'custom',
                class: () => (archLanguageFilter.value === lang ? 'cyber-filter-chip active' : 'cyber-filter-chip'),
                onclick: () => (archLanguageFilter.value = lang),
              })
            ),
            button(
              [Icons.flame(14), 'Hotspots Only'],
              {
                variant: 'custom',
                class: () => (archHotspotFilter.value ? 'cyber-filter-chip active hotspot' : 'cyber-filter-chip'),
                onclick: () => (archHotspotFilter.value = !archHotspotFilter.value),
              }
            )
          );
        }

        if (explorerNavTab.value === 'timeline') {
          const timeline = timelineHistory.value;
          if (timeline.length === 0) return null;
          const currentIdx = selectedTimelineDayIndex.value;
          const currentEntry = timeline[currentIdx] || timeline[0];

          return div(
            { class: 'cyber-timeline-bar' },
            button(['◀ Prev Day'], {
              variant: 'custom',
              class: 'cyber-btn',
              disabled: currentIdx >= timeline.length - 1,
              onclick: () => { if (currentIdx < timeline.length - 1) selectedTimelineDayIndex.value = currentIdx + 1; },
            }),
            span({ class: 'cyber-timeline-date' }, `📅 ${currentEntry.date} (${currentEntry.changesCount} file changes recorded)`),
            button(['Next Day ▶'], {
              variant: 'custom',
              class: 'cyber-btn',
              disabled: currentIdx <= 0,
              onclick: () => { if (currentIdx > 0) selectedTimelineDayIndex.value = currentIdx - 1; },
            })
          );
        }

        return null;
      },

      // Main Canvas with Floating Zoom Level Widget
      div(
        { class: 'cyber-canvas-wrapper' },

        // Floating Zoom Controller Widget
        div(
          { class: 'cyber-zoom-widget' },
          span({ class: 'zoom-label' }, 'ZOOM LEVEL'),
          div(
            { class: 'zoom-controls' },
            button(['−'], {
              variant: 'custom',
              class: 'zoom-btn',
              title: 'Zoom Out',
              onclick: () => { if (cyInstance) { cyInstance.zoom(cyInstance.zoom() * 0.85); cyZoomLevel.value = Math.round(cyInstance.zoom() * 100); } },
            }),
            span({ class: 'zoom-val' }, () => `${cyZoomLevel.value}%`),
            button(['+'], {
              variant: 'custom',
              class: 'zoom-btn',
              title: 'Zoom In',
              onclick: () => { if (cyInstance) { cyInstance.zoom(cyInstance.zoom() * 1.18); cyZoomLevel.value = Math.round(cyInstance.zoom() * 100); } },
            }),
            button(['Fit'], {
              variant: 'custom',
              class: 'zoom-btn fit',
              title: 'Fit Viewport',
              onclick: () => { if (cyInstance) { cyInstance.fit(null, 40); cyZoomLevel.value = Math.round(cyInstance.zoom() * 100); } },
            })
          )
        ),

        // Interactive Canvas / Grid View
        () => {
          if (explorerDisplayMode.value === 'flow') {
            const nodes = filteredArchNodes.value;
            if (nodes.length === 0) {
              return div(
                { class: 'empty-nodes-state' },
                p('No codebase memory loaded yet. Run `codememory init` in your terminal to index.')
              );
            }

            setTimeout(renderCytoscapeGraph, 50);

            return div({ id: 'cy-canvas', class: 'cyber-grid-canvas' });
          }

          // Grid View Fallback
          const nodes = filteredArchNodes.value;
          if (nodes.length === 0) {
            return div(
              { class: 'empty-nodes-state' },
              p('No codebase memory loaded yet. Run `codememory init` in your terminal to index.')
            );
          }

          return div(
            { class: 'cyber-nodes-grid' },
            nodes.map((node) => {
              const isSelected = selectedNode.value && selectedNode.value.path === node.path;
              const roleInfo = getFileRoleInfo(node.path);
              const shortName = node.path.split('/').pop() || node.path;

              return div(
                {
                  class: () => (isSelected ? 'cyber-node-card selected' : 'cyber-node-card'),
                  onclick: () => inspectNode(node),
                },
                div(
                  { class: 'cyber-node-header' },
                  div(
                    { class: 'cyber-role-tag' },
                    span({ class: 'cyber-dot', style: { background: roleInfo.dotColor } }),
                    span({ class: 'role-name' }, roleInfo.role)
                  ),
                  node.is_hotspot
                    ? span({ class: 'cyber-hotspot-badge' }, 'CRITICAL')
                    : null
                ),
                div({ class: 'cyber-node-title', title: node.path }, shortName),
                div(
                  { class: 'cyber-node-footer' },
                  span({ class: 'cyber-deps-count' }, `< ${node.symbols_count || 0} symbols`),
                  span({ class: 'cyber-size' }, `${Math.round((node.size_bytes || 0) / 1024 * 10) / 10} KB`)
                )
              );
            })
          );
        }
      )
    ),

    // Right Side Inspector Panel
    () => {
      if (!selectedNode.value) {
        return div(
          { class: 'cyber-inspector empty' },
          Icons.network(32),
          p('Click any node card in the graph to inspect AST symbols, callers, and dependencies.')
        );
      }

      const node = selectedNode.value;
      const details = selectedNodeDetails.value || {};
      const roleInfo = getFileRoleInfo(node.path);

      return div(
        { class: 'cyber-inspector' },
        div(
          { class: 'cyber-inspector-header' },
          div(
            { class: 'cyber-role-tag' },
            span({ class: 'cyber-dot', style: { background: roleInfo.dotColor } }),
            span({ class: 'role-name' }, roleInfo.role)
          ),
          button([Icons.close(16)], {
            variant: 'custom',
            class: 'cyber-close-btn',
            onclick: () => { selectedNode.value = null; },
          })
        ),

        div({ class: 'cyber-inspector-title', title: node.path }, node.path),

        div(
          { class: 'cyber-inspector-stats' },
          div({ class: 'stat-box' },
            span({ class: 'lbl' }, 'Language'),
            span({ class: 'val' }, node.language || 'typescript')
          ),
          div({ class: 'stat-box' },
            span({ class: 'lbl' }, 'Size'),
            span({ class: 'val' }, `${Math.round((node.size_bytes || 0) / 1024 * 10) / 10} KB`)
          ),
          div({ class: 'stat-box' },
            span({ class: 'lbl' }, 'Symbols'),
            span({ class: 'val' }, node.symbols_count || (node.symbols ? node.symbols.length : 0))
          )
        ),

        // AST Symbols List
        div(
          { class: 'cyber-symbols-section' },
          h4('AST Symbols & Exports'),
          () => {
            const symbols = details.symbols || node.symbols || [];
            if (symbols.length === 0) return p({ class: 'empty-text' }, 'No public symbols detected.');
            return div(
              { class: 'cyber-symbols-list' },
              symbols.map((s) =>
                div(
                  { class: 'cyber-symbol-item' },
                  span({ class: 'sym-kind' }, s.kind || 'fn'),
                  span({ class: 'sym-name' }, s.name),
                  s.line_start ? span({ class: 'sym-line' }, `L${s.line_start}`) : null
                )
              )
            );
          }
        ),

        // Outgoing Dependencies (Imports)
        div(
          { class: 'cyber-symbols-section' },
          h4('Outgoing Dependencies (Imports)'),
          () => {
            const deps = details.dependencies || [];
            if (deps.length === 0) return p({ class: 'empty-text' }, 'No outgoing imports.');
            return div(
              { class: 'cyber-symbols-list' },
              deps.map((d) =>
                div(
                  {
                    class: 'cyber-symbol-item clickable',
                    style: { cursor: 'pointer' },
                    onclick: () => inspectNode(d.target_path || d.import_path),
                  },
                  Icons.arrowRight(12),
                  span({ class: 'sym-name' }, d.target_path || d.import_path || d.target_symbol_name)
                )
              )
            );
          }
        ),

        // Incoming Callers (Dependents)
        div(
          { class: 'cyber-symbols-section' },
          h4('Incoming Callers (Dependents)'),
          () => {
            const dependents = details.dependents || [];
            if (dependents.length === 0) return p({ class: 'empty-text' }, 'No incoming dependents.');
            return div(
              { class: 'cyber-symbols-list' },
              dependents.map((d) =>
                div(
                  {
                    class: 'cyber-symbol-item clickable',
                    style: { cursor: 'pointer' },
                    onclick: () => inspectNode(d.source_path),
                  },
                  Icons.arrowLeft(12),
                  span({ class: 'sym-name' }, d.source_path)
                )
              )
            );
          }
        ),

        // AI Context Slicer
        div(
          { class: 'cyber-context-section' },
          h4('Change-Aware Context Slicer'),
          input({
            value: () => contextTaskPrompt.value,
            oninput: (e) => (contextTaskPrompt.value = e.target.value),
            placeholder: 'Describe coding task for AI (e.g. Refactor handler)...',
            class: 'cyber-input',
          }),
          button(
            () => (isGeneratingContext.value ? [Icons.refresh(14), 'Assembling Slice...'] : [Icons.zap(14), 'Generate AI Context Slice']),
            {
              variant: 'custom',
              class: 'cyber-action-btn',
              onclick: () => generateContextSlice(),
            }
          ),
          () => {
            if (!contextResult.value) return null;
            const cr = contextResult.value;
            return div(
              { class: 'cyber-context-result' },
              div(
                { class: 'result-header' },
                span(`Tokens: ~${cr.tokenCount || cr.estimatedTokens || 640}`),
                button(
                  () => (contextCopied.value ? [Icons.check(12), 'Copied!'] : [Icons.copy(12), 'Copy JSON']),
                  {
                    variant: 'custom',
                    class: 'cyber-copy-btn',
                    style: {
                      background: 'var(--surface-container)',
                      border: '1px solid var(--surface-container-high)',
                      color: () => (contextCopied.value ? 'var(--secondary)' : 'var(--on-surface)'),
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    },
                    onclick: () => {
                      const text = typeof cr === 'string' ? cr : JSON.stringify(cr, null, 2);
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(text);
                        contextCopied.value = true;
                        setTimeout(() => { contextCopied.value = false; }, 2500);
                      }
                    },
                  }
                )
              ),
              pre(code(typeof cr === 'string' ? cr : JSON.stringify(cr, null, 2)))
            );
          }
        )
      );
    }
  );
}

// --- VitePress Documentation Hub View ---

function getCategoryIcon(category) {
  switch (category) {
    case 'Getting Started': return Icons.zap(14);
    case 'How-To Guides': return Icons.terminal(14);
    case 'CLI & Config': return Icons.terminal(14);
    case 'MCP & AI Agents': return Icons.bot(14);
    case 'Architecture & Persistence': return Icons.network(14);
    case 'Agent Skills': return Icons.brain(14);
    case 'Help & FAQ': return Icons.help(14);
    case 'Legal & Privacy': return Icons.scale(14);
    default: return Icons.folder(14);
  }
}

function renderDocsSidebar() {
  return div(
    { class: 'vp-sidebar' },
    div(
      { class: 'vp-docs-search' },
      span({ class: 'search-icon' }, Icons.search(16)),
      input({
        value: () => docsSearchQuery.value,
        oninput: (e) => (docsSearchQuery.value = e.target.value),
        placeholder: 'Search documentation...',
      })
    ),
    () => {
      const docs = filteredDocs.value;
      if (docs.length === 0) {
        return div({ style: { padding: '1rem', color: 'var(--vp-c-text-mute)', fontSize: '0.85rem' } }, 'No matching docs found.');
      }

      const categories = {};
      for (const d of docs) {
        if (!categories[d.category]) categories[d.category] = [];
        categories[d.category].push(d);
      }

      return div(
        Object.entries(categories).map(([category, items]) =>
          div(
            { class: 'vp-category-group' },
            div({ class: 'vp-category-header' }, [getCategoryIcon(category), category]),
            div(
              { class: 'vp-nav-list' },
              items.map((item) =>
                button(
                  [item.title],
                  {
                    variant: 'custom',
                    class: () => (selectedDocId.value === item.id ? 'vp-nav-item active' : 'vp-nav-item'),
                    onclick: () => {
                      selectedDocId.value = item.id;
                      fetchDocumentContent(item);
                      isMobileDocsMenuOpen.value = false;
                      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                      setTimeout(initMermaidInArticle, 100);
                    },
                  }
                )
              )
            )
          )
        )
      );
    }
  );
}

function unescapeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

async function initMermaidInArticle() {
  if (typeof window.mermaid === 'undefined') return;
  const boxes = document.querySelectorAll('.mermaid-diagram-box');
  for (let idx = 0; idx < boxes.length; idx++) {
    const box = boxes[idx];
    const encoded = box.getAttribute('data-mermaid-code');
    const code = (encoded ? decodeURIComponent(encoded) : unescapeHtmlEntities(box.textContent || '')).trim();
    if (!code) continue;

    const id = `mermaid_svg_${Date.now()}_${idx}`;
    try {
      const renderRes = await window.mermaid.render(id, code);
      box.innerHTML = renderRes.svg;
    } catch (err) {
      console.warn('Mermaid render warning:', err);
      const tempEl = document.getElementById(id);
      if (tempEl) tempEl.remove();
      box.innerHTML = `<pre class="step-code"><code>${code}</code></pre>`;
    }
  }
}

function parseMarkdownCallouts(html) {
  return html.replace(/<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, (match, type, content) => {
    const lowerType = type.toLowerCase();
    const typeTitle = type.toUpperCase();
    return `<div class="vp-callout ${lowerType}"><div class="vp-callout-title">${typeTitle}</div><p>${content}</p></div>`;
  });
}

function renderDocsContent() {
  return div(
    { class: 'vp-content-wrapper' },

    // Mobile Docs Menu Bar
    div(
      { class: 'mobile-docs-bar' },
      button(
        [Icons.list(16), 'Browse Documents'],
        {
          variant: 'custom',
          class: 'mobile-docs-toggle-btn',
          onclick: () => (isMobileDocsMenuOpen.value = true),
        }
      ),
      span({ class: 'mobile-docs-active-title' }, () => (activeDoc.value ? activeDoc.value.title : 'Docs'))
    ),

    () => {
      const doc = activeDoc.value;
      if (!doc) {
        return div(
          { class: 'vp-doc-container' },
          h2('Documentation'),
          p('Select a document from the sidebar to begin reading.')
        );
      }

      const rawContent = doc.content || docContentCache[doc.id] || `# ${doc.title}\n\nLoading document content...`;
      const readingTime = calculateReadingTime(rawContent);

      let rawHtml = '';
      if (typeof window.marked !== 'undefined') {
        try {
          rawHtml = window.marked.parse(rawContent);
        } catch (e) {
          rawHtml = `<pre><code>${rawContent}</code></pre>`;
        }
      } else {
        rawHtml = `<pre><code>${rawContent}</code></pre>`;
      }

      rawHtml = rawHtml.replace(
        /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
        (match, codeText) => {
          const cleanCode = unescapeHtmlEntities(codeText);
          const encoded = encodeURIComponent(cleanCode);
          return `<div class="mermaid-diagram-box" data-mermaid-code="${encoded}"></div>`;
        }
      );

      rawHtml = parseMarkdownCallouts(rawHtml);

      const articleEl = div({
        class: 'markdown-body',
        innerHTML: rawHtml,
      });

      // Highlight syntax and render Mermaid
      setTimeout(() => {
        if (typeof window.Prism !== 'undefined') {
          try {
            window.Prism.highlightAllUnder(articleEl);
          } catch (e) {}
        }
        initMermaidInArticle();
      }, 50);

      // Attach copy buttons to pre blocks
      setTimeout(() => {
        const preBlocks = articleEl.querySelectorAll('pre');
        preBlocks.forEach((preEl) => {
          if (!preEl.querySelector('.code-copy-btn')) {
            const btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.innerHTML = `<span>Copy</span>`;
            btn.onclick = () => {
              const text = preEl.querySelector('code') ? preEl.querySelector('code').innerText : preEl.innerText;
              copyToClipboard(text);
              btn.innerHTML = `<span>Copied!</span>`;
              setTimeout(() => { btn.innerHTML = `<span>Copy</span>`; }, 2000);
            };
            preEl.appendChild(btn);
          }
        });
      }, 60);

      // Previous & Next Doc Calculation
      const currentIndex = docsList.value.findIndex((d) => d.id === doc.id);
      const prevDoc = currentIndex > 0 ? docsList.value[currentIndex - 1] : null;
      const nextDoc = currentIndex < docsList.value.length - 1 ? docsList.value[currentIndex + 1] : null;

      return div(
        { class: 'vp-doc-container' },
        div(
          { class: 'vp-doc-header' },
          div(
            { class: 'vp-breadcrumb' },
            span({ class: 'cat' }, doc.category),
            '/',
            span(doc.path)
          ),
          h1(doc.title),
          div(
            { class: 'vp-meta-bar' },
            span({ class: 'vp-meta-item' }, [Icons.clock(13), readingTime]),
            a(
              {
                href: `https://github.com/EldrexDelosReyesBula/CodeMemory/blob/main/${doc.path}`,
                target: '_blank',
                rel: 'noopener noreferrer',
                class: 'vp-meta-item',
                style: { color: 'var(--vp-c-text-3)', textDecoration: 'none' },
              },
              [Icons.external(12), 'View on GitHub']
            )
          )
        ),
        articleEl,

        // Article Feedback Box
        div(
          { class: 'vp-feedback-box' },
          span(
            { class: 'vp-feedback-title' },
            () => (feedbackGiven.value[doc.id] ? 'Thank you for your feedback!' : 'Was this documentation helpful?')
          ),
          () => {
            if (feedbackGiven.value[doc.id]) return null;
            return div(
              { class: 'vp-feedback-btns' },
              button(['👍 Yes'], {
                variant: 'custom',
                class: 'vp-feedback-btn',
                onclick: () => {
                  feedbackGiven.value = { ...feedbackGiven.value, [doc.id]: 'yes' };
                },
              }),
              button(['👎 No'], {
                variant: 'custom',
                class: 'vp-feedback-btn',
                onclick: () => {
                  feedbackGiven.value = { ...feedbackGiven.value, [doc.id]: 'no' };
                },
              })
            );
          }
        ),

        // Next / Prev Pager Cards
        div(
          { class: 'vp-doc-pager' },
          prevDoc
            ? div(
                {
                  class: 'vp-pager-link',
                  onclick: () => navigateTo('docs', prevDoc.id),
                },
                span({ class: 'vp-pager-sub' }, [Icons.arrowLeft(12), ' Previous Page']),
                span({ class: 'vp-pager-title' }, prevDoc.title)
              )
            : div(),
          nextDoc
            ? div(
                {
                  class: 'vp-pager-link',
                  style: { textAlign: 'right' },
                  onclick: () => navigateTo('docs', nextDoc.id),
                },
                span({ class: 'vp-pager-sub' }, ['Next Page ', Icons.arrowRight(12)]),
                span({ class: 'vp-pager-title' }, nextDoc.title)
              )
            : div()
        )
      );
    }
  );
}

function renderDocsAside() {
  return div(
    { class: 'vp-aside' },
    () => {
      const doc = activeDoc.value;
      if (!doc) return null;

      const rawContent = doc.content || docContentCache[doc.id] || '';
      const headings = [];
      const lines = rawContent.split('\n');
      for (const line of lines) {
        const match = line.match(/^(#{2,3})\s+(.+)$/);
        if (match) {
          headings.push({
            level: match[1].length === 2 ? 'h2' : 'h3',
            text: match[2].replace(/[#`*]/g, '').trim(),
          });
        }
      }

      if (headings.length === 0) return null;

      return div(
        div({ class: 'vp-aside-title' }, 'On this page'),
        div(
          { class: 'vp-toc-list' },
          headings.map((hItem) =>
            div(
              {
                class: () =>
                  activeHeading.value === hItem.text
                    ? `vp-toc-link ${hItem.level} active`
                    : `vp-toc-link ${hItem.level}`,
                onclick: () => {
                  if (typeof document !== 'undefined') {
                    const allHeadings = Array.from(document.querySelectorAll('.markdown-body h2, .markdown-body h3'));
                    const target = allHeadings.find((el) => el.textContent.includes(hItem.text));
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                },
              },
              hItem.text
            )
          )
        )
      );
    }
  );
}

function renderDocumentationHub() {
  return div(
    { class: 'vp-docs-page' },
    renderDocsSidebar(),
    renderDocsContent(),
    renderDocsAside()
  );
}

// --- Main App Root ---

function renderApp() {
  return div(
    { class: 'app-root' },
    renderHeader(),
    renderMobileDrawer(),
    renderLocalLaunchModal(),
    renderMobileDocsModal(),
    renderSearchModal(),
    div(
      { class: 'app-main' },
      () => {
        switch (activeTab.value) {
          case 'explorer':
            return renderArchitectureExplorer();
          case 'docs':
            return renderDocumentationHub();
          case 'home':
          default:
            return renderLandingPage();
        }
      }
    ),
    Footer(
      { class: 'footer' },
      p('CodeMemory v1.0.0 — The Persistent Engineering Context Layer for AI Agents.'),
      p(
        { style: { fontSize: '0.8rem', marginTop: '0.35rem', color: '#64748b' } },
        'Official Documentation at ',
        a({ href: 'https://codemem.vercel.app/', target: '_blank', style: { color: 'var(--vp-c-brand)' } }, 'codemem.vercel.app'),
        '. Built by Eldrex Delos Reyes Bula with @eldrex/cairnjs v1.2.0. Licensed under MIT.'
      )
    )
  );
}

mount('#app', renderApp());
