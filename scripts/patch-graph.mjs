import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const file = path.join(
  root,
  "node_modules",
  "@quartz-community",
  "graph",
  "dist",
  "components",
  "index.js",
)

if (!fs.existsSync(file)) {
  console.warn("graph plugin not found, skip pathname decode patch")
  process.exit(0)
}

const needle =
  "function we(){let u=window.location.pathname;return u.endsWith(\"/\")&&(u=u.slice(0,-1)),u.startsWith(\"/\")&&(u=u.slice(1)),u}"
const insert =
  "function we(){let u=window.location.pathname;try{u=decodeURIComponent(u)}catch(e){}return u.endsWith(\"/\")&&(u=u.slice(0,-1)),u.startsWith(\"/\")&&(u=u.slice(1)),u}"

let src = fs.readFileSync(file, "utf8")
if (src.includes(insert)) {
  console.log("graph pathname decode patch already applied")
  process.exit(0)
}
if (!src.includes(needle)) {
  console.warn("graph pathname helper not found; plugin may have changed")
  process.exit(0)
}
fs.writeFileSync(file, src.replace(needle, insert))
console.log("patched graph to decode Chinese paths")
