import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentOrganization } from '@/contexts/OrganizationContext'
import * as api from '@/services/api'

// ============================================================
// CAMPAIGNS
// ============================================================

export function useCampaigns() {
  const { organizationId } = useCurrentOrganization()

  return useQuery({
    queryKey: ['campaigns', organizationId],
    queryFn: () => api.getCampaigns(organizationId!),
    enabled: !!organizationId,
  })
}

export function useCampaign(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => api.getCampaignById(campaignId!),
    enabled: !!campaignId,
  })
}

export function useCampaignsByPlatform(platform: string) {
  const { organizationId } = useCurrentOrganization()

  return useQuery({
    queryKey: ['campaigns', organizationId, platform],
    queryFn: () => api.getCampaignsByPlatform(organizationId!, platform),
    enabled: !!organizationId,
  })
}

// ============================================================
// METRICS
// ============================================================

export function useDashboardSummary(startDate?: Date, endDate?: Date) {
  const { organizationId } = useCurrentOrganization()

  return useQuery({
    queryKey: ['dashboard-summary', organizationId, startDate, endDate],
    queryFn: () => api.getDashboardSummary(organizationId!, startDate, endDate),
    enabled: !!organizationId,
  })
}

export function useCampaignMetrics(
  campaignId: string | undefined,
  startDate?: Date,
  endDate?: Date
) {
  return useQuery({
    queryKey: ['campaign-metrics', campaignId, startDate, endDate],
    queryFn: () => api.getCampaignMetrics(campaignId!, startDate, endDate),
    enabled: !!campaignId,
  })
}

export function useMetricsByDateRange(startDate: Date, endDate: Date) {
  const { organizationId } = useCurrentOrganization()

  return useQuery({
    queryKey: ['metrics-date-range', organizationId, startDate, endDate],
    queryFn: () => api.getMetricsByDateRange(organizationId!, startDate, endDate),
    enabled: !!organizationId,
  })
}

// ============================================================
// ALERTS
// ============================================================

export function useActiveAlerts() {
  const { organizationId } = useCurrentOrganization()

  return useQuery({
    queryKey: ['active-alerts', organizationId],
    queryFn: () => api.getActiveAlerts(organizationId!),
    enabled: !!organizationId,
    refetchInterval: 60000, // Refetch every minute
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()
  const { organizationId } = useCurrentOrganization()

  return useMutation({
    mutationFn: api.resolveAlert,
    onSuccess: () => {
      // Invalidate alerts query to refetch
      queryClient.invalidateQueries({ queryKey: ['active-alerts', organizationId] })
    },
  })
}

// ============================================================
// CONVERSION FUNNEL
// ============================================================

export function useConversionFunnel(startDate?: Date, endDate?: Date) {
  const { organizationId } = useCurrentOrganization()

  return useQuery({
    queryKey: ['conversion-funnel', organizationId, startDate, endDate],
    queryFn: () => api.getConversionFunnel(organizationId!, startDate, endDate),
    enabled: !!organizationId,
  })
}

// ============================================================
// AD CONNECTIONS
// ============================================================

export function useAdConnections() {
  const { organizationId } = useCurrentOrganization()

  return useQuery({
    queryKey: ['ad-connections', organizationId],
    queryFn: () => api.getAdConnections(organizationId!),
    enabled: !!organizationId,
  })
}

export function useDisconnectAdAccount() {
  const queryClient = useQueryClient()
  const { organizationId } = useCurrentOrganization()

  return useMutation({
    mutationFn: api.disconnectAdAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-connections', organizationId] })
    },
  })
}

// ============================================================
// BRANDING
// ============================================================

export function useOrganizationBranding() {
  const { organizationId } = useCurrentOrganization()

  return useQuery({
    queryKey: ['branding', organizationId],
    queryFn: () => api.getOrganizationBranding(organizationId!),
    enabled: !!organizationId,
  })
}

export function useUpdateBranding() {
  const queryClient = useQueryClient()
  const { organizationId } = useCurrentOrganization()

  return useMutation({
    mutationFn: (branding: {
      logo_url?: string
      primary_color?: string
      company_name?: string
    }) => api.updateOrganizationBranding(organizationId!, branding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding', organizationId] })
    },
  })
}
