import React from 'react'
import { assets } from '../../assets/assets'
import Image from 'next/image'
import { useAppContext } from '@/context/AppContext'
import Link from 'next/link'

const Navbar = () => {
  const { router } = useAppContext()

  return (
    <header className='sticky top-0 z-40 flex h-16 items-center justify-between border-b border-brand-line bg-brand-cream px-4 md:px-8'>
      <div className="flex items-center gap-5">
      <Image
        onClick={() => router.push('/')} 
        className='w-28 lg:w-32 cursor-pointer' 
        src={assets.logo} 
        alt="logo" 
      />
      <span className="hidden border-l border-brand-line pl-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted sm:block">Panel de administración</span>
      </div>

      <div className="flex items-center gap-3">
      <Link href="/seller/dashboard" className="hidden text-xs font-medium text-brand-charcoal hover:text-brand-accent sm:block">Resumen</Link>
      <button
        onClick={() => router.push('/')}
        className='rounded-full border border-brand-line bg-white px-5 py-2 text-xs font-medium text-brand-charcoal transition hover:border-brand-accent hover:text-brand-accent sm:px-7 sm:text-sm'
      >
        Ver tienda
      </button>
      </div>
    </header>
  )
}

export default Navbar
