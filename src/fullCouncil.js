const fs = require("fs");

const puppeteer = require("puppeteer");

const doIfNeed = require("./doIfNeed");
const parseURL = require("./parseURL");
const parseDate = require("./parseDate");
const parseDuration = require("./parseDuration");
const { DISTRICTS } = require("./district");

const MEETING_COL_CNT = 7;
const CIRCULATE_COL_CNT = 2;


async function parseAudio(browser, audioURL, attrs) {
  const page = await browser.newPage();
  await page.goto(audioURL);
  const meeting_location = await page.$eval("table.meeting tr:nth-child(3) td:nth-child(2)", td => td.textContent.trim());

  let rows = await page.$$eval("table.meeting", nodes => {
    const output = [];
    const table = nodes[1];
    const rows = Array.from(table.querySelectorAll("tr")).slice(1);
    for (const row of rows) {
      const cols = Array.from(row.querySelectorAll("td"));

      const anchor = cols[1].querySelector("a");
      // The first childNode is <span class="access">這連結會以新視窗打開。</span>
      // We want to skip it.
      const title = anchor != null ? anchor.childNodes[1].textContent.trim() : null;
      const url = anchor != null ? anchor.href : null;
      // We do not parse the agenda code because they are very irregular.
      const durationText = cols[2].textContent.trim();

      output.push({
        title,
        url,
        durationText,
      });
    }
    return output;
  });

  rows = rows.filter(row => !!row.title && !!row.url && !!row.durationText);
  rows = rows.map(row => {
    return {
      ...attrs,
      meeting_location,
      agenda_title: row.title,
      url: row.url,
      duration: parseDuration(row.durationText),
      content_type: "audio/mp3",
      document_type: "audio",
    };
  });

  await page.close();
  return { meeting_location, rows };
}

async function parseTable(browser, table, attrs) {
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

  let meetingList = [];
  for (const d of dataRows) {
    if (d.length !== MEETING_COL_CNT) {
      continue;
    }

    let agenda;
    let minutes;
    let audio;
    try {
      agenda = parseURL(d[3]);
      minutes = parseURL(d[4]);
      audio = parseURL(d[5]);
    } catch (e) {
      continue;
    }

    const meeting_number = d[0];
    const meeting_date = parseDate(d[1], d[2]);

    const { meeting_location, rows } = await parseAudio(browser, audio, { ...attrs,  meeting_number, meeting_date });

    meetingList = meetingList.concat(rows);

    meetingList.push({
      ...attrs,
      agenda,
      minutes,
      meeting_date,
      meeting_number,
      meeting_location,
    });
  }

  return meetingList;
}

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
