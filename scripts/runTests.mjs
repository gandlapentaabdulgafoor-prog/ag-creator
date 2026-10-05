import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, '.test-build');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!context.parentURL?.startsWith('file:')) return nextResolve(specifier, context);
    const parentPath = fileURLToPath(context.parentURL);
    if (!parentPath.startsWith(outputRoot + path.sep) || parentPath.includes(`${path.sep}node_modules${path.sep}`)) {
      return nextResolve(specifier, context);
    }
    if (!specifier.startsWith('.')) return nextResolve(specifier, context);
    const target = path.resolve(path.dirname(parentPath), specifier);
    if (specifier.endsWith('firebase-applet-config.json') && !existsSync(target)) {
      return nextResolve(pathToFileURL(path.join(projectRoot, 'firebase-applet-config.json')).href, context);
    }
    if (!path.extname(specifier)) {
      for (const extension of ['.js', '.json']) {
        if (existsSync(target + extension)) return nextResolve(pathToFileURL(target + extension).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('firebase-applet-config.json')) {
      return {
        format: 'json',
        source: readFileSync(path.join(projectRoot, 'firebase-applet-config.json'), 'utf8'),
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

await import(pathToFileURL(path.join(outputRoot, 'server', 'test', 'runSuites.js')).href);
