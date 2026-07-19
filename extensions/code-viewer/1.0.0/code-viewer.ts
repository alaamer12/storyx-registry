// .storyx/extensions/code-viewer.ts
var code_viewer_default = (ctx) => {
  ctx.registerPanel("stage-toolbar", {
    id: "code-viewer-toggle",
    get html() {
      return `
        <button type="button" data-code-viewer-toggle data-storyx-requires-component data-storyx-preview-hide class="px-2.5 py-1 text-xs font-semibold rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all flex items-center gap-1.5" title="Show Component Code">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-slate-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
          <span>Show Code</span>
        </button>
      `;
    }
  });
  ctx.registerPanel("stage", {
    id: "code-viewer-panel",
    get html() {
      return `
        <div data-code-viewer-panel data-storyx-requires-component data-storyx-preview-hide class="hidden border-t border-slate-800 bg-slate-950 transition-all duration-300 ease-in-out w-full flex flex-col h-64 overflow-hidden relative">
          <!-- Top bar of the code panel -->
          <div class="flex items-center justify-between px-4 py-1.5 border-b border-slate-900 bg-slate-900/40">
            <span class="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-indigo-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              Source Code
            </span>
            <div class="flex items-center gap-2">
              <button type="button" data-code-viewer-copy class="px-2 py-0.5 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-slate-100 transition-all flex items-center gap-1" title="Copy code to clipboard">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-slate-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.675a.625.625 0 1 1-1.19 0V3.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25 11.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v6m-9.75 1.5 1.5 1.5 3-3" />
                </svg>
                Copy
              </button>
            </div>
          </div>
          <!-- Scrollable code block -->
          <div class="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 select-text bg-slate-950/80">
            <pre class="whitespace-pre m-0"><code data-code-viewer-content class="language-typescript"></code></pre>
          </div>
        </div>

        <script is:inline>
          (function() {
            const storageKey = 'storyx:code-viewer-preference';
            let prismLoaded = false;

            // Load PrismJS CSS dynamically
            function loadPrismTheme() {
              if (document.querySelector('link[data-prism-theme]')) return;
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.setAttribute('data-prism-theme', 'true');
              link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
              document.head.appendChild(link);
            }

            // Load PrismJS Script dynamically and highlight
            function highlightCodeElement(el) {
              if (window.Prism && window.Prism.languages.typescript) {
                window.Prism.highlightElement(el);
                return;
              }
              if (prismLoaded) return;
              prismLoaded = true;

              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
              script.onload = () => {
                const tsScript = document.createElement('script');
                tsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js';
                tsScript.onload = () => {
                  if (window.Prism) {
                    window.Prism.highlightElement(el);
                  }
                };
                document.head.appendChild(tsScript);
              };
              document.head.appendChild(script);
            }

            function initCodeViewer() {
              // Generic gallery-context and isolated-preview hide/show rules (via the
              // 'data-storyx-requires-component' / 'data-storyx-preview-hide' attributes on
              // the toggle button and panel) are already applied centrally by StoryX core -
              // no need to duplicate that detection logic here. We only bail out early using
              // the same shared, centrally-computed <html> attributes when this extension's
              // OWN behavior (reading/applying the open/closed preference) must not run.
              const toggleBtn = document.querySelector('[data-code-viewer-toggle]');
              const panel = document.querySelector('[data-code-viewer-panel]');
              
              if (!panel || !toggleBtn) return;

              const html = document.documentElement;
              const isGalleryContext = html.getAttribute('data-storyx-context') !== 'component';
              const isIsolatedPreview = html.hasAttribute('data-storyx-isolated-preview');

              // In isolated preview contexts (e.g. gallery thumbnail <iframe>s), the panel's
              // "open"/"closed" preference is a GLOBAL localStorage value shared across the
              // whole app, so it must never be read/applied there — otherwise, once the user
              // opens the code panel while actually viewing a component, every gallery
              // thumbnail iframe would also render with the panel open, pushing/resizing its
              // layout. Same for the gallery/dashboard index, which has no component at all.
              if (isGalleryContext || isIsolatedPreview) {
                panel.classList.add('hidden');
                updateToggleButton(false);
                return;
              }

              // Retrieve raw code for the current component. This is exposed as its own
              // small, page-scoped global (not embedded inside window.__STORYX_COMPONENTS__,
              // which stays lightweight metadata-only across every page).
              const codeContent = document.querySelector('[data-code-viewer-content]');
              if (codeContent) {
                codeContent.textContent = window.__STORYX_CURRENT_COMPONENT_CODE__ || '// No source code available.';
                loadPrismTheme();
                highlightCodeElement(codeContent);
              }

              // Apply saved user preference (open or closed)
              const savedVal = localStorage.getItem(storageKey);
              if (savedVal === 'open') {
                panel.classList.remove('hidden');
                updateToggleButton(true);
              } else {
                panel.classList.add('hidden');
                updateToggleButton(false);
              }
            }

            function updateToggleButton(isOpen) {
              const btn = document.querySelector('[data-code-viewer-toggle]');
              if (!btn) return;
              if (isOpen) {
                btn.classList.add('bg-indigo-600/20', 'text-indigo-400');
                btn.classList.remove('text-slate-400');
              } else {
                btn.classList.remove('bg-indigo-600/20', 'text-indigo-400');
                btn.classList.add('text-slate-400');
              }
            }

            // Bind click to copy code
            document.addEventListener('click', function(e) {
              const copyBtn = e.target.closest('[data-code-viewer-copy]');
              if (copyBtn) {
                const codeContent = document.querySelector('[data-code-viewer-content]');
                if (codeContent) {
                  navigator.clipboard.writeText(codeContent.textContent).then(() => {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = \`
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-emerald-400">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Copied!
                    \`;
                    copyBtn.classList.add('border-emerald-500/30', 'bg-emerald-500/10', 'text-emerald-400');
                    setTimeout(() => {
                      copyBtn.innerHTML = originalHTML;
                      copyBtn.classList.remove('border-emerald-500/30', 'bg-emerald-500/10', 'text-emerald-400');
                    }, 2000);
                  });
                }
              }

              const toggleBtn = e.target.closest('[data-code-viewer-toggle]');
              if (toggleBtn) {
                const panel = document.querySelector('[data-code-viewer-panel]');
                if (panel) {
                  const isHidden = panel.classList.contains('hidden');
                  if (isHidden) {
                    panel.classList.remove('hidden');
                    localStorage.setItem(storageKey, 'open');
                    updateToggleButton(true);
                  } else {
                    panel.classList.add('hidden');
                    localStorage.setItem(storageKey, 'closed');
                    updateToggleButton(false);
                  }
                }
              }
            });

            initCodeViewer();

            // Handle client side page transitions
            document.addEventListener('astro:after-swap', initCodeViewer);
          })();
        </script>
      `;
    }
  });
};
export {
  code_viewer_default as default
};
