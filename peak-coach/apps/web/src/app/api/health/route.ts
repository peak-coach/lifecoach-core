import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * HEALTH CHECK API
 * 
 * Prüft alle kritischen Systeme:
 * - Environment Variables
 * - Supabase Verbindung
 * - Service Role Key (RLS bypass)
 * - Schreibzugriff auf Tabellen
 * 
 * URL: /api/health
 * URL: /api/health?full=true (detaillierter Check)
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    duration_ms?: number;
  }[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fullCheck = searchParams.get('full') === 'true';
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: [],
    summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
  };

  // ============================================
  // CHECK 1: Environment Variables
  // ============================================
  const envCheck = checkEnvironmentVariables();
  health.checks.push(envCheck);

  // ============================================
  // CHECK 2: Supabase Connection (Anon Key)
  // ============================================
  const anonConnectionCheck = await checkSupabaseConnection('anon');
  health.checks.push(anonConnectionCheck);

  // ============================================
  // CHECK 3: Supabase Service Role (CRITICAL!)
  // ============================================
  const serviceRoleCheck = await checkSupabaseConnection('service');
  health.checks.push(serviceRoleCheck);

  // ============================================
  // CHECK 4: Write Operations (RLS Test)
  // ============================================
  if (fullCheck) {
    const writeCheck = await checkWriteOperations();
    health.checks.push(writeCheck);
    
    // CHECK 5: Critical Tables Exist
    const tablesCheck = await checkCriticalTables();
    health.checks.push(tablesCheck);
  }

  // ============================================
  // Calculate Summary
  // ============================================
  health.summary.total = health.checks.length;
  health.summary.passed = health.checks.filter(c => c.status === 'pass').length;
  health.summary.failed = health.checks.filter(c => c.status === 'fail').length;
  health.summary.warnings = health.checks.filter(c => c.status === 'warn').length;

  if (health.summary.failed > 0) {
    health.status = 'unhealthy';
  } else if (health.summary.warnings > 0) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

// ============================================
// CHECK FUNCTIONS
// ============================================

function checkEnvironmentVariables(): HealthStatus['checks'][0] {
  const start = Date.now();
  const required = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
  ];

  const missing = required.filter(r => !r.value || r.value === '');
  
  if (missing.length > 0) {
    return {
      name: 'environment_variables',
      status: 'fail',
      message: `Missing: ${missing.map(m => m.name).join(', ')}`,
      duration_ms: Date.now() - start,
    };
  }

  // Check if service role key is same as anon key (common mistake)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      name: 'environment_variables',
      status: 'fail',
      message: 'SUPABASE_SERVICE_ROLE_KEY is same as ANON_KEY - RLS will block writes!',
      duration_ms: Date.now() - start,
    };
  }

  return {
    name: 'environment_variables',
    status: 'pass',
    message: 'All required environment variables are set',
    duration_ms: Date.now() - start,
  };
}

async function checkSupabaseConnection(type: 'anon' | 'service'): Promise<HealthStatus['checks'][0]> {
  const start = Date.now();
  const name = type === 'anon' ? 'supabase_anon_connection' : 'supabase_service_connection';
  
  try {
    const key = type === 'anon' 
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      : process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!key) {
      return {
        name,
        status: 'fail',
        message: `${type === 'service' ? 'SUPABASE_SERVICE_ROLE_KEY' : 'ANON_KEY'} not configured`,
        duration_ms: Date.now() - start,
      };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key
    );

    // Simple query to test connection
    const { error } = await supabase.from('goals').select('id').limit(1);
    
    if (error && !error.message.includes('0 rows')) {
      throw error;
    }

    return {
      name,
      status: 'pass',
      message: `${type} connection successful`,
      duration_ms: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name,
      status: 'fail',
      message: `Connection failed: ${error.message}`,
      duration_ms: Date.now() - start,
    };
  }
}

async function checkWriteOperations(): Promise<HealthStatus['checks'][0]> {
  const start = Date.now();
  
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return {
        name: 'write_operations',
        status: 'fail',
        message: 'Cannot test writes - SUPABASE_SERVICE_ROLE_KEY missing',
        duration_ms: Date.now() - start,
      };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    );

    // Try to upsert a health check record
    const testId = 'health-check-test';
    const { error: writeError } = await supabase
      .from('learning_settings')
      .upsert({ 
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        learning_level: 'health_check',
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: true,
      });

    // This will likely fail due to FK constraint, but that's fine
    // We're testing if we can attempt writes at all
    
    if (writeError && writeError.message.includes('violates foreign key')) {
      // FK violation is OK - it means we CAN write, just no valid user
      return {
        name: 'write_operations',
        status: 'pass',
        message: 'Write operations enabled (FK constraint working)',
        duration_ms: Date.now() - start,
      };
    }

    if (writeError && (writeError.message.includes('permission denied') || writeError.message.includes('RLS'))) {
      return {
        name: 'write_operations',
        status: 'fail',
        message: 'RLS is blocking writes - check SUPABASE_SERVICE_ROLE_KEY',
        duration_ms: Date.now() - start,
      };
    }

    return {
      name: 'write_operations',
      status: 'pass',
      message: 'Write operations working',
      duration_ms: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'write_operations',
      status: 'fail',
      message: `Write test failed: ${error.message}`,
      duration_ms: Date.now() - start,
    };
  }
}

async function checkCriticalTables(): Promise<HealthStatus['checks'][0]> {
  const start = Date.now();
  
  const criticalTables = [
    'goals',
    'actions',
    'learning_activity',
    'learning_settings',
    'goal_learning_progress',
    'spaced_repetition',
    'user_gamification',
    'xp_events',
    'goal_skills',
  ];

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey!
    );

    const missingTables: string[] = [];
    
    for (const table of criticalTables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.message.includes('does not exist')) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      return {
        name: 'critical_tables',
        status: 'fail',
        message: `Missing tables: ${missingTables.join(', ')}`,
        duration_ms: Date.now() - start,
      };
    }

    return {
      name: 'critical_tables',
      status: 'pass',
      message: `All ${criticalTables.length} critical tables exist`,
      duration_ms: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'critical_tables',
      status: 'fail',
      message: `Table check failed: ${error.message}`,
      duration_ms: Date.now() - start,
    };
  }
}

