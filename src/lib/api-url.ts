export function getBasePath(): string {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/lemans/demo')) return '/lemans/demo';
    if (path.startsWith('/lemans')) return '/lemans';
    return '';
  }
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

export function getApiUrl(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function getInternalApiUrl(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (base) {
    return `${base}${normalized}`;
  }
  return normalized;
}
