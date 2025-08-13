import { ChevronDown } from "lucide-react";

import { MODEL_OPTIONS } from "../constants/models";
import CustomLogo from "./icons/CustomLogo";
import ModelDownloadInfo from "./ModelDownloadInfo";

import { useEffect, useRef, useState } from "react";

export const LoadingScreen = ({
  isLoading,
  progress,
  error,
  loadSelectedModel,
  selectedModelId,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  handleModelSelect,
}: {
  isLoading: boolean;
  progress: number;
  error: string | null;
  loadSelectedModel: () => void;
  selectedModelId: string;
  isModelDropdownOpen: boolean;
  setIsModelDropdownOpen: (isOpen: boolean) => void;
  handleModelSelect: (modelId: string) => void;
}) => {
  const model = MODEL_OPTIONS.find((opt) => opt.id === selectedModelId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showDownloadInfo, setShowDownloadInfo] = useState(false);
  
  // Check if model is already cached
  const isModelCached = (modelId: string): boolean => {
    try {
      const cacheKey = `onnx-community/LFM2-${modelId}-ONNX`;
      // This is a simplified check - in reality, you'd check IndexedDB or cache API
      return localStorage.getItem(`model_cached_${cacheKey}`) === 'true';
    } catch {
      return false;
    }
  };

  // Background Animation Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let dots: {
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
      blur: number;
    }[] = [];

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = [];
      const numDots = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < numDots; ++i) {
        dots.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.5 + 0.1,
          opacity: Math.random() * 0.5 + 0.2,
          blur: Math.random() > 0.7 ? Math.random() * 2 + 1 : 0,
        });
      }
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        // Update dot position
        dot.y += dot.speed;
        if (dot.y > canvas.height) {
          dot.y = 0 - dot.radius;
          dot.x = Math.random() * canvas.width;
        }

        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
        if (dot.blur > 0) {
          ctx.filter = `blur(${dot.blur}px)`;
        }
        ctx.fill();
        ctx.filter = "none"; // Reset filter
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      setup();
      draw();
    };

    setup();
    draw();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4 overflow-hidden">
      {/* Background Canvas for Animation */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      {/* Vignette Overlay */}
      <div className="absolute top-0 left-0 w-full h-full z-10 bg-[radial-gradient(ellipse_at_center,_rgba(17,24,39,0)_30%,_#111827_95%)]"></div>

      {/* Main Content */}
      <div className="relative z-20 max-w-2xl w-full flex flex-col items-center">
        <div className="flex items-center justify-center mb-8">
          <CustomLogo size={120} className="animate-pulse hover:scale-110 transition-transform duration-300" />
        </div>

        <div className="w-full text-center mb-6">
          <h1 className="text-5xl font-bold mb-2 text-gray-100 tracking-tight">
            Idea Structuring AI
          </h1>
          <p className="text-md md:text-lg text-gray-400">
            A chatbot-based AI agent that helps users structure any idea by asking follow-up questions and iterating
          </p>
        </div>

        <div className="w-full text-left text-gray-300 space-y-4 mb-6 text-base max-w-xl">
          <p>
            This application guides you through exploring your idea's core concept, target audience, goals, challenges, and implementation details through natural conversation. Powered by LFM2, a new generation of hybrid models by{" "}
            <a
              href="https://www.liquid.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline font-medium"
            >
              Liquid AI
            </a>{" "}
            designed for edge AI and on-device deployment.
          </p>
          <p>
            Everything runs entirely in your browser with{" "}
            <a
              href="https://huggingface.co/docs/transformers.js"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline font-medium"
            >
              Transformers.js
            </a>{" "}
            and ONNX Runtime Web, ensuring your data remains private and secure. It can even run offline!
          </p>
        </div>

        <p className="text-gray-400 mb-6">
          Select a model and click load to get started.
        </p>

        <div className="relative">
          <div className="flex rounded-lg shadow-lg bg-indigo-600">
            <button
              onClick={isLoading ? undefined : () => setShowDownloadInfo(true)}
              disabled={isLoading}
              className={`flex items-center justify-center rounded-l-lg font-bold transition-all text-lg ${isLoading ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              <div className="px-6 py-3">
                {isLoading ? (
                  <div className="flex items-center">
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span className="ml-3">Loading... ({progress}%)</span>
                  </div>
                ) : (
                  `Load ${model?.label}`
                )}
              </div>
            </button>
            <button
              onClick={(e) => {
                if (!isLoading) {
                  e.stopPropagation();
                  setIsModelDropdownOpen(!isModelDropdownOpen);
                }
              }}
              aria-label="Select model"
              className="px-3 py-3 border-l border-indigo-800 hover:bg-indigo-700 transition-colors rounded-r-lg disabled:cursor-not-allowed disabled:bg-gray-700"
              disabled={isLoading}
            >
              <ChevronDown size={24} />
            </button>
          </div>

          {isModelDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 w-full overflow-hidden">
              {MODEL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleModelSelect(option.id)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${selectedModelId === option.id ? "bg-indigo-600 text-white" : "text-gray-200"}`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-400">{option.size}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700/60 rounded-lg p-4 mt-6 max-w-md text-center">
            <p className="text-sm text-red-200">Error: {error}</p>
            <button
              onClick={loadSelectedModel}
              className="mt-3 text-sm bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-md font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Click-away listener for dropdown */}
      {isModelDropdownOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsModelDropdownOpen(false)}
        />
      )}

      {/* Model Download Info Popup */}
      {showDownloadInfo && model && (
        <ModelDownloadInfo
          modelSize={model.size}
          isFirstTime={!isModelCached(selectedModelId)}
          onClose={() => setShowDownloadInfo(false)}
          onConfirm={() => {
            setShowDownloadInfo(false);
            // Mark model as cached when loading starts
            try {
              const cacheKey = `onnx-community/LFM2-${selectedModelId}-ONNX`;
              localStorage.setItem(`model_cached_${cacheKey}`, 'true');
            } catch {}
            loadSelectedModel();
          }}
        />
      )}
    </div>
  );
};
