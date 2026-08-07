// Test harness setup: stub the 'server-only' package and, on Linux, force the
// OpenSSL 3.0.x query engine so Prisma does not fall back to the 1.1.x engine
// (which is not installed in node:20-slim).

const Module = require('module');
const path = require('path');
const os = require('os');

const originalLoad = Module._load;

Module._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === 'server-only' || request.endsWith('/server-only')) {
    return {};
  }
  return originalLoad.apply(this, [request, parent, isMain]);
};

if (os.platform() === 'linux') {
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(
    process.cwd(),
    'node_modules/.prisma/client/libquery_engine-linux-arm64-openssl-3.0.x.so.node'
  );
}
