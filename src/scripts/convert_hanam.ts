import fs from "fs";
import path from "path";

const sourceFile = "data/regions/경기도 하남시_대형폐기물 수거품목 정보_20250721.csv";
const outputFile = "data/regions/경기도_하남시.json";
const fullSourcePath = path.join(process.cwd(), sourceFile);
const fullOutputPath = path.join(process.cwd(), outputFile);

// Utility to parse CSV line respecting quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

try {
  const buffer = fs.readFileSync(fullSourcePath);
  const decoder = new TextDecoder("euc-kr");
  const content = decoder.decode(buffer);
  
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
  
  // Skip header (Assuming first line is header)
  const dataLines = lines.slice(1);
  
  const records: any[] = [];
  let currentCategory = "기타"; // Default category if not specified

  for (const line of dataLines) {
    const cols = parseCSVLine(line);
    // idx 0: 번호
    // idx 1: 수거품목명
    // idx 2: 수거품목설명
    // idx 3: 수거품목금액
    // idx 4: 데이터기준일자

    if (cols.length < 4) continue;

    const name = cols[1];
    const spec = cols[2];
    const feeStr = cols[3];

    // Check if category row
    if (!feeStr && name) {
      currentCategory = name;
      continue;
    }

    // Check if item row
    if (feeStr && name) {
      // Create record
      const record = {
        "시도명": "경기도",
        "시군구명": "하남시",
        "대형폐기물명": name.replace(/^"|"$/g, ""), // Remove quotes if any remains
        "대형폐기물구분명": currentCategory,
        "대형폐기물규격": spec || "모든규격",
        "수수료": feeStr,
        "데이터기준일자": cols[4] || "2025-07-21"
      };
      records.push(record);
    }
  }

  const outputData = {
    fields: [
        {"id":"시도명"},
        {"id":"시군구명"},
        {"id":"대형폐기물명"},
        {"id":"대형폐기물구분명"},
        {"id":"대형폐기물규격"},
        {"id":"수수료"},
        {"id":"데이터기준일자"}
    ],
    records: records
  };

  fs.writeFileSync(fullOutputPath, JSON.stringify(outputData, null, 2));
  console.log(`Successfully converted ${records.length} records to ${outputFile}`);

} catch (error) {
  console.error("Error converting CSV:", error);
}
