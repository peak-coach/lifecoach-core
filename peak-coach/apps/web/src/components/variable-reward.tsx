'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { VariableReward, getRewardRarityColor } from '@/lib/rewards';

interface VariableRewardPopupProps {
  reward: VariableReward | null;
  show: boolean;
  onClose: () => void;
}

export function VariableRewardPopup({ reward, show, onClose }: VariableRewardPopupProps) {
  if (!reward) return null;

  const rarityColor = getRewardRarityColor(reward.rarity);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              transition: { type: 'spring', stiffness: 300, damping: 20 }
            }}
            exit={{ scale: 0, rotate: 10 }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${rarityColor} blur-3xl opacity-50 scale-150`} />
            
            {/* Card */}
            <div className={`relative bg-gradient-to-br ${rarityColor} rounded-3xl p-1`}>
              <div className="bg-[#0f0f1a] rounded-3xl p-8 text-center min-w-[300px]">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>

                {/* Sparkles animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="relative"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      ease: 'easeInOut'
                    }}
                    className="text-7xl mb-4"
                  >
                    {reward.emoji}
                  </motion.div>
                  
                  {/* Floating sparkles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        x: Math.cos(i * 60 * Math.PI / 180) * 60,
                        y: Math.sin(i * 60 * Math.PI / 180) * 60,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: i * 0.2,
                      }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Rarity label */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-gradient-to-r ${rarityColor} text-white`}
                >
                  {reward.rarity}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold mb-2"
                >
                  {reward.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/60 mb-6"
                >
                  {reward.description}
                </motion.p>

                {/* XP Bonus */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${rarityColor} text-white font-bold text-xl`}
                >
                  <Sparkles className="w-6 h-6" />
                  +{reward.xpBonus} XP
                </motion.div>

                {/* Claim button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                >
                  Einsammeln! 🎉
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Badge Display Component
interface BadgeCardProps {
  badge: {
    name: string;
    description: string;
    emoji: string;
    rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  };
  earned: boolean;
  progress?: number; // 0-100
}

export function BadgeCard({ badge, earned, progress }: BadgeCardProps) {
  const rarityColors = {
    bronze: 'from-amber-700 to-amber-500',
    silver: 'from-gray-400 to-gray-300',
    gold: 'from-yellow-500 to-amber-400',
    platinum: 'from-cyan-400 to-blue-400',
    diamond: 'from-purple-500 to-pink-500',
  };

  return (
    <motion.div
      whileHover={{ scale: earned ? 1.05 : 1 }}
      className={`relative p-4 rounded-xl border ${
        earned 
          ? `bg-gradient-to-br ${rarityColors[badge.rarity]} bg-opacity-20 border-white/20` 
          : 'bg-white/5 border-white/10 opacity-50'
      }`}
    >
      {!earned && progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-xl overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${rarityColors[badge.rarity]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <div className="text-center">
        <span className={`text-3xl ${!earned && 'grayscale'}`}>{badge.emoji}</span>
        <h3 className="font-medium text-sm mt-2">{badge.name}</h3>
        <p className="text-xs text-white/60 mt-1">{badge.description}</p>
        {!earned && progress !== undefined && (
          <p className="text-xs text-white/40 mt-2">{Math.round(progress)}%</p>
        )}
      </div>
    </motion.div>
  );
}

