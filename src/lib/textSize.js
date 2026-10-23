const SCALE_CONFIG = {
  normal: {
    label: 'Normal',
    fontSize: '100%',
    description: 'Ukuran standar (16px)'
  },
  large: {
    label: 'Besar',
    fontSize: '115%',
    description: 'Lebih mudah dibaca (~18.4px)'
  },
  xlarge: {
    label: 'Sangat Besar',
    fontSize: '130%',
    description: 'Kenyamanan maksimal untuk lansia (~20.8px)'
  }
};

const STORAGE_KEY = 'wb_text_scale';

export const getTextScale = () => {
  if (typeof window === 'undefined') return 'normal';
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return SCALE_CONFIG[val] ? val : 'normal';
  } catch {
    return 'normal';
  }
};

export const setTextScale = (scale) => {
  const chosen = SCALE_CONFIG[scale] ? scale : 'normal';
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = SCALE_CONFIG[chosen].fontSize;
    document.documentElement.setAttribute('data-text-scale', chosen);
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, chosen);
    } catch {
      // Abaikan bila storage terkunci
    }
  }
  return chosen;
};

export const initTextScale = () => {
  return setTextScale(getTextScale());
};

export const TEXT_SCALE_OPTIONS = Object.entries(SCALE_CONFIG).map(([key, cfg]) => ({
  id: key,
  label: cfg.label,
  description: cfg.description
}));
