const puppeteer = require("puppeteer");
const _ = require("lodash");
const grid = require("./grid");
const CREDS = require("./creds");

async function waitForLoader(page) {
  await page.waitFor(
    () => "document.querySelector('.loaderServeur').style.display === 'none'"
  );
  await page.waitFor(
    () => "document.querySelector('.loaderServeur').style.display === 'block'"
  );
  await page.waitFor(
    () => "document.querySelector('.loaderServeur').style.display === 'none'"
  );
}

async function run() {
  let i = 1;
  const browser = await puppeteer.launch({
    headless: false
    //slowMo: 2 * 100
  });
  const page = await browser.newPage();
  await page.setViewport({ height: 800, width: 1200 });

  // Load home
  await page.goto("https://www.caisse-epargne.fr");
  await page.screenshot({ path: `../screenshots/0${i++}.png` });

  // Open modal
  await page.click('a[data-target="#pauth"]');
  await page.waitForSelector(".modal-body .step1.in");
  await page.screenshot({ path: `../screenshots/0${i++}.png` });

  // Username
  await page.waitForSelector("input#idClient");
  await page.click("input#idClient");
  await page.keyboard.type(CREDS.username);
  await page.screenshot({ path: `../screenshots/0${i++}.png` });
  await page.click(`${"input#idClient"} + button`);
  await page.waitForSelector(".modal-body .step3.in");
  await page.screenshot({ path: `../screenshots/0${i++}.png` });

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
  await page.screenshot({ path: `../screenshots/0${i++}.png` });

  // Submit
  await page.click(
    'form.password-form .affClavierSecurise button[type="submit"].confirm'
  );
  await page.waitForNavigation();
  await page.screenshot({ path: `../screenshots/0${i++}.png` });

  // Go to history page
  await page.click(
    "#MM_SYNTHESE table.accompte .rowHover:nth-child(1) .rowClick > a"
  );
  await waitForLoader(page);
  await page.waitForSelector(
    "#MM_HISTORIQUE_COMPTE #MM_HISTORIQUE_COMPTE_pnlPagination"
  );
  await page.screenshot({ path: `../screenshots/0${i++}.png` });

  // Read all pages
  let transactions = [];
  while (
    !(await page.evaluate(sel => {
      return (
        document.querySelector(sel).getAttribute("disabled") === "disabled"
      );
    }, "#MM_HISTORIQUE_COMPTE_lnkSuivante"))
  ) {
    await page.screenshot({ path: `../screenshots/0${i++}.png` });

    // Extract data
    let { headings, rows } = await page.evaluate(sel => {
      return {
        headings: Array.from(
          document.querySelectorAll(`${sel} thead span`).values()
        ).map(e => e.innerHTML),
        rows: Array.from(
          document
            .querySelectorAll(
              '#MM_HISTORIQUE_COMPTE > table[summary="summary"] tbody tr'
            )
            .values()
        ).map(e => Array.from(e.children).map(f => f.textContent.trim()))
      };
    }, '#MM_HISTORIQUE_COMPTE > table[summary="summary"]');

    transactions = [
      ...transactions,
      ...rows.map(row =>
        _.fromPairs(row.map((col, colIndex) => [headings[colIndex], col]))
      )
    ];

    await page.click("#MM_HISTORIQUE_COMPTE_lnkSuivante");
    await waitForLoader(page);
  }

  console.table(transactions);

  browser.close();
}

run();
