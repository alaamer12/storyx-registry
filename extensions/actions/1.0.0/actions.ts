// .storyx/extensions/actions.ts
var actions_default = (ctx) => {
  ctx.registerPanel("stage-toolbar", {
    id: "actions-toggle",
    get html() {
      return `
        <button type="button" data-actions-toggle data-storyx-requires-component data-storyx-preview-hide class="px-2.5 py-1 text-xs font-semibold rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all flex items-center gap-1.5" title="Show Actions Log">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-slate-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <span>Actions</span>
        </button>
      `;
    }
  });
  ctx.registerPanel("stage", {
    id: "actions-panel",
    get html() {
      return `
        <div data-actions-panel data-storyx-requires-component data-storyx-preview-hide class="hidden border-t border-slate-800 bg-slate-950 transition-all duration-300 ease-in-out w-full flex flex-col h-64 overflow-hidden relative">
          <!-- Top bar of the actions panel -->
          <div class="flex items-center justify-between px-4 py-1.5 border-b border-slate-900 bg-slate-900/40">
            <span class="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-indigo-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
              Actions Log
            </span>
            <div class="flex items-center gap-2">
              <button type="button" data-actions-clear class="px-2 py-0.5 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-slate-100 transition-all flex items-center gap-1" title="Clear all logs">
                Clear
              </button>
            </div>
          </div>
          <!-- Scrollable log entries list -->
          <div data-actions-log-container class="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300 select-text bg-slate-950/80 flex flex-col gap-2">
            <div data-actions-empty class="text-slate-500 italic">No actions logged yet. Trigger an action in your component using window.storyxAction('name', data)</div>
          </div>
        </div>

        <script is:inline>
          (function() {
            const storageKey = 'storyx:actions-panel-preference';

            function initActionsPanel() {
              // Generic gallery-context and isolated-preview hide/show rules (via the
              // 'data-storyx-requires-component' / 'data-storyx-preview-hide' attributes on
              // the toggle button and panel) are already applied centrally by StoryX core -
              // no need to duplicate that detection logic here. We only bail out early using
              // the same shared, centrally-computed <html> attributes when this extension's
              // OWN behavior (reading/applying the open/closed preference) must not run.
              const toggleBtn = document.querySelector('[data-actions-toggle]');
              const panel = document.querySelector('[data-actions-panel]');
              
              if (!panel || !toggleBtn) return;

              const html = document.documentElement;
              const isGalleryContext = html.getAttribute('data-storyx-context') !== 'component';
              const isIsolatedPreview = html.hasAttribute('data-storyx-isolated-preview');

              // In isolated preview contexts (e.g. gallery thumbnail <iframe>s), the panel's
              // "open"/"closed" preference is a GLOBAL localStorage value shared across the
              // whole app, so it must never be read/applied there — otherwise, once the user
              // opens the actions panel while actually viewing a component, every gallery
              // thumbnail iframe would also render with the panel open, pushing/resizing its
              // layout. Same for the gallery/dashboard index, which has no component at all.
              if (isGalleryContext || isIsolatedPreview) {
                panel.classList.add('hidden');
                updateToggleButton(false);
                return;
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

            // Global API for logging actions fallback
            window.storyxAction = function(name, data) {
              if (window.storyx && window.storyx.action) {
                window.storyx.action(name, data);
              } else {
                const event = new CustomEvent('storyx:action', {
                  detail: { name, data, timestamp: new Date().toLocaleTimeString() }
                });
                window.dispatchEvent(event);
              }
            };

            function updateToggleButton(isOpen) {
              const btn = document.querySelector('[data-actions-toggle]');
              if (!btn) return;
              if (isOpen) {
                btn.classList.add('bg-indigo-600/20', 'text-indigo-400');
                btn.classList.remove('text-slate-400');
              } else {
                btn.classList.remove('bg-indigo-600/20', 'text-indigo-400');
                btn.classList.add('text-slate-400');
              }
            }

            function appendActionLog(name, data, timestamp) {
              const container = document.querySelector('[data-actions-log-container]');
              if (!container) return;

              // Remove empty state placeholder
              const empty = container.querySelector('[data-actions-empty]');
              if (empty) {
                empty.remove();
              }

              const row = document.createElement('div');
              row.className = 'border-b border-slate-900/60 pb-2 mb-2 last:border-none last:pb-0 last:mb-0 flex flex-col gap-1';
              
              let payloadStr = '';
              if (data !== undefined && data !== null) {
                try {
                  payloadStr = \`<pre class="text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-900 mt-1 max-w-full overflow-auto">\${JSON.stringify(data, null, 2)}</pre>\`;
                } catch (e) {
                  payloadStr = \`<span class="text-slate-500 text-[10px]">\${data}</span>\`;
                }
              }

              row.innerHTML = \`
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-950/80 text-indigo-400 border border-indigo-900/50">\${name}</span>
                  </div>
                  <span class="text-[10px] text-slate-500">\${timestamp}</span>
                </div>
                \${payloadStr}
              \`;

              container.appendChild(row);
              container.scrollTop = container.scrollHeight;
            }

            // Hook up to StoryX Lifecycle Hooks System
            if (window.storyx && window.storyx.hooks) {
              window.storyx.hooks.on('action', function(payload) {
                appendActionLog(payload.name, payload.data, payload.timestamp);
              });
            } else {
              // Fallback to custom event
              window.addEventListener('storyx:action', function(e) {
                const { name, data, timestamp } = e.detail;
                appendActionLog(name, data, timestamp || new Date().toLocaleTimeString());
              });
            }

            document.addEventListener('click', function(e) {
              // Toggle Panel click
              const toggleBtn = e.target.closest('[data-actions-toggle]');
              if (toggleBtn) {
                const panel = document.querySelector('[data-actions-panel]');
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
                return;
              }

              // Clear Logs click
              const clearBtn = e.target.closest('[data-actions-clear]');
              if (clearBtn) {
                const container = document.querySelector('[data-actions-log-container]');
                if (container) {
                  container.innerHTML = \`<div data-actions-empty class="text-slate-500 italic">No actions logged yet. Trigger an action in your component using window.storyxAction('name', data)</div>\`;
                }
                return;
              }
            });

            initActionsPanel();

            // Handle client side page transitions
            document.addEventListener('astro:after-swap', initActionsPanel);
          })();
        </script>
      `;
    }
  });
};
export {
  actions_default as default
};
