"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, Coins, MapPin } from "lucide-react";
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

interface Region {
  sido: string;
  sigungu: string;
}

interface FeeItem {
  대형폐기물명: string;
  대형폐기물규격: string;
  수수료: string;
  대형폐기물구분명: string;
}

export function AnalysisResult({ result, onReset }: AnalysisResultProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>("");
  const [selectedSigungu, setSelectedSigungu] = useState<string>("");
  const [specificFees, setSpecificFees] = useState<FeeItem[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data))
      .catch((err) => console.error(err));
  }, []);

  const uniqueSidos = Array.from(new Set(regions.map((r) => r.sido)));
  const availableSigungus = regions
    .filter((r) => r.sido === selectedSido)
    .map((r) => r.sigungu);

  useEffect(() => {
    const fetchSpecificFees = async () => {
      if (!selectedSido || !selectedSigungu) {
        setSpecificFees([]);
        return;
      }
      
      setLoadingFees(true);
      try {
        const res = await fetch(`/api/fees?sido=${encodeURIComponent(selectedSido)}&sigungu=${encodeURIComponent(selectedSigungu)}`);
        const data: FeeItem[] = await res.json();
        
        // Filter fees based on itemName or category
        // First try to find items that include the itemName
        let filtered = data.filter(item => 
          item.대형폐기물명.includes(result.itemName) || 
          result.itemName.includes(item.대형폐기물명) // In case result is "Plastic Chair" and fee item is "Chair"
        );

        // If no direct matches, try matching by category if available
        if (filtered.length === 0 && result.category) {
           filtered = data.filter(item => 
             item.대형폐기물구분명.includes(result.category!) ||
             (result.category!.includes("가구") && item.대형폐기물구분명.includes("가구")) ||
             (result.category!.includes("가전") && item.대형폐기물구분명.includes("가전"))
           );
           
           // If still too many results (e.g. all furniture), maybe limit or show a message?
           // For now, let's show them but limit to top 5-10 to avoid huge lists
        }

        setSpecificFees(filtered);
      } catch (error) {
        console.error("Error fetching specific fees:", error);
      } finally {
        setLoadingFees(false);
      }
    };

    fetchSpecificFees();
  }, [selectedSido, selectedSigungu, result.itemName, result.category]);


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

        {!result.recyclable && (
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-orange-800 font-semibold">
              <Coins className="w-5 h-5" />
              <h3>대형폐기물 수수료 확인</h3>
            </div>
            
            {/* Generic Estimate */}
            {result.feeRange && (
              <div className="mb-2">
                <p className="text-xs text-orange-600 mb-1">전국 평균 추정치</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-orange-600">
                    {result.feeRange.min.toLocaleString()} ~ {result.feeRange.max.toLocaleString()}원
                    </span>
                </div>
              </div>
            )}

            {/* Region Selector */}
            <div className="border-t border-orange-200 pt-3">
                <p className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3"/> 내 지역 정확한 수수료 찾기
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <select 
                        className="p-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                        value={selectedSido}
                        onChange={(e) => {
                            setSelectedSido(e.target.value);
                            setSelectedSigungu("");
                        }}
                    >
                        <option value="">시/도 선택</option>
                        {uniqueSidos.map((sido) => (
                            <option key={sido} value={sido}>{sido}</option>
                        ))}
                    </select>
                    <select 
                        className="p-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white disabled:opacity-50"
                        value={selectedSigungu}
                        onChange={(e) => setSelectedSigungu(e.target.value)}
                        disabled={!selectedSido}
                    >
                        <option value="">시/군/구 선택</option>
                        {availableSigungus.map((sigungu) => (
                            <option key={sigungu} value={sigungu}>{sigungu}</option>
                        ))}
                    </select>
                </div>

                {loadingFees && (
                     <div className="text-center py-2 text-sm text-orange-500">조회중...</div>
                )}

                {!loadingFees && selectedSido && selectedSigungu && (
                    <div className="bg-white rounded-lg border border-orange-100 overflow-hidden max-h-60 overflow-y-auto">
                        {specificFees.length > 0 ? (
                            <div className="divide-y divide-orange-50">
                                {specificFees.map((fee, idx) => (
                                    <div key={idx} className="p-3 text-sm flex justify-between items-center hover:bg-orange-50/50">
                                        <div className="pr-4">
                                            <p className="font-medium text-gray-800">{fee.대형폐기물명}</p>
                                            <p className="text-xs text-gray-500">{fee.대형폐기물규격}</p>
                                        </div>
                                        <span className="font-bold text-orange-600 whitespace-nowrap">
                                            {parseInt(fee.수수료).toLocaleString()}원
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-sm text-gray-500">
                                <p className="mb-1">해당 지역의 수수료 데이터에서<br/> '{result.itemName}' 관련 항목을<br/> 찾지 못했습니다.</p>
                                <p className="text-xs text-gray-400">(카테고리: {result.category || "미지정"})</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
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
