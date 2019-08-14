const fs = require("fs");
const read = require("./full-council.js");

async function doIfNeed(f, path) {
  try {
    fs.lstatSync(path);
  } catch (e) {
    const r = await f();
    fs.writeFileSync(path, r);
  }
}

async function main() {
  fs.mkdirSync("data", {recursive: true});
  doIfNeed(read, "data/full-council.json");
}

main();
