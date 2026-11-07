// Format monetary figures strictly in PKR (Rs.)
export function formatPKR(amount) {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPKRCompact(amount) {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-PK', {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatPercent(val) {
  const num = Number(val) || 0;
  return `${num.toFixed(1)}%`;
}
