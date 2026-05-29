import { useEffect, useState } from 'react'
import { FaChartLine, FaMoneyBillWave, FaReceipt, FaWallet } from 'react-icons/fa'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
})

function Ganancias() {
    const [resumen, setResumen] = useState({
        ganancias: 0,
        gananciasHoy: 0,
        ventasHoy: 0,
        totalVentas: 0,
        ventasRecientes: []
    })

    useEffect(() => {
        obtenerResumen()
    }, [])

    const obtenerResumen = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await api.get('/reportes/admin', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setResumen(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const egresos = 0
    const utilidad = Number(resumen.ganancias || 0) - egresos

    const filas = [
        ['Ingresos de hoy', 'Ventas registradas durante el día', Number(resumen.gananciasHoy || 0), 'Ganancia'],
        ['Ingresos acumulados', 'Histórico de ventas capturadas', Number(resumen.ganancias || 0), 'Ganancia'],
        ['Egresos registrados', 'Pendiente conectar módulo de gastos o compras', egresos, 'Sin datos'],
        ['Utilidad estimada', 'Ingresos menos egresos registrados', utilidad, utilidad >= 0 ? 'Ganancia' : 'Pérdida']
    ]

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-emerald-600 via-lime-500 to-slate-900" />
                <div className="p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Finanzas</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">Ganancias</h1>
                <p className="mt-2 max-w-2xl text-slate-500">
                    Lectura financiera del negocio con ingresos, egresos registrados y utilidad estimada.
                </p>
                </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaMoneyBillWave className="text-emerald-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Ingresos de hoy</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{formatoMoneda.format(Number(resumen.gananciasHoy || 0))}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaWallet className="text-blue-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Ingresos acumulados</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{formatoMoneda.format(Number(resumen.ganancias || 0))}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaReceipt className="text-amber-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Ventas de hoy</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{resumen.ventasHoy}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaChartLine className={utilidad >= 0 ? 'text-emerald-700' : 'text-red-700'} />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Utilidad estimada</p>
                    <p className={`mt-2 text-3xl font-bold ${utilidad >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatoMoneda.format(utilidad)}
                    </p>
                </div>
            </section>

            <section className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-950">Estado de resultados</h2>
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Para calcular pérdidas reales falta registrar egresos como compras, servicios o sueldos. Por ahora la utilidad usa ventas menos egresos registrados.
                    </div>
                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-3">Concepto</th>
                                    <th className="px-3 py-3">Descripción</th>
                                    <th className="px-3 py-3 text-right">Monto</th>
                                    <th className="px-3 py-3 text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map(([concepto, descripcion, monto, estado]) => (
                                    <tr key={concepto} className="border-b transition last:border-0 hover:bg-emerald-50/50">
                                        <td className="px-3 py-4 font-semibold text-slate-900">{concepto}</td>
                                        <td className="px-3 py-4 text-slate-500">{descripcion}</td>
                                        <td className={`px-3 py-4 text-right font-bold ${estado === 'Pérdida' ? 'text-red-700' : 'text-emerald-700'}`}>
                                            {formatoMoneda.format(monto)}
                                        </td>
                                        <td className="px-3 py-4 text-right">
                                            <span className={`rounded-md px-3 py-1 text-xs font-semibold ${
                                                estado === 'Pérdida' ? 'bg-red-50 text-red-700' : estado === 'Sin datos' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                                {estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Últimos ingresos</h2>
                            <p className="text-sm text-slate-500">Ventas recientes en formato horizontal.</p>
                        </div>
                        <span className="rounded-md bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                            {resumen.ventasRecientes.length} movimientos
                        </span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {resumen.ventasRecientes.length === 0 ? (
                            <p className="text-sm text-slate-500 md:col-span-2 xl:col-span-4">No hay ventas recientes.</p>
                        ) : resumen.ventasRecientes.map((venta) => (
                            <div key={venta.id_venta} className="rounded-lg border border-slate-200 p-4 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md">
                                <div>
                                    <p className="font-semibold text-slate-900">Venta #{venta.id_venta}</p>
                                    <p className="text-xs text-slate-500">{new Date(venta.fecha_venta).toLocaleString('es-MX')}</p>
                                </div>
                                <p className="mt-4 text-xl font-bold text-emerald-700">{formatoMoneda.format(Number(venta.total || 0))}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </DashboardLayout>
    )
}

export default Ganancias
