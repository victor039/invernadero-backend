import { useState } from 'react'
import { FaDatabase, FaDownload, FaShieldAlt } from 'react-icons/fa'
import Swal from 'sweetalert2'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

function Respaldo() {
    const [generando, setGenerando] = useState(false)

    const descargarRespaldo = async (formato = '') => {
        setGenerando(true)

        try {
            const token = localStorage.getItem('token')
            const response = await api.get(`/respaldos/generar${formato ? `?formato=${formato}` : ''}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                responseType: 'blob'
            })

            const disposition = response.headers['content-disposition'] || ''
            const nombreArchivo = disposition.match(/filename="?([^"]+)"?/)?.[1] || `respaldo_${new Date().toISOString().slice(0, 10)}.sql`
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const enlace = document.createElement('a')

            enlace.href = url
            enlace.setAttribute('download', nombreArchivo)
            document.body.appendChild(enlace)
            enlace.click()
            enlace.remove()
            window.URL.revokeObjectURL(url)

            Swal.fire('Respaldo creado', 'El archivo SQL se descargó correctamente.', 'success')
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo generar el respaldo.', 'error')
        } finally {
            setGenerando(false)
        }
    }

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/10">
                <div className="grid gap-6 p-6 text-white lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Seguridad de datos</p>
                        <h1 className="mt-3 text-3xl font-bold lg:text-4xl">Respaldo</h1>
                        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                            Genera una copia descargable de la base de datos del sistema para guardarla fuera del equipo.
                        </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-400 text-slate-950">
                            <FaShieldAlt />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-300">Formato generado</p>
                        <p className="mt-1 text-3xl font-bold text-emerald-300">.SQL</p>
                    </div>
                </div>
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600" />
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-950 text-xl text-white">
                        <FaDatabase />
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-slate-950">Crear respaldo</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        El sistema exporta tablas y registros actuales en un archivo SQL listo para restaurarse cuando sea necesario.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => descargarRespaldo()}
                            disabled={generando}
                            className="inline-flex h-11 items-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            <FaDownload />
                            {generando ? 'Generando...' : 'Descargar respaldo'}
                        </button>
                        <button
                            type="button"
                            onClick={() => descargarRespaldo('postgres')}
                            disabled={generando}
                            className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            <FaDownload />
                            Para PostgreSQL
                        </button>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-950">Contenido del respaldo</h2>
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {['Inventario', 'Ventas', 'Clientes', 'Empleados', 'Proveedores', 'Catálogos'].map((item) => (
                            <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-bold text-slate-900">{item}</p>
                                <p className="mt-1 text-xs text-slate-500">Incluido en el archivo SQL</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </DashboardLayout>
    )
}

export default Respaldo
