import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// Keep build caches inside this checkout on every operating system.
const result = spawnSync('hugo', [...process.argv.slice(2), '--cacheDir', resolve('.cache/hugo')], { stdio: 'inherit' });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
