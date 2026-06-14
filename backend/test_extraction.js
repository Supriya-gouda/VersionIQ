import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

async function testPdfExtraction() {
  console.log('\n=== PDF EXTRACTION TEST ===\n');
  
  const pdfPath = path.join(__dirname, '..', 'test_document.pdf');
  console.log('1. Loading PDF from:', pdfPath);
  
  const dataBuffer = await fs.promises.readFile(pdfPath);
  console.log('   ✓ Buffer loaded: ' + dataBuffer.length + ' bytes');
  
  console.log('\n2. Parsing PDF with pdf-parse...');
  const data = await pdfParse(dataBuffer);
  console.log('   ✓ PDF parsed successfully');
  console.log('   - Pages:', data.numpages);
  console.log('   - Version:', data.version);
  console.log('   - Producer:', data.producer);
  console.log('   - Text length:', data.text.length, 'characters');
  
  console.log('\n3. Extracted text:');
  console.log('   Length:', data.text.length, 'chars');
  console.log('   First 200 chars:', data.text.substring(0, 200));
  console.log('   Last 100 chars:', data.text.substring(data.text.length - 100));
  
  console.log('\n4. Text validation check:');
  const MIN_LENGTH = 10;
  const trimmed = data.text.trim();
  console.log('   - Empty?', trimmed.length === 0 ? 'YES' : 'NO');
  console.log('   - Whitespace only?', trimmed.length === 0 ? 'YES' : 'NO');
  console.log('   - Min length (10)?', trimmed.length >= MIN_LENGTH ? 'PASS' : 'FAIL');
  console.log('   - Valid for processing?', trimmed.length >= MIN_LENGTH ? 'YES' : 'NO');
  
  return {
    success: true,
    extractedText: data.text,
    characterCount: data.text.length,
    pages: data.numpages
  };
}

testPdfExtraction()
  .then(result => {
    console.log('\n✓ PDF extraction test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n✗ PDF extraction test failed:');
    console.error(err.message);
    process.exit(1);
  });
