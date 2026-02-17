import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { exchangeCodeForTokens } from '@/services/googleAds';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // org_id
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

    // Get Clerk token then exchange code for Google tokens
    getToken({ template: 'supabase' })
      .then((clerkToken) => {
        if (!clerkToken) throw new Error('Not authenticated');
        return exchangeCodeForTokens(code, state, clerkToken);
      })
      .then(() => {
        setStatus('success');
        setTimeout(() => {
          navigate('/integrations');
        }, 2000);
      })
      .catch((err) => {
        console.error('OAuth error:', err);
        setStatus('error');
        setError(err.message || 'Failed to connect Google Ads account');
        setTimeout(() => navigate('/integrations'), 3000);
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Connecting Google Ads</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we connect your Google Ads account...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your Google Ads account has been connected successfully.
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
