import { Link } from 'react-router-dom'
import { FaArrowLeft, FaLeaf } from 'react-icons/fa'

function NotFound() {
    const token = localStorage.getItem('token')
    const destino = token ? '/dashboard' : '/'

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
            <section className="w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
                <div className="h-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" />
                <div className="p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400 text-2xl text-slate-950">
                        <FaLeaf />
                    </div>
                    <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-emerald-200">Ruta no encontrada</p>
                    <h1 className="mt-3 text-4xl font-bold">Esta pantalla no existe</h1>
                    <p className="mx-auto mt-3 max-w-md text-slate-300">
                        La dirección que abriste no corresponde a ningún módulo activo del sistema.
                    </p>
                    <Link
                        to={destino}
                        className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                    >
                        <FaArrowLeft />
                        Volver al sistema
                    </Link>
                </div>
            </section>
        </main>
    )
}

export default NotFound
