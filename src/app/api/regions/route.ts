import { NextResponse } from "next/server";
import { getAvailableRegions } from "@/lib/fee-data";

export async function GET() {
  try {
    const regions = getAvailableRegions();
    return NextResponse.json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
