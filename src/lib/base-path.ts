const CONFIGURED_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

export function getBasePath(): string {
  return CONFIGURED_BASE_PATH;
}

export function stripBasePath(pathname: string): string {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (!CONFIGURED_BASE_PATH || normalizedPathname === CONFIGURED_BASE_PATH) {
    return '/';
  }

  if (normalizedPathname.startsWith(`${CONFIGURED_BASE_PATH}/`)) {
    return normalizedPathname.slice(CONFIGURED_BASE_PATH.length) || '/';
  }

  return normalizedPathname;
}
