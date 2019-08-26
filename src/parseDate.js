const TIME_REGEX = /(上|中|下)午(\d+)時(\d+分|正)/u;

function pad(s) {
  return ("0" + s).slice(-2);
}

module.exports = function parseDate(dateStr, timeStr) {
  const date = dateStr.slice(0, 10);
  const matches = TIME_REGEX.exec(timeStr);
  if (matches == null) {
    console.warn("invalid time: " + timeStr);
    console.warn("fallback to 0930");
    return `${date}T09:30:00.000+08:00`;
  }
  let hour = parseInt(matches[2], 10);
  let minutes = "";
  // 下午11時 == 23:00
  // 下午12時 == 12:00
  // Chinese is so interesting...
  if (matches[1] === "下" && hour < 12) {
    hour += 12;
  }
  if (matches[3] === "正") {
    minutes = "00";
  } else {
    minutes = matches[3].slice(0, 2);
  }
  return `${date}T${pad(hour)}:${pad(minutes)}:00.000+08:00`;
};
