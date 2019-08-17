const fs = require("fs");
const { doIfNeed } = require("./utils");
const fullCouncil = require("./fullCouncil.js");
const download = require("./download");
const paginate = require("./paginate");

async function main() {
  fs.mkdirSync("data", { recursive: true });
  await fullCouncil();
  await download();
  await doIfNeed(async () => {
    return paginate();
  }, "data/data.json");
}

main();
