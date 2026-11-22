// Module package for deployment (`foundry-server deploy dist/pf2e-subsystems`): the same files the release workflow
// zips (.github/workflows/deploy.yml), from a fresh build (`npm run package` builds first).
import { promises as fs } from "fs";
import path from "path";

const OUT = path.join("dist", "pf2e-subsystems");
const FILES = ["module.json", "README.md", "LICENSE", "Subsystems.js", "templates", "styles/pf2e-subsystems.css", "packs", "lang", "tours"];
// LevelDB lock and logs are runtime files of whoever opened the pack last
const SKIP = /(^|[\\/])(LOCK|LOG(\.old)?)$/;

await fs.rm(OUT, { recursive: true, force: true });
for (const file of FILES) {
  await fs.cp(file, path.join(OUT, file), { recursive: true, filter: (source) => !SKIP.test(source) });
}
const { version } = JSON.parse(await fs.readFile("module.json", "utf8"));
console.log(`${OUT}: pf2e-subsystems ${version}`);
