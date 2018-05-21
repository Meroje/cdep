const sharp = require("sharp");
const fs = require("fs");
const crypto = require("crypto");

const blank = "d081a26e8f2e58663916128dcd34b6f4";
const hashes = [
  "ee4f21a92ca6089d3565704ed3811fa5",
  "7165c1489da4fc3471dd45a0d57d52d8",
  "cf534ce6a93e5ffe94da4267a92a20ab",
  "7d9e801c185e61b0988d56e466d1ab88",
  "7af043c13eeb0079874afe35c1202339",
  "a5624f6892a8eae027da24020abcb8eb",
  "34d8881313674328513adab645c8c3f9",
  "836e2a124ab238d7cbe47b2f2d264e17",
  "d9599fa1eeb407c09787be8149dd0b97",
  "3a7b7fad38fc9e0a51188904b8e0fc5c"
];

module.exports = async function(buffer) {
  const cellmatch = new Array(10);

  const image = sharp(buffer).threshold(250, { greyscale: true });

  const metadata = await image.metadata();

  const cell = {
    height: metadata.height / 3,
    width: metadata.width / 5
  };

  let i = 0;
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 5; x++) {
      let cell_image = image.extract({
        left: x * cell.width,
        top: y * cell.height,
        width: cell.width,
        height: cell.height
      });

      await cell_image.toFile(`work.png`);
      const hash = crypto.createHash("md5");
      hash.update(fs.readFileSync(`work.png`));
      const hashvalue = hash.digest("hex");

      if (hashvalue === blank) {
        i++;
        continue;
      }

      const num = hashes.findIndex(value => value === hashvalue);
      cellmatch[num] = i;

      i++;
    }
  }
  fs.unlinkSync(`work.png`);

  return cellmatch;
};
