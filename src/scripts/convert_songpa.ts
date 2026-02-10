const fs = require("fs");
const path = require("path");

const sourceFile = "data/regions/서울특별시_송파구_대형생활폐기물 수집·운반수수료 품목별 부과기준.csv";
const outputFile = "data/regions/서울특별시_송파구.json";
const fullSourcePath = path.join(process.cwd(), sourceFile);
const fullOutputPath = path.join(process.cwd(), outputFile);

// State machine grounded CSV parser to handle multi-line quotes
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let insideQuote = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentVal += '"';
          i++; 
        } else {
          // End of quote
          insideQuote = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = "";
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
        currentRow = [];
        currentVal = "";
        if (char === '\r') i++;
      } else if (char === '\r') {
         // CR only
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
        currentRow = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }
  return rows;
}

try {
  const buffer = fs.readFileSync(fullSourcePath);
  const decoder = new TextDecoder("euc-kr");
  const content = decoder.decode(buffer);

  const rows = parseCSV(content);
  
  // Find header row index
  const headerRowIdx = rows.findIndex(row => 
    row.some(col => col.replace(/\s/g, "").includes("품목") && col.replace(/\s/g, "").includes("부과금액")) ||
    (row[0] && row[0].includes("품목별") && row[3] && row[3].includes("부과금액")) ||
    row.join("").includes("품목별") // Fallback
  );
  
  if (headerRowIdx === -1) {
      console.log("First few rows for debugging:");
      rows.slice(0, 5).forEach((r, i) => console.log(`Row ${i}:`, r));
      throw new Error("Could not find header row");
  }

  const dataRows = rows.slice(headerRowIdx + 1);
  const records: any[] = [];
  
  // Need to handle merged cells (If '품목별' is empty, use previous value)
  let lastCategory = "기타";
  let lastName = "";

  for (const cols of dataRows) {
    // Expected structure based on head output:
    // 품목별, 세부품목별, 규격, 부과금액, ...
    
    // Skip empty lines
    if (cols.every(c => !c)) continue;
    if (cols.length < 4) continue;

    let category = cols[0];
    const name = cols[1];
    const spec = cols[2];
    const feeStr = cols[3];

    // Handle merge: if category is empty, inherit from last valid category
    if (!category) {
        category = lastCategory;
    }
    
    // Clean up category string (remove all spaces)
    category = category.replace(/\s+/g, "");
    lastCategory = category;

    // Handle merge: if name is empty but spec/fee exists, inherit from last valid name
    if (!name && (spec || feeStr)) {
         // name = lastName; // Actually, looking at the data, it seems better to keep it as is OR inherit.
         // In "TV", "42인치 이상", then "", "25인치 이상".
         // The second row is clearly "TV 25인치 이상".
         // Let's inherit name.
    } 
    
    // Clean up name (remove spaces inside, e.g. "가 스 레 인 지" -> "가스레인지")
    // But be careful not to merge words that should be separate?
    // Most items in this CSV seems to have spaced-out characters for justification.
    // "가   전" -> "가전". "내   장   고" -> "내장고".
    // "TV" -> "TV".
    // I will remove all spaces for name as well, as it seems to be the style of this specific CSV.
    
    let cleanName = name.replace(/\s+/g, "");
    
    if (!cleanName && (spec || feeStr)) {
        cleanName = lastName;
    }
    
    if (cleanName) {
        lastName = cleanName;
    }

    // Skip rows where name is effectively impossible to determine
    if (!cleanName) continue;
    
    // Clean fee string: remove commas, extract numbers
    // '7,000' -> '7000'
    // '면제' -> '0'
    let fee = "0";
    if (feeStr) {
        if (feeStr.includes("면제")) {
            fee = "0";
        } else {
            fee = feeStr.replace(/,/g, "").replace(/[^0-9]/g, "");
            if (!fee) fee = "0";
        }
    }

    const record = {
      "시도명": "서울특별시",
      "시군구명": "송파구",
      "대형폐기물명": cleanName,
      "대형폐기물구분명": category,
      "대형폐기물규격": spec || "모든규격",
      "수수료": fee,
      "데이터기준일자": "2024-01-01" // Defaulting as date is not in CSV
    };
    records.push(record);
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
