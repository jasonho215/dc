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

async function process(logStream, item, documentType) {
  const output = [];
  const url = item[documentType];
  const filepath = "data" + new URL(url).pathname;
  const buffer = fs.readFileSync(filepath);

  let doc;
  try {
    doc = await pdfjs.getDocument(buffer).promise;
  } catch (e) {
    logStream.write(filepath + "\n");
    return output;
  }

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

const DIRS = ["fullCouncil", "committee"];

module.exports = async function paginate() {
  let output = [];

  const logStream = fs.createWriteStream("INVALID_PDF");

  for (const dir of DIRS) {
    const basenames = fs.readdirSync(`data/${dir}`);

    for (const basename of basenames) {
      const filepath = path.join(`data/${dir}`, basename);
      const items = JSON.parse(
        fs.readFileSync(filepath, { encoding: "utf-8" })
      );

      for (const item of items) {
        if (!item.agenda || !item.minutes) {
          output.push(item);
        } else {
          output = output.concat(await process(logStream, item, "agenda"));
          output = output.concat(await process(logStream, item, "minutes"));
        }
      }
    }
  }

  logStream.end();

  return JSON.stringify(output, null, 2);
};
