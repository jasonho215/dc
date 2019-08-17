module.exports = function parseDuration(s) {
  // 0'32
  // 0"32
  // 0:32
  // 2:15:32
  // 2：15：32
  let hour = 0;
  let minute = 0;
  let second = 0;

  let match = null;

  if (match = /^(\d+)(?:['"])(\d+)$/.exec(s)) {
    minute = match[1];
    second = match[2];
  } else {
    const parts = s.replace("：", ":").split(":");
    switch (parts.length) {
    case 3:
      hour = parts[0];
      minute = parts[1];
      second = parts[2];
      break;
    case 2:
      minute = parts[0];
      second = parts[1];
      break;
    default:
      throw new Error("invalid duration: " + JSON.stringify(s));
    }
  }

  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);
  second = parseInt(second, 10);

  return hour * 3600 + minute * 60 + second;
}
