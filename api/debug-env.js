// api/debug-env.js
// Diagnostic endpoint to check environment variables and database connectivity

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    platform: process.env.VERCEL ? 'vercel' : (process.env.NETLIFY ? 'netlify' : 'unknown'),
    envVars: {},
    supabaseTest: null,
    errors: []
  };

  // Check environment variables (without exposing sensitive values)
  const envVarsToCheck = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'SEARCHAPI_IO_KEY',
    'CRYPTO_COMPARE_API',
    'CG_DEMO_API_KEY',
    'COINGECKO_API_KEY'
  ];

  envVarsToCheck.forEach(varName => {
    const value = process.env[varName];
    diagnostics.envVars[varName] = {
      exists: !!value,
      length: value ? value.length : 0,
      prefix: value ? value.substring(0, 8) + '...' : null
    };
  });

  // Test Supabase connection
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Import Supabase dynamically
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Test database connection with a simple query
      const { data, error } = await supabase
        .from('signals')
        .select('count(*)')
        .limit(1);

      if (error) {
        diagnostics.supabaseTest = {
          success: false,
          error: error.message,
          code: error.code
        };
        diagnostics.errors.push(`Supabase query failed: ${error.message}`);
      } else {
        diagnostics.supabaseTest = {
          success: true,
          message: 'Database connection successful',
          hasData: data && data.length > 0
        };
      }
    } else {
      diagnostics.supabaseTest = {
        success: false,
        error: 'Missing Supabase environment variables'
      };
      diagnostics.errors.push('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
  } catch (error) {
    diagnostics.supabaseTest = {
      success: false,
      error: error.message
    };
    diagnostics.errors.push(`Supabase connection error: ${error.message}`);
  }

  // Check if we're missing critical environment variables
  const criticalVars = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingCritical = criticalVars.filter(varName => !process.env[varName]);
  
  if (missingCritical.length > 0) {
    diagnostics.errors.push(`Missing critical environment variables: ${missingCritical.join(', ')}`);
  }

  // Return diagnostics
  res.status(200).json(diagnostics);
}