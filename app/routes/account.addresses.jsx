import {json, redirect} from '@shopify/remix-oxygen';
import {
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from '@remix-run/react';

export const meta = () => {
  return [{title: 'Addresses'}];
};

export async function loader({context}) {
  const {session} = context;
  const customerAccessToken = await session.get('customerAccessToken');
  if (!customerAccessToken) {
    return redirect('/account/login');
  }
  return json({});
}

export async function action({request, context}) {
  const {storefront, session} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    const customerAccessToken = await session.get('customerAccessToken');
    if (!customerAccessToken) {
      return json({error: {[addressId]: 'Unauthorized'}}, {status: 401});
    }
    const {accessToken} = customerAccessToken;

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : null;
    const address = {};
    const keys = [
      'address1',
      'address2',
      'city',
      'company',
      'country',
      'firstName',
      'lastName',
      'phone',
      'province',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {customerAddressCreate} = await storefront.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {customerAccessToken: accessToken, address},
            },
          );

          if (customerAddressCreate?.customerUserErrors?.length) {
            const error = customerAddressCreate.customerUserErrors[0];
            throw new Error(error.message);
          }

          const createdAddress = customerAddressCreate?.customerAddress;
          if (!createdAddress?.id) {
            throw new Error(
              'Expected customer address to be created, but the id is missing',
            );
          }

          if (defaultAddress) {
            const createdAddressId = decodeURIComponent(createdAddress.id);
            const {customerDefaultAddressUpdate} = await storefront.mutate(
              UPDATE_DEFAULT_ADDRESS_MUTATION,
              {
                variables: {
                  customerAccessToken: accessToken,
                  addressId: createdAddressId,
                },
              },
            );

            if (customerDefaultAddressUpdate?.customerUserErrors?.length) {
              const error = customerDefaultAddressUpdate.customerUserErrors[0];
              throw new Error(error.message);
            }
          }

          return json({error: null, createdAddress, defaultAddress});
        } catch (error) {
          if (error instanceof Error) {
            return json({error: {[addressId]: error.message}}, {status: 400});
          }
          return json({error: {[addressId]: error}}, {status: 400});
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {customerAddressUpdate} = await storefront.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                customerAccessToken: accessToken,
                id: decodeURIComponent(addressId),
              },
            },
          );

          const updatedAddress = customerAddressUpdate?.customerAddress;

          if (customerAddressUpdate?.customerUserErrors?.length) {
            const error = customerAddressUpdate.customerUserErrors[0];
            throw new Error(error.message);
          }

          if (defaultAddress) {
            const {customerDefaultAddressUpdate} = await storefront.mutate(
              UPDATE_DEFAULT_ADDRESS_MUTATION,
              {
                variables: {
                  customerAccessToken: accessToken,
                  addressId: decodeURIComponent(addressId),
                },
              },
            );

            if (customerDefaultAddressUpdate?.customerUserErrors?.length) {
              const error = customerDefaultAddressUpdate.customerUserErrors[0];
              throw new Error(error.message);
            }
          }

          return json({error: null, updatedAddress, defaultAddress});
        } catch (error) {
          if (error instanceof Error) {
            return json({error: {[addressId]: error.message}}, {status: 400});
          }
          return json({error: {[addressId]: error}}, {status: 400});
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {customerAddressDelete} = await storefront.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {customerAccessToken: accessToken, id: addressId},
            },
          );

          if (customerAddressDelete?.customerUserErrors?.length) {
            const error = customerAddressDelete.customerUserErrors[0];
            throw new Error(error.message);
          }
          return json({error: null, deletedAddress: addressId});
        } catch (error) {
          if (error instanceof Error) {
            return json({error: {[addressId]: error.message}}, {status: 400});
          }
          return json({error: {[addressId]: error}}, {status: 400});
        }
      }

      default: {
        return json(
          {error: {[addressId]: 'Method not allowed'}},
          {status: 405},
        );
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return json({error: error.message}, {status: 400});
    }
    return json({error}, {status: 400});
  }
}

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition";
const labelClass = "text-sm font-medium text-gray-700";

export default function Addresses() {
  const {customer} = useOutletContext();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="flex flex-col gap-4">

      {/* New address form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tambah Alamat Baru</h2>
        <NewAddressForm />
      </div>

      {/* Existing addresses */}
      {addresses.nodes.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Alamat Tersimpan</h2>
          <ExistingAddresses addresses={addresses} defaultAddress={defaultAddress} />
        </div>
      )}

      {!addresses.nodes.length && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-8 text-center">
          <p className="text-sm text-gray-400">Belum ada alamat tersimpan.</p>
        </div>
      )}
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '', address2: '', city: '', company: '', country: '',
    firstName: '', id: 'new', lastName: '', phone: '', province: '', zip: '',
  };
  return (
    <AddressForm address={newAddress} defaultAddress={null}>
      {({stateForMethod}) => (
        <button disabled={stateForMethod('POST') !== 'idle'} formMethod="POST" type="submit"
          className="w-full sm:w-auto bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors duration-200">
          {stateForMethod('POST') !== 'idle' ? 'Menyimpan...' : 'Simpan Alamat'}
        </button>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({addresses, defaultAddress}) {
  return (
    <>
      {addresses.nodes.map((address) => (
        <div key={address.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5">
          {defaultAddress?.id === address.id && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Alamat Utama
            </span>
          )}
          <AddressForm address={address} defaultAddress={defaultAddress}>
            {({stateForMethod}) => (
              <div className="flex gap-2 flex-wrap">
                <button disabled={stateForMethod('PUT') !== 'idle'} formMethod="PUT" type="submit"
                  className="bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white font-semibold py-2 px-5 rounded-xl text-sm transition-colors duration-200">
                  {stateForMethod('PUT') !== 'idle' ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button disabled={stateForMethod('DELETE') !== 'idle'} formMethod="DELETE" type="submit"
                  className="bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 font-semibold py-2 px-5 rounded-xl text-sm transition-colors duration-200">
                  {stateForMethod('DELETE') !== 'idle' ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            )}
          </AddressForm>
        </div>
      ))}
    </>
  );
}

export function AddressForm({address, defaultAddress, children}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData();
  const error = action?.error?.[address.id];
  const isDefaultAddress = defaultAddress?.id === address.id;

  return (
    <Form id={address.id} className="flex flex-col gap-4">
      <input type="hidden" name="addressId" defaultValue={address.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="firstName" className={labelClass}>Nama Depan *</label>
          <input aria-label="First name" autoComplete="given-name" defaultValue={address?.firstName ?? ''}
            id="firstName" name="firstName" placeholder="Nama depan" required type="text" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lastName" className={labelClass}>Nama Belakang *</label>
          <input aria-label="Last name" autoComplete="family-name" defaultValue={address?.lastName ?? ''}
            id="lastName" name="lastName" placeholder="Nama belakang" required type="text" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="company" className={labelClass}>Perusahaan</label>
        <input aria-label="Company" autoComplete="organization" defaultValue={address?.company ?? ''}
          id="company" name="company" placeholder="Nama perusahaan (opsional)" type="text" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address1" className={labelClass}>Alamat *</label>
        <input aria-label="Address line 1" autoComplete="address-line1" defaultValue={address?.address1 ?? ''}
          id="address1" name="address1" placeholder="Jalan, No. Rumah" required type="text" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address2" className={labelClass}>Alamat 2</label>
        <input aria-label="Address line 2" autoComplete="address-line2" defaultValue={address?.address2 ?? ''}
          id="address2" name="address2" placeholder="Apartemen, Gedung, dll (opsional)" type="text" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="city" className={labelClass}>Kota *</label>
          <input aria-label="City" autoComplete="address-level2" defaultValue={address?.city ?? ''}
            id="city" name="city" placeholder="Kota" required type="text" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="province" className={labelClass}>Provinsi *</label>
          <input aria-label="State" autoComplete="address-level1" defaultValue={address?.province ?? ''}
            id="province" name="province" placeholder="Provinsi" required type="text" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="zip" className={labelClass}>Kode Pos *</label>
          <input aria-label="Zip" autoComplete="postal-code" defaultValue={address?.zip ?? ''}
            id="zip" name="zip" placeholder="Kode pos" required type="text" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="country" className={labelClass}>Negara *</label>
          <input aria-label="Country" autoComplete="country-name" defaultValue={address?.country ?? ''}
            id="country" name="country" placeholder="Negara" required type="text" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className={labelClass}>Nomor HP</label>
        <input aria-label="Phone" autoComplete="tel" defaultValue={address?.phone ?? ''}
          id="phone" name="phone" placeholder="+6281234567890" pattern="^\+?[1-9]\d{3,14}$"
          type="tel" className={inputClass} />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input defaultChecked={isDefaultAddress} id="defaultAddress" name="defaultAddress" type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
        <span className="text-sm text-gray-600">Jadikan alamat utama</span>
      </label>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {children({stateForMethod: (method) => (formMethod === method ? state : 'idle')})}
    </Form>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/2023-04/mutations/customeraddressupdate
const UPDATE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressUpdate(
    $address: MailingAddressInput!
    $customerAccessToken: String!
    $id: ID!
    $country: CountryCode
    $language: LanguageCode
 ) @inContext(country: $country, language: $language) {
    customerAddressUpdate(
      address: $address
      customerAccessToken: $customerAccessToken
      id: $id
    ) {
      customerAddress {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/mutations/customerAddressDelete
const DELETE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressDelete(
    $customerAccessToken: String!,
    $id: ID!,
    $country: CountryCode,
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      customerUserErrors {
        code
        field
        message
      }
      deletedCustomerAddressId
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/mutations/customerdefaultaddressupdate
const UPDATE_DEFAULT_ADDRESS_MUTATION = `#graphql
  mutation customerDefaultAddressUpdate(
    $addressId: ID!
    $customerAccessToken: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customerDefaultAddressUpdate(
      addressId: $addressId
      customerAccessToken: $customerAccessToken
    ) {
      customer {
        defaultAddress {
          id
        }
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/mutations/customeraddresscreate
const CREATE_ADDRESS_MUTATION = `#graphql
  mutation customerAddressCreate(
    $address: MailingAddressInput!
    $customerAccessToken: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customerAddressCreate(
      address: $address
      customerAccessToken: $customerAccessToken
    ) {
      customerAddress {
        id
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;
