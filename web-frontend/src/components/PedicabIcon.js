import React from 'react';

const PedicabIcon = ({ size = 40, color = "#ff8c42" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rear Wheel */}
      <circle cx="30" cy="85" r="18" fill="none" stroke={color} strokeWidth="3"/>
      <circle cx="30" cy="85" r="3" fill={color}/>
      {/* Spokes */}
      <line x1="30" y1="67" x2="30" y2="103" stroke={color} strokeWidth="1.5"/>
      <line x1="12" y1="85" x2="48" y2="85" stroke={color} strokeWidth="1.5"/>
      
      {/* Front Wheel */}
      <circle cx="90" cy="85" r="18" fill="none" stroke={color} strokeWidth="3"/>
      <circle cx="90" cy="85" r="3" fill={color}/>
      {/* Spokes */}
      <line x1="90" y1="67" x2="90" y2="103" stroke={color} strokeWidth="1.5"/>
      <line x1="72" y1="85" x2="108" y2="85" stroke={color} strokeWidth="1.5"/>
      
      {/* Frame */}
      <path d="M 30 85 L 60 45 L 90 85" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 60 45 L 60 30" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <path d="M 30 85 L 60 65" stroke={color} strokeWidth="2.5"/>
      
      {/* Seat */}
      <ellipse cx="60" cy="65" rx="8" ry="4" fill={color}/>
      
      {/* Handlebars */}
      <path d="M 60 30 Q 70 25 75 30" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      
      {/* Canopy/Roof */}
      <path d="M 20 40 Q 60 25 100 40" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="30" y1="45" x2="25" y2="40" stroke={color} strokeWidth="2"/>
      <line x1="90" y1="45" x2="95" y2="40" stroke={color} strokeWidth="2"/>
    </svg>
  );
};

export default PedicabIcon;
