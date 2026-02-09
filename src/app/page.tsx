"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { AnalysisResult, type AnalysisResultData } from "@/components/AnalysisResult";

export default function Home() {
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append("image", file);

      // Call the API
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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {!result && (
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-green-600">BinGo</h1>
            <p className="text-xl text-gray-600">
              AI 재활용 도우미
            </p>
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
    </main>
  );
}
