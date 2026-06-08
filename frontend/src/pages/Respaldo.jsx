import { useState } from 'react'
import { FaDatabase, FaDownload, FaFileAlt, FaFilePdf, FaLayerGroup, FaShieldAlt } from 'react-icons/fa'
import Swal from 'sweetalert2'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

function Respaldo() {
    const [generando, setGenerando] = useState(false)

    const descargarArchivo = async ({ url, fallback, mensaje }) => {
        setGenerando(true)

        try {
            const token = localStorage.getItem('token')
            const response = await api.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                responseType: 'blob'
            })

            const disposition = response.headers['content-disposition'] || ''
            const nombreArchivo = disposition.match(/filename="?([^"]+)"?/)?.[1] || fallback
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const enlace = document.createElement('a')

            enlace.href = url
            enlace.setAttribute('download', nombreArchivo)
            document.body.appendChild(enlace)
            enlace.click()
            enlace.remove()
            window.URL.revokeObjectURL(url)

            Swal.fire('Descarga lista', mensaje, 'success')
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo generar el archivo.', 'error')
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
                        <p className="mt-4 text-sm font-semibold text-slate-300">Formatos disponibles</p>
                        <p className="mt-1 text-3xl font-bold text-emerald-300">SQL + PDF</p>
                    </div>
                </div>
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600" />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="h-1.5 bg-emerald-600" />
                    <div className="p-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-emerald-700 text-xl text-white">
                            <FaDatabase />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-slate-950">Respaldo SQL</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Exporta los registros actuales en formato SQL para restauración directa.
                        </p>
                        <button
                            type="button"
                            onClick={() => descargarArchivo({
                                url: '/respaldos/generar',
                                fallback: `respaldo_${new Date().toISOString().slice(0, 10)}.sql`,
                                mensaje: 'El archivo SQL se descargó correctamente.'
                            })}
                            disabled={generando}
                            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            <FaDownload />
                            {generando ? 'Generando...' : 'Descargar SQL'}
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="h-1.5 bg-slate-950" />
                    <div className="p-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-950 text-xl text-white">
                            <FaLayerGroup />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-slate-950">Para PostgreSQL</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Genera el respaldo con comillas y secuencias pensadas para PostgreSQL.
                        </p>
                        <button
                            type="button"
                            onClick={() => descargarArchivo({
                                url: '/respaldos/generar?formato=postgres',
                                fallback: `respaldo_postgres_${new Date().toISOString().slice(0, 10)}.sql`,
                                mensaje: 'El respaldo para PostgreSQL se descargó correctamente.'
                            })}
                            disabled={generando}
                            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            <FaDownload />
                            {generando ? 'Generando...' : 'Descargar PostgreSQL'}
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm">
                    <div className="h-1.5 bg-red-600" />
                    <div className="p-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-red-600 text-xl text-white">
                            <FaFilePdf />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-slate-950">Reporte PDF</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Descarga un reporte visual con tablas, conteos, fecha y vista previa del respaldo.
                        </p>
                        <button
                            type="button"
                            onClick={() => descargarArchivo({
                                url: '/respaldos/pdf',
                                fallback: `reporte_respaldo_${new Date().toISOString().slice(0, 10)}.pdf`,
                                mensaje: 'El reporte PDF se descargó correctamente.'
                            })}
                            disabled={generando}
                            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            <FaFilePdf />
                            {generando ? 'Generando...' : 'Descargar PDF'}
                        </button>
                    </div>
                </div>
            </section>

            <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">Contenido protegido</h2>
                        <p className="mt-1 text-sm text-slate-500">El respaldo conserva la información central del sistema.</p>
                    </div>
                    <div className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-bold text-slate-700">
                        <FaFileAlt />
                        Restauración y auditoría
                    </div>
                </div>
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {['Inventario', 'Ventas', 'Clientes', 'Empleados', 'Proveedores', 'Catálogos'].map((item) => (
                            <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-bold text-slate-900">{item}</p>
                                <p className="mt-1 text-xs text-slate-500">Incluido en SQL y documentado en PDF</p>
                            </div>
                        ))}
                    </div>
            </section>
        </DashboardLayout>
    )
}

export default Respaldo
