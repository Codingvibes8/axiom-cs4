import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 }
    );
  }

  try {
    const { agentId } = await params;
    const body = await req.json();

    // 1. Fetch Agent Harness config
    const { data: agent, error: agentError } = await supabase
      .from('agent_harnesses')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent harness not found or invalid' },
        { status: 404 }
      );
    }

    // 2. Validate Status & TTL
    if (agent.status === 'revoked') {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          reason: 'Agent credentials have been REVOKED via Emergency Killswitch.' 
        },
        { status: 403 }
      );
    }

    if (agent.status === 'sandboxed') {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          reason: 'Agent is currently SANDBOXED and blocked from outbound external requests.' 
        },
        { status: 403 }
      );
    }

    if (agent.expires_at && new Date(agent.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          reason: 'Agent ephemeral lease TTL has EXPIRED. Token automatically revoked.' 
        },
        { status: 403 }
      );
    }

    // 3. Validate Quota
    if (agent.tokens_used_today >= agent.token_limit_per_hour) {
      return NextResponse.json(
        { 
          error: 'Too Many Requests', 
          reason: `Hourly token quota exceeded (${agent.tokens_used_today}/${agent.token_limit_per_hour}).` 
        },
        { status: 429 }
      );
    }

    // 4. Fetch the real Secret Value (for injection)
    // Note: Production would use KMS to decrypt the value column here
    // For this implementation we're using the plaintext value stored in DB
    const { data: secrets, error: secretsError } = await supabase
      .from('secrets')
      .select('key, value')
      .in('key', agent.allowed_secrets)
      .eq('project_id', agent.project_id)
      .eq('environment', agent.environment);

    if (secretsError) {
      return NextResponse.json(
        { error: 'Internal server error while retrieving proxy credentials' },
        { status: 500 }
      );
    }

    // 5. Proxy Simulation (in real app, use fetch to actual provider endpoint like https://api.anthropic.com/v1/messages)
    // We are simulating the network call and returning the "masked" proxy result
    
    // Calculate simulated tokens used for this request
    const simulatedTokensUsed = Math.floor(Math.random() * 300) + 150; 
    
    // 6. Update usage in Supabase
    await supabase
      .from('agent_harnesses')
      .update({ 
        tokens_used_today: agent.tokens_used_today + simulatedTokensUsed,
        last_invoked: new Date().toISOString()
      })
      .eq('id', agentId);

    // 7. Return Result
    return NextResponse.json({
      success: true,
      proxy_result: {
        message: 'Successfully proxied via Axiom Zero-Trust Harness.',
        model: agent.model_provider,
        injected_secrets_count: secrets?.length || 0,
        keys_masked: agent.auto_mask_secrets
      },
      tokens_used: simulatedTokensUsed,
      masked_keys_count: secrets?.length || 0
    });

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
