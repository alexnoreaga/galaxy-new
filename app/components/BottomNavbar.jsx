import React from 'react'
import {useLoaderData, Link} from '@remix-run/react';

export const BottomNavbar = () => {
  return (
    <>
<div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-100 dark:bg-gray-700 dark:border-gray-600">
    <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
            <Link
                className="m-auto"
                prefetch="intent"
                to='/'
                >
            <button type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
       
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>

                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500">Home</p>
            </button>
            </Link>
        <a href="#search-aside" className="m-auto">
            <button type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>

                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500">Cari</p>
            </button>
        </a>

        <Link
                className="m-auto"
                prefetch="intent"
                to='/collections'
                >
                <button type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>

                    <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500">Kategori</p>
                </button>
        </Link>

        <Link
                className="m-auto"
                prefetch="intent"
                to='/page/contact'
                >
            <button type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>

                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500">Alamat</p>
            </button>
            </Link>
    </div>
</div>




    </>
  )
}
