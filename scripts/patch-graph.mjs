import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const weOriginal =
  'function we(){let u=window.location.pathname;return u.endsWith("/")&&(u=u.slice(0,-1)),u.startsWith("/")&&(u=u.slice(1)),u}'
const weDecoded =
  'function we(){let u=window.location.pathname;try{u=decodeURIComponent(u)}catch(e){}return u.endsWith("/")&&(u=u.slice(0,-1)),u.startsWith("/")&&(u=u.slice(1)),u}'
const weSlug =
  'function we(){let s=document.body&&document.body.dataset?document.body.dataset.slug:"";if(s)return s;let u=window.location.pathname;try{u=decodeURIComponent(u)}catch(e){}return u.endsWith("/")&&(u=u.slice(0,-1)),u.startsWith("/")&&(u=u.slice(1)),u}'
const fuOriginal = 'function Fu(u){let e=_t(ft(u,"index"),!0);return e.length===0?"/":e}'
const fuDecoded =
  'function Fu(u){try{u=decodeURIComponent(u)}catch(e){}let e=_t(ft(u,"index"),!0);return e.length===0?"/":e}'
const labelHidden = "lu.alpha=0,lu.scale.set(1/qu)"
const labelVisible = "lu.alpha=1,lu.scale.set(1/qu)"

function patchSource(src) {
  let next = src
  if (!next.includes(weSlug)) {
    if (next.includes(weDecoded)) next = next.replaceAll(weDecoded, weSlug)
    else if (next.includes(weOriginal)) next = next.replaceAll(weOriginal, weSlug)
  }
  if (!next.includes(fuDecoded) && next.includes(fuOriginal)) {
    next = next.replaceAll(fuOriginal, fuDecoded)
  }
  if (next.includes(labelHidden)) next = next.replaceAll(labelHidden, labelVisible)
  return next
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === ".bin" || entry.name === "test") continue
      walk(full, out)
    } else if (entry.name === "index.js" && full.includes(`${path.sep}graph${path.sep}`)) {
      out.push(full)
    }
  }
  return out
}

const files = [
  path.join(root, "node_modules", "@quartz-community", "graph", "dist", "components", "index.js"),
  ...walk(path.join(root, ".quartz", "plugins")),
].filter((file, i, arr) => fs.existsSync(file) && arr.indexOf(file) === i)

if (files.length === 0) {
  console.warn("graph plugin not found, skip pathname decode patch")
  process.exit(0)
}

let changed = 0
for (const file of files) {
  const src = fs.readFileSync(file, "utf8")
  const next = patchSource(src)
  if (next !== src) {
    fs.writeFileSync(file, next)
    changed++
    console.log("patched", path.relative(root, file))
  }
}

if (changed === 0) {
  const sample = fs.readFileSync(files[0], "utf8")
  if (sample.includes(weSlug) || sample.includes("decodeURIComponent(u)") || sample.includes(labelVisible)) {
    console.log("graph pathname decode patch already applied")
  } else {
    console.warn("graph pathname helper not found; plugin may have changed")
  }
}
