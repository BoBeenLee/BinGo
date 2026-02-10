import fs from "fs";
import path from "path";

const sourceFile = "data/regions/경기도 성남시_대형폐기물 수거기준정보_20260116.csv";
const outputFile = "data/regions/경기도_성남시.json";
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
  // Reading as UTF-8 since view_file showed correct content
  const content = fs.readFileSync(fullSourcePath, 'utf-8');
  
  const lines = content.split(/\r?\n/).filter((line: string) => line.trim() !== "");
  
  // Skip header (Assuming first line is header)
  const dataLines = lines.slice(1);
  
  const records: any[] = [];

  for (const line of dataLines) {
    const cols = parseCSVLine(line);
    // idx 0: 분류
    // idx 1: 품명
    // idx 2: 규격
    // idx 3: 수수료
    // idx 4: 데이터기준일자

    if (cols.length < 4) continue;

    const category = cols[0];
    const name = cols[1];
    const spec = cols[2];
    const feeStr = cols[3];
    const date = cols[4];

    if (feeStr && name) {
      // Create record
      const record = {
        "시도명": "경기도",
        "시군구명": "성남시",
        "대형폐기물명": name.replace(/^"|"$/g, ""),
        "대형폐기물구분명": category,
        "대형폐기물규격": spec || "모든규격",
        "수수료": feeStr,
        "데이터기준일자": date || "2026-01-16"
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
