import {Form, NavLink, Outlet, useLoaderData} from '@remix-run/react';
import {json, redirect} from '@shopify/remix-oxygen';

export function shouldRevalidate() {
  return true;
}

export async function loader({request, context}) {
  const {session, storefront} = context;
  const {pathname} = new URL(request.url);
  const customerAccessToken = await session.get('customerAccessToken');
  const isLoggedIn = !!customerAccessToken?.accessToken;
  const isAccountHome = pathname === '/account' || pathname === '/account/';
  const isPrivateRoute =
    /^\/account\/(orders|orders\/.*|profile|addresses|addresses\/.*)$/.test(
      pathname,
    );

  if (!isLoggedIn) {
    if (isPrivateRoute || isAccountHome) {
      session.unset('customerAccessToken');
      return redirect('/account/login', {
        headers: {
          'Set-Cookie': await session.commit(),
        },
      });
    } else {
      // public subroute such as /account/login...
      return json({
        isLoggedIn: false,
        isAccountHome,
        isPrivateRoute,
        customer: null,
      });
    }
  } else {
    // loggedIn, default redirect to the orders page
    if (isAccountHome) {
      return redirect('/account/orders');
    }
  }

  try {
    const {customer} = await storefront.query(CUSTOMER_QUERY, {
      variables: {
        customerAccessToken: customerAccessToken.accessToken,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      cache: storefront.CacheNone(),
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return json(
      {isLoggedIn, isPrivateRoute, isAccountHome, customer},
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was a problem loading account', error);
    session.unset('customerAccessToken');
    return redirect('/account/login', {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    });
  }
}

export default function Acccount() {
  const {customer, isPrivateRoute, isAccountHome} = useLoaderData();

  if (!isPrivateRoute && !isAccountHome) {
    return <Outlet context={{customer}} />;
  }

  return (
    <AccountLayout customer={customer}>
      <br />
      <br />
      <Outlet context={{customer}} />
    </AccountLayout>
  );
}

function AccountLayout({customer, children}) {
  const heading = customer
    ? customer.firstName
      ? `Halo, ${customer.firstName}`
      : `Akun Saya`
    : 'Akun';

  return (
    <div className="min-h-[80vh] bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          {customer?.email && (
            <p className="text-sm text-gray-400 mt-0.5">{customer.email}</p>
          )}
        </div>

        {/* Nav tabs */}
        <AccountMenu />

        {/* Content */}
        <div className="mt-6">
          {children}
        </div>

      </div>
    </div>
  );
}

function AccountMenu() {
  return (
    <nav role="navigation" className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
      {[
        { to: '/account/orders', label: 'Pesanan' },
        { to: '/account/profile', label: 'Profil' },
        { to: '/account/addresses', label: 'Alamat' },
      ].map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form method="POST" action="/account/logout">
      <button
        type="submit"
        className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
      >
        Keluar
      </button>
    </Form>
  );
}

export const CUSTOMER_FRAGMENT = `#graphql
  fragment Customer on Customer {
    acceptsMarketing
    addresses(first: 6) {
      nodes {
        ...Address
      }
    }
    defaultAddress {
      ...Address
    }
    email
    firstName
    lastName
    numberOfOrders
    phone
  }
  fragment Address on MailingAddress {
    id
    formatted
    firstName
    lastName
    company
    address1
    address2
    country
    province
    city
    zip
    phone
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/customer
const CUSTOMER_QUERY = `#graphql
  query Customer(
    $customerAccessToken: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customer(customerAccessToken: $customerAccessToken) {
      ...Customer
    }
  }
  ${CUSTOMER_FRAGMENT}
`;
