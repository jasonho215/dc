const fs = require("fs");
const path = require("path");

const pdfjs = require("pdfjs-dist");

function textContentToText(textContent) {
  let text = "";
  for (let item of textContent.items) {
    text += item.str;
  }
  return text;
}

async function process(item, documentType) {
  const output = [];
  const url = item[documentType];
  const filepath = "data/" + new URL(url).pathname;
  const buffer = fs.readFileSync(filepath);
  const doc = await pdfjs.getDocument(buffer).promise;
  for (let i = 1; i <= doc.numPages; ++i) {
    const pageProxy = await doc.getPage(i);
    const textContent = await pageProxy.getTextContent();
    const text = textContentToText(textContent);
    output.push({
      district: item.district,
      year: item.year,
      meeting_type: item.meeting_type,
      meeting_number: item.meeting_number,
      meeting_date: item.meeting_date,
      meeting_location: item.meeting_location,
      content_type: "application/pdf",
      url: url,
      document_type: documentType,
      page_number: i,
      page_content: text,
    });
  }
  return output;
}

module.exports = async function paginate() {
  const basenames = fs.readdirSync("data/fullCouncil");

  let output = [];
  for (const basename of basenames) {
    const filepath = path.join("data/fullCouncil", basename);
    const items = JSON.parse(fs.readFileSync(filepath, { encoding: "utf-8" }));

    for (const item of items) {
      if (!item.agenda || !item.minutes) {
        output.push(item);
      } else {
        output = output.concat(await process(item, "agenda"));
        output = output.concat(await process(item, "minutes"));
      }
    }
  }

  return JSON.stringify(output, null, 2);
}
