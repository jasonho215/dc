const fs = require("fs");

module.exports = async function doIfNeed(f, path) {
  try {
    fs.lstatSync(path);
  } catch (e) {
    const r = await f();
    fs.writeFileSync(path, r);
  }
}
