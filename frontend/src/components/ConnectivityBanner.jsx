import { useEffect, useState } from 'react'
import { FaCloud, FaRedoAlt } from 'react-icons/fa'

function ConnectivityBanner() {
    const [online, setOnline] = useState(() => navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setOnline(true)
        const handleOffline = () => setOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (online) return null

    return (
        <div className="fixed bottom-4 left-1/2 z-[120] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2">
            <div className="rounded-lg border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-950/15 backdrop-blur">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                        <FaCloud />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-950">Estás sin conexión</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            La app sigue abierta con lo que ya quedó cacheado. Para ver inventario, ventas o respaldos en vivo, vuelve a conectarte.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                        <FaRedoAlt />
                        Reintentar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConnectivityBanner
