import {json} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import {getCatalogIndex} from '~/lib/catalogIndex';

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

  // Every brand in the catalog with product counts (full walk, cached) — the old version sampled
  // the first 250 products and missed most brands.
  let brands = [];
  try {
    const idx = await getCatalogIndex(storefront);
    brands = idx.brands.filter((b) => b.count > 0).map((b) => ({name: b.name, handle: b.handle, count: b.count, categories: b.categories.slice(0, 3).map((c) => c.name)}))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    const data = await storefront.query(ALL_BRANDS_QUERY, {variables: {first: 250}});
    brands = [...new Set(data.products.nodes.map(p => p.vendor).filter(Boolean))].sort().map((name) => ({name, handle: name.toLowerCase().replace(/\s+/g, '-'), count: 0, categories: []}));
  }

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
        {brands.map((brand) => (
          <Link
            key={brand.handle}
            to={`/brands/${brand.handle}`}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-900 transition-colors text-center no-underline"
            prefetch="intent"
          >
            <h2 className="text-base font-semibold text-gray-900">{brand.name}</h2>
            {brand.count > 0 && (
              <p className="mt-1 text-xs text-gray-500">{brand.count} produk{brand.categories.length ? ` · ${brand.categories.join(', ')}` : ''}</p>
            )}
          </Link>
        ))}
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
