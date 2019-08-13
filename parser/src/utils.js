const { URL } = require("url");

function parseLink(val) {
  try {
    return new URL(val).toString();
  } catch {
    return undefined;
  }
}

module.exports = { parseLink };
