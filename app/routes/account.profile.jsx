import {json, redirect} from '@shopify/remix-oxygen';
import {
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';

// const [emailSekarang,setEmailSekarang] = useState('test')

// export async function emailGo ({context}) {

//   const customerAccessToken = await context.session.get('customerAccessToken');


//   const custEmail = await context.storefront.query(CUSTOMER_EMAIL_QUERY, {
//     variables: {
//       customertoken: customerAccessToken, // Value for the 'first' variable
//     }, 
//   });

//   return {custEmail}
// }




export const meta = () => {
  return [{title: 'Profile'}];
};

export async function loader({context}) {
  const customerAccessToken = await context.session.get('customerAccessToken');
  if (!customerAccessToken) {
    return redirect('/account/login');
  }
  return json({});
}

export async function action({request, context}) {
  const {session, storefront} = context;

  if (request.method !== 'PUT') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();
  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken) {
    return json({error: 'Unauthorized'}, {status: 401});
  }

  try {
    const password = getPassword(form);
    const customer = {};
    const validInputKeys = [
      'firstName',
      'lastName',
      'email',
      'password',
      'phone',
    ];
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key)) {
        continue;
      }
      if (key === 'acceptsMarketing') {
        customer.acceptsMarketing = value === 'on';
      }
      if (typeof value === 'string' && value.length) {
        customer[key] = value;
      }
    }

    if (password) {
      customer.password = password;
    }

    // update customer and possibly password
    const updated = await storefront.mutate(CUSTOMER_UPDATE_MUTATION, {
      variables: {
        customerAccessToken: customerAccessToken.accessToken,
        customer,
      },
    });

    // check for mutation errors
    if (updated.customerUpdate?.customerUserErrors?.length) {
      return json(
        {error: updated.customerUpdate?.customerUserErrors[0]},
        {status: 400},
      );
    }

    // update session with the updated access token
    if (updated.customerUpdate?.customerAccessToken?.accessToken) {
      session.set(
        'customerAccessToken',
        updated.customerUpdate?.customerAccessToken,
      );
    }

    return json(
      {error: null, customer: updated.customerUpdate?.customer},
      {
        headers: {
          'Set-Cookie': await session.commit(),
        },
      },
    );
  } catch (error) {
    return json({error: error.message, customer: null}, {status: 400});
  }
}

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition";
const labelClass = "text-sm font-medium text-gray-700";

export default function AccountProfile() {
  const account = useOutletContext();
  const {state} = useNavigation();
  const action = useActionData();
  const customer = action?.customer ?? account?.customer;

  return (
    <div className="flex flex-col gap-4">

      {/* Personal info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Informasi Pribadi</h2>
        <Form method="PUT" className="flex flex-col gap-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="firstName" className={labelClass}>Nama Depan</label>
              <input id="firstName" name="firstName" type="text" autoComplete="given-name"
                placeholder="Nama depan" aria-label="First name"
                defaultValue={customer.firstName ?? ''} minLength={2} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="lastName" className={labelClass}>Nama Belakang</label>
              <input id="lastName" name="lastName" type="text" autoComplete="family-name"
                placeholder="Nama belakang" aria-label="Last name"
                defaultValue={customer.lastName ?? ''} minLength={2} className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className={labelClass}>Nomor HP</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel"
              placeholder="+6281234567890" aria-label="Mobile"
              defaultValue={customer.phone ?? ''} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required
              placeholder="Email address" aria-label="Email address"
              defaultValue={customer.email ?? ''} className={inputClass} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input id="acceptsMarketing" name="acceptsMarketing" type="checkbox"
              aria-label="Accept marketing" defaultChecked={customer.acceptsMarketing}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
            <span className="text-sm text-gray-600">Terima info promo & penawaran terbaru</span>
          </label>

          <div className="border-t border-gray-100 pt-4 mt-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ganti Password <span className="text-gray-400 normal-case font-normal">(opsional)</span></h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="currentPassword" className={labelClass}>Password Saat Ini</label>
                <input id="currentPassword" name="currentPassword" type="password"
                  autoComplete="current-password" placeholder="Password saat ini"
                  aria-label="Current password" minLength={8} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="newPassword" className={labelClass}>Password Baru</label>
                  <input id="newPassword" name="newPassword" type="password"
                    placeholder="Password baru" aria-label="New password"
                    minLength={8} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="newPasswordConfirm" className={labelClass}>Konfirmasi Password</label>
                  <input id="newPasswordConfirm" name="newPasswordConfirm" type="password"
                    placeholder="Ulangi password baru" aria-label="New password confirm"
                    minLength={8} className={inputClass} />
                </div>
              </div>
              <p className="text-xs text-gray-400">Password minimal 8 karakter.</p>
            </div>
          </div>

          {action?.error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{action.error?.message || action.error}</span>
            </div>
          )}

          <button type="submit" disabled={state !== 'idle'}
            className="w-full sm:w-auto sm:self-end bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors duration-200 active:scale-[0.98]">
            {state !== 'idle' ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </Form>
      </div>

    </div>
  );
}

function getPassword(form) {
  let password;
  const currentPassword = form.get('currentPassword');
  const newPassword = form.get('newPassword');
  const newPasswordConfirm = form.get('newPasswordConfirm');

  let passwordError;
  if (newPassword && !currentPassword) {
    passwordError = new Error('Current password is required.');
  }

  if (newPassword && newPassword !== newPasswordConfirm) {
    passwordError = new Error('New passwords must match.');
  }

  if (newPassword && currentPassword && newPassword === currentPassword) {
    passwordError = new Error(
      'New password must be different than current password.',
    );
  }

  if (passwordError) {
    throw passwordError;
  }

  if (currentPassword && newPassword) {
    password = newPassword;
  } else {
    password = currentPassword;
  }

  return String(password);
}

const CUSTOMER_UPDATE_MUTATION = `#graphql
  # https://shopify.dev/docs/api/storefront/latest/mutations/customerUpdate
  mutation customerUpdate(
    $customerAccessToken: String!,
    $customer: CustomerUpdateInput!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
      customer {
        acceptsMarketing
        email
        firstName
        id
        lastName
        phone
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;







