// .storyx/extensions/viewport.ts
var viewport_default = (ctx) => {
  ctx.registerPanel("top-bar", {
    id: "viewport-switcher",
    get html() {
      return `
        <div data-viewport-switcher-shell data-storyx-requires-component data-storyx-preview-hide class="hidden sm:flex items-center gap-1.5 bg-slate-950/50 p-1 rounded-lg border border-slate-800/80 mr-4">
          <button type="button" data-viewport="desktop" class="px-2.5 py-1 text-xs font-semibold rounded text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1" title="Desktop View">
            Desktop
          </button>
          <button type="button" data-viewport="tablet" class="px-2.5 py-1 text-xs font-semibold rounded text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1" title="Tablet View">
            Tablet
          </button>
          <button type="button" data-viewport="mobile" class="px-2.5 py-1 text-xs font-semibold rounded text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1" title="Mobile View">
            Mobile
          </button>
        </div>
      `;
    }
  });
  ctx.registerStageWrapper({
    get start() {
      return `
        <style>
          /* Stage Wrapper Responsive Styles */
          [data-viewport-container] {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            overflow: auto;
          }
          [data-viewport-content] {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 100%;
            max-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* Mobile Framed Preset */
          [data-viewport-val="mobile"] [data-viewport-content] {
            width: 375px;
            height: 667px;
            border: 12px solid #1e293b;
            border-radius: 28px;
            background: #0f172a;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            overflow: auto;
          }
          
          /* Tablet Framed Preset */
          [data-viewport-val="tablet"] [data-viewport-content] {
            width: 768px;
            height: 1024px;
            border: 14px solid #1e293b;
            border-radius: 28px;
            background: #0f172a;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            overflow: auto;
          }
          
          /* Desktop Fluid Preset */
          [data-viewport-val="desktop"] [data-viewport-content] {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
          }
        </style>
        <div data-viewport-container data-viewport-val="desktop">
          <div data-viewport-content>
      `;
    },
    get end() {
      return `
          </div>
        </div>
        <script is:inline>
          (function() {
            const storageKey = 'storyx:viewport-preference';
            
            function initViewport() {
              // Generic gallery-context and isolated-preview hide/show rules (via the
              // 'data-storyx-requires-component' / 'data-storyx-preview-hide' attributes
              // on the shell) are already applied centrally by StoryX core. We read the
              // same shared, centrally-computed 'data-storyx-*' attributes on <html> here
              // (rather than the 'storyx' module SDK, which may not be loaded yet at this
              // point) only for the EXTRA behavior specific to this extension: forcing the
              // desktop layout in isolated preview.
              const container = document.querySelector('[data-viewport-container]');
              if (!container) return;

              const html = document.documentElement;
              if (html.hasAttribute('data-storyx-isolated-preview')) {
                // Isolated preview surfaces (e.g. the gallery card thumbnail/hover <iframe>s)
                // must always render the fluid "desktop" layout and must NOT read/apply the
                // user's globally-persisted viewport preference. Since localStorage is
                // shared across same-origin iframes, honoring it there would make every
                // thumbnail suddenly render in a tiny mobile/tablet device frame as soon
                // as the user picks "Mobile"/"Tablet" anywhere in the app.
                container.setAttribute('data-viewport-val', 'desktop');
                return;
              }

              if (html.getAttribute('data-storyx-context') !== 'component') return;

              const savedVal = localStorage.getItem(storageKey) || 'desktop';
              container.setAttribute('data-viewport-val', savedVal);
              updateButtons(savedVal);
            }
            
            function updateButtons(activeVal) {
              const buttons = document.querySelectorAll('[data-viewport-switcher-shell] [data-viewport]');
              buttons.forEach(btn => {
                if (btn.getAttribute('data-viewport') === activeVal) {
                  btn.classList.add('bg-indigo-600/30', 'text-indigo-400');
                  btn.classList.remove('text-slate-400');
                } else {
                  btn.classList.remove('bg-indigo-600/30', 'text-indigo-400');
                  btn.classList.add('text-slate-400');
                }
              });
            }
            
            // Delegate click events on the switcher buttons
            document.addEventListener('click', function(e) {
              const btn = e.target.closest('[data-viewport-switcher-shell] [data-viewport]');
              if (!btn) return;
              
              const selectedVal = btn.getAttribute('data-viewport');
              const container = document.querySelector('[data-viewport-container]');
              if (container) {
                container.setAttribute('data-viewport-val', selectedVal);
                localStorage.setItem(storageKey, selectedVal);
                updateButtons(selectedVal);
              }
            });
            
            initViewport();
            
            // Handle client side page transitions
            document.addEventListener('astro:after-swap', initViewport);
          })();
        </script>
      `;
    }
  });
};
export {
  viewport_default as default
};
