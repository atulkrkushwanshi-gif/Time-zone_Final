import React, { useState, useEffect } from 'react';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const GlobalRipple: React.FC = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const handleInteraction = (e: MouseEvent) => {
      // Create a ripple at the cursor position
      const newRipple = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now(),
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove the ripple from state after animation finishes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    };

    // Trigger on mousedown for immediate feedback
    window.addEventListener('mousedown', handleInteraction);

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-cred-accent animate-ripple pointer-events-none block"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            marginTop: '-10px',
            marginLeft: '-10px',
            boxShadow: '0 0 10px rgba(225, 255, 89, 0.6)',
          }}
        />
      ))}
    </div>
  );
};