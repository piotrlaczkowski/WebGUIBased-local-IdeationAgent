import React, { useState } from "react";
import { Info, X, Download, Check, Zap } from "lucide-react";

interface ModelDownloadInfoProps {
  modelSize: string;
  isFirstTime: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ModelDownloadInfo: React.FC<ModelDownloadInfoProps> = ({
  modelSize,
  isFirstTime,
  onClose,
  onConfirm
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-blue-500/20 rounded-full p-2 mr-3">
              {isFirstTime ? (
                <Download className="h-5 w-5 text-blue-400" />
              ) : (
                <Zap className="h-5 w-5 text-green-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {isFirstTime ? "Model Download" : "Model Ready"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-gray-300 space-y-3 mb-6">
          {isFirstTime ? (
            <>
              <div className="flex items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Info className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
                <p className="text-sm">
                  <strong>One-time download:</strong> The AI model ({modelSize}) will be downloaded and cached in your browser.
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-400 mr-2" />
                  <span>Runs entirely in your browser</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-400 mr-2" />
                  <span>No data sent to servers</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-400 mr-2" />
                  <span>Works offline after download</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-400 mr-2" />
                  <span>Cached for future sessions</span>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-sm text-yellow-200">
                  <strong>Note:</strong> Download may take a few minutes depending on your internet speed. You only need to do this once per model.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                <p className="text-sm">
                  <strong>Model cached:</strong> The AI model ({modelSize}) is already downloaded and will load instantly!
                </p>
              </div>
              
              <p className="text-sm text-gray-400">
                No download needed - the model will be loaded from your browser's cache.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            {isFirstTime ? "Download & Load" : "Load Model"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelDownloadInfo;
