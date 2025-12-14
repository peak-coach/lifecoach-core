'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '@/lib/pwa';

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      handleDismiss();
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // iOS specific instructions
  if (isIOS) {
    return (
      <>
        <AnimatePresence>
          {!dismissed && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-2xl bg-[#141414] border border-[#D94F3D]/30 shadow-2xl"
            >
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#D94F3D]/10">
                  <Download className="w-5 h-5 text-[#D94F3D]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Als App installieren</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Schnellerer Zugriff direkt vom Home Screen
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSInstructions(true)}
                className="w-full mt-3 py-2.5 rounded-xl bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors"
              >
                Anleitung zeigen
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* iOS Instructions Modal */}
        <AnimatePresence>
          {showIOSInstructions && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowIOSInstructions(false)}
                className="fixed inset-0 bg-black/60 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-50 p-6 rounded-2xl bg-[#141414] border border-[#2a2a2a]"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">App installieren (iOS)</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#D94F3D]/10 text-[#D94F3D] flex items-center justify-center text-sm font-medium">1</div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Tippe auf</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Share className="w-5 h-5 text-[#007AFF]" />
                        <span className="text-sm text-muted-foreground">Teilen</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#D94F3D]/10 text-[#D94F3D] flex items-center justify-center text-sm font-medium">2</div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Scrolle und wähle</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Plus className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Zum Home-Bildschirm</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#D94F3D]/10 text-[#D94F3D] flex items-center justify-center text-sm font-medium">3</div>
                    <p className="text-sm text-foreground">Tippe auf "Hinzufügen"</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowIOSInstructions(false);
                    handleDismiss();
                  }}
                  className="w-full mt-6 py-2.5 rounded-xl bg-[#1f1f1f] text-foreground text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                >
                  Verstanden
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Standard install prompt (Chrome, Edge, etc.)
  if (!canInstall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-2xl bg-[#141414] border border-[#D94F3D]/30 shadow-2xl"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#1f1f1f] text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#D94F3D]/10">
            <Download className="w-5 h-5 text-[#D94F3D]" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">Peak Coach installieren</p>
            <p className="text-xs text-muted-foreground mt-1">
              Schnellerer Zugriff, Offline-Support & mehr
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl bg-[#1f1f1f] text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
          >
            Später
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 rounded-xl bg-[#D94F3D] text-white text-sm font-medium hover:bg-[#c44535] transition-colors"
          >
            Installieren
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

