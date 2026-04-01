import {json, redirect} from '@shopify/remix-oxygen';
import {Form, Link, useActionData, useSearchParams} from '@remix-run/react';
import {useEffect} from 'react';

export const meta = () => {
  return [{title: 'Login'}];
};

export async function loader({context}) {
  if (await context.session.get('customerAccessToken')) {
    return redirect('/account');
  }
  return json({});
}

export async function action({request, context}) {
  const {session, storefront} = context;

  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  try {
    const form = await request.formData();
    const email = String(form.has('email') ? form.get('email') : '');
    const password = String(form.has('password') ? form.get('password') : '');
    const validInputs = Boolean(email && password);

    if (!validInputs) {
      throw new Error('Please provide both an email and a password.');
    }

    const {customerAccessTokenCreate} = await storefront.mutate(
      LOGIN_MUTATION,
      {
        variables: {
          input: {email, password},
        },
      },
    );

    if (!customerAccessTokenCreate?.customerAccessToken?.accessToken) {
      throw new Error(customerAccessTokenCreate?.customerUserErrors[0].message);
    }

    const {customerAccessToken} = customerAccessTokenCreate;
    session.set('customerAccessToken', customerAccessToken);

    return redirect('/account', {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return json({error: error.message}, {status: 400});
    }
    return json({error}, {status: 400});
  }
}

export default function Login() {
  const data = useActionData();
  const [searchParams] = useSearchParams();
  const error = data?.error || null;
  const googleError = searchParams.get('google_error');

  // If GSI script already loaded (client-side nav), render the button now
  useEffect(() => {
    if (window.__googleGsiReady && window.google?.accounts?.id) {
      const container = document.getElementById('google-btn-container');
      if (container && !container.hasChildNodes()) {
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: container.offsetWidth || 400,
          text: 'signin_with',
          logo_alignment: 'left',
        });
      }
    }
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">

        {/* Logo & heading */}
        <div className="text-center mb-8">
          <img
            src="https://cdn.shopify.com/s/files/1/0672/3806/8470/files/logo-galaxy-web-new.png"
            alt="Galaxy Camera"
            width={140}
            height={40}
            className="mx-auto mb-5 h-10 w-auto object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900">Masuk ke Akun Anda</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali di Galaxy Camera</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8">
          <Form method="POST" className="flex flex-col gap-4">

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="contoh@email.com"
                aria-label="Email address"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="/account/recover" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
                  Lupa password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Minimal 8 karakter"
                aria-label="Password"
                minLength={8}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
            </div>

            {googleError && (
              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-xl px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <p className="font-medium">Login Google gagal</p>
                  <p className="text-orange-600 mt-0.5">
                    {googleError.includes('find or create')
                      ? 'Email ini sudah terdaftar secara manual. Silakan masuk dengan email & password terlebih dahulu.'
                      : googleError}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors duration-200 mt-1 active:scale-[0.98]"
            >
              Masuk
            </button>
          </Form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">atau</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google Sign In Button — rendered by Google GSI for reliability */}
          <div id="google-btn-container" className="w-full flex justify-center" />

          <div className="mt-4 text-center text-sm text-gray-500">
            Belum punya akun?{' '}
            <Link to="/account/register" className="font-semibold text-gray-900 hover:underline">
              Daftar sekarang
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/mutations/customeraccesstokencreate
const LOGIN_MUTATION = `#graphql
  mutation login($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerUserErrors {
        code
        field
        message
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
    }
  }
`;
