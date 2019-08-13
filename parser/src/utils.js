const { URL } = require("url");

const CHI_TIME_REGEX = /(上|下)午(1[0-2]|[1-9])時([1-5]?[0-9])分/u;

function parseLink(val) {
  try {
    return new URL(val).toString();
  } catch {
    return undefined;
  }
}

/**
 * Parse the date in www.districtcouncils.gov.hk (tc version)
 * @param {String} val Date string in format YYYY-MM-DD\n(星期[一|二|三|四|五|六|日])
 */
function parseDateStr(val) {
  const dateStr = String(val)
    .replace(/\n/g, "")
    .slice(0, 10);
  console.log(dateStr);
  return new Date(Date.parse(dateStr));
}

function parseTimeStr(val) {
  const matches = String(val).match(CHI_TIME_REGEX);
  if (matches == null) {
    return null;
  }
  const hours = parseInt(matches[2]);
  const minutes = parseInt(matches[3]);
  switch (matches[1]) {
    case "上": {
      return { hours, minutes };
    }
    case "下": {
      return { hours: hours + 12, minutes };
    }
    default: {
      return null;
    }
  }
}

module.exports = { parseLink, parseDateStr, parseTimeStr };
