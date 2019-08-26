const fs = require("fs");

const puppeteer = require("puppeteer");

const doIfNeed = require("./doIfNeed");
const { parseTable } = require("./extract");
const { DISTRICTS } = require("./district");

module.exports = async function read() {
  fs.mkdirSync("data/committee", { recursive: true});
  const browser = await puppeteer.launch();

  for (const district of DISTRICTS) {
    await doIfNeed(async () => {
      const page = await browser.newPage();
      await page.goto(
        `https://www.districtcouncils.gov.hk/${district}/tc_chi/meetings/committees/committee_meetings.php`
      );

      const committeeNames = await page.$$eval(
        ".content_inside_format > div > div > ul",
        nodes => nodes.map(node => node.querySelector("a[href]").textContent)
      );

      const handles = Array.from(await page.$$(".content_inside_format > div > div > div[id^=table]"));

      if (committeeNames.length !== handles.length) {
        throw new Error("committeeNames length mismatch: " + district);
      }

      let result = [];
      for (let i = 0; i < committeeNames.length; ++i) {
        const committeeName = committeeNames[i];
        const handle = handles[i];
        const years = await handle.$$eval("h3", h3s => h3s.map(h3 => parseInt(h3.textContent, 10)));
        const tableHandles = Array.from(await handle.$$("table"));
        if (years.length !== tableHandles.length) {
          throw new Error("tableHandles length mismatch: " + district);
        }
        for (let j = 0; j < years.length; ++j) {
          const year = years[j];
          const table = tableHandles[j];
          const r = await parseTable(browser, table, {
            district,
            year,
            meeting_type: "committee",
            committee_name: committeeName,
          });
          result = result.concat(r);
        }
      }

      await page.close();
      return JSON.stringify(result, null, 2);
    }, `data/committee/${district}.json`);
  }

  await browser.close();
}
