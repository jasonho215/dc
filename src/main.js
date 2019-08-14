const fs = require("fs");
const { doIfNeed } = require("./utils");
const read = require("./fullCouncil.js");
const download = require("./download");

async function main() {
  fs.mkdirSync("data", { recursive: true });
  await doIfNeed(read, "data/full-council.json");
  const items = JSON.parse(fs.readFileSync("data/full-council.json", { "encoding": "utf8" }));
  await download(items);
}

main();
