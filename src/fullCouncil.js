const fs = require("fs");

const puppeteer = require("puppeteer");

const doIfNeed = require("./doIfNeed");
const { parseTable } = require("./extract");
const { DISTRICTS } = require("./district");

module.exports = async function read() {
  fs.mkdirSync("data/fullCouncil", { recursive: true});
  const browser = await puppeteer.launch();

  for (const district of DISTRICTS) {
    await doIfNeed(async () => {
      const page = await browser.newPage();
      await page.goto(
        `https://www.districtcouncils.gov.hk/${district}/tc_chi/meetings/dcmeetings/dc_meetings.php`
      );
      const tables = Array.from(await page.$$("div#mainContent div[id^=table]"));
      let result = [];
      for (const table of tables) {
        const id = String(await (await table.getProperty("id")).jsonValue());
        const year = parseInt(id.slice(5), 10);
        const r = await parseTable(browser, table, { year, district, meeting_type: "full_council" });
        result = result.concat(r);
      }
      await page.close();
      return JSON.stringify(result, null, 2);
    }, `data/fullCouncil/${district}.json`);
  }

  await browser.close();
}
