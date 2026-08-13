import { getBasePath as getConfiguredBasePath } from './base-path';

export { getBasePath } from './base-path';

export function getApiUrl(path: string): string {
  const base = getConfiguredBasePath();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function getInternalApiUrl(path: string): string {
  const base = getConfiguredBasePath();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (base) {
    return `${base}${normalized}`;
  }
  return normalized;
}
