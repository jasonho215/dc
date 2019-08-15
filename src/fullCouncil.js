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

async function parseAudio(browser, audioURL) {
  const page = await browser.newPage();
  await page.goto(audioURL);
  const meeting_location = await page.$eval("table.meeting tr:nth-child(3) td:nth-child(2)", td => td.textContent.trim());
  await page.close();
  return { meeting_location };
}

async function parseTable(browser, table) {
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
  const dataRows = rows.slice(1, rows.length);

  const meetingList = [];
  for (const d of dataRows) {
    if (d.length !== MEETING_COL_CNT) {
      continue;
    }
    try {
      const agenda = parseLink(d[3]);
      const minutes = parseLink(d[4]);
      const audio = parseLink(d[5]);

      const { meeting_location } = await parseAudio(browser, audio);

      meetingList.push({
        agenda,
        minutes,
        audio,
        meeting_type: "full_council",
        meeting_date: parseDate(d[1], d[2]),
        meeting_number: d[0],
        meeting_location,
      });
    } catch (e) {
      continue;
    }
  }

  return meetingList;
}

module.exports = async function read() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let result = [];
  for (const district of DISTRICTS) {
    await page.goto(
      `https://www.districtcouncils.gov.hk/${district}/tc_chi/meetings/dcmeetings/dc_meetings.php`
    );
    const tables = Array.from(await page.$$("div#mainContent div[id^=table]"));
    for (const table of tables) {
      const id = String(await (await table.getProperty("id")).jsonValue());
      const year = parseInt(id.slice(5), 10);
      const r = await parseTable(browser, table);
      for (const a of r) {
        a.year = year;
        a.district = district;
      }
      result = result.concat(r);
    }
  }
  await browser.close();
  return JSON.stringify(result, null, 2);
}
