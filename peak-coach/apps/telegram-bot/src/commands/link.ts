// ============================================
// PEAK COACH - /link Command (Telegram-Web Linking)
// ============================================

import { BotContext } from '../bot';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';

export async function linkCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  const telegramName = ctx.from?.first_name || 'User';
  const messageText = ctx.message?.text || '';
  
  if (!telegramId) {
    await ctx.reply('❌ Konnte deine Telegram ID nicht ermitteln.');
    return;
  }

  // Extract code from message: "/link ABC123" or just "ABC123"
  const parts = messageText.trim().split(/\s+/);
  const code = parts.length > 1 ? parts[1].toUpperCase() : null;

  if (!code || code.length !== 6) {
    await ctx.reply(
      `🔗 *Telegram mit Web App verknüpfen*\n\n` +
      `Um deinen Telegram Account mit der Web App zu verknüpfen:\n\n` +
      `1️⃣ Öffne die Web App\n` +
      `2️⃣ Gehe zu *Einstellungen*\n` +
      `3️⃣ Klicke auf *Telegram verknüpfen*\n` +
      `4️⃣ Kopiere den 6-stelligen Code\n` +
      `5️⃣ Sende mir: \`/link DEINCODE\`\n\n` +
      `_Beispiel: /link ABC123_`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  try {
    // Check if already linked
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('telegram_id', telegramId)
      .not('email', 'is', null)
      .single();

    if (existingUser) {
      await ctx.reply(
        `✅ Dein Account ist bereits verknüpft!\n\n` +
        `📧 Verknüpft mit: ${existingUser.email}\n\n` +
        `_Möchtest du die Verknüpfung ändern? Kontaktiere den Support._`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Try to link accounts using the database function
    const { data, error } = await supabase.rpc('link_telegram_account', {
      p_code: code,
      p_telegram_id: telegramId,
      p_telegram_name: telegramName,
    });

    if (error) {
      logger.error('Error linking account:', error);
      await ctx.reply(
        `❌ Fehler beim Verknüpfen.\n\n` +
        `Bitte versuche es erneut oder generiere einen neuen Code.`
      );
      return;
    }

    if (data && data.success) {
      await ctx.reply(
        `🎉 *Erfolgreich verknüpft!*\n\n` +
        `Dein Telegram Account ist jetzt mit der Web App verbunden.\n\n` +
        `✅ Deine Tasks, Habits und Ziele sind jetzt synchron!\n` +
        `✅ Du kannst beide Plattformen nutzen.\n\n` +
        `_Tippe /start um loszulegen._`,
        { parse_mode: 'Markdown' }
      );
      
      logger.info(`Account linked: Telegram ${telegramId} -> User ${data.user_id}`);
    } else {
      const errorMsg = data?.error || 'Unbekannter Fehler';
      await ctx.reply(
        `❌ ${errorMsg}\n\n` +
        `Bitte generiere einen neuen Code in der Web App.`
      );
    }
  } catch (error) {
    logger.error('Error in link command:', error);
    await ctx.reply('❌ Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
  }
}

// Status command to check linking status
export async function linkStatusCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('❌ Konnte deine Telegram ID nicht ermitteln.');
    return;
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('telegram_id', telegramId)
      .single();

    if (!user) {
      await ctx.reply(
        `📱 *Telegram Account Status*\n\n` +
        `Status: ❌ Nicht registriert\n\n` +
        `_Tippe /start um einen Account zu erstellen._`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (user.email) {
      await ctx.reply(
        `📱 *Account Status*\n\n` +
        `✅ *Verknüpft*\n\n` +
        `👤 Name: ${user.name}\n` +
        `📧 E-Mail: ${user.email}\n` +
        `📅 Registriert: ${new Date(user.created_at).toLocaleDateString('de-DE')}\n\n` +
        `_Deine Daten sind zwischen Telegram und Web App synchronisiert._`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `📱 *Account Status*\n\n` +
        `⚠️ *Nur Telegram* (nicht verknüpft)\n\n` +
        `👤 Name: ${user.name}\n` +
        `📅 Registriert: ${new Date(user.created_at).toLocaleDateString('de-DE')}\n\n` +
        `_Tippe /link um deinen Account mit der Web App zu verknüpfen._`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    logger.error('Error checking link status:', error);
    await ctx.reply('❌ Fehler beim Abrufen des Status.');
  }
}

