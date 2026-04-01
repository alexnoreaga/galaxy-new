import {CartForm, Image, Money} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import {useVariantUrl} from '~/utils';

export function CartMain({layout, cart}) {
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {!linesCount && <CartEmpty layout={layout} />}
      {linesCount && <CartDetails cart={cart} layout={layout} />}
    </div>
  );
}

function CartDetails({layout, cart}) {
  const cartHasItems = !!cart && cart.totalQuantity > 0;

  if (layout === 'page') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <CartLines lines={cart?.lines} layout={layout} />
        </div>
        {/* Summary */}
        {cartHasItems && (
          <div className="lg:col-span-1">
            <CartSummary cost={cart.cost} layout={layout}>
              <CartDiscounts discountCodes={cart.discountCodes} />
              <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
            </CartSummary>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <CartLines lines={cart?.lines} layout={layout} />
      {cartHasItems && (
        <CartSummary cost={cart.cost} layout={layout}>
          <CartDiscounts discountCodes={cart.discountCodes} />
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
        </CartSummary>
      )}
    </div>
  );
}

function CartLines({lines, layout}) {
  if (!lines) return null;

  if (layout === 'page') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {lines.nodes.map((line) => (
            <CartLineItem key={line.id} line={line} layout={layout} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
      <ul className="flex flex-col gap-4">
        {lines.nodes.map((line) => (
          <CartLineItem key={line.id} line={line} layout={layout} />
        ))}
      </ul>
    </div>
  );
}

function CartLineItem({layout, line}) {
  const {merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const isPage = layout === 'page';

  return (
    <li className={`flex gap-4 ${isPage ? 'p-4 sm:p-5' : 'pb-4 border-b border-gray-100 last:border-0'}`}>
      {image && (
        <div className={`flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 ${isPage ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20'}`}>
          <Image
            alt={title}
            aspectRatio="1/1"
            data={image}
            height={isPage ? 112 : 80}
            loading="lazy"
            width={isPage ? 112 : 80}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') window.location.href = lineItemUrl;
          }}
          className="no-underline hover:underline"
        >
          <p className={`font-semibold text-gray-900 leading-tight line-clamp-2 ${isPage ? 'text-sm sm:text-base' : 'text-sm'}`}>
            {product.title}
          </p>
        </Link>

        <ul className="flex flex-wrap gap-x-2 gap-y-0.5">
          {selectedOptions.map((option) => (
            <li key={option.name} className="text-xs text-gray-500">
              {option.name}: {option.value}
            </li>
          ))}
        </ul>

        <div className={`flex items-center justify-between mt-auto ${isPage ? 'pt-2' : 'pt-1'}`}>
          <CartLinePrice line={line} />
          <CartLineQuantity line={line} />
        </div>
      </div>
    </li>
  );
}

function CartCheckoutActions({checkoutUrl}) {
  if (!checkoutUrl) return null;

  return (
    <a
      href={checkoutUrl}
      target="_self"
      className="block w-full bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold text-center py-3.5 rounded-xl transition-colors duration-200 no-underline active:scale-[0.98]"
    >
      Lanjut ke Pembayaran &rarr;
    </a>
  );
}

export function CartSummary({cost, layout, children = null}) {
  if (layout !== 'aside') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-24 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ringkasan Pesanan</h2>
        <div className="flex items-center justify-between py-3 border-t border-b border-gray-100">
          <span className="text-sm text-gray-700">Subtotal</span>
          <span className="font-bold text-lg text-gray-900">
            {cost?.subtotalAmount?.amount ? <Money data={cost.subtotalAmount} /> : '-'}
          </span>
        </div>
        <p className="text-xs text-gray-400">Ongkir & pajak dihitung saat checkout</p>
        {children}
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Subtotal</span>
        <span className="text-lg font-bold text-gray-900">
          {cost?.subtotalAmount?.amount ? <Money data={cost.subtotalAmount} /> : '-'}
        </span>
      </div>
      <p className="text-xs text-gray-400">Ongkir & pajak dihitung saat checkout</p>
      {children}
    </div>
  );
}

function CartLineRemoveButton({lineIds}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        type="submit"
        className="text-xs text-gray-400 hover:text-red-500 transition-colors underline-offset-2 hover:underline"
        aria-label="Hapus item"
      >
        Hapus
      </button>
    </CartForm>
  );
}

function CartLineQuantity({line}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="flex items-center gap-1.5">
      <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
        <button
          aria-label="Kurangi jumlah"
          disabled={quantity <= 1}
          className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
        >
          &#8722;
        </button>
      </CartLineUpdateButton>

      <span className="w-5 text-center text-sm font-medium text-gray-800">{quantity}</span>

      <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <button
          aria-label="Tambah jumlah"
          className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors text-sm"
        >
          &#43;
        </button>
      </CartLineUpdateButton>

      <CartLineRemoveButton lineIds={[lineId]} />
    </div>
  );
}

function CartLinePrice({line, priceType = 'regular', ...passthroughProps}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) return null;

  return (
    <span className="text-sm font-bold text-gray-900">
      <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />
    </span>
  );
}

export function CartEmpty({layout = 'aside'}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-1">Keranjang kamu kosong</p>
      <p className="text-sm text-gray-500 mb-6">Yuk mulai belanja produk kamera favoritmu!</p>
      <Link
        to="/collections"
        onClick={() => {
          if (layout === 'aside') window.location.href = '/collections';
        }}
        className="inline-block bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors no-underline"
      >
        Mulai Belanja
      </Link>
    </div>
  );
}

function CartDiscounts({discountCodes}) {
  const codes =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div className="flex flex-col gap-2">
      {codes.length > 0 && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="font-medium">{codes.join(', ')}</span>
          </div>
          <UpdateDiscountForm>
            <button className="text-xs text-green-600 hover:text-green-800 font-medium">Hapus</button>
          </UpdateDiscountForm>
        </div>
      )}

      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex gap-2">
          <input
            type="text"
            name="discountCode"
            placeholder="Kode diskon"
            className="flex-1 h-9 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            type="submit"
            className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            Pakai
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({discountCodes, children}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{discountCodes: discountCodes || []}}
    >
      {children}
    </CartForm>
  );
}

function CartLineUpdateButton({children, lines}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}
