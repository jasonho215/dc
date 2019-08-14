const puppeteer = require("puppeteer");
const { parseLink, parseDate } = require("./utils");

const MEETING_COL_CNT = 7;
const CIRCULATE_COL_CNT = 2;

const DISTRICTS = [
  // "central",
  // "wc",
  // "south",
  // "east",
  // "kt",
  // "ssp",
  // "ytm",
  // "wts",
  // "kc",
  // "island",
  // "tw",
  // "yl",
  // "north",
  // "st",
  // "sk",
  // "kwt",
  // "tp",
  "tm",
];

async function parseTable(table) {
  const rows = await table.$$eval("tr", trs => {
    return trs.map(tr =>
      Array.from(tr.querySelectorAll("td")).map(td => {
        const link = td.querySelector("a");
        if (link != null) {
          return link.href;
        }
        return td.textContent.replace(/\n|\t/g, "");
      })
    );
  });
  // remove table header
  const dataRows = Array.from(rows).slice(1, rows.length);
  const meetingList = [];
  for (let i = 0; i < dataRows.length; ) {
    const d = Array.from(dataRows[i]);
    const circulates = [];
    for (let j = i + 1; j < dataRows.length; j++) {
      const c = Array.from(dataRows[j]);
      if (c.length === MEETING_COL_CNT) {
        break;
      }
      if (c.length === CIRCULATE_COL_CNT) {
        circulates.push(parseLink(c[1]));
      }
    }
    meetingList.push({
      name: d[0],
      date: parseDate(d[1], d[2]),
      agenda: parseLink(d[3]),
      minutes: parseLink(d[4]),
      // audio: parseLink(d[5]),
    });
    i += circulates.length + 1;
  }
  return meetingList.filter(a => !!a.agenda && !!a.minutes);
}

module.exports = async function read() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const result = [];
  for (const district of DISTRICTS) {
    await page.goto(
      `https://www.districtcouncils.gov.hk/${district}/tc_chi/meetings/dcmeetings/dc_meetings.php`
    );
    const tables = Array.from(await page.$$("div#mainContent div[id^=table]"));
    for (const table of tables) {
      const id = String(await (await table.getProperty("id")).jsonValue());
      const year = id.slice(5);
      const r = await parseTable(table);
      for (const a of r) {
        a.year = year;
      }
      result.push(r);
    }
  }
  await browser.close();
  return JSON.stringify(result, null, 2);
}
