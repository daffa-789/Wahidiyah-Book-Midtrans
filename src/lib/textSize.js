export const getTextScale = () => 'normal';

export const setTextScale = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = '100%';
    document.documentElement.setAttribute('data-text-scale', 'normal');
  }
  return 'normal';
};

export const initTextScale = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = '100%';
    document.documentElement.setAttribute('data-text-scale', 'normal');
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('wb_text_scale');
  }
  return 'normal';
};

export const TEXT_SCALE_OPTIONS = [
  { id: 'normal', label: 'Normal', fontSize: '100%', description: 'Ukuran standar (16px)' }
];
