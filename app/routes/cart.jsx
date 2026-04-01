import {Await, useMatches} from '@remix-run/react';
import {Suspense} from 'react';
import {CartForm} from '@shopify/hydrogen';
import {json} from '@shopify/remix-oxygen';
import {CartMain} from '~/components/Cart';

export const meta = () => {
  return [{title: `Galaxy Camera | Cart`}];
};

export async function action({request, context}) {
  const {session, cart} = context;

  const [formData, customerAccessToken] = await Promise.all([
    request.formData(),
    session.get('customerAccessToken'),
  ]);

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = formDiscountCode ? [formDiscountCode] : [];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
        customerAccessToken: customerAccessToken?.accessToken,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result.cart.id;
  const headers = cart.setCartId(result.cart.id);
  const {cart: cartResult, errors} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return json(
    {
      cart: cartResult,
      errors,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export default function Cart() {
  const [root] = useMatches();
  const cart = root.data?.cart;

  return (
    <div className="min-h-[70vh] bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Keranjang Belanja</h1>
        <Suspense fallback={<p className="text-gray-500 text-sm">Memuat keranjang...</p>}>
          <Await errorElement={<div className="text-red-500 text-sm">Terjadi kesalahan.</div>} resolve={cart}>
            {(cart) => <CartMain layout="page" cart={cart} />}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
