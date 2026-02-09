import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchFees } from "@/lib/fee-data";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const prompt = `
      이 사진의 물건을 분석해서 다음 JSON 형식으로 응답해줘. 한국어로 작성해줘.
      
      {
        "itemName": "물건 이름 (예: 침대, 의자, 냉장고, 플라스틱 병)",
        "recyclable": true/false (재활용 분리수거함에 배출 가능하면 true, 대형폐기물 스티커 부착 필요하면 false),
        "category": "물건 카테고리 (예: 가구, 가전, 플라스틱, 캔, 유리 등)",
        "instructions": ["배출 방법 1", "배출 방법 2"],
        "reason": "판단 이유 및 추가 설명"
      }

      유의사항:
      - 대형폐기물(가구, 이불, 가방, 큰 가전 등)은 recyclable: false 로 설정.
      - itemName은 명확한 명사형으로 작성 (예: "플라스틱 의자" -> "의자").
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    let jsonResponse;
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
        try {
            jsonResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini response:", text);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }
    } else {
         try {
            jsonResponse = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini response (raw):", text);
             return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }
    }

    // Fee lookup if applicable
    if (jsonResponse && !jsonResponse.recyclable) {
        // Try searching by itemName first
        let feeInfo = searchFees(jsonResponse.itemName);
        
        // If no result and category is available, try searching combinatorially or just fallback?
        // For now, let's keep it simple. If itemName includes adjectives, searchFees handles exact substring match.
        // We might want to remove "플라스틱" from "플라스틱 의자" if "의자" is the key.
        // But searchFees does "itemName.includes(keyword) || keyword.includes(itemName)".
        
        if (feeInfo) {
            jsonResponse.feeRange = {
                min: feeInfo.min,
                max: feeInfo.max,
                avg: feeInfo.avg
            };
        }
    }

    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
