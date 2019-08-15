const { romanToNumber, lookLikeRoman } = require("./roman");

function isFirstLevel(s) {
  return s.length > 0 && s[0] !== "(";
}

function alphaToNumber(s) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const idx = alphabet.indexOf(s);
  if (idx < 0) {
    throw new Error("alphabet overflow");
  }
  return idx + 1;
}

module.exports = function fixAgendaCode(rows) {
  let first = 0;
  let second = 0;
  let third = 0;

  const output = [];
  for (let i = 0; i < rows.length; ++i) {
    const { agenda_code } = rows[i];

    if (isFirstLevel(agenda_code)) {
      first = romanToNumber(agenda_code);
      second = 0;
      third = 0;
    } else {
      const withoutParen = agenda_code.slice(1, agenda_code.length - 1);
      if (agenda_code === "(i)") {
        if (rows[i + 1]) {
          if (rows[i + 1].agenda_code === "(ii)") {
            third = romanToNumber(withoutParen);
          } else {
            second = alphaToNumber(withoutParen);
            third = 0;
          }
        } else {
          throw new Error("ambiguous");
        }
      } else {
        if (lookLikeRoman(withoutParen)) {
          third = romanToNumber(withoutParen);
        } else {
          second = alphaToNumber(withoutParen);
          third = 0;
        }
      }
    }

    output.push({
      ...rows[i],
      agenda_code: [first, second, third].filter(a => a !== 0).join("."),
    });
  }

  return output;
}
