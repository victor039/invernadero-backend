import { useMemo, useState } from 'react'
import { FaCheckCircle, FaClipboardCheck, FaDatabase, FaDownload, FaFileAlt, FaFileCode, FaFileCsv, FaFilePdf, FaLayerGroup, FaLock, FaShieldAlt } from 'react-icons/fa'
import Swal from 'sweetalert2'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

function Respaldo() {
    const [generando, setGenerando] = useState('')
    const fechaHoy = useMemo(() => new Date().toISOString().slice(0, 10), [])

    const descargarArchivo = async ({ key, url, fallback, mensaje }) => {
        setGenerando(key)

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
            const urlDescarga = window.URL.createObjectURL(new Blob([response.data]))
            const enlace = document.createElement('a')

            enlace.href = urlDescarga
            enlace.setAttribute('download', nombreArchivo)
            document.body.appendChild(enlace)
            enlace.click()
            enlace.remove()
            window.URL.revokeObjectURL(urlDescarga)

            Swal.fire('Descarga lista', mensaje, 'success')
        } catch (error) {
            console.log(error)
            Swal.fire('Error', error.response?.data?.mensaje || 'No se pudo generar el archivo.', 'error')
        } finally {
            setGenerando('')
        }
    }

    const respaldos = [
        {
            key: 'sql',
            titulo: 'SQL operativo',
            subtitulo: 'Restauración completa',
            descripcion: 'Incluye metadatos, limpieza ordenada, transacción, inserciones y cierre seguro para restaurar el sistema.',
            icono: FaDatabase,
            color: 'emerald',
            formato: 'SQL',
            url: '/respaldos/generar',
            fallback: `respaldo_${fechaHoy}.sql`,
            mensaje: 'El respaldo SQL operativo se descargó correctamente.'
        },
        {
            key: 'postgres',
            titulo: 'PostgreSQL',
            subtitulo: 'Compatible con Render',
            descripcion: 'Genera SQL con comillas estándar, TRUNCATE con reinicio de identidad y secuencias ajustadas para PostgreSQL.',
            icono: FaLayerGroup,
            color: 'slate',
            formato: 'PGSQL',
            url: '/respaldos/generar?formato=postgres',
            fallback: `respaldo_postgres_${fechaHoy}.sql`,
            mensaje: 'El respaldo compatible con PostgreSQL se descargó correctamente.'
        },
        {
            key: 'pdf',
            titulo: 'Reporte PDF',
            subtitulo: 'Auditoría visual',
            descripcion: 'Documento ejecutivo con portada, resumen, conteos por tabla, checklist de restauración y vista previa del SQL.',
            icono: FaFilePdf,
            color: 'red',
            formato: 'PDF',
            url: '/respaldos/pdf',
            fallback: `reporte_respaldo_${fechaHoy}.pdf`,
            mensaje: 'El reporte PDF profesional se descargó correctamente.'
        },
        {
            key: 'csv',
            titulo: 'Resumen CSV',
            subtitulo: 'Datos para Excel',
            descripcion: 'Descarga un resumen tabular con tablas, conteos, columnas y muestra de información para revisión rápida.',
            icono: FaFileCsv,
            color: 'blue',
            formato: 'CSV',
            url: '/respaldos/csv',
            fallback: `resumen_respaldo_${fechaHoy}.csv`,
            mensaje: 'El resumen CSV se descargó correctamente.'
        }
    ]

    const estilos = {
        emerald: {
            barra: 'bg-emerald-600',
            icono: 'bg-emerald-700 text-white',
            boton: 'bg-emerald-700 hover:bg-emerald-800 text-white',
            chip: 'bg-emerald-50 text-emerald-700 border-emerald-100'
        },
        slate: {
            barra: 'bg-slate-950',
            icono: 'bg-slate-950 text-white',
            boton: 'bg-slate-950 hover:bg-slate-800 text-white',
            chip: 'bg-slate-100 text-slate-700 border-slate-200'
        },
        red: {
            barra: 'bg-red-600',
            icono: 'bg-red-600 text-white',
            boton: 'bg-red-600 hover:bg-red-700 text-white',
            chip: 'bg-red-50 text-red-700 border-red-100'
        },
        blue: {
            barra: 'bg-blue-600',
            icono: 'bg-blue-600 text-white',
            boton: 'bg-blue-600 hover:bg-blue-700 text-white',
            chip: 'bg-blue-50 text-blue-700 border-blue-100'
        }
    }

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/10">
                <div className="grid gap-6 p-6 text-white lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Seguridad de datos</p>
                        <h1 className="mt-3 text-3xl font-bold lg:text-4xl">Centro de respaldos</h1>
                        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                            Genera respaldos listos para auditoría, restauración y entrega. Los archivos se preparan desde Render y conservan la información central del sistema.
                        </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-400 text-slate-950">
                                <FaShieldAlt />
                            </div>
                            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-200">
                                Admin
                            </span>
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-300">Formatos disponibles</p>
                        <p className="mt-1 text-3xl font-bold text-emerald-300">SQL + PGSQL + PDF</p>
                    </div>
                </div>
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600" />
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-4">
                {respaldos.map((respaldo) => {
                    const Icono = respaldo.icono
                    const estilo = estilos[respaldo.color]
                    const cargando = generando === respaldo.key

                    return (
                        <div key={respaldo.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                            <div className={`h-1.5 ${estilo.barra}`} />
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-md text-xl ${estilo.icono}`}>
                                        <Icono />
                                    </div>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${estilo.chip}`}>
                                        {respaldo.formato}
                                    </span>
                                </div>
                                <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{respaldo.subtitulo}</p>
                                <h2 className="mt-2 text-xl font-bold text-slate-950">{respaldo.titulo}</h2>
                                <p className="mt-2 min-h-24 text-sm leading-6 text-slate-500">
                                    {respaldo.descripcion}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => descargarArchivo(respaldo)}
                                    disabled={Boolean(generando)}
                                    className={`mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-400 ${estilo.boton}`}
                                >
                                    {respaldo.key === 'pdf' ? <FaFilePdf /> : <FaDownload />}
                                    {cargando ? 'Generando...' : `Descargar ${respaldo.formato}`}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </section>

            <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                            <FaClipboardCheck />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Checklist profesional</h2>
                            <p className="text-sm text-slate-500">Antes de entregar o restaurar un respaldo.</p>
                        </div>
                    </div>
                    <div className="mt-5 space-y-3">
                        {['Descargar SQL y PDF el mismo día', 'Guardar una copia externa', 'Probar restauración antes de producción', 'Confirmar ventas e inventario después de importar'].map((item) => (
                            <div key={item} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                                <FaCheckCircle className="text-emerald-600" />
                                <p className="text-sm font-semibold text-slate-700">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Contenido protegido</h2>
                            <p className="mt-1 text-sm text-slate-500">Información central incluida en los respaldos.</p>
                        </div>
                        <div className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-bold text-slate-700">
                            <FaLock />
                            Restauración y auditoría
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {[
                            ['Inventario', FaFileCode],
                            ['Ventas', FaFileAlt],
                            ['Clientes', FaDatabase],
                            ['Empleados', FaShieldAlt],
                            ['Proveedores', FaLayerGroup],
                            ['Catálogos', FaClipboardCheck]
                        ].map(([item, Icono]) => (
                            <div key={item} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-emerald-700 shadow-sm">
                                    <Icono />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{item}</p>
                                    <p className="mt-1 text-xs text-slate-500">Incluido en SQL y documentado en PDF</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </DashboardLayout>
    )
}

export default Respaldo
