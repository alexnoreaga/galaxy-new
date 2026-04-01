import {json, redirect} from '@shopify/remix-oxygen';

const GOOGLE_CLIENT_ID = '178369001961-1044kg73e0tdvetg8lhni93m0djvagv8.apps.googleusercontent.com';
const SHOP_DOMAIN = '41a7e9-3.myshopify.com';

// Derive a deterministic password from Google sub + secret
// Same user always gets the same password — no storage needed
async function derivePassword(sub, secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(sub + ':' + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

// Verify Google credential via Google's tokeninfo endpoint
async function verifyGoogleToken(credential) {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
  );
  if (!res.ok) throw new Error('Invalid Google token');
  const payload = await res.json();
  if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Token client mismatch');
  if (!payload.email_verified) throw new Error('Email not verified');
  return payload; // { email, sub, name, given_name, family_name, picture }
}

// Try to login via Storefront API
async function storefrontLogin(storefront, email, password) {
  const {customerAccessTokenCreate} = await storefront.mutate(
    `#graphql
    mutation login($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }`,
    {variables: {input: {email, password}}},
  );
  return customerAccessTokenCreate;
}

// Create customer via Storefront API
async function storefrontCreate(storefront, email, password, firstName, lastName) {
  const {customerCreate} = await storefront.mutate(
    `#graphql
    mutation create($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id }
        customerUserErrors { code message }
      }
    }`,
    {variables: {input: {email, password, firstName, lastName, acceptsMarketing: false}}},
  );
  return customerCreate;
}

// Find customer by email via Admin API
async function adminFindCustomer(email, adminToken) {
  const res = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
    {headers: {'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json'}},
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.customers?.[0] || null;
}

// Update customer password via Admin API
async function adminUpdatePassword(customerId, password, adminToken) {
  const res = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/customers/${customerId}.json`,
    {
      method: 'PUT',
      headers: {'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json'},
      body: JSON.stringify({customer: {id: customerId, password, password_confirmation: password}}),
    },
  );
  return res.ok;
}

export async function action({request, context}) {
  const {session, storefront, env} = context;

  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  try {
    const {credential} = await request.json();
    if (!credential) throw new Error('No credential provided');

    // 1. Verify Google token
    const googleUser = await verifyGoogleToken(credential);
    const {email, sub, given_name, family_name} = googleUser;
    const firstName = given_name || '';
    const lastName = family_name || '';

    // 2. Derive deterministic password from Google sub + session secret
    const password = await derivePassword(sub, env.SESSION_SECRET);

    // 3. Try direct login first (works if they've used Google login before)
    const loginResult = await storefrontLogin(storefront, email, password);

    if (loginResult?.customerAccessToken?.accessToken) {
      session.set('customerAccessToken', loginResult.customerAccessToken);
      return json(
        {success: true},
        {headers: {'Set-Cookie': await session.commit()}},
      );
    }

    // 4. Login failed — customer exists with different password OR doesn't exist yet
    const adminToken = env.PRIVATE_STOREFRONT_API_TOKEN;

    // Try creating new customer first
    const createResult = await storefrontCreate(storefront, email, password, firstName, lastName);

    if (!createResult?.customerUserErrors?.length) {
      // New customer created — login
      const newLogin = await storefrontLogin(storefront, email, password);
      if (newLogin?.customerAccessToken?.accessToken) {
        session.set('customerAccessToken', newLogin.customerAccessToken);
        return json(
          {success: true},
          {headers: {'Set-Cookie': await session.commit()}},
        );
      }
    }

    // 5. Customer already exists with a different password — update via Admin API
    const existingCustomer = await adminFindCustomer(email, adminToken);
    if (!existingCustomer) throw new Error('Could not find or create customer');

    const updated = await adminUpdatePassword(existingCustomer.id, password, adminToken);
    if (!updated) throw new Error('Could not update customer password');

    // 6. Now login with the new password
    const finalLogin = await storefrontLogin(storefront, email, password);
    if (!finalLogin?.customerAccessToken?.accessToken) {
      throw new Error('Login failed after password update');
    }

    session.set('customerAccessToken', finalLogin.customerAccessToken);
    return json(
      {success: true},
      {headers: {'Set-Cookie': await session.commit()}},
    );
  } catch (error) {
    return json({error: error.message}, {status: 400});
  }
}
