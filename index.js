const puppeteer = require("puppeteer");
const grid = require("./grid");
const CREDS = require("./creds");

async function run() {
  const browser = await puppeteer.launch({
    headless: false
    //slowMo: 2 * 100
  });
  const page = await browser.newPage();
  await page.setViewport({ height: 800, width: 1200 });

  // Load home
  await page.goto("https://www.caisse-epargne.fr");
  await page.screenshot({ path: "screenshots/01.png" });

  // Open modal
  await page.click('a[data-target="#pauth"]');
  await page.waitForSelector(".modal-body .step1.in");
  await page.screenshot({ path: "screenshots/02.png" });

  // Username
  await page.waitForSelector("input#idClient");
  await page.click("input#idClient");
  await page.keyboard.type(CREDS.username);
  await page.click(`${"input#idClient"} + button`);
  await page.waitForSelector(".modal-body .step3.in");
  await page.screenshot({ path: "screenshots/03.png" });

  // Extract keyboard
  let audio = await page.evaluate(sel => {
    return document.querySelector(sel).style.backgroundImage;
  }, "#keyboardSecret");

  // Match cells to numbers
  const cells = await grid(
    Buffer.from(
      audio.replace('url("data:image/png;base64,', "").replace('")', ""),
      "base64"
    )
  );

  // Click password cells
  const CELL_SELECTOR = "form.password-form .code-btns button:nth-child(INDEX)";
  await CREDS.password.split("").forEach(async num => {
    await page.click(CELL_SELECTOR.replace("INDEX", cells[num] + 1));
  });
  await page.screenshot({ path: "screenshots/04.png" });

  // Submit
  await page.click(
    'form.password-form .affClavierSecurise button[type="submit"].confirm'
  );
  await page.waitForNavigation();
  await page.screenshot({ path: "screenshots/05.png" });

  browser.close();
}

run();
