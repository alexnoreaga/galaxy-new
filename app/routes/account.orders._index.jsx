import {Link, useLoaderData} from '@remix-run/react';
import {Money, Pagination, getPaginationVariables} from '@shopify/hydrogen';
import {json, redirect} from '@shopify/remix-oxygen';

export const meta = () => {
  return [{title: 'Orders'}];
};

export async function loader({request, context}) {
  const {session, storefront} = context;

  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken?.accessToken) {
    return redirect('/account/login');
  }

  try {
    const paginationVariables = getPaginationVariables(request, {
      pageBy: 20,
    });

    const {customer} = await storefront.query(CUSTOMER_ORDERS_QUERY, {
      variables: {
        customerAccessToken: customerAccessToken.accessToken,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        ...paginationVariables,
      },
      cache: storefront.CacheNone(),
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return json({customer});
  } catch (error) {
    if (error instanceof Error) {
      return json({error: error.message}, {status: 400});
    }
    return json({error}, {status: 400});
  }
}

const STATUS_COLORS = {
  FULFILLED: 'bg-emerald-50 text-emerald-700',
  UNFULFILLED: 'bg-amber-50 text-amber-700',
  PARTIALLY_FULFILLED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const FINANCIAL_COLORS = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  REFUNDED: 'bg-gray-100 text-gray-500',
  VOIDED: 'bg-red-50 text-red-600',
};

export default function Orders() {
  const {customer} = useLoaderData();
  const {orders, numberOfOrders} = customer;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">Riwayat Pesanan</h2>
        <span className="text-xs text-gray-400">{numberOfOrders} pesanan</span>
      </div>
      {orders.nodes.length ? <OrdersTable orders={orders} /> : <EmptyOrders />}
    </div>
  );
}

function OrdersTable({orders}) {
  return (
    <Pagination connection={orders}>
      {({nodes, isLoading, PreviousLink, NextLink}) => (
        <div className="flex flex-col gap-3">
          <PreviousLink>
            <div className="flex justify-center mb-2">
              <button className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-400 transition-all ${isLoading ? 'opacity-60' : ''}`}>
                {isLoading ? 'Memuat...' : '↑ Pesanan sebelumnya'}
              </button>
            </div>
          </PreviousLink>

          {nodes.map((order) => <OrderItem key={order.id} order={order} />)}

          <NextLink>
            <div className="flex justify-center mt-2">
              <button className={`inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-all ${isLoading ? 'opacity-60' : ''}`}>
                {isLoading ? 'Memuat...' : 'Muat lebih banyak ↓'}
              </button>
            </div>
          </NextLink>
        </div>
      )}
    </Pagination>
  );
}

function EmptyOrders() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">Belum ada pesanan</p>
      <p className="text-xs text-gray-400 mb-4">Yuk mulai belanja produk kamera favoritmu</p>
      <Link to="/collections" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors">
        Mulai Belanja
      </Link>
    </div>
  );
}

function OrderItem({order}) {
  const fulfillColor = STATUS_COLORS[order.fulfillmentStatus] || 'bg-gray-100 text-gray-500';
  const financialColor = FINANCIAL_COLORS[order.financialStatus] || 'bg-gray-100 text-gray-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.processedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${fulfillColor}`}>
            {order.fulfillmentStatus.replace(/_/g, ' ')}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${financialColor}`}>
            {order.financialStatus}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <p className="text-sm font-bold text-gray-900">
          <Money data={order.currentTotalPrice} />
        </p>
        <Link
          to={`/account/orders/${btoa(order.id)}`}
          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
        >
          Lihat Detail
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

const ORDER_ITEM_FRAGMENT = `#graphql
  fragment OrderItem on Order {
    currentTotalPrice {
      amount
      currencyCode
    }
    financialStatus
    fulfillmentStatus
    id
    lineItems(first: 10) {
      nodes {
        title
        variant {
          image {
            url
            altText
            height
            width
          }
        }
      }
    }
    orderNumber
    customerUrl
    statusUrl
    processedAt
  }
`;

export const CUSTOMER_FRAGMENT = `#graphql
  fragment CustomerOrders on Customer {
    numberOfOrders
    orders(
      sortKey: PROCESSED_AT,
      reverse: true,
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...OrderItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/customer
const CUSTOMER_ORDERS_QUERY = `#graphql
  ${CUSTOMER_FRAGMENT}
  query CustomerOrders(
    $country: CountryCode
    $customerAccessToken: String!
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    customer(customerAccessToken: $customerAccessToken) {
      ...CustomerOrders
    }
  }
`;
