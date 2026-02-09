import { NextRequest, NextResponse } from "next/server";
import { getFeesByRegion } from "@/lib/fee-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sido = searchParams.get("sido");
    const sigungu = searchParams.get("sigungu");

    if (!sido || !sigungu) {
      return NextResponse.json(
        { error: "Missing sido or sigungu parameter" },
        { status: 400 }
      );
    }

    const fees = getFeesByRegion(sido, sigungu);
    return NextResponse.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
