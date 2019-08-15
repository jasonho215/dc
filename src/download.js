const fs = require("fs");
const { URL } = require("url");
const path = require("path");
const fetch = require("node-fetch");
const { doIfNeed } = require("./utils");

module.exports = async function download(items) {
  for (const item of items) {
    const { agenda, minutes } = item;
    if (!agenda || !minutes) {
      continue;
    }

    const agendaPath = "data/" + new URL(agenda).pathname;
    const agendaDir = path.dirname(agendaPath);

    const minutesPath = "data/" + new URL(minutes).pathname;
    const minutesDir = path.dirname(minutesPath);

    await doIfNeed(async () => {
      fs.mkdirSync(agendaDir, { recursive: true });
      return (await fetch(agenda)).buffer();
    }, agendaPath);

    await doIfNeed(async () => {
      fs.mkdirSync(minutesDir, { recursive: true });
      return (await fetch(minutes)).buffer();
    }, minutesPath);
  }
}
