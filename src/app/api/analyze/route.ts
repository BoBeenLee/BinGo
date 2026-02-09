import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchFees, getFeesByRegion, searchFeesInRegion } from "@/lib/fee-data";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const sido = formData.get("sido") as string;
    const sigungu = formData.get("sigungu") as string;

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
    
    // Prepare Region Context
    let feeContext = "";
    if (sido && sigungu) {
        const regionFees = getFeesByRegion(sido, sigungu);
        if (regionFees.length > 0) {
            const feeList = regionFees.map(f => `- ${f.대형폐기물명} (${f.대형폐기물규격}): ${f.수수료}원`).join("\n");
            feeContext = `
            다음은 사용자가 선택한 지역(${sido} ${sigungu})의 대형폐기물 수수료 목록입니다:
            ${feeList}
            
            위 목록을 참고하여 사진의 물건과 가장 일치하는 항목을 찾아주세요.
            `;
        }
    }

    const prompt = `
      이 사진의 물건을 분석해서 다음 JSON 형식으로 응답해줘. 한국어로 작성해줘.
      
      {
        "wasteType": "recyclable" | "general" | "bulky" (recyclable: 분리수거 가능, general: 종량제 봉투 배출, bulky: 대형폐기물 스티커 필요),
        "itemName": "물건 이름 (예: 침대, 의자, 냉장고, 플라스틱 병)",
        "recyclable": true/false (wasteType이 'recyclable'이면 true, 아니면 false),
        "category": "물건 카테고리 (가구, 가전, 플라스틱, 캔, 유리 등. 대형폐기물인 경우 특히 중요)",
        "instructions": ["배출 방법 1", "배출 방법 2"],
        "reason": "판단 이유 및 추가 설명",
        "estimatedFee": { 
            "amount": number (수수료 목록에서 찾은 금액 또는 목록 내 유사 품목의 금액. 없으면 null),
            "matchedItem": "수수료 목록에서 찾은 품목명 (유사 품목인 경우 해당 품목명 기재)"
        }
      }

      유의사항:
      - 대형폐기물(가구, 이불, 가방, 큰 가전 등)은 wasteType: "bulky", recyclable: false 로 설정.
      - 재활용이 불가능하지만 종량제 봉투에 버릴 수 있는 작은 일반 쓰레기(오염된 종이, 작은 플라스틱 조각 등)는 wasteType: "general", recyclable: false 로 설정.
      - 재활용 분리수거함에 배출 가능한 깨끗한 품목은 wasteType: "recyclable", recyclable: true 로 설정.
      - itemName은 명확한 명사형으로 작성 (예: "플라스틱 의자" -> "의자").
      - itemName에 불필요한 수식어구 제외.
      - estimatedFee는 제공된 수수료 목록에서 우선적으로 찾되, 목록에 정확한 매칭이 없다면 제공된 목록 중 가장 유사한 품목의 수수료를 참고하여 입력해주세요. (일반 지식 기반 추정 지양)
      
      ${feeContext}
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

    // Post-processing for fees
    // Only search fees if it is explicitly bulky waste or strictly not recyclable (fallback)
    const isBulky = jsonResponse && (jsonResponse.wasteType === "bulky" || (!jsonResponse.wasteType && !jsonResponse.recyclable));
    
    if (isBulky) {
        // 1. Nationwide estimate (always provided as fallback/baseline)
        const nationwideFee = searchFees(jsonResponse.itemName);
        if (nationwideFee) {
            jsonResponse.feeRange = {
                min: nationwideFee.min,
                max: nationwideFee.max,
                avg: nationwideFee.avg
            };
        }

        // 2. Region specific processing
        if (sido && sigungu) {
             // A. AI Estimated Match (Single Best Guess)
             if (jsonResponse.estimatedFee && jsonResponse.estimatedFee.amount) {
                 jsonResponse.aiFee = {
                     대형폐기물명: jsonResponse.estimatedFee.matchedItem,
                     대형폐기물규격: "AI 매칭 결과",
                     수수료: String(jsonResponse.estimatedFee.amount),
                     대형폐기물구분명: jsonResponse.category || "AI 자동분류"
                 };
             }

             // B. JSON Search Results (List)
             const specificFees = searchFeesInRegion(
                 jsonResponse.itemName, 
                 jsonResponse.category || "", 
                 sido, 
                 sigungu
             );
             
             // Always return this list if region is selected
             jsonResponse.regionFees = {
                 sido,
                 sigungu,
                 fees: specificFees
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
