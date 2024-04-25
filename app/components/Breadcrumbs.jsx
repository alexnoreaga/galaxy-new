import { useMatches,Link } from '@remix-run/react'
import React from 'react'
import {z} from 'zod';

export const breadcrumbTypeSchema = z.enum(['collection','collections','product'])
// export type TBreadcrumbType = z.infer<typeof breadcrumbTypeSchema>

export const Breadcrumbs = () => {

const matches = useMatches()
const deepestRoute = matches.at(-1)
const parsedBreadcrumbType = breadcrumbTypeSchema.safeParse(deepestRoute?.handle?.breadcrumbType)

const pages = [{href:'/',name:'Home'}]

const isvalidBreadcrumbType = parsedBreadcrumbType.success

// console.log('Apakah berhasil disini ?',isvalidBreadcrumbType)

if(isvalidBreadcrumbType){
    switch(parsedBreadcrumbType.data){
        case 'collections':
            pages.push({
                href:'/collections',
                name: 'Collections'
            });
            break;

        case 'collection':
            pages.push({
                href:'/collections',
                name: 'Collections'
            });

            pages.push({
                href:`/collections/${deepestRoute?.data.collection.handle}`,
                name: `${deepestRoute?.data.collection.title}`,
            });
            break;


        case 'product':
            pages.push({
                href:'/collections',
                name: 'Collections'
            });
            
            const collection = deepestRoute?.data?.product.collections.nodes.at(0)
            pages.push({
                href:`/collections/${collection.handle}`,
                name: `${collection.title}`,
            });

            pages.push({
                href:`/collections/${deepestRoute?.data.product.handle}`,
                name: `${deepestRoute?.data.product.title}`,
            });
            break;

            default:
                break;
    }



}else{
    return null
}




return (
<nav className="flex flex-wrap mt-5 relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl " aria-label="Breadcrumb">
    <ol role="list" className="flex flex-wrap items-center space-x-4 ">
    {pages.map((page, idx) => {
        const currentPage= idx === pages.length - 1;
        const homePage =  page.href === '/';

        const separator = idx !== 0 && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500 hover:text-gray-700">
  <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
</svg>

        );
        return (
            <li key={page.name}>
                <div className="flex items-center">
                    {separator}
                <span className="ml-4 text-xs md:text-sm  text-gray-500 hover:text-gray-700">
            {currentPage ? (
                    page.name
            ):(
                <Link to={page.href}>
                {homePage ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500 hover:text-gray-700">
                        <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
                     <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
                    </svg>

            ):(
                page.name
            )}
        </Link>
            )}
        </span>
        </div>
        </li>
            );
        })}
    </ol>
</nav>
)}



