import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useOrganization, useUser, useAuth } from '@clerk/clerk-react';
import { setSupabaseAuth, supabase } from '@/lib/supabase';
import type { SubscriptionTier } from '@/data/types';
import { canAccess, isTrialActive, trialDaysRemaining } from '@/lib/featureGating';
import type { Feature } from '@/lib/featureGating';

interface OrganizationContextType {
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  isLoading: boolean;
  userRole: 'admin' | 'manager' | 'viewer' | null;
  subscriptionTier: SubscriptionTier | null;
  onboardingCompleted: boolean | null;  // null = still loading from DB
  trialEndsAt: string | null;
  isTrialing: boolean;
  trialDaysLeft: number;
  canAccessFeature: (feature: Feature) => boolean;
  refetchOrgData: () => void;
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
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  // Sync Clerk authentication with Supabase
  useEffect(() => {
    const syncAuth = async () => {
      if (user) {
        try {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            await setSupabaseAuth(token);
          }
        } catch (error) {
          console.error('Error syncing auth with Supabase:', error);
        }
      }
    };

    syncAuth();
  }, [user, getToken]);

  useEffect(() => {
    if (orgLoaded && userLoaded) {
      setIsLoading(false);
    }
  }, [orgLoaded, userLoaded]);

  const fetchOrgData = useCallback(async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('subscription_tier, onboarding_completed, trial_ends_at')
        .eq('id', orgId)
        .single();

      if (error) {
        console.error('Error fetching org data:', error);
        return;
      }

      if (data) {
        setSubscriptionTier((data.subscription_tier as SubscriptionTier) || 'free');
        setOnboardingCompleted(data.onboarding_completed ?? false);
        setTrialEndsAt(data.trial_ends_at ?? null);
      }
    } catch (error) {
      console.error('Error fetching org data:', error);
    }
  }, []);

  useEffect(() => {
    if (organization?.id) {
      fetchOrgData(organization.id);
    } else if (orgLoaded && !organization) {
      // No org, reset
      setSubscriptionTier(null);
      setOnboardingCompleted(null);
      setTrialEndsAt(null);
    }
  }, [organization?.id, orgLoaded, fetchOrgData]);

  const refetchOrgData = useCallback(() => {
    if (organization?.id) {
      fetchOrgData(organization.id);
    }
  }, [organization?.id, fetchOrgData]);

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

  const effectiveTier = subscriptionTier || 'free';
  const trialing = isTrialActive(trialEndsAt);
  const daysLeft = trialDaysRemaining(trialEndsAt);

  const value: OrganizationContextType = {
    organizationId: organization?.id || null,
    organizationName: organization?.name || null,
    organizationSlug: organization?.slug || null,
    isLoading,
    userRole: getUserRole(),
    subscriptionTier,
    onboardingCompleted,
    trialEndsAt,
    isTrialing: trialing,
    trialDaysLeft: daysLeft,
    canAccessFeature: (feature: Feature) => canAccess(effectiveTier, feature),
    refetchOrgData,
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
