import {json, redirect} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {Money, Image, flattenConnection} from '@shopify/hydrogen';

export const meta = ({data}) => {
  return [{title: `Order ${data?.order?.name}`}];
};

export async function loader({params, context}) {
  const {session, storefront} = context;

  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const customerAccessToken = await session.get('customerAccessToken');

  if (!customerAccessToken) {
    return redirect('/account/login');
  }

  const {order} = await storefront.query(CUSTOMER_ORDER_QUERY, {
    variables: {orderId},
  });

  if (!order || !('lineItems' in order)) {
    throw new Response('Order not found', {status: 404});
  }

  const lineItems = flattenConnection(order.lineItems);
  const discountApplications = flattenConnection(order.discountApplications);

  const firstDiscount = discountApplications[0]?.value;

  const discountValue =
    firstDiscount?.__typename === 'MoneyV2' && firstDiscount;

  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue' &&
    firstDiscount?.percentage;

  return json({
    order,
    lineItems,
    discountValue,
    discountPercentage,
  });
}

const STATUS_COLORS = {
  FULFILLED: 'bg-emerald-50 text-emerald-700',
  UNFULFILLED: 'bg-amber-50 text-amber-700',
  PARTIALLY_FULFILLED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function OrderRoute() {
  const {order, lineItems, discountValue, discountPercentage} = useLoaderData();
  const statusColor = STATUS_COLORS[order.fulfillmentStatus] || 'bg-gray-100 text-gray-600';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link to="/account/orders" className="text-xs text-gray-400 hover:text-gray-600 transition-colors mb-1 inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Semua Pesanan
          </Link>
          <h2 className="text-xl font-bold text-gray-900">{order.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{new Date(order.processedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${statusColor}`}>
          {order.fulfillmentStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</p>
        </div>
        <div className="divide-y divide-gray-50">
          {lineItems.map((lineItem, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <OrderLineRow key={i} lineItem={lineItem} />
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
          {((discountValue && discountValue.amount) || discountPercentage) && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Diskon</span>
              <span>
                {discountPercentage ? `-${discountPercentage}%` : discountValue && <Money data={discountValue} />}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <Money data={order.subtotalPriceV2} />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Pajak</span>
            <Money data={order.totalTaxV2} />
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <Money data={order.totalPriceV2} />
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Alamat Pengiriman</p>
        {order?.shippingAddress ? (
          <address className="not-italic text-sm text-gray-700 leading-relaxed">
            <p className="font-semibold text-gray-900">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            {order.shippingAddress.formatted?.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>
        ) : (
          <p className="text-sm text-gray-400">Tidak ada alamat pengiriman</p>
        )}
      </div>

      {/* CTA */}
      <a
        target="_blank"
        href={order.statusUrl}
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors duration-200"
      >
        Lihat Status Pesanan
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  );
}

function OrderLineRow({lineItem}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Link to={`/products/${lineItem.variant.product.handle}`} className="flex-shrink-0">
        {lineItem?.variant?.image ? (
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            <Image data={lineItem.variant.image} width={56} height={56} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
            </svg>
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{lineItem.title}</p>
        {lineItem.variant.title !== 'Default Title' && (
          <p className="text-xs text-gray-400 mt-0.5">{lineItem.variant.title}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">Qty: {lineItem.quantity}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900"><Money data={lineItem.discountedTotalPrice} /></p>
        {lineItem.quantity > 1 && (
          <p className="text-xs text-gray-400"><Money data={lineItem.variant.price} /> / item</p>
        )}
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Order
const CUSTOMER_ORDER_QUERY = `#graphql
  fragment OrderMoney on MoneyV2 {
    amount
    currencyCode
  }
  fragment AddressFull on MailingAddress {
    address1
    address2
    city
    company
    country
    countryCodeV2
    firstName
    formatted
    id
    lastName
    name
    phone
    province
    provinceCode
    zip
  }
  fragment DiscountApplication on DiscountApplication {
    value {
      __typename
      ... on MoneyV2 {
        ...OrderMoney
      }
      ... on PricingPercentageValue {
        percentage
      }
    }
  }
  fragment OrderLineProductVariant on ProductVariant {
    id
    image {
      altText
      height
      url
      id
      width
    }
    price {
      ...OrderMoney
    }
    product {
      handle
    }
    sku
    title
  }
  fragment OrderLineItemFull on OrderLineItem {
    title
    quantity
    discountAllocations {
      allocatedAmount {
        ...OrderMoney
      }
      discountApplication {
        ...DiscountApplication
      }
    }
    originalTotalPrice {
      ...OrderMoney
    }
    discountedTotalPrice {
      ...OrderMoney
    }
    variant {
      ...OrderLineProductVariant
    }
  }
  fragment Order on Order {
    id
    name
    orderNumber
    statusUrl
    processedAt
    fulfillmentStatus
    totalTaxV2 {
      ...OrderMoney
    }
    totalPriceV2 {
      ...OrderMoney
    }
    subtotalPriceV2 {
      ...OrderMoney
    }
    shippingAddress {
      ...AddressFull
    }
    discountApplications(first: 100) {
      nodes {
        ...DiscountApplication
      }
    }
    lineItems(first: 100) {
      nodes {
        ...OrderLineItemFull
      }
    }
  }
  query Order(
    $country: CountryCode
    $language: LanguageCode
    $orderId: ID!
  ) @inContext(country: $country, language: $language) {
    order: node(id: $orderId) {
      ... on Order {
        ...Order
      }
    }
  }
`;
