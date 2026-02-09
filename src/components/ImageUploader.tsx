"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onAnalyze: (file: File) => Promise<void>;
  isAnalyzing: boolean;
}

export function ImageUploader({ onAnalyze, isAnalyzing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onAnalyze(file);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
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
