const fs = require("fs");
const pdfjs = require("pdfjs-dist");


function textContentToText(textContent) {
  let text = "";
  for (let item of textContent.items) {
    text += item.str;
  }
  return text;
}

async function main() {
  const output = [];
  const dataBuffer = fs.readFileSync("my.pdf");
  const doc = await pdfjs.getDocument(dataBuffer);
  const numPages = doc.numPages;
  for (let i = 1; i <= numPages; ++i) {
    const pageProxy = await doc.getPage(i);
    const textContent = await pageProxy.getTextContent();
    const text = textContentToText(textContent);
    output.push({
      "district": "tuen_mun",
      "year": 2019,
      "meeting_type": "full_council",
      "meeting_number": "第二十次",
      "meeting_date": "2019-01-08T09:30:00+08:00",
      "meeting_location": "屯門屯喜路1號\n屯門政府合署3樓\n屯門區議會會議室",
      "content_type": "application/pdf",
      "url": "https://www.districtcouncils.gov.hk/tm/doc/2016_2019/tc/dc_meetings_minutes/dc_20th_minutes_20190108.pdf",
      "document_type": "minutes",
      page_number: i,
      page_content: text,
    });
  }
  console.log(JSON.stringify(output, null, 2));
}

main();
