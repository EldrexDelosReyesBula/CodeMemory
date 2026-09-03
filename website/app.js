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
  input,
  header as Header,
  nav as Nav,
  footer as Footer,
  pre,
  code,
  mount,
} from './cairn.js';
import { EMBEDDED_DOCS } from './docs-data.js';

function button(arg1, ...rest) {
  if (rest.length > 0 && typeof rest[0] === 'object' && !Array.isArray(rest[0]) && !rest[0]?._isCairnState && !rest[0]?.nodeType) {
    const props = rest[0];
    const children = Array.isArray(arg1) ? arg1 : [arg1];
    return h('button', props, ...children, ...rest.slice(1));
  }
  if (typeof arg1 === 'object' && !Array.isArray(arg1) && !arg1?._isCairnState && !arg1?.nodeType) {
    return h('button', arg1, ...rest);
  }
  return h('button', {}, arg1, ...rest);
}

const img = (...args) => h('img', ...args);
const a = (...args) => h('a', ...args);

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
  gitCommit: (size = 18) => createSvgIcon(['M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M2 12h4', 'M18 12h4'], size),
  play: (size = 16) => createSvgIcon('M5 3l14 9-14 9V3z', size),
};

// --- Documentation Catalog ---
const DOC_ENTRIES_CATALOG = [
  { id: 'quick-start', title: 'Quick Start Guide', category: 'Getting Started', path: 'docs/getting-started/quick-start.md' },
  { id: 'installation', title: 'Installation Guide', category: 'Getting Started', path: 'docs/getting-started/installation.md' },
  { id: 'devdiff-integration', title: 'DevDiff Integration Guide', category: 'How-To Guides', path: 'docs/how-to/devdiff-integration.md' },
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
  { id: 'changelog', title: 'Release Changelog', category: 'Releases', path: 'CHANGELOG.md' }
];

// --- Reactive State ---
const activeTab = state('home');
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

// --- Environment & Backend Connectivity State ---
const isBackendConnected = state(false);
const isLocalEnvironment = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.hostname === '[::1]'
);
const isLocalCodeMemoryServer = isLocalEnvironment;

// Asynchronously load markdown content
async function fetchDocumentContent(doc) {
  if (!doc) return '';
  if (doc.content) {
    return doc.content;
  }
  if (docContentCache[doc.id]) {
    return docContentCache[doc.id];
  }

  if (isBackendConnected.value) {
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
    } catch (e) { }
  }

  return `# ${doc.title}\n\nDocumentation content loaded.`;
}

function updateDocContentInState(id, content) {
  docsList.value = docsList.value.map((d) => (d.id === id ? { ...d, content } : d));
}

// Fetch live architecture graph and codebase memory
async function loadArchitectureMemory() {
  try {
    let res = null;
    try {
      res = await fetch('/api/architecture');
    } catch { }

    if (!res || !res.ok) {
      if (typeof window !== 'undefined' && window.location.port !== '3737') {
        try {
          const altRes = await fetch('http://127.0.0.1:3737/api/architecture', { mode: 'cors' });
          if (altRes.ok) {
            res = altRes;
          }
        } catch { }
      }
    }

    if (!res || !res.ok) {
      isBackendConnected.value = false;
      return;
    }

    const data = await res.json();
    isBackendConnected.value = true;
    if (data.nodes) archNodes.value = data.nodes;
    if (data.edges) archEdges.value = data.edges;
    if (data.metrics) archMetrics.value = data.metrics;

    // Load auxiliary endpoints only when backend confirmed active
    try {
      const changesRes = await fetch('/api/changes?limit=40');
      if (changesRes.ok) {
        const cdata = await changesRes.json();
        if (Array.isArray(cdata)) recentChanges.value = cdata;
      }
    } catch (e) { }

    try {
      const hotRes = await fetch('/api/hotspots?limit=15');
      if (hotRes.ok) {
        const hdata = await hotRes.json();
        if (Array.isArray(hdata)) hotspotsList.value = hdata;
      }
    } catch (e) { }

    try {
      const timeRes = await fetch('/api/timeline');
      if (timeRes.ok) {
        const tdata = await timeRes.json();
        if (tdata.timeline && Array.isArray(tdata.timeline)) {
          timelineHistory.value = tdata.timeline;
        }
      }
    } catch (e) { }
  } catch (e) {
    isBackendConnected.value = false;
  }
}

// Inspect a specific file node in depth
async function inspectNode(node) {
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

  if (!isBackendConnected.value) {
    // Offline / Demo mode node details
    selectedNodeDetails.value = {
      dependencies: [],
      dependents: [],
      symbols: node.symbols || [],
      annotations: node.annotations || [],
      loading: false,
    };
    return;
  }

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

// Generate test AI Context slice
async function generateContextSlice() {
  if (!isBackendConnected.value) {
    contextResult.value = {
      task: contextTaskPrompt.value,
      budget: Number(contextBudget.value),
      tokensUsed: 420,
      contextSlice: `// [Demo Context Slice]\n// File: ${selectedNode.value ? selectedNode.value.path : 'src/index.ts'}\n// Connect local server via \`codememory web\` for live context generation.\n\nexport function example() {\n  return "Live CodeMemory context slice";\n}`,
    };
    return;
  }

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

let activeSseInstance = null;

function setupSSE() {
  if (typeof window === 'undefined' || !window.EventSource || !isBackendConnected.value) return;
  if (activeSseInstance) {
    try { activeSseInstance.close(); } catch (e) { }
  }

  try {
    const sse = new EventSource('/ws/updates');
    activeSseInstance = sse;
    sse.onmessage = () => {
      try {
        loadArchitectureMemory();
      } catch (e) { }
    };
    sse.onerror = () => {
      // Close on error/404 to avoid browser retry loops
      sse.close();
      activeSseInstance = null;
    };
  } catch (e) { }
}

// Load initial documentation & check backend connectivity
async function loadInitialData() {
  await loadArchitectureMemory();

  if (isBackendConnected.value) {
    setupSSE();
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
    } catch (err) { }
  }

  const current = docsList.value.find((d) => d.id === selectedDocId.value) || docsList.value[0];
  if (current) {
    await fetchDocumentContent(current);
  }
}

loadInitialData();

// Check URL hash on initial load
function syncTabWithUrl() {
  if (typeof window === 'undefined' || !window.location) return;
  const hash = (window.location.hash || '').replace('#', '');
  if (hash === 'home' || hash === 'docs') {
    activeTab.value = hash;
  } else if (hash === 'explorer') {
    activeTab.value = 'explorer';
  } else if (DOC_ENTRIES_CATALOG.some((d) => d.id === hash)) {
    activeTab.value = 'docs';
    selectedDocId.value = hash;
  } else {
    activeTab.value = 'home';
  }
}

syncTabWithUrl();

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', syncTabWithUrl);
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

// Filtered Architecture Nodes computed signal
const filteredArchNodes = computed(() => {
  let list = isBackendConnected.value ? archNodes.value : [];

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
        'CodeMemory'
      )
    ),
    Nav(
      { class: 'main-nav' },
      button(['Overview'], {
        variant: 'custom',
        class: () => (activeTab.value === 'home' ? 'nav-link-btn active' : 'nav-link-btn'),
        onclick: () => navigateTo('home'),
      }),
      button(['Documentation'], {
        variant: 'custom',
        class: () => (activeTab.value === 'docs' && selectedDocId.value !== 'changelog' ? 'nav-link-btn active' : 'nav-link-btn'),
        onclick: () => navigateTo('docs', 'quick-start'),
      }),
      isLocalEnvironment
        ? button(['Web Explorer'], {
          variant: 'custom',
          class: () => (activeTab.value === 'explorer' ? 'nav-link-btn active' : 'nav-link-btn'),
          onclick: () => navigateTo('explorer'),
        })
        : button(['Explorer'], {
          variant: 'custom',
          class: () => (activeTab.value === 'explorer' ? 'nav-link-btn active' : 'nav-link-btn'),
          onclick: () => { isLocalLaunchModalOpen.value = true; },
        }),
      button(['Changelog'], {
        variant: 'custom',
        class: () => (activeTab.value === 'docs' && selectedDocId.value === 'changelog' ? 'nav-link-btn active' : 'nav-link-btn'),
        onclick: () => navigateTo('docs', 'changelog'),
      })
    ),
    div(
      { class: 'header-actions' },
      button(
        [
          Icons.search(15),
          span({ class: 'search-trigger-text' }, 'Search'),
          span({ class: 'search-kbd' }, '⌘K'),
        ],
        {
          variant: 'custom',
          class: 'search-trigger-btn',
          title: 'Search documentation',
          onclick: () => (isSearchModalOpen.value = true),
        }
      ),
      button(
        ['Get Started →'],
        {
          variant: 'custom',
          class: 'header-cta-btn',
          onclick: () => navigateTo('docs', 'quick-start'),
        }
      ),
      a(
        {
          href: 'https://github.com/EldrexDelosReyesBula/CodeMemory',
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'header-icon-btn',
          title: 'GitHub Repository',
        },
        Icons.github(18)
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
    button([Icons.home(18), 'Overview'], {
      variant: 'custom',
      class: () => (activeTab.value === 'home' ? 'nav-link-btn active' : 'nav-link-btn'),
      onclick: () => navigateTo('home'),
    }),
    button([Icons.book(18), 'Documentation'], {
      variant: 'custom',
      class: () => (activeTab.value === 'docs' && selectedDocId.value !== 'changelog' ? 'nav-link-btn active' : 'nav-link-btn'),
      onclick: () => navigateTo('docs', 'quick-start'),
    }),
    button([Icons.network(18), 'Web Explorer'], {
      variant: 'custom',
      class: () => (activeTab.value === 'explorer' ? 'nav-link-btn active' : 'nav-link-btn'),
      onclick: () => {
        if (isLocalEnvironment) {
          navigateTo('explorer');
        } else {
          isMobileMenuOpen.value = false;
          isLocalLaunchModalOpen.value = true;
        }
      },
    }),
    button([Icons.activity(18), 'Changelog'], {
      variant: 'custom',
      class: () => (activeTab.value === 'docs' && selectedDocId.value === 'changelog' ? 'nav-link-btn active' : 'nav-link-btn'),
      onclick: () => navigateTo('docs', 'changelog'),
    }),
    button([Icons.search(18), 'Search'], {
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
            { style: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' } },
            button(
              {
                variant: 'custom',
                class: 'btn-secondary-pill',
                onclick: () => {
                  isLocalLaunchModalOpen.value = false;
                  navigateTo('docs', 'quick-start');
                },
              },
              ['Browse Documentation ', Icons.arrowRight(14)]
            ),
            button(
              {
                variant: 'custom',
                class: 'btn-primary-pill',
                onclick: () => (isLocalLaunchModalOpen.value = false),
              },
              ['Got It ', Icons.check(14)]
            )
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
                  onclick: () => {
                    isSearchModalOpen.value = false;
                    globalSearchQuery.value = '';
                    navigateTo('docs', item.id);
                  },
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
    div(
      { class: 'landing-hero-edge-bg' },
      img({
        src: './assets/codemem-hero.gif',
        alt: 'CodeMemory Hero Background Animation',
        class: 'hero-edge-gif',
        onerror: (e) => {
          if (!e.target.dataset.tried) {
            e.target.dataset.tried = 'true';
            e.target.src = '../assets/codemem-hero.gif';
          }
        },
      }),
      div({ class: 'hero-edge-overlay' })
    ),
    div({ class: 'landing-bg-glow' }),

    // Hero Section
    div(
      { class: 'landing-hero' },
      // Floating Brand Icon (Matching CairnJS floating pebble stack style)
      div(
        { class: 'hero-floating-icon-wrap' },
        img({
          src: './assets/codememory-logo.png',
          alt: 'CodeMemory Floating Icon',
          class: 'hero-floating-icon',
          onerror: (e) => {
            if (!e.target.dataset.tried) {
              e.target.dataset.tried = 'true';
              e.target.src = '../assets/codememory-logo.png';
            }
          },
        })
      ),

      // Live Pill Badge
      div(
        {
          class: 'hero-pill',
          onclick: () => navigateTo('docs', 'changelog'),
          style: { cursor: 'pointer' },
        },
        span({ class: 'hero-pill-dot' }),
        span({ class: 'hero-pill-ver' }, 'v2.0.0'),
        span({ class: 'hero-pill-sep' }, '•'),
        span({ class: 'hero-pill-action' }, ["What's New →"])
      ),

      // Main Headline
      h1(
        { class: 'hero-title' },
        'AI coding assistants start every session blind. ',
        span(
          { class: 'gradient-text' },
          'CodeMemory gives them instant architectural recall.'
        )
      ),

      // Subtitle
      p(
        { class: 'hero-subtitle' },
        'Stop burning tokens dumping entire directories into LLM prompts. CodeMemory indexes your codebase topology into local SQLite memory — delivering surgical AST symbol slices, caller graphs, and live change awareness to Cursor, Claude Desktop, Copilot, and Antigravity with zero cloud telemetry.'
      ),

      // Install Bar with Copy
      div(
        {
          class: 'hero-install-bar',
          onclick: () => copyToClipboard('npx @eldrex/codememory init', 'Command copied!'),
        },
        span({ class: 'install-prompt' }, '$'),
        span({ class: 'install-cmd' }, 'npx @eldrex/codememory init'),
        button(
          {
            class: () => (copyNotice.value ? 'install-copy-btn copied' : 'install-copy-btn'),
            type: 'button',
            onclick: (e) => {
              if (e && e.stopPropagation) e.stopPropagation();
              copyToClipboard('npx @eldrex/codememory init', 'Command copied!');
            },
          },
          () => (copyNotice.value ? 'Copied!' : 'Copy')
        )
      ),

      // Hero Actions
      div(
        { class: 'hero-actions' },
        button(['Get Started →'], {
          variant: 'custom',
          class: 'btn-primary-pill',
          onclick: () => navigateTo('docs', 'quick-start'),
        }),
        button(
          [Icons.network(16), 'Explore Visualizer'],
          {
            variant: 'custom',
            class: 'btn-secondary-pill',
            onclick: () => {
              if (isLocalEnvironment) {
                navigateTo('explorer');
              } else {
                isLocalLaunchModalOpen.value = true;
              }
            },
          }
        ),
        a(
          {
            href: 'https://github.com/EldrexDelosReyesBula/CodeMemory',
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'btn-secondary-pill',
          },
          [Icons.github(16), 'GitHub']
        )
      ),

      // Hero Metrics Strip
      div(
        { class: 'hero-metrics-strip' },
        div(
          { class: 'hero-metric-item' },
          div({ class: 'hero-metric-val' }, '< 100ms'),
          div({ class: 'hero-metric-label' }, 'Sync Latency')
        ),
        div(
          { class: 'hero-metric-item' },
          div({ class: 'hero-metric-val' }, '0 KB'),
          div({ class: 'hero-metric-label' }, 'Cloud Telemetry (100% Local)')
        ),
        div(
          { class: 'hero-metric-item' },
          div({ class: 'hero-metric-val' }, 'Up to 80%'),
          div({ class: 'hero-metric-label' }, 'Token Budget Saved')
        ),
        div(
          { class: 'hero-metric-item' },
          div({ class: 'hero-metric-val' }, '7+ Languages'),
          div({ class: 'hero-metric-label' }, 'Multi-AST Grammar Engine')
        )
      )
    ),

    // Feature Grid (Structured CodeMemory Architecture)
    div(
      { class: 'cairn-features-section' },
      div(
        { class: 'section-header' },
        h2('Engineered for Token Efficiency & Deep Structural Context'),
        p('Equip AI agents with exact AST symbol graphs, caller hierarchies, and dependency trees without bloated prompts or cloud telemetry.')
      ),
      div(
        { class: 'cairn-features-grid' },
        div(
          {
            class: 'cairn-feature-card',
            onclick: () => navigateTo('docs', 'cli-reference'),
            style: { cursor: 'pointer' },
          },
          div({ class: 'cairn-card-icon icon-cyan' }, Icons.terminal(20)),
          h3('Multi-Language AST Indexer'),
          p('High-fidelity symbol extraction for classes, methods, functions, and imports across TypeScript, JavaScript, Python, Rust, Go, SQL, and C++.')
        ),
        div(
          {
            class: 'cairn-feature-card',
            onclick: () => navigateTo('docs', 'token-optimization'),
            style: { cursor: 'pointer' },
          },
          div({ class: 'cairn-card-icon icon-purple' }, Icons.zap(20)),
          h3('Token-Budgeted Context Slicing'),
          p('Eliminate prompt bloat. CodeMemory extracts and ranks only task-relevant AST symbols, caller paths, and recent diffs within strict token budgets.')
        ),
        div(
          {
            class: 'cairn-feature-card',
            onclick: () => navigateTo('docs', 'privacy-policy'),
            style: { cursor: 'pointer' },
          },
          div({ class: 'cairn-card-icon icon-green' }, Icons.shield(20)),
          h3('Zero-Dependency Local Persistence'),
          p('Engineered with pure Node.js and SQLite in WAL mode. 100% private, runs entirely on your local machine with zero external cloud telemetry.')
        ),
        div(
          {
            class: 'cairn-feature-card',
            onclick: () => navigateTo('docs', 'domain-model'),
            style: { cursor: 'pointer' },
          },
          div({ class: 'cairn-card-icon icon-violet' }, Icons.activity(20)),
          h3('Sub-100ms Incremental Watcher'),
          p('Real-time debounced file watcher keeps codebase memory synchronized instantly as you edit, respecting .gitignore and security rules.')
        ),
        div(
          {
            class: 'cairn-feature-card',
            onclick: () => navigateTo('docs', 'mcp-protocol'),
            style: { cursor: 'pointer' },
          },
          div({ class: 'cairn-card-icon icon-amber' }, Icons.bot(20)),
          h3('Native Model Context Protocol'),
          p('Standardized MCP tools connect seamlessly to Cursor AI, Claude Desktop, Antigravity, VS Code Copilot, and autonomous agent sidecars.')
        ),
        div(
          {
            class: 'cairn-feature-card',
            onclick: () => navigateTo('docs', 'devdiff-integration'),
            style: { cursor: 'pointer' },
          },
          div({ class: 'cairn-card-icon icon-rose' }, Icons.gitCommit(20)),
          h3('Surgical Diff & Change Memory'),
          p('Optional deep synergy with DevDiff for AST-aware diff comparisons, semantic commit generation, and historical change memory tracking.')
        )
      )
    ),

    // Big Sandbox / Visualizer CTA Card
    div(
      { class: 'cairn-cta-banner-section' },
      div(
        { class: 'cairn-cta-banner' },
        h2('See Your Codebase Architecture Come Alive'),
        p('Launch the local visualizer to explore interactive dependency flowcharts, caller hierarchies, hotspot analysis, and live watcher timelines.'),
        div(
          { class: 'cairn-cta-actions' },
          button(
            [Icons.play(16), 'Launch Visualizer'],
            {
              variant: 'custom',
              class: 'btn-primary-pill',
              onclick: () => {
                if (isLocalEnvironment) {
                  navigateTo('explorer');
                } else {
                  isLocalLaunchModalOpen.value = true;
                }
              },
            }
          ),
          button(
            [Icons.book(16), 'Quickstart Guide'],
            {
              variant: 'custom',
              class: 'btn-secondary-pill',
              onclick: () => navigateTo('docs', 'quick-start'),
            }
          )
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
  const edges = isBackendConnected.value ? archEdges.value : [];
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
  } catch (err) { }
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
  if (!isBackendConnected.value) {
    return div(
      { class: 'explorer-container', style: { textAlign: 'center', padding: '4rem 1.5rem', maxWidth: '720px', margin: '0 auto' } },
      div({ style: { display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.12)', color: 'var(--vp-c-brand)', marginBottom: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.25)' } }, Icons.network(36)),
      h2({ style: { marginTop: '0.5rem', color: '#fff', fontSize: '1.75rem', fontWeight: '800' } }, 'Local Architecture & Memory Explorer'),
      p({ style: { color: 'var(--vp-c-text-2)', lineHeight: '1.6', margin: '1rem auto 1.5rem' } },
        'The live architecture explorer visualizes your local codebase AST symbols, caller trees, and real-time dependency topology directly from your local SQLite memory.'
      ),
      div(
        {
          class: 'hero-install-bar',
          style: { maxWidth: '440px', margin: '0 auto 1.75rem', width: '100%', justifyContent: 'space-between' },
          onclick: () => copyToClipboard('npx @eldrex/codememory web', 'Command copied!'),
        },
        div(
          { style: { display: 'flex', alignItems: 'center', gap: '0.65rem' } },
          span({ class: 'install-prompt' }, '$'),
          span({ class: 'install-cmd' }, 'npx @eldrex/codememory web')
        ),
        button(
          {
            class: () => (copyNotice.value ? 'install-copy-btn copied' : 'install-copy-btn'),
            type: 'button',
            onclick: (e) => {
              if (e && e.stopPropagation) e.stopPropagation();
              copyToClipboard('npx @eldrex/codememory web', 'Command copied!');
            },
          },
          () => (copyNotice.value ? 'Copied!' : 'Copy')
        )
      ),
      div(
        { style: { display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' } },
        button(
          {
            variant: 'custom',
            class: 'btn-primary-pill',
            onclick: () => loadArchitectureMemory(),
          },
          [Icons.refresh(14), ' Connect to Local Server']
        ),
        button(
          {
            variant: 'custom',
            class: 'btn-secondary-pill',
            onclick: () => {
              activeTab.value = 'docs';
              selectedDocId.value = 'quick-start';
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            },
          },
          [Icons.zap(14), ' View Quick Start Guide']
        )
      )
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
    case 'Releases': return Icons.activity(14);
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

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseInline(text) {
  return (text || '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderMarkdownDocument(rawMarkdown) {
  if (!rawMarkdown) return '';
  let text = rawMarkdown.replace(/\\`\\`\\`/g, '```').replace(/\\`/g, '`');

  if (typeof window !== 'undefined' && typeof window.marked !== 'undefined') {
    try {
      let html = window.marked.parse(text, { gfm: true, breaks: false });
      html = html.replace(
        /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
        (match, codeText) => {
          const cleanCode = unescapeHtmlEntities(codeText);
          const encoded = encodeURIComponent(cleanCode);
          return `<div class="mermaid-diagram-box" data-mermaid-code="${encoded}"></div>`;
        }
      );
      return parseMarkdownCallouts(html);
    } catch (e) {
      console.warn('Marked parse fallback:', e);
    }
  }

  // Robust fallback markdown parser
  const lines = text.split('\n');
  let inCode = false;
  let codeLang = '';
  let codeBuffer = [];
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const codeMatch = line.match(/^```(\w*)/);
    if (codeMatch) {
      if (inCode) {
        inCode = false;
        const rawCode = codeBuffer.join('\n');
        if (codeLang === 'mermaid') {
          out.push(`<div class="mermaid-diagram-box" data-mermaid-code="${encodeURIComponent(rawCode)}"></div>`);
        } else {
          out.push(`<pre><code class="language-${codeLang || 'text'}">${escapeHtml(rawCode)}</code></pre>`);
        }
        codeBuffer = [];
        codeLang = '';
      } else {
        inCode = true;
        codeLang = codeMatch[1] || '';
        codeBuffer = [];
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      out.push(`<h1>${parseInline(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      out.push(`<h2>${parseInline(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      out.push(`<h3>${parseInline(line.slice(4))}</h3>`);
    } else if (line.startsWith('#### ')) {
      out.push(`<h4>${parseInline(line.slice(5))}</h4>`);
    } else if (line.startsWith('> [!')) {
      const calloutMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
      if (calloutMatch) {
        const type = calloutMatch[1].toLowerCase();
        out.push(`<div class="vp-callout ${type}"><div class="vp-callout-title">${type.toUpperCase()}</div><p>${parseInline(calloutMatch[2] || '')}</p></div>`);
      } else {
        out.push(`<blockquote><p>${parseInline(line.slice(1).trim())}</p></blockquote>`);
      }
    } else if (line.startsWith('> ')) {
      out.push(`<blockquote><p>${parseInline(line.slice(2))}</p></blockquote>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      out.push(`<ul><li>${parseInline(line.slice(2))}</li></ul>`);
    } else if (line.trim() === '---') {
      out.push('<hr>');
    } else if (line.trim()) {
      out.push(`<p>${parseInline(line)}</p>`);
    }
  }

  if (inCode && codeBuffer.length > 0) {
    out.push(`<pre><code class="language-${codeLang || 'text'}">${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
  }

  return parseMarkdownCallouts(out.join('\n'));
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
      const rawHtml = renderMarkdownDocument(rawContent);

      const articleEl = div({
        class: 'markdown-body',
        innerHTML: rawHtml,
      });

      // Highlight syntax and render Mermaid
      setTimeout(() => {
        if (typeof window.Prism !== 'undefined') {
          try {
            window.Prism.highlightAllUnder(articleEl);
          } catch (e) { }
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

// --- Footer (CairnJS Design System) ---

function renderFooter() {
  return Footer(
    { class: 'cairn-footer' },
    div(
      { class: 'cairn-footer-top' },
      div(
        { class: 'cairn-footer-brand' },
        div(
          { class: 'footer-logo-row' },
          img({
            src: './assets/codememory-logo.png',
            alt: 'CodeMemory Logo',
            class: 'footer-logo-img',
            onerror: (e) => {
              if (!e.target.dataset.tried) {
                e.target.dataset.tried = 'true';
                e.target.src = '../assets/codememory-logo.png';
              }
            },
          }),
          span({ class: 'footer-brand-name' }, 'CodeMemory')
        ),
        p(
          { class: 'footer-brand-desc' },
          'A simple, standalone codebase memory engine and native Model Context Protocol (MCP) server for AI coding assistants — built with zero external dependencies.'
        )
      ),
      div(
        { class: 'cairn-footer-links' },
        div(
          { class: 'footer-link-col' },
          h4('DOCUMENTATION'),
          a({ onclick: () => navigateTo('docs', 'quick-start') }, 'Getting Started'),
          a({ onclick: () => navigateTo('docs', 'installation') }, 'Installation'),
          a({ onclick: () => navigateTo('docs', 'token-optimization') }, 'Token Budgeting'),
          a({ onclick: () => navigateTo('docs', 'cli-reference') }, 'CLI Reference'),
          a({ onclick: () => navigateTo('docs', 'mcp-protocol') }, 'MCP Protocol')
        ),
        div(
          { class: 'footer-link-col' },
          h4('ARCHITECTURE'),
          a({ onclick: () => navigateTo('docs', 'domain-model') }, 'Domain Model'),
          a({ onclick: () => navigateTo('docs', 'plugins') }, 'Plugin Engine'),
          a({ onclick: () => navigateTo('docs', 'skills-guide') }, 'Agent Skills'),
          a({ onclick: () => navigateTo('docs', 'devdiff-integration') }, 'DevDiff Synergy'),
          a({ onclick: () => navigateTo('docs', 'privacy-policy') }, 'Privacy Guarantee')
        ),
        div(
          { class: 'footer-link-col' },
          h4('ECOSYSTEM'),
          a({ onclick: () => navigateTo('docs', 'changelog') }, 'Release Changelog'),
          a({ onclick: () => (isLocalEnvironment ? navigateTo('explorer') : (isLocalLaunchModalOpen.value = true)) }, 'Web Explorer'),
          a({ href: 'https://github.com/EldrexDelosReyesBula/CodeMemory', target: '_blank', rel: 'noopener noreferrer' }, 'GitHub Repository'),
          a({ href: 'https://github.com/EldrexDelosReyesBula', target: '_blank', rel: 'noopener noreferrer', style: { color: '#ec4899', fontWeight: '600' } }, 'Support Author ❤️')
        )
      )
    ),
    div(
      { class: 'cairn-footer-bottom' },
      p('Released under the MIT License. • Copyright © 2026 Eldrex Bula & CodeMemory Contributors.'),
      p(
        'Built with ',
        a({ href: 'https://cairnjs.org', target: '_blank', style: { color: 'var(--vp-c-brand)' } }, 'CairnJS'),
        ' — A Lightweight, Zero-Dependency Reactive Framework'
      )
    )
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
    renderFooter()
  );
}

mount('#app', renderApp());
