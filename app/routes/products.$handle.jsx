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
import { useHistory ,useLocation } from 'react-router-dom';
import { HitunganPersen } from '~/components/HitunganPersen';


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

    console.log(product.metafields)
    return (
      <>
      <section className="lg:container mx-auto w-full gap-4 md:gap-8 grid px-0 md:px-8 lg:px-12">
        <div className="grid items-start gap-2 lg:gap-2 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid md:grid-flow-row  md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full lg:col-span-2">
            <div className="md:col-span-2 snap-center card-image aspect-square md:w-full w-full">
              
              <ImageGallery productData={product}/>
            </div>
          </div>
          <div className="md:shadow-xl rounded-lg md:sticky md:mx-auto max-w-xl md:max-w-[26rem] grid gap-2 p-2 md:p-2 lg:p-4 md:px-2 top-[6rem] lg:top-[rem] xl:top-[10rem]">



            <div className="grid gap-2 w-full ">
              <h1 className="text-4xl font-bold leading-10 whitespace-normal">
                {product.title}
              </h1>
            </div>

            {/* <div className='flex flex-row gap-1 items-center text-slate-700 text-sm'>
            <div>Garansi Resmi 1 Tahun</div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-sky-400">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
          </div> */}

 

          {product.metafields[1] && (
            <div className="rounded-md text-sm">
              <div className='text-rose-700 text-sm border-solid font-bold border-rose-700 border w-10 text-center rounded mb-1'>
                FREE
              </div>
              <div>
                {product.metafields[1]?.value.split('\n').map(str => <div className='text-sm'>- {str}</div>)}
              </div>
            </div>)}


            

                <div className='text-sm'>
                  {product.options[0].values.length > 1 && (
                  <ProductOptions
                    options={product.options}
                    selectedVariant={selectedVariant}
                  />
                  )}
                  </div>
              
              
                  <div className='flex flex-row gap-2 items-center mb-2'>
              {selectedVariant?.compareAtPrice?.amount > selectedVariant.price.amount && (
                <div className='flex flex-row gap-2'>
                <div className='bg-rose-700 p-1 ml-0 m-auto font-bold text-white text-xs rounded '><HitunganPersen hargaSebelum={selectedVariant.compareAtPrice.amount} hargaSesudah={selectedVariant.price.amount}/></div>
                  <Money
                    withoutTrailingZeros
                    data={{
                      amount: selectedVariant.compareAtPrice.amount,
                      currencyCode: selectedVariant.price.currencyCode,
                    }}
                    className="text-xl line-through text-slate-400"
                  />
                </div>
              )}
            
            
              <Money
                withoutTrailingZeros
                data={selectedVariant.price}
                className={`text-xl font-semibold ${selectedVariant?.compareAtPrice?.amount ? 'text-rose-700' : ''}`}
              />
          </div>   


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

  
  {selectedVariant?.availableForSale
  && <TombolWa product={product}/>}
    
  

    <div className='divide-y mt-2'>

        <Accordion 
        title="Belanja Lewat Marketplace ?" 
        content="Untuk setiap pembelian di Galaxy Digital gratis ongkir hingga ke seluruh Indonesia" 
        icon={(
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
  <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
</svg>
        )}/>

        


        <Accordion 
        title="14 Hari Tukar Baru" 
        content="Jaminan penukaran kembali jika barang yang diterima tidak sesuai / cacat produksi atau salah ukuran." 
        icon={(
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
        </svg>

        )}/>

      <Accordion 
        title="Cicilan Tanpa Kartu Kredit ?" 
        content="Galaxy tersedia juga kredit tanpa kartu kredit, tersedia leasing seperti : Homecredit, Kredivo, Aeon, Indodana, Akulaku & Shopee Paylater. Hubungi admin untuk info lebih lanjut" 
        icon={(
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
        </svg>

        )}/>

</div>



          </div>
        </div>

        <div className='flex gap-2  flex-wrap'>
          <div className='border px-2 cursor-pointer rounded-md text-lg font-bold text-black-700'>
            Deskripsi
          </div>

          <div className='border px-2 cursor-pointer rounded-md text-lg font-bold text-black-700'>
            Spesifikasi
          </div>

          <div className='border px-2 cursor-pointer rounded-md text-lg font-bold text-black-700'>
            Isi Dalam Box
          </div>


        </div>

        
        <div className='flex flex-row items-center gap-1 '>
          <div className='font-bold mr-3'>Garansi</div>
          <div>: Resmi {product.metafields[0]?.value}</div>
        </div>

        {product.metafields[3]?.value &&
        <div className='flex flex-row items-center gap-1 '>
          <div className='font-bold mr-3'>Periode Promo</div>
          <div>: {perubahTanggal(product.metafields[3]?.value)} - {perubahTanggal(product.metafields[4]?.value)}</div>
        </div>
        }

            <div className="w-full prose md:border-t md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/>

      
      </section>

      </>

    );
  }

  function perubahTanggal(tanggalInput){
    const inputDateString = tanggalInput;
    const date = new Date(inputDateString);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate
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




function TombolWa({product}){
  // const infoChat = `Hi admin Galaxy saya berminat tentang produk ${namaProduk}. Boleh dibantu untuk info lebih lanjut`
  const namaProduk = product.title
  const urlProduk = product.handle
  // const urlProduk = window.location.href
//   function componentWillMount() {
//     if (typeof window !== 'undefined') {
//         console.log('window.innerHeight', window.location.href);
//         namaProduk =  window.location.href
//     }
// }

// componentWillMount()

// console.log('Berikut merupakan nama produk ',namaProduk)

  return(
    <>
    

        <div className='gap-2 items-center bg-gradient-to-r from-green-200 to-emerald-800 rounded p-2 cursor-pointer font-semibold text-white text-center'>
            <a href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20bertanya%20tentang%20produk%20"${namaProduk}"%20.%20Link%20Produk:%20" ${urlProduk}`} target="_blank" className='drop-shadow-sm text-white'>ORDER VIA WHATSAPP</a>

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
      metafields(identifiers:[
        {namespace:"custom" key:"garansi"}
        {namespace:"custom" key:"free"}
        {namespace:"custom" key:"isi_dalam_box"}
        {namespace:"custom" key:"periode_promo"}
        {namespace:"custom" key:"periode_promo_akhir"}
      ]){
        key
        value
      }
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


// const seo = ({data}) => ({
//   title: data?.product?.title,
//   description: data?.product?.description.substr(0, 155),
// });

// export const handle = {
//   seo,
// };


export const meta = ({data}) => {
  const lokasi = useLocation()
  const urlSekarang = lokasi.pathname
  const today = new Date();

  console.log('url sekarang',urlSekarang)


  return [
    { title: data?.product?.title },
    {
      name: "description",
      content: data?.product?.description.substr(0, 155),
    },
    {
      property: "og:title",
      content: data?.product?.title,
    },
    {
      name: "keywords",
      content: data?.product?.title,
    },
    {
      property: "og:description",
      content: data?.product?.description.substr(0, 155),
    },
    {
      property: "og:type",
      content: "article",
    },
    {
      property: "og:site_name",
      content: "galaxy.co.id",
    },
    {
      property: "og:image",
      content: data?.product?.featuredImage.url,
    },
    {
      property: "og:url",
      content: 'https://galaxy.co.id'+urlSekarang,
    },
    {
      name: "mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "apple-touch-fullscreen",
      content: "yes",
    },
    {
    name: "apple-mobile-web-app-title",
    content: "Galaxy Camera",
  },
  {
    name: "apple-mobile-web-app-capable",
    content: "yes",
  },
  {
    name: "apple-mobile-web-app-status-bar-style",
    content: "default",
  },


  ];
};





