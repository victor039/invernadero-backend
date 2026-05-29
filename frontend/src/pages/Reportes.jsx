import { useEffect, useMemo, useState } from 'react'
import { FaBoxOpen, FaChartBar, FaExclamationTriangle, FaLeaf, FaReceipt, FaTrophy } from 'react-icons/fa'
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
})

function Reportes() {
    const [productos, setProductos] = useState([])
    const [resumen, setResumen] = useState({
        totalPlantas: 0,
        totalVentas: 0,
        ganancias: 0,
        stockBajo: []
    })

    useEffect(() => {
        obtenerResumen()
        obtenerProductos()
    }, [])

    const obtenerResumen = async () => {
        const token = localStorage.getItem('token')
        const response = await api.get('/reportes/resumen', {
            headers: { Authorization: `Bearer ${token}` }
        })
        setResumen(response.data)
    }

    const obtenerProductos = async () => {
        const token = localStorage.getItem('token')
        const response = await api.get('/reportes/productos-mas-vendidos', {
            headers: { Authorization: `Bearer ${token}` }
        })
        setProductos(response.data)
    }

    const productosGrafica = useMemo(
        () => productos.slice(0, 8).map((producto) => ({
            ...producto,
            etiqueta: `${producto.nombre_planta} #${producto.id_planta}`
        })),
        [productos]
    )

    const productoLider = productos[0]
    const unidadesVendidas = productos.reduce((total, producto) => total + Number(producto.total_vendido || 0), 0)

    const tooltipProductos = ({ active, payload }) => {
        if (!active || !payload?.length) return null

        const producto = payload[0].payload

        return (
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                <p className="font-bold text-slate-950">{producto.nombre_planta} #{producto.id_planta}</p>
                <p className="text-xs text-slate-500">{producto.nombre_cientifico || 'Sin nombre científico'}</p>
                <div className="mt-2 space-y-1 text-sm">
                    <p className="text-emerald-700">Unidades: <span className="font-bold">{producto.total_vendido}</span></p>
                    <p className="text-slate-700">Ingresos: <span className="font-bold">{formatoMoneda.format(Number(producto.total_ingresos || 0))}</span></p>
                    <p className="text-slate-500">Stock actual: {producto.stock}</p>
                </div>
            </div>
        )
    }

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/10">
                <div className="grid gap-6 p-6 text-white lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">Análisis operativo</p>
                        <h1 className="mt-3 text-3xl font-bold lg:text-4xl">Reportes</h1>
                        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                            Lectura rápida de ventas, inventario y productos con mejor movimiento, mostrando nombre e identificador para ubicar cada planta sin adivinar.
                        </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Producto líder</p>
                                <p className="mt-2 text-2xl font-bold text-emerald-300">
                                    {productoLider ? productoLider.nombre_planta : 'Sin ventas'}
                                </p>
                                <p className="mt-1 text-sm text-slate-400">
                                    {productoLider ? `ID #${productoLider.id_planta} · ${productoLider.total_vendido} unidades` : 'Registra ventas para iniciar el ranking'}
                                </p>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-emerald-400 text-xl text-slate-950">
                                <FaTrophy />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-600" />
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaReceipt className="text-blue-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Ventas</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{resumen.totalVentas}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaBoxOpen className="text-emerald-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Plantas</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{resumen.totalPlantas}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaChartBar className="text-emerald-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Ingresos</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-700">{formatoMoneda.format(Number(resumen.ganancias || 0))}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaExclamationTriangle className="text-red-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Stock bajo</p>
                    <p className="mt-2 text-3xl font-bold text-red-700">{resumen.stockBajo.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:col-span-4 xl:col-span-1">
                    <FaLeaf className="text-teal-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Unidades vendidas</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{unidadesVendidas}</p>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Productos más vendidos</h2>
                            <p className="mt-1 text-sm text-slate-500">Unidades vendidas por planta, con nombre e ID para identificarla rápido.</p>
                        </div>
                        <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
                            Top {productosGrafica.length}
                        </span>
                    </div>
                    <div className="mt-5 h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productosGrafica} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="etiqueta"
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                    height={92}
                                    tick={{ fontSize: 12, fill: '#475569' }}
                                />
                                <YAxis />
                                <Tooltip content={tooltipProductos} />
                                <Bar dataKey="total_vendido" fill="#047857" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-950">Ranking de plantas</h2>
                    <div className="mt-4 space-y-3">
                        {productos.length === 0 ? (
                            <p className="text-sm text-slate-500">Aún no hay productos vendidos.</p>
                        ) : productos.slice(0, 6).map((producto, index) => (
                            <div key={producto.id_planta} className="rounded-lg border border-slate-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">#{index + 1} · ID {producto.id_planta}</p>
                                        <p className="mt-1 truncate font-bold text-slate-950">{producto.nombre_planta}</p>
                                        <p className="text-xs text-slate-500">{producto.nombre_cientifico || 'Sin nombre científico'}</p>
                                    </div>
                                    <span className="rounded-md bg-slate-950 px-3 py-1 text-sm font-bold text-white">
                                        {producto.total_vendido}
                                    </span>
                                </div>
                                <div className="mt-3 h-2 rounded-full bg-slate-100">
                                    <div
                                        className="h-2 rounded-full bg-emerald-600"
                                        style={{ width: `${Math.max(8, (Number(producto.total_vendido || 0) / Number(productoLider?.total_vendido || 1)) * 100)}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-xs font-semibold text-slate-500">
                                    {formatoMoneda.format(Number(producto.total_ingresos || 0))} en ventas · stock {producto.stock}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-950">Alertas de inventario</h2>
                    <div className="mt-4 space-y-3">
                        {resumen.stockBajo.length === 0 ? (
                            <p className="text-sm text-slate-500">No hay productos con stock bajo.</p>
                        ) : resumen.stockBajo.map((planta) => (
                            <div key={planta.id_planta} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:border-red-200 hover:bg-red-50/50">
                                <div>
                                    <p className="font-semibold text-slate-900">{planta.nombre_comun}</p>
                                    <p className="text-xs text-slate-500">{planta.nombre_cientifico || 'Sin nombre científico'}</p>
                                </div>
                                <span className="rounded-md bg-red-50 px-3 py-1 text-sm font-bold text-red-700">
                                    {planta.stock}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                </div>
            </section>
        </DashboardLayout>
    )
}

export default Reportes
