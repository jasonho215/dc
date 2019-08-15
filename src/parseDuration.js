module.exports = function parseDuration(s) {
  const parts = s.split(":");
  let hour = 0;
  let minute = 0;
  let second = 0;
  switch (parts.length) {
  case 3:
    hour = parseInt(parts[0], 10);
    minute = parseInt(parts[1], 10);
    second = parseInt(parts[2], 10);
    break;
  case 2:
    minute = parseInt(parts[0], 10);
    second = parseInt(parts[1], 10);
    break;
  default:
    throw new Error("invalid duration: " + JSON.stringify(s));
  }
  return hour * 3600 + minute * 60 + second;
}
