import {useLoaderData} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
// import {Image} from '@shopify/hydrogen-react';
import ProductOptions from '~/components/ProductOptions';
import {Image, Money, ShopPayButton} from '@shopify/hydrogen-react';
import {CartForm} from '@shopify/hydrogen';
import { ProductGallery } from '~/components/ProductGallery';
import React, { useState } from 'react';
import ProductCard from '~/components/ProductCard';
import { Accordion } from '~/components/Accordion';



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
           <InfoExtraTambahan/>


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

 
  <Accordion title="Pengiriman Gratis se-Indonesia" content="Untuk setiap pembelian di Galaxy Digital gratis ongkir hingga ke seluruh Indonesia" icon={(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
  <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
</svg>


)}/>

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
          <div className="grid grid-cols-4 gap-4 md:mt-4 w-5/5 mx-auto">
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
        
      
      <p className='text-sm text-slate-500'>Harga Sudah Termasuk PPN</p>

      </div>




    </>
  )
}

function TombolWa(){
  return(
    <>
    

        <div className='gap-2 items-center bg-gradient-to-r from-green-200 to-emerald-800 rounded p-2 cursor-pointer font-semibold text-white text-center'>
            <div className='drop-shadow-sm'>ORDER VIA WHATSAPP</div>
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





