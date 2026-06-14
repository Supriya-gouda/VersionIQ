import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

async function test() {
  try {
    const buffer = fs.readFileSync("test_document.pdf");
    const parser = new pdfParse.PDFParse(buffer);
    console.log("Methods on parser:");
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));

    // Maybe it's not a function but we just call a method like .extractText() or .text?
    // Let's see what happens.
  } catch (e) {
    console.error(e);
  }
}

test();
