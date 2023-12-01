import {useLoaderData, Link} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {Pagination, getPaginationVariables, Image} from '@shopify/hydrogen';
import {defer} from '@shopify/remix-oxygen';

export async function loader({params, context, request}) {

  // const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 100,
  });

  // console.log('testttt',context.storefront.query)

  // const te = context.storefront.query

  const brands = await context.storefront.query(BRANDS_QUERY, {
    variables: {
      type: "brands", // Value for the 'type' variable
      first: 10, // Value for the 'first' variable
      ...paginationVariables
    }, 
  });

  return json({brands});
    // return defer({test});

}

export default function BrandHandle() {
  const {brands} = useLoaderData();



  console.log('ini adalah collection',brands?.metaobjects?.edges)

  return (
    <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
      <h1>Semua Brands</h1>

      <div className="flex flex-wrap justify-center gap-x-2 p-2 items-center shadow-md rounded-lg">
        {brands?.metaobjects?.edges.map((brand)=>{
          
            return(
              <Link key={brand.node.fields[0].value}
              to={`/brands/${brand.node.fields[0].value}`}>
              <div>
                <img className="cursor-pointer w-20 sm:w-28 h-auto hover:shadow-md hover:border rounded-lg p-2" src={brand.node.fields[1].reference.image.url} alt={brand.node.fields[0].value}/>
                {/* <div>{brand.node.fields[1].reference.image.url}</div> */}
              </div>
              </Link>
            )
        })}
    </div>
      
    </div>
  );
}



const BRANDS_QUERY = `#graphql
query BrandQuery($first:Int!,$type: String!) {
    metaobjects(first: $first, type: $type) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
      edges {
        node {
          id
          fields {
            value
            reference {
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
        }
      }
    }
  }
`;


const seo = ({data}) => ({
  title: "Brand Produk Galaxy Camera",
  description: "Brand Pilihan Galaxy Camera",
});

export const handle = {
  seo,
};

