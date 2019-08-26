module.exports = function parseDuration(s) {
  // 0'32
  // 0"32
  // 0:32
  // 2:15:32
  // 2：15：32
  // :00:00:43
  // 00:13:45:
  // 00::00:03
  let hour = 0;
  let minute = 0;
  let second = 0;

  let match = null;

  if ((match = /^(\d+)(?:['"])(\d+)$/.exec(s))) {
    minute = match[1];
    second = match[2];
  } else {
    s = s.replace("：", ":");
    s = s
      .replace(/^:/, "")
      .replace(/:$/, "")
      .replace(/:+/, ":");
    const parts = s.split(":");
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
};
