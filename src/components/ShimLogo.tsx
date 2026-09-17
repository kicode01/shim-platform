import React from 'react';

interface ShimLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function ShimLogo({ size = 24, className = '', ...props }: ShimLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`shim-logo ${className}`}
      {...props}
    >
      <path d="M15 5c-3-2-8-1-9 3-1 4 4 5 7 6 3 1 4 5 2 8-2 3-8 2-9-2" />
    </svg>
  );
}
