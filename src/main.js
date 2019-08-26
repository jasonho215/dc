const fs = require("fs");
const doIfNeed = require("./doIfNeed");
const fullCouncil = require("./fullCouncil");
const committee = require("./committee");
const download = require("./download");
const paginate = require("./paginate");

async function main() {
  fs.mkdirSync("data", { recursive: true });
  await fullCouncil();
  await committee();
  await download();
  await doIfNeed(async () => {
    return paginate();
  }, "data/data.json");
}

main();
