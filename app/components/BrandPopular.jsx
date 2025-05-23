import { Await, Link, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';

export const BrandPopular = ({ brands }) => {
  return (
    <Suspense fallback={<div>Loading popular brands...</div>}>
      <Await resolve={brands}>
        {(resolvedBrands) => (
          <div className="my-6">
            <div className="flex flex-row items-center justify-between m-1 mb-2">
              <div className="text-slate-800 text-sm sm:text-lg sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead">
                Brand Popular
              </div>
              <Link to={`/brands/`}>
                <div className="text-slate-500 block mx-1 text-sm sm:text-md">
                  Lihat Semua
                </div>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-x-2 p-2 items-center shadow-md rounded-lg">
              {resolvedBrands.map((brand, index) => (
                <Link to={`/brands/${brand.metaobject.fields[0].value}`} key={index}>
                  <img
                    className="cursor-pointer w-20 sm:w-28 h-auto hover:shadow-md hover:border rounded-lg p-2"
                    src={brand.metaobject.fields[1].reference.image.url}
                    alt={brand.metaobject.fields[0].value}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </Await>
    </Suspense>
  );
};
