"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onAnalyze: (file: File, sido?: string, sigungu?: string) => Promise<void>;
  isAnalyzing: boolean;
}

interface Region {
  sido: string;
  sigungu: string;
}

export function ImageUploader({ onAnalyze, isAnalyzing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Region state
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>("");
  const [selectedSigungu, setSelectedSigungu] = useState<string>("");

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data))
      .catch((err) => console.error(err));
    
    // Load from local storage
    const savedSido = localStorage.getItem("bingo-sido");
    const savedSigungu = localStorage.getItem("bingo-sigungu");
    if (savedSido) setSelectedSido(savedSido);
    if (savedSigungu) setSelectedSigungu(savedSigungu);
  }, []);

  // Save to local storage
  useEffect(() => {
      if (selectedSido) localStorage.setItem("bingo-sido", selectedSido);
      else localStorage.removeItem("bingo-sido");
      
      if (selectedSigungu) localStorage.setItem("bingo-sigungu", selectedSigungu);
      else localStorage.removeItem("bingo-sigungu");
  }, [selectedSido, selectedSigungu]);

  const uniqueSidos = Array.from(new Set(regions.map((r) => r.sido)));
  const availableSigungus = regions
    .filter((r) => r.sido === selectedSido)
    .map((r) => r.sigungu);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const clearImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeClick = () => {
    if (file) {
      onAnalyze(file, selectedSido, selectedSigungu);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Region Selection (Optional) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
            <MapPin className="w-4 h-4 text-blue-500" />
            지역 선택 (선택 시 수수료 자동 분석)
        </div>
        <div className="grid grid-cols-2 gap-2">
            <select 
                className="p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={selectedSido}
                onChange={(e) => {
                    setSelectedSido(e.target.value);
                    setSelectedSigungu("");
                }}
                disabled={isAnalyzing}
            >
                <option value="">시/도 선택</option>
                {uniqueSidos.map((sido) => (
                    <option key={sido} value={sido}>{sido}</option>
                ))}
            </select>
            <select 
                className="p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 disabled:opacity-50"
                value={selectedSigungu}
                onChange={(e) => setSelectedSigungu(e.target.value)}
                disabled={!selectedSido || isAnalyzing}
            >
                <option value="">시/군/구 선택</option>
                {availableSigungus.map((sigungu) => (
                    <option key={sigungu} value={sigungu}>{sigungu}</option>
                ))}
            </select>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        capture="environment"
      />

      {preview ? (
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Selected"
            className="w-full h-full object-cover"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            disabled={isAnalyzing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
            <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer aspect-square"
            >
            <Camera className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-500">사진 촬영</span>
            </button>
            <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer aspect-square"
            >
            <Upload className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-500">갤러리 선택</span>
            </button>
        </div>
      )}

      {preview && (
        <button
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing}
          className={cn(
            "w-full py-4 px-6 rounded-xl text-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
            isAnalyzing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              분석 중...
            </>
          ) : (
            "분석하기"
          )}
        </button>
      )}
    </div>
  );
}
