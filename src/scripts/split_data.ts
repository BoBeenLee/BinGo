import fs from "fs";
import path from "path";

const sourcePath = path.join(process.cwd(), "data", "nationwide_bulky_waste_fee_standard_data.json");
const outputDir = path.join(process.cwd(), "data", "regions");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read and parse source data
const rawData = fs.readFileSync(sourcePath, "utf-8");
const data = JSON.parse(rawData);

if (!data.records || !Array.isArray(data.records)) {
  console.error("Invalid data format: 'records' array missing.");
  process.exit(1);
}

// Group records by '시도명'
const groupedData: Record<string, any[]> = {};

data.records.forEach((record: any) => {
  const region = record["시도명"];
  if (!region) return;

  if (!groupedData[region]) {
    groupedData[region] = [];
  }
  groupedData[region].push(record);
});

// Write to files
console.log(`Found ${Object.keys(groupedData).length} regions.`);

Object.entries(groupedData).forEach(([region, records]) => {
  const fileName = `${region}.json`;
  const filePath = path.join(outputDir, fileName);
  
  const fileContent = {
    fields: data.fields, // Keep fields definition
    records: records
  };

  fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
  console.log(`Written ${records.length} records to ${fileName}`);
});

console.log("Data split complete.");
