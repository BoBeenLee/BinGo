"use client";

import { CheckCircle, AlertTriangle, XCircle, Info, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalysisResultData {
  itemName: string;
  recyclable: boolean;
  category?: string;
  instructions: string[];
  feeRange?: {
    min: number;
    max: number;
    avg: number;
  };
  reason?: string;
}

interface AnalysisResultProps {
  result: AnalysisResultData;
  onReset: () => void;
}

export function AnalysisResult({ result, onReset }: AnalysisResultProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={cn(
        "p-6 text-white text-center",
        result.recyclable ? "bg-green-500" : "bg-orange-500"
      )}>
        <div className="flex justify-center mb-4">
          {result.recyclable ? (
            <CheckCircle className="w-16 h-16" />
          ) : (
            <XCircle className="w-16 h-16" />
          )}
        </div>
        <h2 className="text-2xl font-bold mb-1">{result.itemName}</h2>
        <p className="text-lg opacity-90">
          {result.recyclable ? "재활용 가능" : "재활용 불가능 / 대형폐기물"}
        </p>
        {result.category && (
          <span className="inline-block mt-2 px-3 py-1 bg-black/20 rounded-full text-sm">
            {result.category}
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            배출 방법
          </h3>
          <ul className="space-y-2">
            {result.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {result.feeRange && (
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              대형폐기물 예상 수수료
            </h3>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">
                {result.feeRange.min.toLocaleString()} ~ {result.feeRange.max.toLocaleString()}원
                </span>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              평균: {result.feeRange.avg.toLocaleString()}원
            </p>
            <p className="text-xs text-orange-400 mt-2">
              * 전국 지자체 데이터 기반 추정치입니다. 실제 수수료는 거주지 조례에 따라 다를 수 있습니다.
            </p>
          </div>
        )}

        {result.reason && (
           <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
             <p className="font-semibold mb-1">참고:</p>
             {result.reason}
           </div>
        )}

        <button
          onClick={onReset}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
        >
          다른 물품 확인하기
        </button>
      </div>
    </div>
  );
}
