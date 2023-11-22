

export const BrandPopular = ({brands}) => {
   
    console.log('Ini adalah brands',brands)

  return (
    <div className="my-4">
    <div className="text-slate-800 text-lg mx-auto sm:mx-1 px-1 whitespace-pre-wrap max-w-prose font-bold text-lead">Brand Popular</div>
    <div className="flex flex-wrap gap-x-2 p-2 items-center shadow-md rounded-lg">
        {brands.map((brand)=>{
            return(
                <img className="w-20 sm:w-28 h-auto hover:shadow-md hover:border rounded-lg p-2" src={brand.metaobject.fields[1].reference.image.url} alt={brand.metaobject.fields[0].value}/>
            )
        })}
    </div>
    </div>
  )
}







