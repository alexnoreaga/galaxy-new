import {useLoaderData} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
// import {Image} from '@shopify/hydrogen-react';
import ProductOptions from '~/components/ProductOptions';
import {Image, Money, ShopPayButton} from '@shopify/hydrogen-react';
import {CartForm} from '@shopify/hydrogen';
import { ProductGallery } from '~/components/ProductGallery';
import React, { useState } from 'react';
import ProductCard from '~/components/ProductCard';



export async function loader({params, context, request}) {
    const {handle} = params;
    const searchParams = new URL(request.url).searchParams;
    const selectedOptions = [];
  
    // set selected options from the query string
    searchParams.forEach((value, name) => {
      selectedOptions.push({name, value});
    });
  
    const {shop, product} = await context.storefront.query(PRODUCT_QUERY, {
        variables: {
          handle,
          selectedOptions,
        },
      });
      
    // if (!product?.id) {
    //   throw new Response(null, {status: 404});
    // }
  
    // return json({
    //   product,
    // });

    // Set a default variant so you always have an "orderable" product selected
const selectedVariant =
product.selectedVariant ?? product?.variants?.nodes[0];

return json({
    shop,
    product,
    selectedVariant,
  });
  

  }
  




  export default function ProductHandle() {
    const {shop, product, selectedVariant} = useLoaderData();
    console.log(product.options[0].values.length)
    
    console.log('Ini adalah produk ke 1',product)
    return (
      <section className="lg:container mx-auto w-full gap-4 md:gap-8 grid px-0 md:px-8 lg:px-12">
        <div className="grid items-start gap-6 lg:gap-2 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid md:grid-flow-row  md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full lg:col-span-2">
            <div className="md:col-span-2 snap-center card-image aspect-square md:w-full w-full">
              <ImageGallery productData={product}/>
            </div>
          </div>
          <div className="md:shadow-xl rounded-lg md:sticky md:mx-auto max-w-xl md:max-w-[24rem] grid gap-2 p-2 md:p-2 md:px-4 top-[6rem] lg:top-[rem] xl:top-[10rem]">

            <div className="grid gap-2">
              <h1 className="text-4xl font-bold leading-10 whitespace-normal">
                {product.title}
              </h1>
              {/* <span className="max-w-prose whitespace-pre-wrap inherit text-copy opacity-50 font-medium">
                {product.vendor}
              </span> */}
            </div>
                
            {product.options[0].values.length > 1 && (
              <ProductOptions
                options={product.options}
                selectedVariant={selectedVariant}
              />
              )}

          <Money
            withoutTrailingZeros
            data={selectedVariant.price}
            className="text-xl font-semibold mb-2"
          />


<CartForm
  route="/cart"
  inputs={{
    lines: [
      {
        merchandiseId: selectedVariant.id,
      },
    ],
  }}
  action={CartForm.ACTIONS.LinesAdd}
>
  {(fetcher) => (
    <>
      <button
        type="submit"
        onClick={() => {
          window.location.href = window.location.href + '#cart-aside';
        }}
        disabled={
          !selectedVariant.availableForSale ??
          fetcher.state !== 'idle'
        }
        className="border border-black rounded-sm w-full px-4 py-2 text-white bg-black uppercase hover:bg-white hover:text-black transition-colors duration-150"
      >
        {selectedVariant?.availableForSale
          ? 'Beli Langsung'
          : 'Sold out'}
      </button>
    </>
  )}
  </CartForm>

    <TombolWa/>

  <InfoExtraTambahan/>

          </div>
        </div>

        <div
  className="w-full prose border-t border-gray-200 pt-6 text-black text-md"
  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/>
      
      </section>
    );
  }
  



  const ImageGallery = ({ productData }) => {

    const [selectedImage, setSelectedImage] = useState(productData.images.edges[0].node.src);
    const [startIndex, setStartIndex] = useState(0);


    const handleImageChange = (newImageSrc) => {
      setSelectedImage(newImageSrc);
    };
  
    const nextImages = () => {
      const nextStartIndex = startIndex + 4;
      if (nextStartIndex < productData.images.edges.length) {
        setStartIndex(nextStartIndex);
        handleImageChange(productData.images.edges[nextStartIndex].node.src);
      }
    };
  
    const previousImages = () => {
      const previousStartIndex = startIndex - 4;
      if (previousStartIndex >= 0) {
        setStartIndex(previousStartIndex);
        handleImageChange(productData.images.edges[previousStartIndex].node.src);
      }
    };
  
    const displayedImages = productData.images.edges.slice(startIndex, startIndex + 4);

    // console.log('Ini displyaed images', displayedImages)
  
    return (
      <div className="flex flex-col space-y-4 md:space-y-0 md:space-x-4">
        <div className="md:w-4/5 mx-auto ">
          <img src={selectedImage} alt="Product" className="w-full h-auto shadow rounded" />
        </div>
        <div className="md:w-5/5 ">
          <div className="grid grid-cols-4 gap-4 md:mt-4 w-4/5 mx-auto">
            {displayedImages.map((image) => (
              <div
                key={image.node.src}
                onClick={() => handleImageChange(image.node.src)}
                className={`rounded-lg cursor-pointer transition-opacity duration-300 hover:opacity-75 ${selectedImage === image.node.src ? 'opacity-75' : 'opacity-100'}`}
              >
                <img src={image.node.src} alt="Product" className="w-full h-auto md:mx-auto p-1 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {startIndex > 0 && (
              <button onClick={previousImages} className="text-blue-500 hover:text-blue-700">
                Previous
              </button>
            )}
            {startIndex + 4 < productData.images.edges.length && (
              <button onClick={nextImages} className="text-blue-500 hover:text-blue-700">
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };


function InfoExtraTambahan(){
  return(
    <>
      <div className='flex flex-row gap-2 items-center'>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
        </svg>
      
      <p className='text-sm text-slate-500'>Harga Sudah Termasuk PPN</p>

      </div>




    </>
  )
}

function TombolWa(){
  return(
    <>
    

        <div className='gap-2 items-center bg-gradient-to-r from-green-200 to-emerald-800 rounded p-2 cursor-pointer font-semibold text-white text-center'>
            <div>WA ADMIN</div>
      </div>

     

    </>
  )
}


  const PRODUCT_QUERY = `#graphql
  query product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
    shop {
      primaryDomain {
        url
      }
    }

    product(handle: $handle) {
      images(first:10){
        edges{
          node{
            src
          }
        }
      }

      id
      title
      handle
      vendor
      description
      descriptionHtml
      featuredImage {
        id
        url
        altText
        width
        height
      }
      options {
        name,
        values
      }
      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          price {
            currencyCode
            amount
          }
          compareAtPrice {
            currencyCode
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;


const seo = ({data}) => ({
  title: data?.product?.title,
  description: data?.product?.description.substr(0, 155),
});

export const handle = {
  seo,
};





