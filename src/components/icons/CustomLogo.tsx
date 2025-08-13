import React from "react";

interface CustomLogoProps {
  className?: string;
  size?: number;
}

const CustomLogo: React.FC<CustomLogoProps> = ({ className = "", size = 80 }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="drop-shadow-2xl"
      >
        <defs>
          {/* Gradients for AI Robot */}
          <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          
          {/* Gradient for lightbulb */}
          <linearGradient id="lightbulbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          
          {/* Glow effect */}
          <filter id="aiGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Circuit pattern */}
          <pattern id="circuitPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M5,5 L15,5 M5,15 L15,15 M5,5 L5,15 M15,5 L15,15" 
                  stroke="#3B82F6" strokeWidth="0.5" opacity="0.3"/>
            <circle cx="5" cy="5" r="1" fill="#3B82F6" opacity="0.5"/>
            <circle cx="15" cy="15" r="1" fill="#3B82F6" opacity="0.5"/>
          </pattern>
        </defs>
        
        {/* Circuit background ring */}
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke="url(#circuitPattern)"
          strokeWidth="8"
          opacity="0.4"
          className="animate-spin"
          style={{ 
            animation: "spin 20s linear infinite",
            transformOrigin: "center"
          }}
        />
        
        {/* AI Robot Head */}
        <g transform="translate(60, 60)" filter="url(#aiGlow)">
          {/* Robot head (rounded rectangle) */}
          <rect
            x="-18"
            y="-25"
            width="36"
            height="32"
            rx="6"
            ry="6"
            fill="url(#robotGradient)"
            stroke="#1E40AF"
            strokeWidth="2"
          />
          
          {/* Robot antenna */}
          <line x1="0" y1="-25" x2="0" y2="-35" stroke="#3B82F6" strokeWidth="2"/>
          <circle cx="0" cy="-35" r="2" fill="#F59E0B" className="animate-pulse"/>
          
          {/* Robot eyes (glowing) */}
          <circle cx="-8" cy="-15" r="4" fill="#06D6A0" className="animate-pulse"/>
          <circle cx="8" cy="-15" r="4" fill="#06D6A0" className="animate-pulse"/>
          <circle cx="-8" cy="-15" r="2" fill="#FFFFFF"/>
          <circle cx="8" cy="-15" r="2" fill="#FFFFFF"/>
          
          {/* Robot mouth (LED display style) */}
          <rect x="-10" y="-5" width="20" height="4" rx="2" fill="#1E40AF" opacity="0.8"/>
          <rect x="-8" y="-4" width="4" height="2" fill="#06D6A0"/>
          <rect x="-2" y="-4" width="4" height="2" fill="#06D6A0"/>
          <rect x="4" y="-4" width="4" height="2" fill="#06D6A0"/>
        </g>
        
        {/* Lightbulb - Idea symbol */}
        <g transform="translate(60, 30)">
          {/* Lightbulb outline */}
          <path
            d="M-8,-20 C-8,-28 -4,-32 0,-32 C4,-32 8,-28 8,-20 C8,-15 6,-12 4,-10 L-4,-10 C-6,-12 -8,-15 -8,-20 Z"
            fill="url(#lightbulbGradient)"
            stroke="#F59E0B"
            strokeWidth="1.5"
            className="animate-pulse"
            opacity="0.9"
          />
          
          {/* Lightbulb base/screw */}
          <rect x="-4" y="-10" width="8" height="6" fill="#9CA3AF" rx="1"/>
          <line x1="-4" y1="-8" x2="4" y2="-8" stroke="#6B7280" strokeWidth="0.5"/>
          <line x1="-4" y1="-6" x2="4" y2="-6" stroke="#6B7280" strokeWidth="0.5"/>
          
          {/* Lightbulb filament */}
          <path d="M-4,-28 Q0,-24 4,-28 M-4,-24 Q0,-20 4,-24" 
                stroke="#F97316" strokeWidth="1" opacity="0.8"/>
          
          {/* Light rays */}
          <g className="animate-pulse">
            <line x1="-12" y1="-20" x2="-15" y2="-20" stroke="#FCD34D" strokeWidth="2" opacity="0.7"/>
            <line x1="12" y1="-20" x2="15" y2="-20" stroke="#FCD34D" strokeWidth="2" opacity="0.7"/>
            <line x1="-10" y1="-28" x2="-12" y2="-30" stroke="#FCD34D" strokeWidth="2" opacity="0.7"/>
            <line x1="10" y1="-28" x2="12" y2="-30" stroke="#FCD34D" strokeWidth="2" opacity="0.7"/>
            <line x1="-10" y1="-12" x2="-12" y2="-10" stroke="#FCD34D" strokeWidth="2" opacity="0.7"/>
            <line x1="10" y1="-12" x2="12" y2="-10" stroke="#FCD34D" strokeWidth="2" opacity="0.7"/>
          </g>
        </g>
        
        {/* Data/Neural network nodes */}
        <g className="animate-pulse" opacity="0.6">
          <circle cx="25" cy="35" r="2" fill="#10B981"/>
          <circle cx="95" cy="45" r="2" fill="#8B5CF6"/>
          <circle cx="20" cy="85" r="2" fill="#06B6D4"/>
          <circle cx="100" cy="80" r="2" fill="#F59E0B"/>
          
          {/* Connecting lines (neural network style) */}
          <line x1="25" y1="35" x2="60" y2="50" stroke="#10B981" strokeWidth="1" opacity="0.3"/>
          <line x1="95" y1="45" x2="60" y2="55" stroke="#8B5CF6" strokeWidth="1" opacity="0.3"/>
          <line x1="20" y1="85" x2="60" y2="70" stroke="#06B6D4" strokeWidth="1" opacity="0.3"/>
          <line x1="100" y1="80" x2="60" y2="65" stroke="#F59E0B" strokeWidth="1" opacity="0.3"/>
        </g>
        
        {/* Orbiting data points */}
        <g>
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 60 60"
            to="360 60 60"
            dur="12s"
            repeatCount="indefinite"
          />
          <circle cx="90" cy="60" r="1.5" fill="#3B82F6" opacity="0.8"/>
          <circle cx="30" cy="60" r="1.5" fill="#10B981" opacity="0.8"/>
          <circle cx="60" cy="30" r="1.5" fill="#F59E0B" opacity="0.8"/>
          <circle cx="60" cy="90" r="1.5" fill="#8B5CF6" opacity="0.8"/>
        </g>
      </svg>
      
      {/* Enhanced pulsing glow */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 animate-pulse"
        style={{ filter: "blur(15px)" }}
      />
    </div>
  );
};

export default CustomLogo;
