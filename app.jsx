import { render } from '@solidjs/web';
import { createSignal, createMemo, onCleanup, Show, For } from 'solid-js';
import JSZip from 'jszip';
import { INITIAL_CATAMARAN_BRANCHES, INITIAL_PIER_BRANCHES } from './data/catamaran.js';

function App() {
  const [catBranches, setCatBranches] = createSignal(INITIAL_CATAMARAN_BRANCHES);
  const [pierBranches, setPierBranches] = createSignal(INITIAL_PIER_BRANCHES);
  const [globalProgress, setGlobalProgress] = createSignal('');
  const [isCompiling, setIsCompiling] = createSignal(false);
  const [compileProgressText, setCompileProgressText] = createSignal('');

  // Parameter Modal state
  const [modalItem, setModalItem] = createSignal(null);
  const [modalDomain, setModalDomain] = createSignal(null);
  const [modalParams, setModalParams] = createSignal({});

  // Step-Specific Action Space Topology Poppet Modal state
  const [topologyModalItem, setTopologyModalItem] = createSignal(null);
  const [isTopologyLoading, setIsTopologyLoading] = createSignal(false);
  const [topologyStatuses, setTopologyStatuses] = createSignal([]);
  const [elapsedSeconds, setElapsedSeconds] = createSignal(0);
  const [pipelineStage, setPipelineStage] = createSignal({ step: 0, label: 'Idle', estimate: '' });
  const [topologyData, setTopologyData] = createSignal({
    llmResponse: '',
    explanation: '',
    edges: [],
    paths: [],
    prologOutput: ''
  });

  let timerInterval = null;
  let currentAbortController = null;
  let statusLogEl = null;

  const stopTimer = () => {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  onCleanup(() => {
    stopTimer();
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
  });

  const openModal = (domain, item) => {
    setModalDomain(domain);
    setModalItem(item);
    setModalParams({ ...(item.parameters || {}) });
  };

  const closeModal = () => {
    setModalItem(null);
    setModalDomain(null);
    setModalParams({});
  };

  const handleParamChange = (key, value) => {
    setModalParams(prev => ({ ...prev, [key]: value }));
  };

  const appendStatus = (msg) => {
    const stamp = `${elapsedSeconds().toFixed(1)}s`;
    setTopologyStatuses(prev => [...prev, `[${stamp}] ${msg}`]);
    setTimeout(() => {
      if (statusLogEl) {
        statusLogEl.scrollTop = statusLogEl.scrollHeight;
      }
    }, 0);
  };

  const updateStageFromStatus = (statusText) => {
    if (statusText.startsWith('[4/4]')) {
      setPipelineStage({
        step: 4,
        label: 'Stage 4/4: Compiling PDF & building graph topology...',
        estimate: 'Finalizing'
      });
    } else if (statusText.startsWith('[3/4]')) {
      setPipelineStage({
        step: 3,
        label: 'Stage 3/4: Synthesizing operational sequence analysis (Gemma 2B)...',
        estimate: 'Typically 5–12s'
      });
    } else if (statusText.startsWith('[2/4]')) {
      setPipelineStage({
        step: 2,
        label: 'Stage 2/4: Executing Trealla Prolog (tpl) DP solver...',
        estimate: 'Usually < 2s'
      });
    } else if (statusText.startsWith('[1/4]')) {
      setPipelineStage({
        step: 1,
        label: 'Stage 1/4: Generating Prolog AST facts via Gemma 2B...',
        estimate: 'Typically 5–15s (up to 40s on cold model load)'
      });
    }
  };

  const cancelTopologyRequest = () => {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    stopTimer();
    setIsTopologyLoading(false);
    setPipelineStage({
      step: 0,
      label: 'Request cancelled by user',
      estimate: `Stopped at ${elapsedSeconds().toFixed(1)}s`
    });
    appendStatus('Request cancelled by user.');
  };

  // Open Topology Poppet Modal & Generate on the fly for the selected step
  const openTopologyModal = async (item) => {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    stopTimer();

    const ctrl = new AbortController();
    currentAbortController = ctrl;
    const startTime = Date.now();

    setElapsedSeconds(0);
    setIsTopologyLoading(true);
    setPipelineStage({
      step: 1,
      label: 'Stage 1/4: Connecting to Scala backend (/api/stream)...',
      estimate: 'Typically 5–15s total (up to 40s if Gemma 2B is cold-loading)'
    });
    setTopologyStatuses(['[0.0s] Dispatching POST /api/stream to Scala backend...']);
    setTopologyData({ llmResponse: '', explanation: '', edges: [], paths: [], prologOutput: '' });

    timerInterval = setInterval(() => {
      setElapsedSeconds((Date.now() - startTime) / 1000);
    }, 100);

    setTopologyModalItem(item);

    const stepPrompt = `Analyze operational action space for step: ${item.branch} (${item.category} - ${item.type}). Key tasks: ${item.tasks.join('; ')}`;

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: stepPrompt }),
        signal: ctrl.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from /api/stream`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser response');
      }

      appendStatus('SSE stream opened. Awaiting pipeline tokens...');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));
            if (data.status) {
              updateStageFromStatus(data.status);
              appendStatus(data.status);
            }
            if (data.complete) {
              const edges = data.edges || [];
              setPipelineStage({
                step: 4,
                label: `Completed in ${elapsedSeconds().toFixed(1)}s`,
                estimate: `${edges.length} edges verified`
              });
              appendStatus(`Topology verified (${edges.length} edges).`);
              setTopologyData({
                llmResponse: data.llmResponse || '',
                explanation: data.explanation || '',
                edges: edges,
                paths: data.paths || [],
                prologOutput: data.prologOutput || ''
              });
            }
          }
        }
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        setPipelineStage({
          step: 0,
          label: 'Pipeline failed',
          estimate: err.message || String(err)
        });
        appendStatus(`Error: ${err.message || String(err)}`);
      }
    } finally {
      stopTimer();
      currentAbortController = null;
      setIsTopologyLoading(false);
    }
  };

  const closeTopologyModal = () => {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    stopTimer();
    setIsTopologyLoading(false);
    setTopologyModalItem(null);
    setTopologyStatuses([]);
  };

  // Topology Graph Computed Coordinates
  const topologyGraphNodes = createMemo(() => {
    const set = new Set();
    const edges = topologyData().edges || [];
    edges.forEach(e => {
      set.add(e.from);
      set.add(e.to);
    });
    return Array.from(set);
  });

  const topologyNodeCoords = createMemo(() => {
    const list = topologyGraphNodes();
    const coords = {};
    const cx = 350, cy = 175, radius = 120;
    list.forEach((node, idx) => {
      const angle = (idx / list.length) * 2 * Math.PI;
      coords[node] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      };
    });
    return coords;
  });

  const progressBarPercent = () => {
    const step = pipelineStage().step || 0;
    return Math.min(100, Math.max(15, (step / 4) * 100));
  };

  const downloadTemplateFile = (item) => {
    const paramSummary = Object.entries(modalParams())
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join('\n');

    const fileContent = `=== DESIGN SPECIFICATION & BUILD PARAMETERS TEMPLATE ===\nArtifact: ${item.name}\nCategory: ${item.category}\nType: ${item.type}\nTimestamp: ${new Date().toISOString()}\n\nConfigured Parameters:\n${paramSummary}\n\n[SVG / PDF TEMPLATE VECTOR DATA]\n<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <text x="50" y="50" font-family="monospace" font-size="20" font-weight="bold">TEMPLATE: ${item.name}</text>\n  <text x="50" y="90" font-family="monospace" font-size="14" fill="#333333">Parameters Applied:</text>\n  ${Object.entries(modalParams()).map(([k, v], i) => `<text x="70" y="${130 + (i * 30)}" font-family="monospace" font-size="12" fill="#555555">${k} = ${v}</text>`).join('\n  ')}\n</svg>`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${item.name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setGlobalProgress(`Downloaded template for ${item.name}`);
  };

  const generateIncompleteManualPdf = async () => {
    setIsCompiling(true);
    setCompileProgressText('Initializing assembly manual compilation engine...');

    await new Promise(r => setTimeout(r, 200));
    setCompileProgressText('Assembling chapters and steps...');

    const contentBody = [
      { text: 'MARINE ASSEMBLY & COMPLIANCE MANUAL (INCOMPLETE DRAFT)', fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
      { text: 'PICTORIAL ASSEMBLY & MUNICIPAL PROTOCOLS', fontSize: 10, bold: true, color: '#555', alignment: 'center', margin: [0, 0, 0, 15] },
      { text: `Generated Timestamp: ${new Date().toISOString()}`, fontSize: 8, color: '#777', alignment: 'center', margin: [0, 0, 0, 20] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#111' }], margin: [0, 0, 0, 20] },
      { text: 'SECTION 1: ELECTRIC CATAMARAN ASSEMBLY', fontSize: 14, bold: true, margin: [0, 0, 0, 10] }
    ];

    await new Promise(r => setTimeout(r, 200));
    setCompileProgressText('Formatting Electric Catamaran sequential chapters...');

    catBranches().forEach((b, idx) => {
      const isUploaded = b.status === 'Uploaded & Verified';
      const stepNum = `0${idx + 1}`.slice(-2);

      contentBody.push({
        table: {
          widths: [45, '*'],
          body: [
            [
              { text: `STEP\n${stepNum}`, fontSize: 12, bold: true, alignment: 'center', fillColor: '#111', color: '#fff', margin: [4, 12, 4, 12] },
              {
                stack: [
                  { text: `${b.branch.toUpperCase()}`, fontSize: 11, bold: true, color: '#111', margin: [0, 0, 0, 2] },
                  { text: `File: ${b.name} | Type: ${b.type} | Category: ${b.category}`, fontSize: 8, color: '#555', margin: [0, 0, 0, 6] },
                  {
                    text: b.tasks.map((t, ti) => `  [${ti + 1}] ${t}`).join('\n'),
                    fontSize: 8,
                    font: 'Helvetica',
                    color: '#222',
                    margin: [0, 0, 0, 6]
                  },
                  isUploaded ? {
                    text: `[VERIFIED ARTIFACT LOADED]\n${b.content.substring(0, 140)}...`,
                    fontSize: 7,
                    font: 'Courier',
                    color: '#065f46',
                    fillColor: '#ecfdf5',
                    margin: [0, 2, 0, 0]
                  } : {
                    text: `[PENDING ARTIFACT]\nDownload template, configure parameters, and upload. Task focus: ${b.tasks[0]}`,
                    fontSize: 8,
                    bold: true,
                    color: '#991b1b',
                    fillColor: '#fef2f2',
                    margin: [0, 2, 0, 0]
                  }
                ],
                margin: [8, 6, 8, 6]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#d4d4d8',
          vLineColor: () => '#d4d4d8',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        margin: [0, 0, 0, 12]
      });
    });

    await new Promise(r => setTimeout(r, 200));
    setCompileProgressText('Formatting Pier & Boathouse municipal chapters...');

    contentBody.push({ text: 'SECTION 2: PIER & BOATHOUSE MUNICIPAL OPERATIONS', fontSize: 14, bold: true, margin: [0, 20, 0, 10] });

    pierBranches().forEach((b, idx) => {
      const isUploaded = b.status === 'Uploaded & Verified';
      const stepNum = `0${idx + 1}`.slice(-2);

      contentBody.push({
        table: {
          widths: [45, '*'],
          body: [
            [
              { text: `STEP\n${stepNum}`, fontSize: 12, bold: true, alignment: 'center', fillColor: '#111', color: '#fff', margin: [4, 12, 4, 12] },
              {
                stack: [
                  { text: `${b.branch.toUpperCase()}`, fontSize: 11, bold: true, color: '#111', margin: [0, 0, 0, 2] },
                  { text: `File: ${b.name} | Type: ${b.type} | Category: ${b.category}`, fontSize: 8, color: '#555', margin: [0, 0, 0, 6] },
                  {
                    text: b.tasks.map((t, ti) => `  [${ti + 1}] ${t}`).join('\n'),
                    fontSize: 8,
                    font: 'Helvetica',
                    color: '#222',
                    margin: [0, 0, 0, 6]
                  },
                  isUploaded ? {
                    text: `[VERIFIED ARTIFACT LOADED]\n${b.content.substring(0, 140)}...`,
                    fontSize: 7,
                    font: 'Courier',
                    color: '#065f46',
                    fillColor: '#ecfdf5',
                    margin: [0, 2, 0, 0]
                  } : {
                    text: `[PENDING ARTIFACT]\nDownload template, configure parameters, and upload. Task focus: ${b.tasks[0]}`,
                    fontSize: 8,
                    bold: true,
                    color: '#991b1b',
                    fillColor: '#fef2f2',
                    margin: [0, 2, 0, 0]
                  }
                ],
                margin: [8, 6, 8, 6]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#d4d4d8',
          vLineColor: () => '#d4d4d8',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        margin: [0, 0, 0, 12]
      });
    });

    await new Promise(r => setTimeout(r, 200));
    setCompileProgressText('Triggering PDF download...');

    const docDefinition = {
      content: contentBody,
      styles: { header: { fontSize: 18, bold: true } },
      defaultStyle: { font: 'Helvetica' }
    };

    if (typeof window !== 'undefined' && window.pdfMake) {
      try {
        window.pdfMake.createPdf(docDefinition).download('incomplete_marine_assembly_manual.pdf');
      } catch (err) {
        console.error('pdfMake download error:', err);
      }
    } else {
      console.error('pdfMake is not loaded in the global window context.');
    }

    await new Promise(r => setTimeout(r, 200));
    setIsCompiling(false);
    setCompileProgressText('');
  };

  const handleFileUpload = (domain, id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target.result;
      if (domain === 'catamaran') {
        setCatBranches(catBranches().map(b => b.id === id ? {
          ...b,
          name: file.name,
          content: fileContent,
          status: 'Uploaded & Verified'
        } : b));
      } else {
        setPierBranches(pierBranches().map(b => b.id === id ? {
          ...b,
          name: file.name,
          content: fileContent,
          status: 'Uploaded & Verified'
        } : b));
      }
    };
    reader.readAsText(file);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    const catFolder = zip.folder("catamaran_detailed_artifacts");
    catBranches().forEach((b) => {
      catFolder.file(b.name, b.content);
      catFolder.file(`${b.name}.instructions.txt`, `DETAILED TASK BREAKDOWN:\n${b.tasks.join('\n')}`);
    });

    const pierFolder = zip.folder("pier_detailed_artifacts");
    pierBranches().forEach((b) => {
      pierFolder.file(b.name, b.content);
      pierFolder.file(`${b.name}.instructions.txt`, `DETAILED TASK BREAKDOWN:\n${b.tasks.join('\n')}`);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprehensive_marine_package.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateProgress = (branches) => {
    const uploaded = branches.filter(b => b.status === 'Uploaded & Verified').length;
    return Math.round((uploaded / branches.length) * 100);
  };

  return (
    <div class="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-950 selection:text-white pb-20 relative">

      {/* Parameter Configuration Modal */}
      <Show when={modalItem()}>
        <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div class="bg-white border border-zinc-200 rounded-lg p-6 max-w-lg w-full shadow-xl space-y-5">
            <div class="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-900 text-white px-1.5 py-0.5 rounded mr-2">{modalItem().type}</span>
                <h3 class="text-sm font-semibold text-zinc-900 inline">{modalItem().branch}</h3>
              </div>
              <button type="button" onClick={closeModal} class="text-zinc-400 hover:text-zinc-700 text-xs font-mono">✕</button>
            </div>

            <p class="text-xs text-zinc-600">
              Configure your build parameters and design decisions below, then click <strong>Download Template</strong> to export the serialized template file for filing and verification.
            </p>

            <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
              <For each={Object.keys(modalParams())}>
                {(paramKey) => (
                  <div>
                    <label class="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">{paramKey}</label>
                    <input
                      type="text"
                      value={modalParams()[paramKey]}
                      onInput={(e) => handleParamChange(paramKey, e.target.value)}
                      class="w-full text-xs font-mono bg-zinc-50 border border-zinc-300 rounded px-3 py-1.5 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                )}
              </For>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={closeModal}
                class="border border-zinc-300 text-zinc-700 text-xs font-medium px-3.5 py-1.5 rounded hover:bg-zinc-50 transition">
                Close
              </button>
              <button
                type="button"
                onClick={() => downloadTemplateFile(modalItem())}
                class="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-4 py-1.5 rounded transition">
                Download Template
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Step Action Space Topology Poppet Modal */}
      <Show when={topologyModalItem()}>
        <div class="fixed inset-0 bg-zinc-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div class="bg-white border border-zinc-200 rounded-xl p-6 max-w-3xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">

            <div class="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <span class="text-[9px] uppercase tracking-wider font-mono bg-indigo-600 text-white px-2 py-0.5 rounded mr-2">Action Space Topology</span>
                <h3 class="text-base font-semibold text-zinc-900 inline">{topologyModalItem().branch}</h3>
                <p class="text-xs text-zinc-500 mt-0.5">Dynamic Gemma 2B & Trealla Prolog verification generated for this step.</p>
              </div>
              <button type="button" onClick={closeTopologyModal} class="text-zinc-400 hover:text-zinc-700 text-sm font-mono p-1 cursor-pointer">✕</button>
            </div>

            {/* Live Progress Bar, Elapsed Timer & ETA */}
            <div class="bg-zinc-50 border border-zinc-200 rounded-lg p-3.5 space-y-2.5">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 font-medium text-zinc-800">
                  <Show
                    when={isTopologyLoading()}
                    fallback={<span class="w-2 h-2 rounded-full bg-emerald-500"></span>}
                  >
                    <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
                  </Show>
                  <span>{pipelineStage().label}</span>
                </div>
                <span class="font-mono text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 px-2 py-0.5 rounded">
                  Elapsed: {elapsedSeconds().toFixed(1)}s
                </span>
              </div>

              {/* 4-Stage Progress Bar */}
              <div class="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div
                  class={isTopologyLoading() ? 'h-full bg-indigo-600 animate-pulse transition-all duration-300' : 'h-full bg-emerald-600 transition-all duration-300'}
                  style={`width: ${progressBarPercent()}%`}
                ></div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>{pipelineStage().estimate}</span>
                <Show when={isTopologyLoading()}>
                  <button
                    type="button"
                    onClick={cancelTopologyRequest}
                    class="text-red-600 hover:text-red-800 underline cursor-pointer"
                  >
                    Cancel Request
                  </button>
                </Show>
              </div>
            </div>

            {/* Live Progress Stream inside Modal */}
            <Show when={isTopologyLoading() || topologyStatuses().length > 0}>
              <div class="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Live Pipeline Stream</h4>
                  <Show when={isTopologyLoading()}>
                    <span class="text-[10px] font-mono text-zinc-400 animate-pulse">● awaiting stream chunks...</span>
                  </Show>
                </div>
                <div ref={(el) => (statusLogEl = el)} class="font-mono text-xs text-emerald-400 space-y-1 max-h-28 overflow-y-auto">
                  <For each={topologyStatuses()}>
                    {(status) => <div>&gt; {status}</div>}
                  </For>
                </div>
              </div>
            </Show>

            {/* SVG Graph Topology */}
            <div class="space-y-2">
              <h4 class="text-xs font-semibold text-zinc-800">Generated Graph Topology</h4>
              <div class="relative w-full h-72 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center">
                <svg class="w-full h-full" viewBox="0 0 700 350">
                  <Show
                    when={topologyGraphNodes().length > 0}
                    fallback={
                      <g>
                        <text x="50%" y="46%" fill="#a1a1aa" dominant-baseline="middle" text-anchor="middle" font-size="12" font-family="monospace">
                          {isTopologyLoading()
                            ? `Running Gemma 2B + Trealla Prolog (${elapsedSeconds().toFixed(1)}s)...`
                            : 'No graph edges returned for this step.'}
                        </text>
                        <Show when={isTopologyLoading()}>
                          <text x="50%" y="55%" fill="#71717a" dominant-baseline="middle" text-anchor="middle" font-size="10" font-family="monospace">
                            {elapsedSeconds() > 15
                              ? 'Cold model load in progress (~20–45s on first run)'
                              : 'Typical generation time: 5–15 seconds'}
                          </text>
                        </Show>
                      </g>
                    }
                  >
                    <For each={topologyData().edges}>
                      {(e) => {
                        const coords = topologyNodeCoords();
                        const p1 = coords[e.from] || { x: 100, y: 100 };
                        const p2 = coords[e.to] || { x: 300, y: 300 };
                        return (
                          <g>
                            <line
                              x1={p1.x}
                              y1={p1.y}
                              x2={p2.x}
                              y2={p2.y}
                              stroke="#52525b"
                              stroke-width="2"
                            />
                            <text
                              x={(p1.x + p2.x) / 2}
                              y={(p1.y + p2.y) / 2 - 6}
                              fill="#a1a1aa"
                              font-size="9"
                              text-anchor="middle"
                            >
                              C:{e.capacity}, L:{e.loss}
                            </text>
                          </g>
                        );
                      }}
                    </For>
                    <For each={topologyGraphNodes()}>
                      {(node) => {
                        const pt = topologyNodeCoords()[node] || { x: 100, y: 100 };
                        return (
                          <g>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="22"
                              fill="#18181b"
                              stroke="#a1a1aa"
                              stroke-width="2"
                            />
                            <text
                              x={pt.x}
                              y={pt.y + 3}
                              fill="#ffffff"
                              font-size="8"
                              font-weight="bold"
                              text-anchor="middle"
                            >
                              {node.length > 10 ? node.substring(0, 8) + '..' : node}
                            </text>
                          </g>
                        );
                      }}
                    </For>
                  </Show>
                </svg>
              </div>
            </div>

            {/* Prolog Facts & Explanation Boxes */}
            <Show when={!isTopologyLoading() && topologyData().llmResponse}>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-zinc-50 p-4 rounded-lg border border-zinc-200 space-y-2">
                  <h5 class="text-[10px] font-bold text-zinc-700 uppercase tracking-wider font-mono">Prolog Knowledge Base Facts</h5>
                  <pre class="bg-white p-3 rounded border border-zinc-200 text-[11px] text-zinc-800 whitespace-pre-wrap overflow-x-auto h-36 font-mono">
                    {topologyData().llmResponse}
                  </pre>
                </div>
                <div class="bg-zinc-50 p-4 rounded-lg border border-zinc-200 space-y-2">
                  <h5 class="text-[10px] font-bold text-zinc-700 uppercase tracking-wider font-mono">Stochastic Explanation</h5>
                  <pre class="bg-white p-3 rounded border border-zinc-200 text-[11px] text-zinc-800 whitespace-pre-wrap overflow-x-auto h-36 font-mono">
                    {topologyData().explanation}
                  </pre>
                </div>
              </div>
            </Show>

            <div class="flex items-center justify-between pt-2 border-t border-zinc-100">
              <Show when={!isTopologyLoading() && topologyData().llmResponse} fallback={<div />}>
                <a
                  href="/api/pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="border border-zinc-300 hover:border-zinc-400 text-zinc-700 text-xs font-medium px-3.5 py-2 rounded-md transition"
                >
                  Download Step Report (.pdf)
                </a>
              </Show>
              <button
                type="button"
                onClick={closeTopologyModal}
                class="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium px-4 py-2 rounded-md transition cursor-pointer">
                Close Topology View
              </button>
            </div>

          </div>
        </div>
      </Show>

      {/* PDF Compilation Modal */}
      <Show when={isCompiling()}>
        <div class="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div class="bg-white border border-zinc-200 rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-zinc-900">Compiling Incomplete Assembly Manual</h3>
              <div class="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p class="text-xs font-mono text-zinc-600 bg-zinc-50 p-3 rounded border border-zinc-200">
              {compileProgressText()}
            </p>
            <div class="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
              <div class="bg-zinc-900 h-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      </Show>

      <div class="max-w-7xl mx-auto px-6 pt-8 space-y-8">

        {/* Header */}
        <header class="border-b border-zinc-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-0.5">Comprehensive Industrial & Municipal Pipeline</p>
            <h1 class="text-xl font-semibold tracking-tight">Compliance Verifier & Step Action Space Dashboard</h1>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={generateIncompleteManualPdf}
              disabled={isCompiling()}
              class="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-medium px-3.5 py-1.5 rounded transition flex items-center gap-2">
              {isCompiling() ? 'Compiling Manual...' : 'Download Incomplete Manual (.pdf)'}
            </button>
            <button
              type="button"
              onClick={downloadZip}
              class="border border-zinc-300 hover:border-zinc-400 text-zinc-700 text-xs font-medium px-3.5 py-1.5 rounded transition">
              Export .ZIP
            </button>
          </div>
        </header>

        <Show when={globalProgress()}>
          <div class="text-xs font-mono text-zinc-600 bg-zinc-50 border border-zinc-200 p-2.5 rounded-md">
            {globalProgress()}
          </div>
        </Show>

        {/* Two-Column Responsive Layout for Steps with Poppet Modal Triggers */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Column 1: Electric Catamaran */}
          <div class="border border-zinc-200 rounded-lg p-5 bg-white shadow-xs flex flex-col h-[80vh]">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 flex-shrink-0">
              <div>
                <h2 class="text-sm font-semibold text-zinc-900">Electric Catamaran Manufacturing</h2>
                <p class="text-[11px] text-zinc-500">Click any step to view its dynamic action space topology or configure parameters.</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded">
                  {calculateProgress(catBranches())}% Complete
                </span>
              </div>
            </div>

            <div class="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              <For each={catBranches()}>
                {(b) => {
                  const isUploaded = b.status === 'Uploaded & Verified';
                  return (
                    <div
                      class="border-l-2 border-zinc-200 hover:border-zinc-900 pl-4 py-3 space-y-2 transition group bg-zinc-50/50 rounded-r-lg">
                      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                              {b.category}
                            </span>
                            <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                              {b.type}
                            </span>
                          </div>
                          <span class="text-xs font-mono font-semibold text-zinc-800 group-hover:text-zinc-950">{b.branch}</span>
                          <p class="text-[10px] font-mono text-zinc-400 truncate max-w-xs">{b.name}</p>
                        </div>

                        <div class="flex items-center gap-2 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => openTopologyModal(b)}
                            class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>⚡ Action Topology</span>
                          </button>

                          <Show when={isUploaded}>
                            <span class="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Verified
                            </span>
                          </Show>
                          <label class="cursor-pointer border border-zinc-200 hover:border-zinc-300 text-zinc-700 px-2.5 py-1 rounded text-[11px] transition bg-white">
                            Upload
                            <input type="file" onChange={(e) => handleFileUpload('catamaran', b.id, e)} class="hidden" />
                          </label>
                        </div>
                      </div>

                      <ul class="space-y-1.5 mt-2 cursor-pointer" onClick={() => openModal('catamaran', b)}>
                        <For each={b.tasks}>
                          {(task, ti) => (
                            <li class="text-[11px] text-zinc-600 flex items-start gap-2 hover:text-zinc-900">
                              <span class="flex-shrink-0 font-mono text-[10px] text-zinc-400 mt-0.5">0{ti() + 1}.</span>
                              <span>{task}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Column 2: Pier & Boathouse Operations */}
          <div class="border border-zinc-200 rounded-lg p-5 bg-white shadow-xs flex flex-col h-[80vh]">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 flex-shrink-0">
              <div>
                <h2 class="text-sm font-semibold text-zinc-900">Pier & Boathouse Operations</h2>
                <p class="text-[11px] text-zinc-500">Click any step to view its dynamic action space topology or configure parameters.</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded">
                  {calculateProgress(pierBranches())}% Complete
                </span>
              </div>
            </div>

            <div class="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              <For each={pierBranches()}>
                {(b) => {
                  const isUploaded = b.status === 'Uploaded & Verified';
                  return (
                    <div
                      class="border-l-2 border-zinc-200 hover:border-zinc-900 pl-4 py-3 space-y-2 transition group bg-zinc-50/50 rounded-r-lg">
                      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                              {b.category}
                            </span>
                            <span class="text-[9px] uppercase tracking-wider font-mono bg-zinc-900 text-white px-1.5 py-0.5 rounded">
                              {b.type}
                            </span>
                          </div>
                          <span class="text-xs font-mono font-semibold text-zinc-800 group-hover:text-zinc-950">{b.branch}</span>
                          <p class="text-[10px] font-mono text-zinc-400 truncate max-w-xs">{b.name}</p>
                        </div>

                        <div class="flex items-center gap-2 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => openTopologyModal(b)}
                            class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>⚡ Action Topology</span>
                          </button>

                          <Show when={isUploaded}>
                            <span class="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Verified
                            </span>
                          </Show>
                          <label class="cursor-pointer border border-zinc-200 hover:border-zinc-300 text-zinc-700 px-2.5 py-1 rounded text-[11px] transition bg-white">
                            Upload
                            <input type="file" onChange={(e) => handleFileUpload('pier', b.id, e)} class="hidden" />
                          </label>
                        </div>
                      </div>

                      <ul class="space-y-1.5 mt-2 cursor-pointer" onClick={() => openModal('pier', b)}>
                        <For each={b.tasks}>
                          {(task, ti) => (
                            <li class="text-[11px] text-zinc-600 flex items-start gap-2 hover:text-zinc-900">
                              <span class="flex-shrink-0 font-mono text-[10px] text-zinc-400 mt-0.5">0{ti() + 1}.</span>
                              <span>{task}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

render(() => <App />, document.getElementById('root'));