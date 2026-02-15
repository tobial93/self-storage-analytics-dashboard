import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganization, useUser, useOrganizationList } from '@clerk/clerk-react';

interface OrganizationContextType {
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  isLoading: boolean;
  userRole: 'admin' | 'manager' | 'viewer' | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { organization, isLoaded: orgLoaded, membership } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orgLoaded && userLoaded) {
      setIsLoading(false);
    }
  }, [orgLoaded, userLoaded]);

  // Get user's role in the organization
  const getUserRole = (): 'admin' | 'manager' | 'viewer' | null => {
    if (!organization || !user) return null;

    // Use the membership from useOrganization hook
    if (!membership) return 'viewer'; // Default to viewer if no membership found

    // Map Clerk roles to our app roles
    const clerkRole = membership.role;
    if (clerkRole === 'org:admin' || clerkRole === 'admin') return 'admin';
    if (clerkRole === 'org:member' || clerkRole === 'member') return 'manager';
    return 'viewer';
  };

  const value: OrganizationContextType = {
    organizationId: organization?.id || null,
    organizationName: organization?.name || null,
    organizationSlug: organization?.slug || null,
    isLoading,
    userRole: getUserRole(),
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// Custom hook to use organization context
export function useCurrentOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      'useCurrentOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
}

// Helper hook to check if user has specific permission
export function useHasPermission(
  requiredRole: 'admin' | 'manager' | 'viewer'
): boolean {
  const { userRole } = useCurrentOrganization();

  if (!userRole) return false;

  const roleHierarchy = {
    admin: 3,
    manager: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
