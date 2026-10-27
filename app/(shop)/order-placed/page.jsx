'use client'
import { useAppContext } from '@/context/AppContext'
import { useEffect } from 'react'
import { Check } from 'lucide-react'

const OrderPlaced = () => {

  const { router } = useAppContext()

  useEffect(() => {
    const timeout = setTimeout(() => router.push('/my-orders'), 9000)
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className='flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6'>
      <div className="grid h-24 w-24 animate-[scale-in_500ms_ease-out] place-items-center bg-brand-success/10 text-brand-success">
        <Check size={46} strokeWidth={1.8} />
      </div>
      <h1 className="text-center font-display text-3xl font-semibold text-brand-ink">Orden registrada correctamente</h1>
      <p className="max-w-md text-center text-sm leading-6 text-brand-muted">Gracias por tu compra. Puedes revisar el estado y los detalles de tu orden desde tu cuenta.</p>
      <button onClick={() => router.push('/my-orders')} className="mt-3 bg-brand-accent px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-ink">Ver mis órdenes</button>
    </div>
  )
}

export default OrderPlaced