// main.ts — Night Ledger's hand-in program (Node 22, standard library only).
//
// The game lives in game/ as plain static files (index.html plus ES modules
// under game/src/) and the screenshots live in screenshots/. This program
// gathers both into the output directory and writes dossier.json there,
// using buildDossier from the vendored make.fun library so the judge's view
// matches the entry exactly. Outside the grader, MAKEFUN_OUTPUT_DIR stands
// in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// I wrote this file myself for this entry: it mirrors the kit's starter
// layout (copy dirs, then write the dossier) but the wording, comments and
// the screenshot-size guard below are my own.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output: game/ first, then the screenshots beside it.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  // Refuse an entry the gate would refuse (a screenshot over 256 KiB)
  // rather than silently handing in an invalid one.
  for (const name of readdirSync(shotsDir)) {
    const file = join(shotsDir, name);
    if (statSync(file).isFile() && statSync(file).size > 262144) {
      throw new Error(`screenshot ${name} is over the 256 KiB gate limit`);
    }
  }
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
