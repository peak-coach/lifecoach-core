'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  BellRing,
  Palette,
  Shield,
  Smartphone,
  Globe,
  ChevronRight,
  LogOut,
  Trash2,
  Mail,
  Clock,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { 
  getNotificationPermission, 
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush
} from '@/lib/notifications';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState({
    morningCheckin: true,
    eveningReview: true,
    taskReminders: true,
    habitReminders: true,
    weeklyReport: true,
    coachMessages: true,
  });

  // Push Notification State
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);

  // Telegram Linking State
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [loadingTelegramStatus, setLoadingTelegramStatus] = useState(true);

  const supabase = createClient();

  // Check Telegram linking status on mount
  useEffect(() => {
    checkTelegramStatus();
    checkPushPermission();
  }, [user]);

  const checkPushPermission = async () => {
    const permission = getNotificationPermission();
    setPushPermission(permission);
    setPushEnabled(permission === 'granted');
  };

  const enablePushNotifications = async () => {
    if (!user) return;
    
    setEnablingPush(true);
    try {
      // Register service worker first
      await registerServiceWorker();
      
      // Request permission
      const permission = await requestNotificationPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        // Subscribe to push
        const success = await subscribeToPush(user.id);
        setPushEnabled(success);
      }
    } catch (error) {
      console.error('Error enabling push:', error);
    } finally {
      setEnablingPush(false);
    }
  };

  const checkTelegramStatus = async () => {
    if (!user) return;
    
    setLoadingTelegramStatus(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('telegram_id, linking_code, linking_code_expires_at')
        .eq('id', user.id)
        .single();

      if (data) {
        setTelegramLinked(!!data.telegram_id);
        setTelegramId(data.telegram_id);
        
        if (data.linking_code && data.linking_code_expires_at) {
          const expiry = new Date(data.linking_code_expires_at);
          if (expiry > new Date()) {
            setLinkingCode(data.linking_code);
            setCodeExpiry(expiry);
          }
        }
      }
    } catch (error) {
      console.error('Error checking telegram status:', error);
    } finally {
      setLoadingTelegramStatus(false);
    }
  };

  const generateLinkingCode = async () => {
    if (!user) return;
    
    setGeneratingCode(true);
    try {
      const { data, error } = await supabase.rpc('generate_linking_code', {
        p_user_id: user.id
      });

      if (error) throw error;

      // Refetch to get the new code
      const { data: userData } = await supabase
        .from('users')
        .select('linking_code, linking_code_expires_at')
        .eq('id', user.id)
        .single();

      if (userData) {
        setLinkingCode(userData.linking_code);
        setCodeExpiry(new Date(userData.linking_code_expires_at));
      }
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyCode = () => {
    if (linkingCode) {
      navigator.clipboard.writeText(linkingCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const unlinkTelegram = async () => {
    if (!user || !confirm('Möchtest du die Telegram-Verknüpfung wirklich aufheben?')) return;

    try {
      await supabase
        .from('users')
        .update({ telegram_id: null })
        .eq('id', user.id);
      
      setTelegramLinked(false);
      setTelegramId(null);
    } catch (error) {
      console.error('Error unlinking telegram:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'keine E-Mail';

  return (
    <div className="min-h-screen">
      <div className="px-8 py-10 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">⚙️ Einstellungen</h1>
          <p className="text-muted-foreground mt-1">Verwalte dein Konto und Präferenzen</p>
        </div>

        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Profil
          </h2>
          <div className="p-6 rounded-xl bg-[#141414] border border-[#1f1f1f]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D94F3D] to-[#D9952A] flex items-center justify-center text-2xl font-bold text-white">
                {userName[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{userName}</h3>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                <p className="text-xs text-[#D9952A] mt-1">Peak Performance Member</p>
              </div>
              <button className="ml-auto px-4 py-2 rounded-lg bg-[#1f1f1f] text-sm text-foreground hover:bg-[#2a2a2a] transition-colors">
                Bearbeiten
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-t border-[#1f1f1f]">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">E-Mail</span>
                </div>
                <span className="text-sm text-muted-foreground">{userEmail}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-[#1f1f1f]">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Sprache</span>
                </div>
                <span className="text-sm text-muted-foreground">Deutsch</span>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-[#1f1f1f]">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Zeitzone</span>
                </div>
                <span className="text-sm text-muted-foreground">Europe/Berlin</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Telegram Linking Section - NEW */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Telegram Verknüpfung
          </h2>
          <div className="p-6 rounded-xl bg-[#141414] border border-[#1f1f1f]">
            {loadingTelegramStatus ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : telegramLinked ? (
              // Already Linked
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0088cc]/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-[#0088cc]" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Telegram verbunden ✅</p>
                    <p className="text-xs text-muted-foreground">ID: {telegramId}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Deine Tasks, Habits und Ziele werden automatisch zwischen Web und Telegram synchronisiert.
                </p>
                <button
                  onClick={unlinkTelegram}
                  className="px-4 py-2 rounded-lg bg-[#1f1f1f] text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Verknüpfung aufheben
                </button>
              </div>
            ) : (
              // Not Linked - Show Code
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D94F3D]/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-[#D94F3D]" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Telegram verknüpfen</p>
                    <p className="text-xs text-muted-foreground">Synchronisiere deine Daten</p>
                  </div>
                </div>

                <div className="bg-[#0f0f0f] rounded-xl p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    1. Öffne den Bot: <a href="https://t.me/PeakCoachBot" target="_blank" className="text-[#D94F3D] hover:underline">@PeakCoachBot</a>
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    2. Sende den Befehl mit deinem Code:
                  </p>

                  {linkingCode && codeExpiry && codeExpiry > new Date() ? (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-[#1a1a1a] rounded-lg px-4 py-3 font-mono text-lg text-foreground tracking-widest text-center">
                        /link {linkingCode}
                      </div>
                      <button
                        onClick={copyCode}
                        className="p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] transition-colors"
                      >
                        {codeCopied ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={generateLinkingCode}
                      disabled={generatingCode}
                      className="w-full py-3 rounded-lg bg-[#D94F3D] text-white font-medium hover:bg-[#c44535] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generatingCode ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Code generieren
                        </>
                      )}
                    </button>
                  )}

                  {linkingCode && codeExpiry && (
                    <p className="text-xs text-muted-foreground text-center">
                      Code gültig bis {codeExpiry.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      {' '}
                      <button onClick={generateLinkingCode} className="text-[#D94F3D] hover:underline">
                        (neu generieren)
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Notifications Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Benachrichtigungen
          </h2>

          {/* Push Notification Enable */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#D94F3D]/10 to-[#D9952A]/10 border border-[#D94F3D]/20 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellRing className="w-5 h-5 text-[#D94F3D]" />
                <div>
                  <p className="text-sm font-medium text-foreground">Push Benachrichtigungen</p>
                  <p className="text-xs text-muted-foreground">
                    {pushPermission === 'unsupported' 
                      ? 'Nicht unterstützt in diesem Browser'
                      : pushPermission === 'denied'
                      ? 'In Browser-Einstellungen blockiert'
                      : pushEnabled 
                      ? 'Aktiviert - du erhältst Benachrichtigungen'
                      : 'Erhalte Erinnerungen auch wenn die App geschlossen ist'}
                  </p>
                </div>
              </div>
              {pushPermission !== 'unsupported' && pushPermission !== 'denied' && (
                <button
                  onClick={enablePushNotifications}
                  disabled={pushEnabled || enablingPush}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pushEnabled 
                      ? 'bg-green-500/20 text-green-400 cursor-default'
                      : 'bg-[#D94F3D] text-white hover:bg-[#c44535]'
                  }`}
                >
                  {enablingPush ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pushEnabled ? (
                    <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Aktiv</span>
                  ) : (
                    'Aktivieren'
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#141414] border border-[#1f1f1f] space-y-4">
            {[
              { key: 'morningCheckin', label: 'Morning Check-in', desc: 'Täglich um 7:00 Uhr', icon: '☀️' },
              { key: 'eveningReview', label: 'Evening Review', desc: 'Täglich um 20:00 Uhr', icon: '🌙' },
              { key: 'taskReminders', label: 'Task Erinnerungen', desc: '15 Min vor Deadline', icon: '✅' },
              { key: 'habitReminders', label: 'Habit Erinnerungen', desc: 'Wenn Gewohnheit fällig', icon: '🔄' },
              { key: 'weeklyReport', label: 'Wochenbericht', desc: 'Sonntags um 18:00 Uhr', icon: '📊' },
              { key: 'coachMessages', label: 'Coach Nachrichten', desc: 'AI Coach Tipps', icon: '✨' },
            ].map((item, i) => (
              <div key={item.key} className={`flex items-center justify-between py-3 ${i > 0 ? 'border-t border-[#1f1f1f]' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications] ? 'bg-[#D94F3D]' : 'bg-[#2a2a2a]'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications[item.key as keyof typeof notifications] ? 20 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        {/* AI Coach Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Coach
          </h2>
          <div className="p-6 rounded-xl bg-[#141414] border border-[#1f1f1f] space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Coaching Stil</p>
                <p className="text-xs text-muted-foreground">Wie der Coach mit dir kommuniziert</p>
              </div>
              <select className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-foreground">
                <option>Motivierend</option>
                <option>Direkt</option>
                <option>Sanft</option>
                <option>Analytisch</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-[#1f1f1f]">
              <div>
                <p className="text-sm font-medium text-foreground">Proaktive Vorschläge</p>
                <p className="text-xs text-muted-foreground">AI schlägt automatisch Tasks vor</p>
              </div>
              <button className="relative w-11 h-6 rounded-full bg-[#D94F3D]">
                <motion.div animate={{ x: 20 }} className="absolute top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-[#1f1f1f]">
              <div>
                <p className="text-sm font-medium text-foreground">Persönlichkeit lernen</p>
                <p className="text-xs text-muted-foreground">Coach lernt aus deinen Präferenzen</p>
              </div>
              <button className="relative w-11 h-6 rounded-full bg-[#D94F3D]">
                <motion.div animate={{ x: 20 }} className="absolute top-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-sm font-semibold text-red-400/70 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Gefahrenzone
          </h2>
          <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Abmelden</p>
                <p className="text-xs text-muted-foreground">Von diesem Gerät abmelden</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f1f] text-sm text-foreground hover:bg-[#2a2a2a]"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-red-500/10">
              <div>
                <p className="text-sm font-medium text-foreground">Konto löschen</p>
                <p className="text-xs text-muted-foreground">Alle Daten unwiderruflich löschen</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-sm text-red-400 hover:bg-red-500/20">
                <Trash2 className="w-4 h-4" />
                Löschen
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
