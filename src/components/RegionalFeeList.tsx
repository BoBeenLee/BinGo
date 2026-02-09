"use client";

import { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function RegionalFeeList() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>("");
  const [selectedSigungu, setSelectedSigungu] = useState<string>("");
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const fetchFees = async () => {
    if (!selectedSido || !selectedSigungu) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/fees?sido=${encodeURIComponent(selectedSido)}&sigungu=${encodeURIComponent(selectedSigungu)}`);
      const data = await res.json();
      setFees(data);
    } catch (error) {
      console.error("Error fetching fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSido && selectedSigungu) {
      fetchFees();
    } else {
        setFees([]);
    }
  }, [selectedSido, selectedSigungu]);

  const filteredFees = fees.filter(item => 
    item.대형폐기물명.includes(searchTerm) || 
    item.대형폐기물구분명.includes(searchTerm)
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
           <MapPin className="w-6 h-6 text-blue-500" />
           지역별 수수료 확인하기
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시/도</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={selectedSido}
              onChange={(e) => {
                setSelectedSido(e.target.value);
                setSelectedSigungu("");
              }}
            >
              <option value="">선택하세요</option>
              {uniqueSidos.map((sido) => (
                <option key={sido} value={sido}>{sido}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시/군/구</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
              value={selectedSigungu}
              onChange={(e) => setSelectedSigungu(e.target.value)}
              disabled={!selectedSido}
            >
              <option value="">선택하세요</option>
              {availableSigungus.map((sigungu) => (
                <option key={sigungu} value={sigungu}>{sigungu}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {fees.length > 0 && (
         <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-lg font-bold">
                    {selectedSido} {selectedSigungu} 수수료 목록
                </h3>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="품목 검색..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">품목</th>
                            <th className="p-4 font-semibold text-gray-600">규격</th>
                            <th className="p-4 font-semibold text-gray-600">가격</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredFees.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium">{item.대형폐기물명}</td>
                                <td className="p-4 text-gray-600 text-sm">{item.대형폐기물규격}</td>
                                <td className="p-4 text-blue-600 font-bold whitespace-nowrap">
                                    {parseInt(item.수수료).toLocaleString()}원
                                </td>
                            </tr>
                        ))}
                        {filteredFees.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-500">
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>
      )}

      {loading && (
          <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">데이터를 불러오는 중입니다...</p>
          </div>
      )}
    </div>
  );
}
