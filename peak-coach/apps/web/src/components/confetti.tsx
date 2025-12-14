'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

export function Confetti({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  const colors = ['#D94F3D', '#D9952A', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];

  useEffect(() => {
    if (trigger) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.3,
          rotation: Math.random() * 360,
        });
      }
      setPieces(newPieces);
      setShow(true);
      
      setTimeout(() => setShow(false), 2000);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ 
                y: -20, 
                x: `${piece.x}vw`,
                opacity: 1,
                rotate: 0,
                scale: 1
              }}
              animate={{ 
                y: '100vh',
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0],
                scale: [1, 1, 0.5]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2,
                delay: piece.delay,
                ease: 'easeOut'
              }}
              className="absolute w-3 h-3"
              style={{ 
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Celebration Toast Component
export function CelebrationToast({ 
  show, 
  message = "Gut gemacht! 🎉",
  onClose 
}: { 
  show: boolean; 
  message?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D94F3D] to-[#D9952A] text-white font-medium shadow-lg shadow-[#D94F3D]/20">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

