'use client'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import WhatsappFloat from '@/components/seller/WhatsappFloat'
import ChatWidget from '@/components/ChatWidget'
import Footer from '@/components/seller/Footer'
import React from 'react'

const Layout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <div className='flex w-full'>
        <Sidebar />
        {children}
      </div>
      <Footer />
      <WhatsappFloat />
      <ChatWidget />
    </div>
  )
}

export default Layout