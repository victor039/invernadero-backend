import { Link } from 'react-router-dom'
import { FaBoxOpen, FaCashRegister, FaChartLine, FaLeaf, FaUserShield } from 'react-icons/fa'

import DashboardLayout from '../layouts/DashboardLayout'

const logoPath = '/naturaleza-viva-logo.svg'

function Bienvenida() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const esAdmin = Number(usuario.id_rol) === 1
    const nombre = usuario.nombre || usuario.usuario || (esAdmin ? 'Administrador' : 'Empleado')
    const acento = esAdmin
        ? {
            texto: 'text-emerald-300',
            boton: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
            icono: 'bg-emerald-500 text-slate-950',
            linea: 'from-emerald-500 via-cyan-500 to-violet-600',
            suave: 'bg-emerald-50 text-emerald-800'
        }
        : {
            texto: 'text-blue-300',
            boton: 'bg-blue-600 text-white hover:bg-blue-500',
            icono: 'bg-blue-500 text-white',
            linea: 'from-blue-500 via-cyan-500 to-amber-500',
            suave: 'bg-blue-50 text-blue-800'
        }

    const accesos = [
        {
            titulo: 'Registrar venta',
            descripcion: 'Abre el punto de venta para atender al cliente.',
            ruta: '/ventas',
            icono: FaCashRegister
        },
        {
            titulo: 'Inventario',
            descripcion: 'Consulta plantas, precios y stock disponible.',
            ruta: '/plantas',
            icono: FaLeaf
        },
        {
            titulo: 'Reportes',
            descripcion: 'Revisa movimientos y productos con mejor salida.',
            ruta: '/reportes',
            icono: FaChartLine
        },
        {
            titulo: esAdmin ? 'Dashboard' : 'Panel',
            descripcion: esAdmin ? 'Ve el resumen administrativo completo.' : 'Consulta tu vista general de trabajo.',
            ruta: '/dashboard',
            icono: FaBoxOpen
        }
    ]

    return (
        <DashboardLayout>
            <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/10">
                <div className="grid gap-6 p-4 text-white sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
                    <div>
                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${acento.suave}`}>
                            <FaUserShield />
                            {esAdmin ? 'Acceso administrativo' : 'Acceso de empleado'}
                        </div>
                        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                            Bienvenido, {nombre}
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                            Elige por dónde quieres empezar. Esta pantalla te deja entrar con calma al sistema antes de ir a los módulos de trabajo.
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Link
                                to="/ventas"
                                className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition ${acento.boton}`}
                            >
                                <FaCashRegister />
                                Nueva venta
                            </Link>
                            <Link
                                to="/dashboard"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
                            >
                                <FaChartLine />
                                Ver dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/5 p-4 sm:p-5">
                        <div className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-md ${acento.icono}`}>
                            <img src={logoPath} alt="Naturaleza Viva" className="h-full w-full object-cover" />
                        </div>
                        <p className={`mt-5 text-sm font-bold uppercase tracking-[0.2em] ${acento.texto}`}>
                            Invernadero
                        </p>
                        <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                            {esAdmin ? 'Control general listo' : 'Turno operativo listo'}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                            {esAdmin
                                ? 'Puedes revisar indicadores, empleados, inventario, clientes y respaldos desde el menú lateral.'
                                : 'Puedes registrar ventas, consultar inventario y revisar reportes disponibles para tu rol.'}
                        </p>
                    </div>
                </div>
                <div className={`h-2 bg-gradient-to-r ${acento.linea}`} />
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {accesos.map(({ titulo, descripcion, ruta, icono: Icon }) => (
                    <Link
                        key={titulo}
                        to={ruta}
                        className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                    >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-md ${acento.icono}`}>
                            <Icon />
                        </div>
                        <h2 className="mt-5 text-lg font-bold text-slate-950">{titulo}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{descripcion}</p>
                        <p className={`mt-5 text-sm font-bold ${esAdmin ? 'text-emerald-700' : 'text-blue-700'}`}>
                            Abrir
                        </p>
                    </Link>
                ))}
            </section>
        </DashboardLayout>
    )
}

export default Bienvenida
