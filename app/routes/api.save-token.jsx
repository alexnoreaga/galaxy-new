import { json } from '@shopify/remix-oxygen';

export async function action({ request, context }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return json({ error: 'Token is required' }, { status: 400 });
    }

    // Save token to your database or KV storage
    // For now, just log it and return success
    console.log('FCM Token saved:', token);

    // Example: Save to KV storage (Cloudflare Workers)
    if (context.env.TOKENS_KV) {
      await context.env.TOKENS_KV.put(
        `fcm_token_${Date.now()}`,
        JSON.stringify({ token, timestamp: new Date().toISOString() })
      );
    }

    return json({ success: true, message: 'Token saved successfully' });
  } catch (error) {
    console.error('Error saving token:', error);
    return json({ error: 'Failed to save token' }, { status: 500 });
  }
}
