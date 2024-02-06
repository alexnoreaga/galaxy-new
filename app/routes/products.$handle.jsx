import {useLoaderData,Link} from '@remix-run/react';
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
import {InfoProduk} from '~/components/InfoProduk';
import {ParseSpesifikasi} from '~/components/ParseSpesifikasi';
import {LiveShopee} from '~/components/LiveShopee';
import { Modal } from '~/components/Modal';

export async function loader({params, context, request}) {

  const {session} = context;
  const customerAccessToken = await session.get('customerAccessToken');


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

      const liveshopee = await context.storefront.query(METAOBJECT_LIVE_SHOPEE, {
        variables: {
          type: "live_shopee", // Value for the 'type' variable
          first: 4, // Value for the 'first' variable
        },
      });

      const marketplace = await context.storefront.query(METAOBJECT_MARKETPLACE, {
        variables: {
          type: "marketplace", // Value for the 'type' variable
          first: 10, // Value for the 'first' variable
        },
      });

      const canonicalUrl = request.url
    

      // Set a default variant so you always have an "orderable" product selected
      const selectedVariant =
      product.selectedVariant ?? product?.variants?.nodes[0];
      
      const brandValue = product.metafields[6]?.key == 'brand' && product.metafields[6].value

      if (brandValue) {
        
        const metaobject = await context.storefront.query(METAOBJECT_QUERY, {
          variables: {
            id: brandValue,
          },
        });


        return json({
          shop,
          product,
          selectedVariant,
          metaobject,
          liveshopee,
          marketplace,
          customerAccessToken,
          canonicalUrl,
        });

      }else{
        console.error('Brand value not found.');

        return json({
          shop,
          product,
          selectedVariant,
          liveshopee,
          marketplace,
          customerAccessToken,
          canonicalUrl,

        });


      }
      
      
 





  

  }
  




  export default function ProductHandle() {
    const {canonicalUrl,customerAccessToken,shop, product, selectedVariant,metaobject,liveshopee,marketplace} = useLoaderData();

    // console.log(customerAccessToken)
    // console.log('produk ',product?.metafields[12]?.value)
    // console.log('liveshopee',liveshopee)
    // console.log('marketplace',marketplace)

    // console.log(liveshopee.metaobjects?.edges[0]?.node)

    console.log('Garansissssssssssssssssssssssssss ',product)

    const [bukaModal, setBukaModal] = useState(false)

    const copyToClipboard = () => {
      const textToCopy = `${product.title}${product?.selectedVariant?.title? ' - ' + product?.selectedVariant?.title :''}\n` +
      `Harga : Rp ${parseFloat(selectedVariant.price.amount).toLocaleString()}\n`+
      `${product?.metafields[0]?.value ? 'Garansi : ' + product?.metafields[0]?.value + ' ' + (product.vendor !== 'galaxy' && product.vendor) + '\n':''}`+
      `${product?.metafields[3]?.value ? 'Periode : ' + perubahTanggal(product.metafields[3]?.value) + ' - ' + perubahTanggal(product.metafields[4]?.value) + '\n':''}`+
      `Link : ${canonicalUrl}`;

      // perubahTanggal(product.metafields[3]?.value)
      // Create a temporary textarea to copy the text
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      
      // Select and copy the text
      textArea.select();
      document.execCommand('copy');
      
      // Remove the temporary textarea
      document.body.removeChild(textArea);
    };
  



    return (
      <>
      <section className="lg:container mx-auto w-full gap-2 md:gap-2 grid px-0 md:px-8 lg:px-12">
        <div className="grid grid-cols-none items-start gap-2 lg:gap-2 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid md:grid-flow-row  md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full lg:col-span-2">
            <div className="md:col-span-2 snap-center card-image aspect-square md:w-full w-full">
              
              <ImageGallery productData={product}/>
            </div>
          </div>
          {/* <div className="md:shadow-xl rounded-lg md:sticky md:mx-auto max-w-xl md:max-w-[26rem] grid gap-2 p-2 md:p-2 lg:p-4 md:px-2 top-[6rem] lg:top-[rem] xl:top-[10rem]"> */}
          <div>
          <div className="md:shadow-xl rounded-lg md:sticky md:mx-auto max-w-xl md:max-w-[26rem] grid gap-2 p-2 md:p-2 lg:p-4 md:px-2 ">



            <div className="grid gap-2 w-full">
              <h1 className="text-4xl font-bold leading-10 whitespace-normal " onClick={copyToClipboard}>
                {product.title}
              </h1>
              {/* <h1 className="md:leading-10 whitespace-normal font-bold text-transparent sm:text-2xl md:text-4xl bg-clip-text bg-gradient-to-r from-gray-950 to-rose-700">
                {product.title}
              </h1> */}
            </div>

<div className='flex flex-row gap-1'>
            {!product?.metafields[12]?.value && selectedVariant?.availableForSale && (
  <div className='w-26 p-1 items-center rounded-full border border-gray-200'>
    <div className='m-auto flex flex-row'>
      <div className='text-xs m-auto text-gray-400 pr-1'>Stock Ready</div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="m-auto w-5 h-5 text-emerald-500">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
)}

{product.metafields[0]?.value && (
  <div className='w34 p-1 items-center rounded-full border border-gray-200'>
    <div className='m-auto flex flex-row'>
      <div className='text-xs m-auto text-gray-400 pr-1'>Garansi Resmi</div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="m-auto w-5 h-5 text-emerald-500">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
)}
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
                {product.metafields[1]?.value.split('\n').map(str => <div className='text-sm' key={str}>{str}</div>)}
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
              {parseFloat(selectedVariant?.compareAtPrice?.amount) > parseFloat(selectedVariant.price.amount) && (
                <div className='flex flex-row gap-2'>
                <div className='bg-rose-700 p-1 ml-0 m-auto font-bold text-white text-xs rounded '><HitunganPersen hargaSebelum={selectedVariant.compareAtPrice.amount} hargaSesudah={selectedVariant.price.amount}/></div>
                  {/* <Money
                    withoutTrailingZeros
                    data={{
                      amount: selectedVariant.compareAtPrice.amount,
                      currencyCode: selectedVariant.price.currencyCode,
                    }}
                    className="text-xl line-through text-slate-600"
                  /> */}
                  <div className="text-xl line-through text-slate-600">Rp{parseFloat(selectedVariant.compareAtPrice.amount).toLocaleString()}</div>
                </div>
              )}
            
              {/* <Money
                withoutTrailingZeros
                data={selectedVariant.price}
                className={`text-xl font-semibold ${selectedVariant?.compareAtPrice?.amount ? 'text-rose-700' : ''}`}
              /> */}
              <div className={`text-xl font-semibold ${selectedVariant?.compareAtPrice?.amount ? 'text-rose-700' : 'text-rose-700'}`}>Rp{parseFloat(selectedVariant.price.amount).toLocaleString()}</div>
          </div> 

          <div>Cicilan Mulai dari</div>
          <div onClick={()=>setBukaModal(true)} className="text-rose-700 font-semibold text-md cursor-pointer">Lihat Angsuran</div>  



{!product?.metafields[12]?.value  &&(
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
        className="border flex justify-center gap-1 items-center border-black rounded-sm w-full px-4 py-2 text-white bg-black uppercase hover:bg-white hover:text-black transition-colors duration-150"
      >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>

          <span>
        {selectedVariant?.availableForSale
          ? 'Beli Langsung'
          : 'Sold out'}
          </span>
      </button>
    </>
  )}
  </CartForm>
  )
}


  
  {selectedVariant?.availableForSale
  && <TombolWa product={product}/>}

  {product?.metafields[12]?.value && <TombolWaDiscontinue product={product} />}


    {liveshopee.metaobjects?.edges[0]?.node?.fields[1].value == 'true' && <LiveShopee url={liveshopee.metaobjects?.edges[0]?.node?.fields[0].value}/>}

  
    
  

    <div className='divide-y mt-2'>

        <Accordion 
        title="Belanja Lewat Marketplace ?" 
        content={(<MarketPlace link={product.metafields}/>)}
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




          {product.metafields[2]?.value &&    
          <div className='hidden border lg:block mx-auto w-full mt-2 lg:mr-7 sticky shadow-xl max-w-xl md:max-w-[26rem] rounded-lg md:sticky p-1 md:p-2 lg:p-4 md:px-2 '>
            <div className='bg-black flex gap-1  justify-center text-white border py-2 border-solid items-center font-bold rounded-md m-auto text-center'>
              
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                <div>Isi Dalam Box</div>

            </div>
            <div className='mt-2'>
            {product.metafields[2]?.value.split('\n').map(str => <div className='text-sm p-1' key={str}>{str}</div>)}
            </div>

          </div>}
          




          </div>




          

          
        </div>

    

      
    <div className='p-1 text-sm flex flex-col md:flex-row sm:gap-8'>
        
        {metaobject?.metaobject?.field?.value &&
        <div className='flex flex-row gap-1 mb-1 pl-1'>
          <div className=' mr-3 '>Brand</div>
          <Link 
          to={`/brands/${metaobject.metaobject.field?.value}`}>
          <div className='font-bold'>{metaobject.metaobject.field?.value}</div>
          </Link>
        </div>
        }


        {product.metafields[0]?.value &&
        <div className='flex flex-row gap-1 mb-1 pl-1'>
          <div className=' mr-3 '>Garansi</div>
          <div className='font-bold'>Resmi {product.metafields[0]?.value} {product.vendor !== 'galaxy' && product.vendor}</div>
        </div>
      }

        {product.metafields[3]?.value &&
        <div className='flex flex-row gap-1 mb-1 pl-1'>
          <div className=' mr-3 '>Periode</div>
          <div className='font-bold'>{perubahTanggal(product.metafields[3]?.value)} - {perubahTanggal(product.metafields[4]?.value)}</div>
        </div>
        }



    </div>
{/* 
            <div className="w-full prose md:border-t md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/> */}


            {/* <div className="w-full prose md:border-t md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html:product.metafields[5]?.value }}/> */}
        <div>

        <div className='sm:grid sm:grid-cols-2 md:grid md:grid-cols-2'>
        <InfoProduk 
        deskripsi={(<div className="w-full prose  md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}/>)}
        
        isibox={product.metafields[2]?.value}
        specs={(<div className="w-full prose md:border-gray-200 pt-2 text-black text-md"
              dangerouslySetInnerHTML={{ __html:product.metafields[5]?.value }}/>)}
        />
      




          </div>



        </div>

        {/* <ParseSpesifikasi jsonString={product.metafields[5]?.value}/> */}

           


{/* <div className='flex gap-2  flex-wrap justify-between'>
    <div className='flex gap-2  flex-wrap m-auto ml-0 mt-0'>
      <div className='border px-2 cursor-pointer rounded-md  font-bold text-black-700'>
        Deskripsi
      </div>

      <div className='border px-2 cursor-pointer rounded-md  font-bold text-black-700'>
        Spesifikasi
      </div>

      <div className='border px-2 cursor-pointer rounded-md font-bold text-black-700'>
        Isi Dalam Box
      </div>
    </div>
</div> */}

      {bukaModal&&<Modal statusOpen={bukaModal} setBukaModal={setBukaModal}/>}


      </section>

      </>

    );
  }



function MarketPlace({link}){
  
  const {marketplace} = useLoaderData();
  return(
    <div className='flex flex-wrap gap-2'>
      {marketplace.metaobjects?.edges.map((item)=>{
        const linkS = item.node?.fields[1]?.value.toLowerCase()
        const linkTokopediaObject = link.find(item => item && item.key === linkS);
        {/* console.log('Hello workds',linkTokopediaObject?.value) */}
        return(
          <div key={item.node?.id} >
            <a href={linkTokopediaObject?.value ? linkTokopediaObject.value : item.node?.fields[2]?.value} target="_blank">
            <div>
              <img src={item.node?.fields[0]?.reference?.image?.url} alt={item.node?.fields[1]?.value} className='border p-1 h-9 w-auto rounded-md'/>
              {/* {linkTokopediaObject?.value ? linkTokopediaObject.value : item.node?.fields[2]?.value} */}
            </div>
            </a>
          </div>
        )
      })}
    </div>
  )
}



  function perubahTanggal(tanggalInput){
    const inputDateString = tanggalInput;
    const date = new Date(inputDateString);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate
  }
  



  const ImageGallery = ({ productData }) => {

    console.log('Ini adalah hasil dari gambar ',productData)

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

    console.log('Ini displyaed images', productData?.metafields[12]?.value)
  
    return (
      <div className="flex flex-col space-y-4 md:space-y-0 md:space-x-4">
        <div className="md:w-4/5 mx-auto ">
          <div className='relative'>
          
          <img src={selectedImage} alt="Product" className={`w-full h-auto shadow rounded ${productData?.metafields[12]?.value == "true" && 'opacity-50'}`} />
          {productData?.metafields[12]?.value == "true" &&
          <div class="p-2 rounded-lg m-auto absolute text-2xl font-bold bg-gray-950 text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            PRODUK DISCONTINUE</div>
          }
          </div>
       
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


  return(
    <>
        <div className='text-sm text-gray-500 mt-1'>Ingin harga best price dari kami? Yuk Negoin aja</div>
        <div className='gap-2 items-center bg-gradient-to-r from-green-200 to-emerald-800 rounded p-2 cursor-pointer font-semibold text-white text-center'>
            <a href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20bertanya%20tentang%20produk%20"${namaProduk}"%20.%20Link%20Produk:%20" ${urlProduk}`} target="_blank" className='drop-shadow-sm text-white'>ORDER VIA WHATSAPP</a>
      </div>

     
    </>
  )
}

function TombolWaDiscontinue({product}){
  // const infoChat = `Hi admin Galaxy saya berminat tentang produk ${namaProduk}. Boleh dibantu untuk info lebih lanjut`
  const namaProduk = product.title
  const urlProduk = product.handle


  return(
    <>
    
        <div className='gap-2 items-center bg-gradient-to-r from-green-200 to-emerald-800 rounded p-2 cursor-pointer font-semibold text-white text-center'>
            <a href={`https://wa.me/6282111311131?text=Hi%20Admin%20Galaxy.co.id%20Saya%20mau%20bertanya%20tentang%20produk%20pengganti%20"${namaProduk}"%20.%20Link%20Produk:%20" ${urlProduk}`} target="_blank" className='drop-shadow-sm text-white'>Chat Admin</a>
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
        {namespace:"custom" key:"spesifikasi"}
        {namespace:"custom" key:"brand"}
        {namespace:"custom" key:"tokopedia"}
        {namespace:"custom" key:"shopee"}
        {namespace:"custom" key:"blibli"}
        {namespace:"custom" key:"bukalapak"}
        {namespace:"custom" key:"lazada"}
        {namespace:"custom" key:"produk_discontinue"}
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
          sku
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

const METAOBJECT_QUERY = `#graphql
  query metaobject($id: ID!) {
    metaobject(id: $id) {
      field(key: "brand") {
        value
      }
      field(key: "brand") {
        value
      }
    }
  }
`;




const METAOBJECT_LIVE_SHOPEE = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          value
        }
      }
    }
  }
}`;

const METAOBJECT_MARKETPLACE = `#graphql
query metaobjects($type: String!, $first: Int!) {
  metaobjects(type: $type, first: $first) {
    edges {
      node {
        id
        fields {
          value
          reference{
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
}`;


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
  // const today = new Date();

  const title = data?.product?.title + ' Harga Murah & Terbaik'

  const today = new Date();

  // Get the end of the current month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Format the end date as "YYYY-MM-DD"
  const endDateFormatted = endOfMonth.toISOString().split('T')[0];


// images.edges[0].node.src


  return [
    { title: title },
    {
      name: "title",
      content: title,
    },
    {
      name: "description",
      content: data?.product?.description.substr(0, 155),
    },
    {
      name: "keywords",
      content: data?.product?.title,
    },
    {
      name: "og:image",
      content: data?.product?.images.edges[0].node.src,
    },

    {
      name: "og:image:width",
      content: "500",
    },

    {
      name: "og:image:height",
      content: "500",
    },





    {
      property: "og:title",
      content: data?.product?.title,
    },

    {
      property: "og:description",
      content: data?.product?.description.substr(0, 155),
    },
    {
      property: "og:type",
      content: "product",
    },
    {
      property: "og:site_name",
      content: "galaxy.co.id",
    },
    {
      property: "og:image",
      content: data?.product?.featuredImage?.url,
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

  { tagName:'link',
  rel:'canonical',
  href: data.canonicalUrl
},

{
  "script:ld+json": {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": data?.product?.title,
    "image": data?.product?.images.edges[0].node.src,
    "description": data?.product?.description,
    "sku": data?.selectedVariant?.sku,
    "mpn": data?.selectedVariant?.sku,
    "brand": {
      "@type": "Brand",
      "name": data?.metaobject?.metaobject?.field.value
    },
    "review": {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 5,
        "bestRating": 5
      },
      "author": {
        "@type": "Person",
        "name": "Sistiana"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 5,
      "reviewCount": 1
    },
    "offers": {
      "@type": "Offer",
      "price":data?.selectedVariant?.price?.amount && parseInt(data?.selectedVariant?.price?.amount,10).toString(),
      "url":data.canonicalUrl,
      "availability":data?.selectedVariant?.availableForSale? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceCurrency": "IDR",
      "priceValidUntil": endDateFormatted, // Set the end date here

    }
  },
},


  ];
};





