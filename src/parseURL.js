const { URL } = require("url");

module.exports = function parseLink(val) {
  return new URL(val).toString();
};
