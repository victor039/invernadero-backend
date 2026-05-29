import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaChartLine, FaDatabase, FaLeaf, FaMoneyBillWave, FaReceipt, FaShippingFast, FaUserFriends, FaUsers } from 'react-icons/fa'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
})

function Dashboard() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const esAdmin = Number(usuario.id_rol) === 1
    const [resumen, setResumen] = useState({
        totalPlantas: 0,
        totalEmpleados: 0,
        totalVentas: 0,
        ganancias: 0,
        ventasHoy: 0,
        gananciasHoy: 0,
        unidadesInventario: 0,
        stockBajo: []
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

    const modulos = [
        {
            titulo: 'Inventario',
            descripcion: 'Catálogo de plantas, stock, precios e imágenes.',
            dato: `${resumen.totalPlantas} plantas`,
            ruta: '/plantas',
            icono: FaLeaf,
            color: 'bg-emerald-600'
        },
        {
            titulo: 'Ventas',
            descripcion: 'Registro de ventas, carrito y tickets PDF.',
            dato: `${resumen.ventasHoy} ventas hoy`,
            ruta: '/ventas',
            icono: FaReceipt,
            color: 'bg-blue-700'
        },
        {
            titulo: 'Empleados',
            descripcion: 'Usuarios del sistema, roles y accesos.',
            dato: `${resumen.totalEmpleados} empleados`,
            ruta: '/empleados',
            icono: FaUsers,
            color: 'bg-amber-600',
            adminOnly: true
        },
        {
            titulo: 'Clientes',
            descripcion: 'Directorio de compradores y datos de contacto.',
            dato: 'Directorio',
            ruta: '/clientes',
            icono: FaUserFriends,
            color: 'bg-cyan-700',
            adminOnly: true
        },
        {
            titulo: 'Proveedores',
            descripcion: 'Empresas proveedoras, contactos y abastecimiento.',
            dato: 'Abastecimiento',
            ruta: '/proveedores',
            icono: FaShippingFast,
            color: 'bg-indigo-700',
            adminOnly: true
        },
        {
            titulo: 'Ganancias',
            descripcion: 'Ingresos, utilidad estimada y lectura financiera.',
            dato: formatoMoneda.format(Number(resumen.gananciasHoy || 0)),
            ruta: '/ganancias',
            icono: FaMoneyBillWave,
            color: 'bg-slate-900',
            adminOnly: true
        },
        {
            titulo: 'Reportes',
            descripcion: 'Estadísticas, productos vendidos y alertas.',
            dato: `${resumen.stockBajo.length} alertas`,
            ruta: '/reportes',
            icono: FaChartLine,
            color: 'bg-violet-700'
        },
        {
            titulo: 'Respaldo',
            descripcion: 'Copia descargable de la base de datos.',
            dato: 'SQL',
            ruta: '/respaldo',
            icono: FaDatabase,
            color: 'bg-teal-700',
            adminOnly: true
        }
    ].filter((modulo) => !modulo.adminOnly || esAdmin)

    return (
        <DashboardLayout>
            <section className="mb-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/10">
                <div className="grid gap-6 p-6 text-white lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                            Vista general
                        </p>
                        <h1 className="mt-4 text-4xl font-bold lg:text-5xl">
                            {esAdmin ? 'Panel administrativo' : 'Panel de empleado'}
                        </h1>
                        <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                            {esAdmin
                                ? 'Resumen ejecutivo del invernadero. Cada módulo tiene su propio espacio para operar con más claridad.'
                                : 'Acceso operativo para registrar ventas, consultar inventario y revisar reportes de trabajo.'}
                        </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {esAdmin ? 'Ganancia acumulada' : 'Actividad de hoy'}
                        </p>
                        <p className="mt-3 text-3xl font-bold text-emerald-300">
                            {esAdmin ? formatoMoneda.format(Number(resumen.ganancias || 0)) : `${resumen.ventasHoy} ventas`}
                        </p>
                        <div className="mt-5 h-2 rounded-full bg-white/10">
                            <div className="h-2 w-3/4 rounded-full bg-emerald-400" />
                        </div>
                        <p className="mt-3 text-sm text-slate-400">
                            {esAdmin ? `${resumen.ventasHoy} ventas registradas hoy` : 'Operación activa del punto de venta'}
                        </p>
                    </div>
                </div>
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500" />
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {modulos.map(({ titulo, descripcion, dato, ruta, icono: Icon, color }) => (
                    <Link
                        key={titulo}
                        to={ruta}
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
                    >
                        <div className={`h-1.5 ${color}`} />
                        <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-md text-white ${color}`}>
                                <Icon />
                            </div>
                            <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                                {dato}
                            </span>
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-slate-950">{titulo}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{descripcion}</p>
                        <p className="mt-5 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                            Abrir módulo
                        </p>
                        </div>
                    </Link>
                ))}
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Ventas totales</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{resumen.totalVentas}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Unidades en inventario</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{resumen.unidadesInventario}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Stock bajo</p>
                    <p className="mt-2 text-3xl font-bold text-red-700">{resumen.stockBajo.length}</p>
                </div>
            </section>
        </DashboardLayout>
    )
}

export default Dashboard
