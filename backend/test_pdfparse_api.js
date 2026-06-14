import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

console.log('\n=== TESTING PDF-PARSE USAGE ===\n');

// Method 1: Try direct call (what the code does)
console.log('Method 1: Direct call - pdfParse(buffer)');
const pdfPath = path.join(__dirname, '..', 'test_document.pdf');
const dataBuffer = fs.readFileSync(pdfPath);
console.log('  Buffer loaded:', dataBuffer.length, 'bytes');

try {
  const result = await pdfParse(dataBuffer);
  console.log('  ✓ Success:', result);
} catch (err) {
  console.log('  ✗ ERROR:', err.message);
  console.log('  Type error:', err instanceof TypeError);
}

// Method 2: Try using default export
console.log('\nMethod 2: Check for default export');
console.log('  pdfParse.default:', typeof pdfParse.default);

// Method 3: Try to find the actual parsing function
console.log('\nMethod 3: Check available methods');
const methods = Object.keys(pdfParse).filter(k => typeof pdfParse[k] === 'function');
console.log('  Callable methods:', methods);

// Method 4: Try the PDFParse class
console.log('\nMethod 4: Check PDFParse class');
if (pdfParse.PDFParse) {
  console.log('  PDFParse class exists:', pdfParse.PDFParse.name);
  console.log('  Is constructor:', typeof pdfParse.PDFParse === 'function');
  
  try {
    const parser = new pdfParse.PDFParse(dataBuffer);
    console.log('  ✓ PDFParse instantiated');
  } catch (err) {
    console.log('  ✗ Instantiation error:', err.message);
  }
}

console.log('\n=== END TEST ===\n');
