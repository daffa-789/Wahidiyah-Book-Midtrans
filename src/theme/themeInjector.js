import themeConfig from '../../component.json';



const setVar = (root, name, value) => {
  if (value !== undefined && value !== null && value !== '') {
    root.style.setProperty(name, value);
  }
};

function applyThemeTokens(tokens = themeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  
  if (tokens.colors?.brand) {
    Object.entries(tokens.colors.brand).forEach(([key, val]) => setVar(root, `--color-brand-${key}`, val));
  }

  
  if (tokens.colors?.gold) {
    Object.entries(tokens.colors.gold).forEach(([key, val]) => setVar(root, `--color-gold-${key}`, val));
  }

  
  if (tokens.colors?.cream) {
    Object.entries(tokens.colors.cream).forEach(([key, val]) => setVar(root, `--color-cream-${key}`, val));
  }

  
  if (tokens.colors?.ink) {
    Object.entries(tokens.colors.ink).forEach(([key, val]) => setVar(root, `--color-ink-${key}`, val));
  }

  
  setVar(root, '--color-brand-primary', tokens.colors?.primary);
  setVar(root, '--color-brand-primary-hover', tokens.colors?.primaryHover);
  setVar(root, '--color-brand-primary-light', tokens.colors?.primaryLight);

  
  if (tokens.colors?.accent) {
    Object.entries(tokens.colors.accent).forEach(([key, val]) => setVar(root, `--color-accent-${key}`, val));
  }

  
  if (tokens.colors?.semantic) {
    Object.entries(tokens.colors.semantic).forEach(([key, val]) => setVar(root, `--color-semantic-${key}`, val));
  }

  
  const ui = tokens.colors?.ui;
  if (ui) {
    setVar(root, '--color-ui-bg', ui.background);
    setVar(root, '--color-ui-surface', ui.surface);
    setVar(root, '--color-ui-card', ui.card);
    setVar(root, '--color-ui-border', ui.border);
    setVar(root, '--color-ui-text-primary', ui.textPrimary);
    setVar(root, '--color-ui-text-secondary', ui.textSecondary);
    setVar(root, '--color-ui-text-muted', ui.textMuted);
  }

  
  const cr = tokens.shapes?.componentRadius;
  if (cr) {
    setVar(root, '--radius-btn', cr.button);
    setVar(root, '--radius-card', cr.card);
    setVar(root, '--radius-modal', cr.modal);
    setVar(root, '--radius-input', cr.input);
    setVar(root, '--radius-badge', cr.badge);
  }

  
  const btn = tokens.components?.button;
  if (btn) {
    setVar(root, '--radius-btn', btn.radius);
    setVar(root, '--btn-height-sm', btn.heightSm);
    setVar(root, '--btn-height-md', btn.heightMd);
    setVar(root, '--btn-height-lg', btn.heightLg);
    setVar(root, '--btn-px-sm', btn.paddingXSm);
    setVar(root, '--btn-px-md', btn.paddingXMd);
    setVar(root, '--btn-px-lg', btn.paddingXLg);
    setVar(root, '--btn-font-sm', btn.fontSizeSm);
    setVar(root, '--btn-font-md', btn.fontSizeMd);
    setVar(root, '--btn-font-lg', btn.fontSizeLg);
  }

  
  const card = tokens.components?.card;
  if (card) {
    setVar(root, '--radius-card', card.radius);
    setVar(root, '--card-padding-sm', card.paddingSm);
    setVar(root, '--card-padding-md', card.paddingMd);
    setVar(root, '--card-padding-lg', card.paddingLg);
    setVar(root, '--card-border-width', card.borderWidth);
    setVar(root, '--card-shadow', card.shadow);
  }

  
  const inp = tokens.components?.input;
  if (inp) {
    setVar(root, '--radius-input', inp.radius);
    setVar(root, '--input-height', inp.height);
    setVar(root, '--input-px', inp.paddingX);
    setVar(root, '--input-font-size', inp.fontSize);
    setVar(root, '--input-border-width', inp.borderWidth);
  }

  
  const frame = tokens.components?.deviceFrame;
  if (frame) {
    setVar(root, '--device-frame-radius', frame.radius);
    setVar(root, '--device-frame-max-width', frame.maxWidth);
    setVar(root, '--device-frame-max-height', frame.maxHeight);
    setVar(root, '--device-frame-border-width', frame.borderWidth);
    setVar(root, '--device-frame-border-color', frame.borderColor);
  }

  
  const modal = tokens.components?.modal;
  if (modal) {
    setVar(root, '--radius-modal', modal.radius);
    setVar(root, '--modal-padding', modal.padding);
    setVar(root, '--modal-max-width', modal.maxWidth);
  }

  
  const sb = tokens.components?.sidebar;
  if (sb) {
    setVar(root, '--sidebar-w-expanded', sb.widthExpanded);
    setVar(root, '--sidebar-w-collapsed', sb.widthCollapsed);
    setVar(root, '--sidebar-bg', sb.background);
    setVar(root, '--sidebar-item-radius', sb.itemRadius);
  }

  
  if (tokens.elevation) {
    Object.entries(tokens.elevation).forEach(([key, val]) => setVar(root, `--shadow-${key}`, val));
  }

  
  const m = tokens.motion;
  if (m) {
    setVar(root, '--duration-fast', m.durationFast);
    setVar(root, '--duration-base', m.durationBase);
    setVar(root, '--duration-slow', m.durationSlow);
    setVar(root, '--ease-out', m.easeOut);
    setVar(root, '--ease-in-out', m.easeInOut);
  }

  
  const L = tokens.layout;
  if (L) {
    setVar(root, '--content-narrow', L.contentNarrow);
    setVar(root, '--content-default', L.contentDefault);
    setVar(root, '--content-wide', L.contentWide);
    setVar(root, '--page-padding-x', L.pagePaddingX);
    setVar(root, '--section-gap', L.sectionGap);
  }
}


if (typeof window !== 'undefined') {
  applyThemeTokens(themeConfig);
}






