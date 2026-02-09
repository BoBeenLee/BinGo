import fs from "fs";
import path from "path";

interface FeeRecord {
  시도명: string;
  시군구명: string;
  대형폐기물명: string;
  대형폐기물구분명: string;
  대형폐기물규격: string;
  수수료: string;
}

interface FeeData {
  records: FeeRecord[];
}

// ... (imports remain same)

// ... (FeeRecord and FeeData interfaces remain same)

// Cache of all loaded records
let cachedRecords: FeeRecord[] | null = null;
let cachedRegions: { sido: string; sigungu: string }[] | null = null;

function loadAllData(): FeeRecord[] {
  if (cachedRecords) return cachedRecords;

  const records: FeeRecord[] = [];
  const regionsDir = path.join(process.cwd(), "data", "regions");

  try {
    if (fs.existsSync(regionsDir)) {
      // Load from split files
      const files = fs.readdirSync(regionsDir).filter(file => file.endsWith(".json"));
      
      for (const file of files) {
        const filePath = path.join(regionsDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content) as FeeData;
        if (data.records) {
          records.push(...data.records);
        }
      }
    } else {
      // Fallback to single file
      const filePath = path.join(process.cwd(), "data", "nationwide_bulky_waste_fee_standard_data.json");
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(fileContent) as FeeData;
        if (data.records) {
            records.push(...data.records);
        }
      }
    }
    
    cachedRecords = records;
    return records;
  } catch (error) {
    console.error("Failed to load fee data:", error);
    return [];
  }
}

export function getAvailableRegions() {
  if (cachedRegions) return cachedRegions;

  const records = loadAllData();
  const regions = new Set<string>();
  const result: { sido: string; sigungu: string }[] = [];

  records.forEach((record) => {
    const key = `${record.시도명}|${record.시군구명}`;
    if (!regions.has(key)) {
      regions.add(key);
      result.push({
        sido: record.시도명,
        sigungu: record.시군구명,
      });
    }
  });

  // Sort by Sido then Sigungu
  result.sort((a, b) => {
    if (a.sido !== b.sido) return a.sido.localeCompare(b.sido);
    return a.sigungu.localeCompare(b.sigungu);
  });

  cachedRegions = result;
  return result;
}

export function getFeesByRegion(sido: string, sigungu: string) {
  const records = loadAllData();
  return records.filter(
    (record) => record.시도명 === sido && record.시군구명 === sigungu
  );
}

export function searchFees(keyword: string) {
    // ... (existing implementation)
    const records = loadAllData();
  
  // Clean up keyword (remove spaces, special chars for better matching)
  const normalizedKeyword = keyword.replace(/\s+/g, "");

  const matches = records.filter((record) => {
    const itemName = record.대형폐기물명.replace(/\s+/g, "");
    return itemName.includes(normalizedKeyword) || normalizedKeyword.includes(itemName);
  });

  if (matches.length === 0) {
    return null;
  }

  const fees = matches
    .map((r) => parseInt(r.수수료, 10))
    .filter((f) => !isNaN(f));

  if (fees.length === 0) {
    return null;
  }

  const min = Math.min(...fees);
  const max = Math.max(...fees);
  const avg = Math.round(fees.reduce((a, b) => a + b, 0) / fees.length);

  return {
    min,
    max,
    avg,
    count: matches.length,
    example: matches[0],
  };
}
