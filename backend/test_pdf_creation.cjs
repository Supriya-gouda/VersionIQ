const fs = require("fs");
const path = require("path");

// Create a simple PDF file
const pdfContent = `%PDF-1.4
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Count 1/Kids[3 0 R]>>
endobj
3 0 obj
<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>
endobj
4 0 obj
<</Length 200>>
stream
BT
/F1 12 Tf
50 750 Td
(This is a test PDF file created for PDF extraction verification.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000200 00000 n 
trailer
<</Size 5/Root 1 0 R>>
startxref
450
%%EOF`;

const pdfPath = path.join(__dirname, "..", "test_document.pdf");
fs.writeFileSync(pdfPath, pdfContent);
console.log("✓ PDF created successfully");
console.log("  Path:", pdfPath);
console.log("  Size:", pdfContent.length, "bytes");
console.log("  First 100 chars:", pdfContent.substring(0, 100));
