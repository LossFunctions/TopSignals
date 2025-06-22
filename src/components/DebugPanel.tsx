// src/components/DebugPanel.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/neon-glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface DiagnosticData {
  timestamp: string;
  environment: string;
  platform: string;
  envVars: Record<string, {
    exists: boolean;
    length: number;
    prefix: string | null;
  }>;
  supabaseTest: {
    success: boolean;
    error?: string;
    message?: string;
    hasData?: boolean;
  } | null;
  errors: string[];
}

export function DebugPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug-env');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDiagnostics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Environment Diagnostics
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Run Diagnostics
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {diagnostics && (
          <>
            {/* Platform Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium text-[#F5F5F7]">Platform</h3>
                <Badge variant="outline">{diagnostics.platform}</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-[#F5F5F7]">Environment</h3>
                <Badge variant="outline">{diagnostics.environment}</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-[#F5F5F7]">Timestamp</h3>
                <span className="text-sm text-[#A1A1AA]">
                  {new Date(diagnostics.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Environment Variables */}
            <div className="space-y-3">
              <h3 className="font-medium text-[#F5F5F7]">Environment Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(diagnostics.envVars).map(([varName, info]) => (
                  <div key={varName} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      {info.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-mono">{varName}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant={info.exists ? "default" : "destructive"}>
                        {info.exists ? `${info.length} chars` : 'Missing'}
                      </Badge>
                      {info.prefix && (
                        <div className="text-xs text-[#A1A1AA] mt-1 font-mono">
                          {info.prefix}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supabase Test */}
            <div className="space-y-3">
              <h3 className="font-medium text-[#F5F5F7]">Database Connection</h3>
              <div className="p-4 bg-white/5 rounded-lg">
                {diagnostics.supabaseTest ? (
                  <div className="flex items-start gap-3">
                    {diagnostics.supabaseTest.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={diagnostics.supabaseTest.success ? "default" : "destructive"}>
                          {diagnostics.supabaseTest.success ? 'Connected' : 'Failed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#A1A1AA]">
                        {diagnostics.supabaseTest.message || diagnostics.supabaseTest.error}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-[#A1A1AA]">No test performed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Errors */}
            {diagnostics.errors.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-[#F5F5F7]">Issues Found</h3>
                <div className="space-y-2">
                  {diagnostics.errors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span className="text-sm text-red-400">{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="font-medium text-[#F5F5F7]">Recommendations</h3>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="space-y-2 text-sm text-blue-400">
                  <p>• Ensure all environment variables are set in your deployment platform</p>
                  <p>• For Vercel: Check your project settings → Environment Variables</p>
                  <p>• For Netlify: Check Site settings → Environment variables</p>
                  <p>• Make sure SUPABASE_SERVICE_ROLE_KEY is set (not just the anon key)</p>
                  <p>• Verify your Supabase project URL and keys are correct</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}