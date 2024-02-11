import React from 'react'
import {Link} from '@remix-run/react';

export const FooterColumn2 = () => {
  return (
    <>
        <nav className="footer-menu mx-auto" role="navigation">
        <div className='text-sm flex flex-col'>
            <div className='text-white font-bold py-1'>GALAXY.CO.ID</div>
            <div>
            <Link
                to={`/`}>
                <div className='text-white text-sm py-1'>Tentang Kami</div>
            </Link>            </div>
            <div>
            <Link
                to={`/pages/contact`}>
                <div className='text-white text-sm py-1'>Store Location</div>
            </Link>
            </div>
            <div>
            <Link
                to={`/blogs`}>
                <div className='text-white text-sm py-1'>Blog & Artikel</div>
            </Link>
            </div>
        </div>
        </nav>

    </>
  )
}
