"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { AnalysisResult, type AnalysisResultData } from "@/components/AnalysisResult";
import { RegionalFeeList } from "@/components/RegionalFeeList";
import { List, Camera, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<"analysis" | "list">("analysis");

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error analyzing image:", error);
      alert("이미지 분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
       <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
           <div className="flex justify-center mb-4">
             <div className="p-4 bg-white rounded-2xl shadow-lg inline-block">
               <Recycle className="w-12 h-12 text-green-600" />
             </div>
           </div>
           <h1 className="text-4xl font-bold text-gray-900 mb-2">BinGo</h1>
           <p className="text-lg text-gray-600">AI 재활용 도우미</p>
        </div>

        <div className="flex justify-center mb-8">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
                <button 
                    onClick={() => setMode("analysis")}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                        mode === "analysis" 
                            ? "bg-gray-900 text-white shadow-md" 
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                >
                    <Camera className="w-4 h-4" />
                    AI 분석
                </button>
                <button 
                    onClick={() => setMode("list")}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                        mode === "list" 
                            ? "bg-gray-900 text-white shadow-md" 
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                >
                    <List className="w-4 h-4" />
                    수수료표
                </button>
            </div>
        </div>

        {mode === "analysis" ? (
           <div className="max-w-md mx-auto space-y-8">
             {!result && (
               <div className="text-center space-y-4 mb-4">
                 <p className="text-gray-500">
                   사진을 찍거나 업로드하여<br/> 올바른 분리수거 방법을 확인하세요.
                 </p>
               </div>
             )}
     
             {result ? (
               <AnalysisResult result={result} onReset={handleReset} />
             ) : (
               <ImageUploader onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
             )}
           </div>
        ) : (
            <RegionalFeeList />
        )}
      </div>
    </main>
  );
}
