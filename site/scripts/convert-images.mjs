// Convert HEIC images to JPEG for web compatibility
import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { cwd } from 'node:process';
import convert from 'heic-convert';

const dir = join(cwd(), 'public', 'images');
const files = await readdir(dir);
const heicFiles = files.filter((f) => /\.heic$/i.test(f));

console.log(`Found ${heicFiles.length} HEIC files. Converting...`);

for (const file of heicFiles) {
  const input = await readFile(join(dir, file));
  const output = await convert({ buffer: input, format: 'JPEG', quality: 0.85 });
  const outPath = join(dir, `${basename(file, extname(file))}.jpg`);
  await writeFile(outPath, output);
  await unlink(join(dir, file));
  console.log(`  OK ${file} -> ${basename(outPath)}`);
}

console.log('Done.');
