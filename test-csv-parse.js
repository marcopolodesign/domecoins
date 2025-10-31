// Quick test to verify CSV parsing logic
const csvContent = `TCGplayer Id,Product Line,Set Name,Product Name,Title,Number,Total Quantity,Add to Quantity,Img
AC0001,Accesorio,Folio,ETB Lucario,,65,,7,https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4171_79bd0021eb.heic
AC0002,Accesorio,Folio,ETB Eevee Prismatic,,65,,12,https://res.cloudinary.com/dqpllefve/image/upload/v1761351533/IMG_4174_93facab75a.heic`;

const lines = csvContent.split('\n').filter(line => line.trim() !== '');

// Auto-detect separator (comma or semicolon) from header
const header = lines[0];
const separator = header.includes(';') ? ';' : ',';
console.log(`Detected separator: "${separator}"`);

const accessories = [];

// Skip header (first line)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Split by detected separator
  const columns = line.split(separator);
  
  console.log(`Line ${i}: ${columns.length} columns`);
  
  if (columns.length >= 9) {
    const id = columns[0].trim();
    const productLine = columns[1].trim();
    const setName = columns[2].trim();
    const productName = columns[3].trim();
    const title = columns[4].trim();
    const number = columns[5].trim();
    const totalQuantity = parseInt(columns[6].trim()) || 0;
    const addToQuantity = parseInt(columns[7].trim()) || 0;
    const imageUrl = columns[8].trim();
    const price = columns[9] ? parseFloat(columns[9].trim()) : undefined;
    
    if (id && productName) {
      accessories.push({
        id,
        productLine,
        setName,
        productName,
        title,
        number,
        totalQuantity,
        addToQuantity,
        imageUrl,
        price
      });
      console.log(`✓ Parsed: ${id} - ${productName}`);
    }
  } else {
    console.log(`✗ Skipped: Not enough columns (${columns.length})`);
  }
}

console.log(`\nTotal accessories parsed: ${accessories.length}`);
console.log('\nSample accessory:');
console.log(JSON.stringify(accessories[0], null, 2));

