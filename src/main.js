const fs = require("fs");
const { doIfNeed } = require("./utils");
const read = require("./fullCouncil.js");
const download = require("./download");
const paginate = require("./paginate");

async function main() {
  fs.mkdirSync("data", { recursive: true });
  await doIfNeed(read, "data/full-council.json");
  const items = JSON.parse(fs.readFileSync("data/full-council.json", { "encoding": "utf8" }));
  await download(items);
  await doIfNeed(async () => {
    return paginate(items);
  }, "data/data.json");
}

main();
