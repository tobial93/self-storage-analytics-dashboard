import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { exchangeCodeForTokens } from '@/services/googleAds';
import { exchangeGA4Tokens } from '@/services/ga4';
import { exchangeLinkedInTokens } from '@/services/linkedin';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

function getPlatformName(platform: string): string {
  switch (platform) {
    case 'google_ads': return 'Google Ads'
    case 'ga4': return 'Google Analytics 4'
    case 'linkedin_ads': return 'LinkedIn Ads'
    default: return 'Ad Platform'
  }
}

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [platform, setPlatform] = useState<string>('google_ads');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError('Authorization was denied');
      setTimeout(() => navigate('/integrations'), 3000);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setError('Missing authorization code or organization ID');
      setTimeout(() => navigate('/integrations'), 3000);
      return;
    }

    // State format: "${orgId}:${platform}" (new) or just "${orgId}" (legacy Google Ads)
    const colonIndex = state.indexOf(':');
    const orgId = colonIndex !== -1 ? state.slice(0, colonIndex) : state;
    const detectedPlatform = colonIndex !== -1 ? state.slice(colonIndex + 1) : 'google_ads';
    setPlatform(detectedPlatform);

    getToken({ template: 'supabase' })
      .then((clerkToken) => {
        if (!clerkToken) throw new Error('Not authenticated');

        switch (detectedPlatform) {
          case 'ga4':
            return exchangeGA4Tokens(code, orgId, clerkToken);
          case 'linkedin_ads':
            return exchangeLinkedInTokens(code, orgId, clerkToken);
          default:
            return exchangeCodeForTokens(code, orgId, clerkToken);
        }
      })
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/integrations'), 2000);
      })
      .catch((err) => {
        console.error('OAuth error:', err);
        setStatus('error');
        setError(err.message || `Failed to connect ${getPlatformName(detectedPlatform)} account`);
        setTimeout(() => navigate('/integrations'), 3000);
      });
  }, [searchParams, navigate]);

  const platformName = getPlatformName(platform);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Connecting {platformName}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we connect your {platformName} account...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your {platformName} account has been connected successfully.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Redirecting to integrations page...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Connection Failed</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Redirecting back to integrations page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
