import { CreateOrganization as ClerkCreateOrganization } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export function CreateOrganization() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Your Organization
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Set up your agency workspace
          </p>
        </div>
        <ClerkCreateOrganization
          routing="path"
          path="/create-organization"
          afterCreateOrganizationUrl="/"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
