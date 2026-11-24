import React from 'react'

const Loading = () => {
    return (
        <div className="flex justify-center items-center h-[70vh]" role="status">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-brand-accent border-brand-line" aria-hidden="true"></div>
            <span className="sr-only">Cargando…</span>
        </div>
    )
}

export default Loading
