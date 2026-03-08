import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// NOTE: This function must be deployed with JWT verification disabled
// because Stripe sends its own signature — not a Clerk JWT.

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const priceToTier: Record<string, string> = {
  [Deno.env.get('STRIPE_PRICE_STARTER') || '']: 'starter',
  [Deno.env.get('STRIPE_PRICE_PROFESSIONAL') || '']: 'professional',
  [Deno.env.get('STRIPE_PRICE_AGENCY') || '']: 'agency',
}

function getTierFromSubscription(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price?.id || ''
  return priceToTier[priceId] || 'free'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
      },
    })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const orgId = session.metadata?.org_id || session.subscription_data?.metadata?.org_id
        if (!orgId) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const tier = getTierFromSubscription(subscription)

        await supabase
          .from('organizations')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_tier: tier,
          })
          .eq('id', orgId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.org_id
        if (!orgId) break

        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        const tier = isActive ? getTierFromSubscription(subscription) : 'free'

        await supabase
          .from('organizations')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_tier: tier,
          })
          .eq('id', orgId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = subscription.metadata?.org_id
        if (!orgId) break

        await supabase
          .from('organizations')
          .update({
            stripe_subscription_id: null,
            subscription_tier: 'free',
          })
          .eq('id', orgId)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handler error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
