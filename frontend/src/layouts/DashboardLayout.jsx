import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FaBars, FaBell, FaBoxOpen, FaBriefcase, FaCashRegister, FaChartLine, FaCheckDouble, FaChevronRight, FaCrown, FaDatabase, FaHandHoldingUsd, FaHeadset, FaHome, FaLeaf, FaPowerOff, FaRocket, FaSave, FaSeedling, FaShieldAlt, FaShippingFast, FaStar, FaTimes, FaUserAstronaut, FaUserCog, FaUserFriends, FaUserTie, FaUsers } from 'react-icons/fa'
import Swal from 'sweetalert2'
import { guardarPerfilLocal } from '../utils/perfilLocal'
import api from '../services/api'
import { capitalizarNombre, limpiarTexto, normalizarNombre, normalizarTelefono, validarCorreo, validarLongitudMinMax, validarNombrePersona, validarTelefono } from '../utils/validaciones'

const formatoMonedaNotificacion = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
})

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'https://invernadero-backend-pfgt.onrender.com/api').replace(/\/api\/?$/, '')
const obtenerFotoPerfilSrc = (foto) => {
    if (!foto) return ''
    if (foto.startsWith('data:image/') || foto.startsWith('http')) return foto

    const ruta = foto.replace(/^\/?uploads\//, '').replace(/^\/+/, '')
    return `${API_ORIGIN}/uploads/${ruta}`
}

function AvatarPerfil({ foto, idRol, nombre = 'Perfil', className = '' }) {
    const [errorImagen, setErrorImagen] = useState(false)
    const esAdmin = Number(idRol) === 1
    const iconosAdmin = [FaShieldAlt, FaCrown, FaStar, FaUserCog]
    const iconosEmpleado = [FaUserTie, FaHeadset, FaLeaf, FaBriefcase, FaRocket, FaUserAstronaut]
    const semilla = String(nombre || '').split('').reduce((total, letra) => total + letra.charCodeAt(0), 0)
    const listaIconos = esAdmin ? iconosAdmin : iconosEmpleado
    const Icono = listaIconos[semilla % listaIconos.length]
    const estilo = esAdmin
        ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white'
        : [
            'bg-gradient-to-br from-blue-600 to-cyan-600 text-white',
            'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white',
            'bg-gradient-to-br from-emerald-600 to-teal-600 text-white',
            'bg-gradient-to-br from-slate-700 to-slate-950 text-white'
        ][semilla % 4]

    if (foto && !errorImagen) {
        return (
            <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${estilo} ${className}`}>
                <img
                    src={obtenerFotoPerfilSrc(foto)}
                    alt={nombre}
                    onError={() => setErrorImagen(true)}
                    className="h-full w-full object-cover"
                />
            </div>
        )
    }

    return (
        <div className={`flex shrink-0 items-center justify-center rounded-full ${estilo} ${className}`}>
            <Icono />
        </div>
    )
}

const SIDEBAR_SCROLL_KEY = 'dashboard_sidebar_scroll'

function DashboardLayout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem('usuario') || '{}'))
    const [perfilAbierto, setPerfilAbierto] = useState(false)
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false)
    const [ventaDetalle, setVentaDetalle] = useState(null)
    const [ventasEmpleado, setVentasEmpleado] = useState([])
    const [guardandoPerfil, setGuardandoPerfil] = useState(false)
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
    const [ultimaVentaVista, setUltimaVentaVista] = useState(() => Number(localStorage.getItem(`ventas_vistas_admin_${usuario.id_empleado}`) || 0))
    const sidebarNavRef = useRef(null)
    const sidebarScrollInicial = useRef(Number(sessionStorage.getItem(SIDEBAR_SCROLL_KEY) || 0))
    const notificacionesRef = useRef(null)
    const [perfilForm, setPerfilForm] = useState({
        nombre: usuario.nombre || usuario.usuario || '',
        apellido: usuario.apellido || '',
        correo: usuario.correo || '',
        telefono: usuario.telefono || '',
        puesto: usuario.puesto || 'Administrador general',
        ubicacion: usuario.ubicacion || '',
        notas: usuario.notas || '',
        foto: usuario.foto || ''
    })
    const esAdmin = Number(usuario.id_rol) === 1
    const ventasNuevas = useMemo(
        () => ventasEmpleado.filter((venta) => Number(venta.id_venta) > ultimaVentaVista),
        [ventasEmpleado, ultimaVentaVista]
    )

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        localStorage.removeItem('id_empleado')
        navigate('/')
    }

    const abrirPerfil = () => {
        setPerfilForm({
            nombre: usuario.nombre || usuario.usuario || '',
            apellido: usuario.apellido || '',
            correo: usuario.correo || '',
            telefono: usuario.telefono || '',
            puesto: usuario.puesto || 'Administrador general',
            ubicacion: usuario.ubicacion || '',
            notas: usuario.notas || '',
            foto: usuario.foto || ''
        })
        setPerfilAbierto(true)
    }

    const guardarPerfil = async (event) => {
        event.preventDefault()

        if (!usuario.id_empleado) {
            Swal.fire('Sesión inválida', 'Vuelve a iniciar sesión para guardar tu perfil.', 'warning')
            return
        }

        setGuardandoPerfil(true)

        try {
            const token = localStorage.getItem('token')
            const formData = new FormData()
            const nombre = limpiarTexto(perfilForm.nombre) || usuario.nombre || usuario.usuario || 'Administrador'
            const apellido = limpiarTexto(perfilForm.apellido)
            const correo = limpiarTexto(perfilForm.correo)
            const telefono = normalizarTelefono(perfilForm.telefono)

            if (!validarLongitudMinMax(nombre, 2, 30) || !validarNombrePersona(nombre)) {
                Swal.fire('Nombre inválido', 'Usa solo letras y de 2 a 30 caracteres.', 'warning')
                return
            }

            if (apellido && (!validarLongitudMinMax(apellido, 2, 40) || !validarNombrePersona(apellido))) {
                Swal.fire('Apellido inválido', 'Usa solo letras y de 2 a 40 caracteres.', 'warning')
                return
            }

            if (!validarCorreo(correo)) {
                Swal.fire('Correo inválido', 'Escribe un correo con formato correcto.', 'warning')
                return
            }

            if (!validarTelefono(telefono)) {
                Swal.fire('Teléfono inválido', 'El teléfono debe tener 10 dígitos.', 'warning')
                return
            }

            formData.append('nombre', nombre)
            formData.append('apellido', apellido)
            formData.append('correo', correo)
            formData.append('telefono', telefono)

            const response = await api.put(
                `/empleados/${usuario.id_empleado}`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            const usuarioActualizado = {
                ...usuario,
                ...(response.data.empleado || {
                    nombre,
                    apellido,
                    correo,
                    telefono
                }),
                ...(esAdmin ? {
                    puesto: perfilForm.puesto.trim(),
                    ubicacion: perfilForm.ubicacion.trim(),
                    notas: perfilForm.notas.trim()
                } : {})
            }

            const usuarioPersistido = guardarPerfilLocal(usuarioActualizado)

            localStorage.setItem('usuario', JSON.stringify(usuarioPersistido))
            setUsuario(usuarioPersistido)
            setPerfilForm((prev) => ({
                ...prev,
                foto: usuarioPersistido.foto || prev.foto
            }))
            setPerfilAbierto(false)
            Swal.fire('Perfil guardado', 'Tus datos se guardaron correctamente.', 'success')
        } catch (error) {
            console.log(error)
            const mensaje = error.response?.status === 413
                ? 'La imagen era demasiado grande, pero ya activamos el ajuste automático. Selecciónala de nuevo y guarda.'
                : error.response?.data?.mensaje || 'No se pudo guardar el perfil.'

            Swal.fire('Error', mensaje, 'error')
        } finally {
            setGuardandoPerfil(false)
        }
    }

    const obtenerNotificacionesVentas = async ({ inicial = false } = {}) => {
        if (!esAdmin) return

        try {
            const token = localStorage.getItem('token')
            const response = await api.get('/ventas', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const ventasDeEmpleados = response.data
                .filter((venta) => Number(venta.empleado_rol) !== 1)
                .sort((a, b) => Number(b.id_venta) - Number(a.id_venta))

            setVentasEmpleado(ventasDeEmpleados)

            if (inicial && ultimaVentaVista === 0 && ventasDeEmpleados[0]) {
                const ultimoId = Number(ventasDeEmpleados[0].id_venta)
                localStorage.setItem(`ventas_vistas_admin_${usuario.id_empleado}`, String(ultimoId))
                setUltimaVentaVista(ultimoId)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const marcarNotificacionesLeidas = () => {
        const ultimoId = Number(ventasEmpleado[0]?.id_venta || ultimaVentaVista)
        localStorage.setItem(`ventas_vistas_admin_${usuario.id_empleado}`, String(ultimoId))
        setUltimaVentaVista(ultimoId)
    }

    const abrirDetalleNotificacion = (venta) => {
        const ventaId = Number(venta.id_venta)

        setVentaDetalle(venta)
        setNotificacionesAbiertas(false)

        if (ventaId > ultimaVentaVista) {
            localStorage.setItem(`ventas_vistas_admin_${usuario.id_empleado}`, String(ventaId))
            setUltimaVentaVista(ventaId)
        }
    }

    useEffect(() => {
        obtenerNotificacionesVentas({ inicial: true })

        if (!esAdmin) return undefined

        const intervalo = setInterval(() => {
            obtenerNotificacionesVentas()
        }, 12000)

        return () => clearInterval(intervalo)
    }, [esAdmin, usuario.id_empleado])

    useEffect(() => {
        const cerrarAlClickFuera = (event) => {
            if (!notificacionesAbiertas) return
            if (notificacionesRef.current?.contains(event.target)) return
            setNotificacionesAbiertas(false)
        }

        document.addEventListener('mousedown', cerrarAlClickFuera)

        return () => {
            document.removeEventListener('mousedown', cerrarAlClickFuera)
        }
    }, [notificacionesAbiertas])

    useEffect(() => {
        setMenuMovilAbierto(false)
    }, [location.pathname])

    useEffect(() => {
        if (!menuMovilAbierto) return undefined

        const cerrarConEscape = (event) => {
            if (event.key === 'Escape') setMenuMovilAbierto(false)
        }

        window.addEventListener('keydown', cerrarConEscape)

        return () => window.removeEventListener('keydown', cerrarConEscape)
    }, [menuMovilAbierto])

    const asignarSidebarNav = (node) => {
        sidebarNavRef.current = node

        if (node) {
            node.scrollTop = sidebarScrollInicial.current
        }
    }

    useLayoutEffect(() => {
        const nav = sidebarNavRef.current
        if (!nav) return

        nav.scrollTop = Number(sessionStorage.getItem(SIDEBAR_SCROLL_KEY) || sidebarScrollInicial.current)
    }, [location.pathname])

    useEffect(() => {
        const nav = sidebarNavRef.current
        if (!nav) return undefined
        
        const guardarScroll = () => {
            sidebarScrollInicial.current = nav.scrollTop
            sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop))
        }

        nav.addEventListener('scroll', guardarScroll, { passive: true })

        return () => {
            guardarScroll()
            nav.removeEventListener('scroll', guardarScroll)
        }
    }, [])

    const links = [
        { to: '/bienvenida', label: 'Inicio', icon: FaHome },
        { to: '/dashboard', label: 'Dashboard', icon: FaChartLine },
        { to: '/plantas', label: 'Inventario', icon: FaLeaf },
        { to: '/ventas', label: 'Ventas', icon: FaCashRegister },
        { to: '/clientes', label: 'Clientes', icon: FaUserFriends, adminOnly: true },
        { to: '/proveedores', label: 'Proveedores', icon: FaShippingFast, adminOnly: true },
        { to: '/empleados', label: 'Empleados', icon: FaUsers, adminOnly: true },
        { to: '/ganancias', label: 'Ganancias', icon: FaHandHoldingUsd, adminOnly: true },
        { to: '/reportes', label: 'Reportes', icon: FaBoxOpen },
        { to: '/respaldo', label: 'Respaldo', icon: FaDatabase, adminOnly: true }
    ].filter((link) => !link.adminOnly || esAdmin)
    const moduloActivo = links.find((link) => link.to === location.pathname) || links[0]
    const fechaActual = new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
    }).format(new Date())
    const tema = esAdmin
        ? {
            panel: 'Panel administrativo',
            logo: 'bg-emerald-500 text-slate-950',
            logoMovil: 'bg-emerald-600 text-white',
            activo: 'bg-emerald-500 text-slate-950',
            activoMovil: 'bg-emerald-600 text-white',
            focus: 'focus:ring-emerald-400/70',
            avatar: 'bg-emerald-500 text-slate-950 ring-emerald-400/20 group-hover:ring-emerald-300',
            hoverTexto: 'text-emerald-300',
            hoverFlecha: 'group-hover:text-emerald-300',
            modulo: 'text-emerald-700',
            rolCaja: 'border-emerald-100 bg-emerald-50',
            rolTexto: 'text-emerald-800',
            rolSubtexto: 'text-emerald-700',
            botonSuave: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
            focoInput: 'focus:border-emerald-600',
            guardar: 'bg-emerald-700 hover:bg-emerald-800'
        }
        : {
            panel: 'Panel de ventas',
            logo: 'bg-blue-500 text-white',
            logoMovil: 'bg-blue-600 text-white',
            activo: 'bg-blue-500 text-white',
            activoMovil: 'bg-blue-600 text-white',
            focus: 'focus:ring-blue-400/70',
            avatar: 'bg-blue-500 text-white ring-blue-400/20 group-hover:ring-blue-300',
            hoverTexto: 'text-blue-300',
            hoverFlecha: 'group-hover:text-blue-300',
            modulo: 'text-blue-700',
            rolCaja: 'border-blue-100 bg-blue-50',
            rolTexto: 'text-blue-800',
            rolSubtexto: 'text-blue-700',
            botonSuave: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
            focoInput: 'focus:border-blue-600',
            guardar: 'bg-blue-700 hover:bg-blue-800'
        }

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
            <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 overflow-hidden border-r border-slate-800 bg-slate-950 px-5 py-6 text-white lg:flex lg:flex-col">
                <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-md ${tema.logo}`}>
                        <FaSeedling />
                    </div>

                    <div>
                        <h1 className="text-lg font-bold">Invernadero</h1>
                        <p className="text-xs text-slate-400">{tema.panel}</p>
                    </div>
                </div>

                <nav ref={asignarSidebarNav} className="sidebar-scroll mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 pb-4">
                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                                    isActive
                                        ? tema.activo
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <Icon />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="shrink-0 rounded-md border border-white/10 bg-white/5 p-3">
                    <button
                        type="button"
                        onClick={abrirPerfil}
                        className={`group w-full rounded-md p-2 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 ${tema.focus}`}
                    >
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sesión activa</p>
                        <div className="mt-3 flex items-center gap-3">
                            <AvatarPerfil
                                foto={usuario.foto}
                                idRol={usuario.id_rol}
                                nombre={usuario.nombre || 'Perfil'}
                                className={`h-12 w-12 ring-2 transition ${tema.avatar}`}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">{`${usuario.nombre || usuario.usuario || 'Administrador'} ${usuario.apellido || ''}`.trim()}</p>
                                <p className="truncate text-sm text-slate-400">{usuario.correo || 'Acceso interno'}</p>
                                <p className={`mt-1 text-xs font-semibold opacity-0 transition group-hover:opacity-100 ${tema.hoverTexto}`}>Editar perfil</p>
                            </div>
                            <FaChevronRight className={`shrink-0 text-slate-500 transition group-hover:translate-x-1 ${tema.hoverFlecha}`} />
                        </div>
                    </button>

                    <button
                        onClick={logout}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        <FaPowerOff />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-5 lg:hidden">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tema.logoMovil}`}>
                                    <FaSeedling />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate font-bold">Invernadero</p>
                                    <p className="truncate text-xs text-slate-500">{tema.panel}</p>
                                </div>
                            </div>
                            <p className={`mt-2 text-xs font-bold uppercase tracking-[0.18em] ${tema.modulo}`}>
                                {moduloActivo.label}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setMenuMovilAbierto(true)}
                                className={`flex h-11 w-11 items-center justify-center rounded-md text-white shadow-sm ${tema.logoMovil}`}
                                aria-label="Abrir menú"
                                title="Abrir menú"
                            >
                                <FaBars />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="relative z-30 hidden border-b border-slate-200 bg-white/85 px-8 py-4 backdrop-blur lg:block">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${tema.modulo}`}>
                                {moduloActivo.label}
                            </p>
                            <h2 className="mt-1 text-2xl font-bold text-slate-950">
                                Hola, {usuario.nombre || usuario.usuario || 'Administrador'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-right">
                                <p className="text-xs font-semibold text-slate-500">Hoy</p>
                                <p className="text-sm font-bold capitalize text-slate-800">{fechaActual}</p>
                            </div>
                            <div className={`rounded-lg border px-4 py-2 ${tema.rolCaja}`}>
                                <p className={`flex items-center gap-2 text-sm font-bold ${tema.rolTexto}`}>
                                    <FaShieldAlt />
                                    {esAdmin ? 'Administrador' : 'Empleado'}
                                </p>
                                <p className={`text-xs ${tema.rolSubtexto}`}>Sesión segura</p>
                            </div>
                            {esAdmin && (
                                <div ref={notificacionesRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setNotificacionesAbiertas(!notificacionesAbiertas)}
                                        className="relative flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                                        aria-label="Notificaciones"
                                        title="Notificaciones"
                                    >
                                        <FaBell />
                                        {ventasNuevas.length > 0 && (
                                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                                                {ventasNuevas.length}
                                            </span>
                                        )}
                                    </button>

                                    {notificacionesAbiertas && (
                                        <div className="absolute right-0 top-13 z-[9999] w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
                                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-950">Ventas de empleados</p>
                                                    <p className="text-xs text-slate-500">Control de movimientos recientes</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={marcarNotificacionesLeidas}
                                                    className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                                                >
                                                    <FaCheckDouble />
                                                    Revisado
                                                </button>
                                            </div>

                                            <div className="max-h-96 overflow-y-auto">
                                                {ventasEmpleado.length === 0 ? (
                                                    <div className="p-5 text-sm text-slate-500">
                                                        Aún no hay ventas realizadas por empleados.
                                                    </div>
                                                ) : ventasEmpleado.slice(0, 8).map((venta) => {
                                                    const nueva = Number(venta.id_venta) > ultimaVentaVista

                                                    return (
                                                        <button
                                                            key={venta.id_venta}
                                                            type="button"
                                                            onClick={() => {
                                                                abrirDetalleNotificacion(venta)
                                                            }}
                                                            className={`block w-full border-b border-slate-100 p-4 text-left transition last:border-0 hover:bg-slate-50 ${nueva ? 'bg-emerald-50/80' : 'bg-white'}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="font-bold text-slate-950">Venta #{venta.id_venta}</p>
                                                                    <p className="mt-1 text-sm text-slate-600">
                                                                        {venta.empleado_nombre} vendió a: {venta.cliente_nombre}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        {new Date(venta.fecha_venta).toLocaleString('es-MX')}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-emerald-700">{formatoMonedaNotificacion.format(Number(venta.total || 0))}</p>
                                                                    {nueva && <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">Nueva</span>}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate('/ventas')}
                                className="flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                            >
                                <FaCashRegister />
                                Nueva venta
                            </button>
                        </div>
                    </div>
                </div>

                <main className="page-enter min-h-screen p-4 sm:p-5 lg:p-8">
                    {children}
                </main>
            </div>

            {menuMovilAbierto && (
                <div className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden" onClick={() => setMenuMovilAbierto(false)}>
                    <aside
                        className="ml-auto flex h-full w-[min(100%,22rem)] flex-col overflow-hidden bg-slate-950 text-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tema.logo}`}>
                                    <FaSeedling />
                                </div>
                                <div>
                                    <p className="font-bold">Invernadero</p>
                                    <p className="text-xs text-slate-400">{tema.panel}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMenuMovilAbierto(false)}
                                className="rounded-md bg-white/10 p-2 text-white"
                                aria-label="Cerrar menú"
                                title="Cerrar"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sesión activa</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <AvatarPerfil
                                        foto={usuario.foto}
                                        idRol={usuario.id_rol}
                                        nombre={usuario.nombre || 'Perfil'}
                                        className={`h-12 w-12 ring-2 transition ${tema.avatar}`}
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">{`${usuario.nombre || usuario.usuario || 'Administrador'} ${usuario.apellido || ''}`.trim()}</p>
                                        <p className="truncate text-sm text-slate-400">{usuario.correo || 'Acceso interno'}</p>
                                    </div>
                                </div>
                            </div>

                            {esAdmin && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Movimientos recientes</p>
                                            <p className="mt-1 text-lg font-bold text-white">{ventasNuevas.length} nuevas</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuMovilAbierto(false)
                                                navigate('/ventas')
                                            }}
                                            className="rounded-md bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
                                        >
                                            Ver ventas
                                        </button>
                                    </div>
                                </div>
                            )}

                            <nav className="grid grid-cols-1 gap-2">
                                {links.map(({ to, label, icon: Icon }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        onClick={() => setMenuMovilAbierto(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                                                isActive
                                                    ? tema.activoMovil
                                                    : 'bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'
                                            }`
                                        }
                                    >
                                        <Icon />
                                        {label}
                                    </NavLink>
                                ))}
                            </nav>

                            <button
                                type="button"
                                onClick={() => {
                                    setMenuMovilAbierto(false)
                                    abrirPerfil()
                                }}
                                className={`rounded-md border px-4 py-3 text-left text-sm font-bold ${tema.botonSuave}`}
                            >
                                Editar perfil
                            </button>

                            <button
                                type="button"
                                onClick={logout}
                                className="mt-auto flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
                            >
                                <FaPowerOff />
                                Cerrar sesión
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {perfilAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                    <form onSubmit={guardarPerfil} autoComplete="off" className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-950">Editar perfil</h2>
                                <p className="text-sm text-slate-500">{esAdmin ? 'Administra tus datos visibles del panel.' : 'Actualiza tus datos básicos de sesión.'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPerfilAbierto(false)}
                                className="rounded-md bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                                aria-label="Cerrar"
                                title="Cerrar"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-5">
                            <div className="flex items-center gap-4">
                                <AvatarPerfil
                                    foto={perfilForm.foto}
                                    idRol={usuario.id_rol}
                                    nombre={perfilForm.nombre || 'Perfil'}
                                    className="h-20 w-20 text-2xl"
                                />
                                <div className={`rounded-md border px-4 py-2 text-sm font-bold ${tema.botonSuave}`}>
                                    Avatar de rol automático
                                    <p className="mt-1 text-xs font-semibold opacity-70">Tu perfil mantiene una identidad visual del panel.</p>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <input
                                    value={perfilForm.nombre}
                                    onChange={(event) => setPerfilForm({ ...perfilForm, nombre: capitalizarNombre(normalizarNombre(event.target.value, 30)) })}
                                    placeholder="Nombre"
                                    maxLength={30}
                                    className={`h-11 w-full rounded-md border border-slate-300 px-3 outline-none ${tema.focoInput}`}
                                />
                                <input
                                    value={perfilForm.apellido}
                                    onChange={(event) => setPerfilForm({ ...perfilForm, apellido: capitalizarNombre(normalizarNombre(event.target.value, 40)) })}
                                    placeholder="Apellido"
                                    maxLength={40}
                                    className={`h-11 w-full rounded-md border border-slate-300 px-3 outline-none ${tema.focoInput}`}
                                />
                                <input
                                    type="email"
                                    value={perfilForm.correo}
                                    onChange={(event) => setPerfilForm({ ...perfilForm, correo: event.target.value.trim().slice(0, 80) })}
                                    placeholder="Correo"
                                    maxLength={80}
                                    className={`h-11 w-full rounded-md border border-slate-300 px-3 outline-none ${tema.focoInput}`}
                                />
                                <input
                                    value={perfilForm.telefono}
                                    onChange={(event) => setPerfilForm({ ...perfilForm, telefono: normalizarTelefono(event.target.value) })}
                                    placeholder="Teléfono"
                                    inputMode="numeric"
                                    maxLength={10}
                                    className={`h-11 w-full rounded-md border border-slate-300 px-3 outline-none ${tema.focoInput}`}
                                />
                            </div>

                            {esAdmin && (
                                <div className="mt-3 space-y-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Datos de administrador</p>
                                    <input
                                        value={perfilForm.puesto}
                                        onChange={(event) => setPerfilForm({ ...perfilForm, puesto: event.target.value })}
                                        placeholder="Puesto o responsabilidad"
                                        className="h-11 w-full rounded-md border border-emerald-200 bg-white px-3 outline-none focus:border-emerald-600"
                                    />
                                    <input
                                        value={perfilForm.ubicacion}
                                        onChange={(event) => setPerfilForm({ ...perfilForm, ubicacion: event.target.value })}
                                        placeholder="Ubicación o sucursal"
                                        className="h-11 w-full rounded-md border border-emerald-200 bg-white px-3 outline-none focus:border-emerald-600"
                                    />
                                    <textarea
                                        value={perfilForm.notas}
                                        onChange={(event) => setPerfilForm({ ...perfilForm, notas: event.target.value })}
                                        placeholder="Notas internas del administrador"
                                        rows="3"
                                        className="w-full resize-none rounded-md border border-emerald-200 bg-white px-3 py-2 outline-none focus:border-emerald-600"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                            <button
                                type="button"
                                onClick={() => setPerfilAbierto(false)}
                                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardandoPerfil}
                                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400 ${tema.guardar}`}
                            >
                                <FaSave />
                                {guardandoPerfil ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {ventaDetalle && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4">
                    <section className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                        <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600" />
                        <div className="flex items-start justify-between gap-4 bg-slate-950 p-5 text-white">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Auditoría de venta</p>
                                <h2 className="mt-2 text-2xl font-bold">Venta #{ventaDetalle.id_venta}</h2>
                                <p className="mt-1 text-sm text-slate-300">
                                    Movimiento registrado el {new Date(ventaDetalle.fecha_venta).toLocaleString('es-MX')}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-slate-950">
                                {Number(ventaDetalle.id_venta) > ultimaVentaVista ? 'Nueva' : 'Revisada'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setVentaDetalle(null)}
                                className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
                                aria-label="Cerrar detalle"
                                title="Cerrar detalle"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 sm:col-span-2">
                                    <p className="text-sm font-semibold text-emerald-800">Total vendido</p>
                                    <p className="mt-1 text-4xl font-bold text-emerald-900">
                                        {formatoMonedaNotificacion.format(Number(ventaDetalle.total || 0))}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Folio</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-950">#{ventaDetalle.id_venta}</p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                                            {String(ventaDetalle.empleado_nombre || 'E').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Empleado responsable</p>
                                            <p className="font-bold text-slate-950">{ventaDetalle.empleado_nombre}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                            ID empleado #{ventaDetalle.id_empleado}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                            Rol: {Number(ventaDetalle.empleado_rol) === 1 ? 'Administrador' : 'Empleado'}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                                            {String(ventaDetalle.cliente_nombre || 'C').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cliente</p>
                                            <p className="font-bold text-slate-950">{ventaDetalle.cliente_nombre}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                            ID cliente #{ventaDetalle.id_cliente}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                            Venta registrada
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Fecha y hora</p>
                                    <p className="mt-2 font-bold text-slate-900">{new Date(ventaDetalle.fecha_venta).toLocaleDateString('es-MX')}</p>
                                    <p className="text-sm text-slate-500">{new Date(ventaDetalle.fecha_venta).toLocaleTimeString('es-MX')}</p>
                                </div>
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Control administrativo</p>
                                    <p className="mt-2 text-sm font-semibold text-amber-900">
                                        Verifica que este monto coincida con el corte del empleado.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
                            <button
                                type="button"
                                onClick={() => setVentaDetalle(null)}
                                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                            >
                                Entendido
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}

export default DashboardLayout
