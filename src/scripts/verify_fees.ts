import { searchFees } from "../lib/fee-data";

const testItems = [
  "침대",
  "의자",
  "냉장고",
  "책상",
  "장롱",
  "소파",
  "없는물건123"
];

console.log("Starting fee verification...");

testItems.forEach(item => {
  console.log(`\nSearching for: ${item}`);
  const result = searchFees(item);
  
  if (result) {
    console.log(`Found ${result.count} records`);
    console.log(`Min: ${result.min}, Max: ${result.max}, Avg: ${result.avg}`);
    console.log(`Example: ${JSON.stringify(result.example, null, 2)}`);
  } else {
    console.log("No records found.");
  }
});

console.log("\nVerification complete.");
