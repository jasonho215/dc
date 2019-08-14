const { URL } = require("url");

const TIME_REGEX = /(上|下)午(\d+)時(\d+分|正)/u;

function pad(s) {
  return ("0" + s).slice(-2);
}

function parseLink(val) {
  try {
    return new URL(val).toString();
  } catch {
    return undefined;
  }
}

function parseDate(dateStr, timeStr) {
  const date = dateStr.slice(0, 10);
  const matches = TIME_REGEX.exec(timeStr);
  let hour = parseInt(matches[2], 10);
  let minutes = "";
  if (matches[1] === "下") {
    hour += 12;
  }
  if (matches[3] === "正") {
    minutes = "00";
  } else {
    minutes = matches[3].slice(0, 2);
  }
  return `${date}T${pad(hour)}:${pad(minutes)}:00.000+08:00`;
}

module.exports = { parseLink, parseDate };
