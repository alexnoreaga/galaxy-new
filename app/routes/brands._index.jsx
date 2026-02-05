import {json} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';

export const meta = () => {
  return [
    {title: 'Semua Brand Kamera - Galaxy Camera'},
    {
      name: 'description',
      content: 'Jelajahi koleksi lengkap brand kamera terbaik di Galaxy Camera. Canon, Sony, Nikon, Fujifilm, dan brand terpercaya lainnya dengan harga kompetitif.',
    },
    {
      name: 'keywords',
      content: 'brand kamera, merk kamera, canon, sony, nikon, fujifilm, panasonic, olympus, galaxy camera',
    },
  ];
};

export async function loader({context}) {
  const {storefront} = context;

  // Get all products to extract unique brands
  const data = await storefront.query(ALL_BRANDS_QUERY, {
    variables: {
      first: 250,
    },
  });

  // Extract unique vendors (brands)
  const brands = [...new Set(data.products.nodes.map(p => p.vendor).filter(Boolean))].sort();

  return json({brands});
}

export default function BrandsIndex() {
  const {brands} = useLoaderData();

  return (
    <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Semua Brand Kamera</h1>
      
      <p className="text-gray-700 mb-8">
        Jelajahi koleksi lengkap produk dari brand kamera terbaik dan terpercaya di Indonesia. 
        Dapatkan produk original dengan harga terbaik dan garansi resmi.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {brands.map((brand) => {
          const brandHandle = brand.toLowerCase().replace(/\s+/g, '-');
          return (
            <Link
              key={brand}
              to={`/brands/${brandHandle}`}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow text-center"
              prefetch="intent"
            >
              <h2 className="text-lg font-semibold text-gray-900">{brand}</h2>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const ALL_BRANDS_QUERY = `#graphql
  query AllBrands($first: Int!) {
    products(first: $first) {
      nodes {
        vendor
      }
    }
  }
`;
