

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export const formatRupiah = (value) => idrFormatter.format(Number(value || 0));
