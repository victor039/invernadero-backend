import { useEffect, useState } from 'react'
import { FaBoxOpen, FaChartBar, FaExclamationTriangle, FaReceipt } from 'react-icons/fa'
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

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-violet-700 via-blue-600 to-emerald-600" />
                <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Análisis</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-950">Reportes</h1>
                        <p className="mt-2 text-slate-500">Indicadores del negocio, productos vendidos y alertas de stock.</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-violet-700 text-white">
                        <FaChartBar />
                    </div>
                </div>
                </div>
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
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-950">Productos más vendidos</h2>
                    <p className="mt-1 text-sm text-slate-500">La gráfica muestra unidades vendidas agrupadas por producto.</p>
                    <div className="mt-5 h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productos}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="id_planta" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="total_vendido" fill="#047857" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
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
            </section>
        </DashboardLayout>
    )
}

export default Reportes
