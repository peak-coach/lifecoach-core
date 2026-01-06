#!/usr/bin/env npx ts-node

/**
 * PRE-DEPLOY CHECK SCRIPT
 * 
 * Führe dieses Script vor jedem Deployment aus:
 * npx ts-node scripts/pre-deploy-check.ts
 * 
 * Es prüft:
 * 1. Environment Variables
 * 2. TypeScript Kompilierung
 * 3. Test Suite
 * 4. API Verbindungen (wenn Server läuft)
 */

import { execSync } from 'child_process';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function addResult(result: CheckResult) {
  results.push(result);
  const emoji = result.status === 'pass' ? '✅' : 
                result.status === 'fail' ? '❌' : 
                result.status === 'warn' ? '⚠️' : '⏭️';
  log(emoji, `${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
}

async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           🚀 PRE-DEPLOY CHECK                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  // ============================================
  // CHECK 1: Environment Variables
  // ============================================
  log('🔍', 'Checking environment variables...');
  
  const requiredEnvVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', critical: true },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', critical: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', critical: true },
    { name: 'OPENAI_API_KEY', critical: false },
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];
    if (!value || value === '') {
      addResult({
        name: `ENV: ${envVar.name}`,
        status: envVar.critical ? 'fail' : 'warn',
        message: envVar.critical ? 'MISSING - CRITICAL!' : 'Not set (optional)',
        details: envVar.critical ? 'This will cause features to fail!' : undefined,
      });
    } else {
      addResult({
        name: `ENV: ${envVar.name}`,
        status: 'pass',
        message: 'Set',
      });
    }
  }

  // Check if service role key is different from anon key
  if (process.env.SUPABASE_SERVICE_ROLE_KEY === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    addResult({
      name: 'ENV: Service vs Anon Key',
      status: 'fail',
      message: 'Service key is same as anon key!',
      details: 'RLS will block all server-side writes. Get the correct service_role key from Supabase.',
    });
  }

  // ============================================
  // CHECK 2: TypeScript
  // ============================================
  log('🔍', 'Running TypeScript check...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { 
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    addResult({
      name: 'TypeScript',
      status: 'pass',
      message: 'No type errors',
    });
  } catch (error: any) {
    addResult({
      name: 'TypeScript',
      status: 'fail',
      message: 'Type errors found',
      details: error.stdout?.toString().slice(0, 500),
    });
  }

  // ============================================
  // CHECK 3: Linting
  // ============================================
  log('🔍', 'Running ESLint...');
  try {
    execSync('npm run lint', { 
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    addResult({
      name: 'ESLint',
      status: 'pass',
      message: 'No lint errors',
    });
  } catch (error: any) {
    addResult({
      name: 'ESLint',
      status: 'warn',
      message: 'Lint warnings/errors found',
    });
  }

  // ============================================
  // CHECK 4: Tests
  // ============================================
  log('🔍', 'Running test suite...');
  try {
    execSync('npm run test:run', { 
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    addResult({
      name: 'Test Suite',
      status: 'pass',
      message: 'All tests passed',
    });
  } catch (error: any) {
    addResult({
      name: 'Test Suite',
      status: 'fail',
      message: 'Some tests failed',
      details: 'Run `npm run test:run` to see details',
    });
  }

  // ============================================
  // CHECK 5: Build
  // ============================================
  log('🔍', 'Testing build...');
  try {
    execSync('npm run build', { 
      stdio: 'pipe',
      cwd: process.cwd(),
      env: {
        ...process.env,
        // Provide dummy values for build if not set
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
      },
    });
    addResult({
      name: 'Build',
      status: 'pass',
      message: 'Build successful',
    });
  } catch (error: any) {
    addResult({
      name: 'Build',
      status: 'fail',
      message: 'Build failed',
      details: 'Run `npm run build` to see details',
    });
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                       SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  
  console.log(`\n  ✅ Passed:   ${passed}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log('');

  if (failed > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  ❌ DEPLOYMENT NOT RECOMMENDED                           ║');
    console.log('║                                                          ║');
    console.log('║  Fix the failed checks before deploying!                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  ⚠️  DEPLOYMENT POSSIBLE WITH WARNINGS                   ║');
    console.log('║                                                          ║');
    console.log('║  Consider fixing warnings before deploying.              ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    process.exit(0);
  } else {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL CHECKS PASSED - READY TO DEPLOY!                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    process.exit(0);
  }
}

main().catch(console.error);

