// tsc only emits JavaScript; the windows load their HTML from dist/renderer.
import { cpSync } from 'fs';

cpSync('src/renderer', 'dist/renderer', {
  recursive: true,
  filter: (src) => !src.endsWith('.ts'),
});
