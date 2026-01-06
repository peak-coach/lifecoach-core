import { describe, it, expect, beforeAll } from 'vitest';

/**
 * ENVIRONMENT VARIABLE TESTS
 * 
 * Diese Tests prüfen ob alle kritischen Environment Variables gesetzt sind.
 * Sie würden das RLS-Problem SOFORT erkennen!
 * 
 * Führe aus mit: npm run test:run -- --grep "Environment"
 * 
 * NOTE: In Test-Umgebung werden Mock-Werte verwendet.
 * Diese Tests sind primär für CI/CD und Pre-Deploy Checks gedacht.
 */

// In test environment, vitest.config.ts sets mock values
const IS_TEST_ENV = process.env.OPENAI_API_KEY === 'test-api-key';

describe('Environment Variables - Critical Config', () => {
  describe('Supabase Configuration', () => {
    it('should have NEXT_PUBLIC_SUPABASE_URL set', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(url).toBeDefined();
      expect(url).not.toBe('');
      // In test env, we have mock values
      if (!IS_TEST_ENV) {
        expect(url).toMatch(/^https:\/\/.*\.supabase\.co$/);
      }
    });

    it('should have NEXT_PUBLIC_SUPABASE_ANON_KEY set', () => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      expect(key).toBeDefined();
      expect(key).not.toBe('');
    });

    it('⚠️ CRITICAL: should have SUPABASE_SERVICE_ROLE_KEY set for server operations', () => {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      // Skip detailed check in test env (mock values)
      if (IS_TEST_ENV) {
        expect(key).toBeDefined();
        return;
      }
      
      // This is the KEY test that would have caught the RLS issue!
      if (!key || key === '' || key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error(`
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  CRITICAL: SUPABASE_SERVICE_ROLE_KEY IS MISSING!           ║
║                                                                 ║
║  Without this key, ALL server-side database operations will    ║
║  FAIL due to Row Level Security (RLS) blocking writes.         ║
║                                                                 ║
║  TO FIX:                                                        ║
║  1. Go to Supabase Dashboard → Settings → API                  ║
║  2. Copy the "service_role" secret key                         ║
║  3. Add it to Vercel: Settings → Environment Variables         ║
║     Name: SUPABASE_SERVICE_ROLE_KEY                            ║
║     Value: [your service role key]                             ║
║  4. Redeploy the application                                   ║
╚════════════════════════════════════════════════════════════════╝
        `);
      }
      
      expect(key).toBeDefined();
      expect(key).not.toBe('');
      expect(key).not.toBe(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    });

    it('should have service role key different from anon key', () => {
      // Skip in test env
      if (IS_TEST_ENV) return;
      
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      // If they're the same, RLS will block server operations
      expect(serviceKey).not.toBe(anonKey);
    });
  });

  describe('OpenAI Configuration', () => {
    it('should have OpenAI API key set', () => {
      const key = process.env.OPENAI_API_KEY || process.env.OpenAI_API_KEY;
      expect(key).toBeDefined();
      expect(key).not.toBe('');
      // Skip format check in test env
      if (!IS_TEST_ENV) {
        expect(key).toMatch(/^sk-/); // OpenAI keys start with sk-
      }
    });
  });

  describe('Production Readiness', () => {
    it('should have all required environment variables', () => {
      const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ];
      
      const missing = required.filter(name => !process.env[name]);
      
      if (missing.length > 0 && !IS_TEST_ENV) {
        console.error(`Missing environment variables: ${missing.join(', ')}`);
      }
      
      expect(missing).toHaveLength(0);
    });

    it('should not expose service role key to client', () => {
      // Service role key should NOT start with NEXT_PUBLIC_
      const publicVars = Object.keys(process.env).filter(k => 
        k.startsWith('NEXT_PUBLIC_') && k.toLowerCase().includes('service')
      );
      
      expect(publicVars).toHaveLength(0);
    });
  });
});

describe('Environment Variable Security', () => {
  it('should not have test/placeholder values in production', () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // Check for common test/placeholder patterns
    const testPatterns = ['localhost', 'test', 'example', 'placeholder', 'xxx'];
    const hasTestValue = testPatterns.some(pattern => 
      url?.toLowerCase().includes(pattern)
    );
    
    if (process.env.NODE_ENV === 'production') {
      expect(hasTestValue).toBe(false);
    }
  });
});

