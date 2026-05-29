import { useEffect, useMemo, useState } from 'react'
import { FaCalendarAlt, FaCashRegister, FaCheckCircle, FaCreditCard, FaDownload, FaEnvelope, FaExclamationTriangle, FaExchangeAlt, FaLeaf, FaMinus, FaMoneyBillWave, FaPlus, FaPrint, FaReceipt, FaSearch, FaShoppingCart, FaTicketAlt, FaTrash, FaUserCheck, FaUserClock } from 'react-icons/fa'
import Swal from 'sweetalert2'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
})

function Ventas() {
    const [plantas, setPlantas] = useState([])
    const [ventas, setVentas] = useState([])
    const [clientes, setClientes] = useState([])
    const [carrito, setCarrito] = useState([])
    const [plantaSeleccionada, setPlantaSeleccionada] = useState('')
    const [cantidad, setCantidad] = useState(1)
    const [tipoCliente, setTipoCliente] = useState('registrado')
    const [clienteSeleccionado, setClienteSeleccionado] = useState('')
    const [clientePaso, setClientePaso] = useState('Cliente de paso')
    const [metodoPago, setMetodoPago] = useState('')
    const [referenciaPago, setReferenciaPago] = useState('')
    const [correoTicket, setCorreoTicket] = useState('')
    const [busquedaHistorial, setBusquedaHistorial] = useState('')
    const [filtroHistorial, setFiltroHistorial] = useState('hoy')
    const [ticketProcesandoId, setTicketProcesandoId] = useState(null)
    const [entregaTicket, setEntregaTicket] = useState({
        descarga: true,
        correo: false
    })

    useEffect(() => {
        obtenerPlantas()
        obtenerVentas()
        obtenerClientes()
    }, [])

    useEffect(() => {
        if (tipoCliente !== 'registrado') return

        const cliente = clientes.find((item) => item.id_cliente === Number(clienteSeleccionado))

        setCorreoTicket(cliente?.correo || '')
    }, [tipoCliente, clienteSeleccionado, clientes])

    useEffect(() => {
        if (tipoCliente !== 'paso') return

        setEntregaTicket((actual) => ({
            ...actual,
            descarga: true
        }))
    }, [tipoCliente])

    const obtenerPlantas = async () => {
        const response = await api.get('/plantas')
        setPlantas(response.data)
    }

    const obtenerVentas = async () => {
        const token = localStorage.getItem('token')
        const response = await api.get('/ventas', {
            headers: { Authorization: `Bearer ${token}` }
        })
        setVentas(response.data)
    }

    const obtenerClientes = async () => {
        const token = localStorage.getItem('token')
        const response = await api.get('/clientes', {
            headers: { Authorization: `Bearer ${token}` }
        })
        setClientes(response.data)
    }

    const limpiarCapturaProducto = () => {
        setPlantaSeleccionada('')
        setCantidad(1)
    }

    const limpiarFormularioVenta = () => {
        setCarrito([])
        limpiarCapturaProducto()
        setTipoCliente('registrado')
        setClienteSeleccionado('')
        setClientePaso('Cliente de paso')
        setMetodoPago('')
        setReferenciaPago('')
        setCorreoTicket('')
        setEntregaTicket({
            descarga: true,
            correo: false
        })
    }

    const agregarAlCarrito = () => {
        if (!plantaSeleccionada) {
            Swal.fire('Selecciona una planta', 'Elige un producto para agregarlo a la venta.', 'warning')
            return
        }

        const planta = plantas.find((p) => p.id_planta === Number(plantaSeleccionada))
        if (!planta) return

        if (cantidad < 1 || cantidad > Number(planta.stock)) {
            Swal.fire('Cantidad inválida', `Stock disponible: ${planta.stock}`, 'warning')
            return
        }

        const productoExistente = carrito.find((item) => item.id_planta === planta.id_planta)

        if (productoExistente) {
            const nuevaCantidad = productoExistente.cantidad + cantidad

            if (nuevaCantidad > Number(planta.stock)) {
                Swal.fire('Stock insuficiente', `Ya tienes ${productoExistente.cantidad} en el carrito. Stock disponible: ${planta.stock}`, 'warning')
                return
            }

            setCarrito(carrito.map((item) => {
                if (item.id_planta !== planta.id_planta) return item
                return {
                    ...item,
                    cantidad: nuevaCantidad,
                    subtotal: nuevaCantidad * Number(item.precio)
                }
            }))
            limpiarCapturaProducto()
            return
        }

        setCarrito([
            ...carrito,
            {
                id_planta: planta.id_planta,
                nombre: planta.nombre_comun,
                cantidad,
                precio: Number(planta.precio),
                subtotal: Number(planta.precio) * cantidad
            }
        ])
        limpiarCapturaProducto()
    }

    const quitarDelCarrito = (idPlanta) => {
        setCarrito(carrito.filter((item) => item.id_planta !== idPlanta))
    }

    const obtenerStockPlanta = (idPlanta) => {
        const planta = plantas.find((item) => item.id_planta === Number(idPlanta))
        return Number(planta?.stock || 0)
    }

    const actualizarCantidadCarrito = (idPlanta, nuevaCantidad) => {
        const cantidadLimpia = Number(nuevaCantidad)
        const stockDisponible = obtenerStockPlanta(idPlanta)

        if (!Number.isFinite(cantidadLimpia)) return

        if (cantidadLimpia <= 0) {
            quitarDelCarrito(idPlanta)
            return
        }

        if (cantidadLimpia > stockDisponible) {
            Swal.fire('Stock insuficiente', `Stock disponible: ${stockDisponible}`, 'warning')
            return
        }

        setCarrito(carrito.map((item) => {
            if (item.id_planta !== idPlanta) return item

            return {
                ...item,
                cantidad: cantidadLimpia,
                subtotal: cantidadLimpia * Number(item.precio)
            }
        }))
    }

    const total = carrito.reduce((acc, item) => acc + item.subtotal, 0)

    const plantaActual = plantas.find((planta) => planta.id_planta === Number(plantaSeleccionada))
    const clienteActivo = tipoCliente === 'registrado'
        ? clientes.find((cliente) => cliente.id_cliente === Number(clienteSeleccionado))
        : null
    const nombreClienteActivo = tipoCliente === 'registrado'
        ? `${clienteActivo?.nombre || ''} ${clienteActivo?.apellido || ''}`.trim()
        : clientePaso.trim()
    const ticketSeleccionado = [
        entregaTicket.descarga && 'Descarga',
        entregaTicket.correo && 'correo'
    ].filter(Boolean)
    const ventaLista = carrito.length > 0
        && (tipoCliente === 'paso' ? Boolean(clientePaso.trim()) : Boolean(clienteSeleccionado))
        && Boolean(metodoPago)
        && (metodoPago === 'Efectivo' || Boolean(referenciaPago.trim()))
        && ticketSeleccionado.length > 0
        && (!entregaTicket.correo || Boolean(correoTicket.trim()))
    const pasosVenta = [
        { label: 'Productos', listo: carrito.length > 0 },
        { label: 'Cliente', listo: tipoCliente === 'paso' ? Boolean(clientePaso.trim()) : Boolean(clienteSeleccionado) },
        { label: 'Pago', listo: Boolean(metodoPago) && (metodoPago === 'Efectivo' || Boolean(referenciaPago.trim())) },
        { label: 'Ticket', listo: ticketSeleccionado.length > 0 && (!entregaTicket.correo || Boolean(correoTicket.trim())) }
    ]
    const unidadesCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0)

    const ventaHoy = useMemo(() => {
        const hoy = new Date()
        const ventasHoy = ventas.filter((venta) => new Date(venta.fecha_venta).toDateString() === hoy.toDateString())
        const monto = ventasHoy.reduce((totalDia, venta) => totalDia + Number(venta.total || 0), 0)
        return { cantidad: ventasHoy.length, monto }
    }, [ventas])
    const historialFiltrado = useMemo(() => {
        const hoy = new Date().toDateString()
        const texto = busquedaHistorial.trim().toLowerCase()

        return ventas.filter((venta) => {
            const fechaVenta = new Date(venta.fecha_venta)
            const coincideFecha = filtroHistorial === 'todos' || fechaVenta.toDateString() === hoy
            const textoVenta = [
                `venta ${venta.id_venta}`,
                venta.cliente_nombre,
                venta.empleado_nombre,
                venta.total
            ].join(' ').toLowerCase()

            return coincideFecha && (!texto || textoVenta.includes(texto))
        })
    }, [ventas, busquedaHistorial, filtroHistorial])
    const totalHistorial = historialFiltrado.reduce((acc, venta) => acc + Number(venta.total || 0), 0)
    const promedioHistorial = historialFiltrado.length ? totalHistorial / historialFiltrado.length : 0
    const ultimaVenta = historialFiltrado[0]

    const realizarVenta = async () => {
        if (carrito.length === 0) {
            Swal.fire('Agrega productos', 'El carrito está vacío.', 'warning')
            return
        }

        if (tipoCliente === 'registrado' && !clienteSeleccionado) {
            Swal.fire('Selecciona cliente', 'Elige un cliente registrado o cambia a cliente de paso.', 'warning')
            return
        }

        if (tipoCliente === 'paso' && !clientePaso.trim()) {
            Swal.fire('Nombre del cliente', 'Escribe un nombre para el cliente de paso.', 'warning')
            return
        }

        if (!metodoPago) {
            Swal.fire('Método de pago', 'Selecciona cómo pagó el cliente.', 'warning')
            return
        }

        if (metodoPago !== 'Efectivo' && !referenciaPago.trim()) {
            Swal.fire('Referencia requerida', 'Agrega una referencia para este método de pago.', 'warning')
            return
        }

        if (!entregaTicket.descarga && !entregaTicket.correo) {
            Swal.fire('Entrega del ticket', 'Selecciona al menos una forma de entregar el ticket.', 'warning')
            return
        }

        if (entregaTicket.correo && !correoTicket.trim()) {
            Swal.fire('Correo requerido', 'Agrega un correo para enviar el ticket. Si el cliente registrado no tiene correo, escríbelo manualmente.', 'warning')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await api.post(
                '/ventas',
                {
                    id_cliente: tipoCliente === 'registrado' ? Number(clienteSeleccionado) : 1,
                    id_empleado: localStorage.getItem('id_empleado') || 1,
                    productos: carrito,
                    tipo_cliente: tipoCliente,
                    cliente_paso: clientePaso,
                    metodo_pago: metodoPago,
                    referencia_pago: referenciaPago,
                    entrega_ticket: {
                        ...entregaTicket,
                        descarga: true
                    },
                    correo_ticket: correoTicket
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            const descargaLocal = await entregarTicket(response.data)

            const entregas = [
                ...(descargaLocal ? [descargaLocal] : []),
                ...(response.data.entregas || [])
            ]
            const detalleEntregas = entregas
                .map((entrega) => `${entrega.enviado ? 'OK' : 'Pendiente'}: ${entrega.mensaje}`)
                .join('<br />')

            Swal.fire({
                icon: entregas.some((entrega) => entrega.enviado === false) ? 'info' : 'success',
                title: 'Venta realizada',
                html: detalleEntregas || 'Se registró la venta correctamente.'
            })

            limpiarFormularioVenta()
            obtenerVentas()
            obtenerPlantas()
        } catch (error) {
            console.log(error.response?.data || error.message)
            Swal.fire('Error', error.response?.data?.mensaje || 'No se pudo realizar la venta', 'error')
        }
    }

    const toggleEntrega = (campo) => {
        setEntregaTicket({
            ...entregaTicket,
            [campo]: !entregaTicket[campo]
        })
    }

    const descargarTicket = async (pdfUrl, ventaId) => {
        const response = await fetch(pdfUrl)

        if (!response.ok) {
            throw new Error('No se pudo descargar el ticket')
        }

        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `ticket-${ventaId || 'venta'}.pdf`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    }

    const entregarTicket = async (ventaData) => {
        const pdfUrl = ventaData.pdf
        const ventaId = ventaData.venta?.id_venta

        if (entregaTicket.descarga) {
            try {
                await descargarTicket(pdfUrl, ventaId)
                return {
                    enviado: true,
                    mensaje: 'Ticket descargado correctamente'
                }
            } catch (error) {
                console.log(error.message)
                return {
                    enviado: false,
                    mensaje: 'La venta se guardó, pero no se pudo descargar el ticket'
                }
            }
        }

        return null
    }

    const generarTicketHistorial = async (venta, entregaTicketHistorial = {}) => {
        const token = localStorage.getItem('token')
        const response = await api.post(
            `/ventas/${venta.id_venta}/ticket`,
            entregaTicketHistorial,
            { headers: { Authorization: `Bearer ${token}` } }
        )

        return response.data
    }

    const abrirTicketImpresion = async (venta) => {
        try {
            setTicketProcesandoId(venta.id_venta)
            const response = await generarTicketHistorial(venta, {
                entrega_ticket: { descarga: true }
            })

            window.open(response.pdf, '_blank', 'noopener,noreferrer')
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo generar el ticket para imprimir.', 'error')
        } finally {
            setTicketProcesandoId(null)
        }
    }

    const descargarTicketHistorial = async (venta) => {
        try {
            setTicketProcesandoId(venta.id_venta)
            const response = await generarTicketHistorial(venta, {
                entrega_ticket: { descarga: true }
            })

            await descargarTicket(response.pdf, venta.id_venta)
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo descargar el ticket.', 'error')
        } finally {
            setTicketProcesandoId(null)
        }
    }

    const reenviarTicketCorreo = async (venta) => {
        const result = await Swal.fire({
            title: `Enviar ticket #${venta.id_venta}`,
            input: 'email',
            inputLabel: 'Correo del cliente',
            inputValue: venta.correo_ticket || '',
            inputPlaceholder: 'cliente@correo.com',
            confirmButtonText: 'Enviar por Gmail/correo',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1d4ed8',
            inputValidator: (value) => {
                if (!value) return 'Escribe un correo para enviar el ticket'
                if (!/^\S+@\S+\.\S+$/.test(value)) return 'Correo no válido'
                return null
            }
        })

        if (!result.isConfirmed) return

        try {
            setTicketProcesandoId(venta.id_venta)
            const response = await generarTicketHistorial(venta, {
                entrega_ticket: { correo: true },
                correo_ticket: result.value
            })
            const entrega = response.entregas?.[0]

            Swal.fire(entrega?.enviado ? 'Enviado' : 'Revisar configuración', entrega?.mensaje || 'Solicitud procesada', entrega?.enviado ? 'success' : 'info')
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo enviar el ticket por correo.', 'error')
        } finally {
            setTicketProcesandoId(null)
        }
    }

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-500" />
                <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Punto de venta</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-950">Ventas</h1>
                        <p className="mt-2 text-slate-500">Registra ventas, controla el carrito y genera tickets PDF.</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-700 text-white">
                        <FaCashRegister />
                    </div>
                </div>
                </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <p className="text-sm font-semibold text-slate-500">Ventas de hoy</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{ventaHoy.cantidad}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <p className="text-sm font-semibold text-slate-500">Ingresos de hoy</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-700">{formatoMoneda.format(ventaHoy.monto)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <p className="text-sm font-semibold text-slate-500">Total en carrito</p>
                    <p className="mt-2 text-3xl font-bold text-blue-700">{formatoMoneda.format(total)}</p>
                </div>
            </section>

            <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Estado de venta</p>
                                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                                    {ventaLista ? 'Lista para cobrar' : 'Completa los datos pendientes'}
                                </h2>
                            </div>
                            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${ventaLista ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {ventaLista ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                {ventaLista ? 'Validada' : 'Pendiente'}
                            </span>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                            {pasosVenta.map((paso) => (
                                <div key={paso.label} className={`rounded-lg border p-3 ${paso.listo ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm ${paso.listo ? 'bg-emerald-700 text-white' : 'bg-white text-slate-400'}`}>
                                        {paso.listo ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                    </div>
                                    <p className={`text-sm font-bold ${paso.listo ? 'text-emerald-900' : 'text-slate-500'}`}>{paso.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-950 p-5 text-white">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Cliente activo</p>
                        <h3 className="mt-2 text-xl font-bold">{nombreClienteActivo || 'Sin cliente seleccionado'}</h3>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-white/10 p-3">
                                <p className="text-white/60">Unidades</p>
                                <p className="text-2xl font-bold">{unidadesCarrito}</p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-3">
                                <p className="text-white/60">Entrega</p>
                                <p className="font-bold">{ticketSeleccionado.join(' + ') || 'Sin ticket'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(420px,0.95fr)_minmax(560px,1.25fr)]">
                <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Nueva venta</h2>
                            <p className="text-sm text-slate-500">Selecciona producto, cliente y forma de pago.</p>
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-700 text-white">
                            <FaShoppingCart />
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_110px]">
                        <select value={plantaSeleccionada} onChange={(e) => setPlantaSeleccionada(e.target.value)} className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600">
                            <option value="">Selecciona una planta</option>
                            {plantas.map((planta) => (
                                <option key={planta.id_planta} value={planta.id_planta}>
                                    {planta.nombre_comun} - stock {planta.stock}
                                </option>
                            ))}
                        </select>
                        <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <button onClick={agregarAlCarrito} className="flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 sm:col-span-2">
                            <FaPlus />
                            Agregar al carrito
                        </button>
                    </div>
                    <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        {plantaActual ? (
                            <>
                                <div className="relative">
                                    <img src={`http://localhost:3000/uploads/${plantaActual.imagen}`} alt={plantaActual.nombre_comun} className="h-40 w-full object-cover" />
                                    <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-emerald-800 shadow">
                                        <FaLeaf />
                                        Disponible
                                    </span>
                                </div>
                                <div className="p-4">
                                    <p className="font-bold text-slate-950">{plantaActual.nombre_comun}</p>
                                    <p className="text-sm text-slate-500">{plantaActual.nombre_cientifico || 'Sin nombre científico'}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                        <div className="rounded-md bg-white p-3">
                                            <p className="text-xs font-semibold text-slate-500">Precio</p>
                                            <p className="font-bold text-emerald-700">{formatoMoneda.format(Number(plantaActual.precio || 0))}</p>
                                        </div>
                                        <div className="rounded-md bg-white p-3">
                                            <p className="text-xs font-semibold text-slate-500">Stock</p>
                                            <p className="font-bold text-slate-950">{plantaActual.stock}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className={`h-full rounded-full ${Number(plantaActual.stock) <= 5 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                                            style={{ width: `${Math.max(8, Math.min(100, Number(plantaActual.stock || 0) * 5))}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs font-semibold text-slate-500">
                                        {Number(plantaActual.stock) <= 5 ? 'Stock bajo, revisa antes de vender mucho.' : 'Inventario suficiente para venta rápida.'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="p-5 text-sm text-slate-500">
                                Selecciona una planta para ver su ficha rápida antes de agregarla.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-950">Cliente</h2>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => setTipoCliente('registrado')}
                            className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-bold transition ${tipoCliente === 'registrado' ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <FaUserCheck />
                            Registrado
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipoCliente('paso')}
                            className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-bold transition ${tipoCliente === 'paso' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <FaUserClock />
                            De paso
                        </button>
                    </div>

                    <div className="mt-4">
                        {tipoCliente === 'registrado' ? (
                            <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} className="h-14 w-full rounded-md border border-slate-300 px-4 text-base font-semibold outline-none focus:border-blue-700">
                                <option value="">Selecciona cliente</option>
                                {clientes.map((cliente) => (
                                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                                        {cliente.nombre} {cliente.apellido || ''} {cliente.telefono ? `- ${cliente.telefono}` : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="space-y-3">
                                <input value={clientePaso} onChange={(e) => setClientePaso(e.target.value)} placeholder="Nombre del cliente de paso" className="h-16 w-full rounded-md border border-amber-200 bg-amber-50 px-4 text-lg font-bold text-slate-950 outline-none focus:border-amber-600 focus:bg-white" />
                                <input value={correoTicket} onChange={(e) => setCorreoTicket(e.target.value)} placeholder="Correo electrónico para Gmail" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-amber-600" />
                            </div>
                        )}
                    </div>

                    <div className={`mt-4 rounded-lg border p-4 ${nombreClienteActivo ? 'border-blue-100 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${nombreClienteActivo ? 'text-blue-700' : 'text-amber-700'}`}>Cliente que aparecerá en el ticket</p>
                        <p className="mt-2 text-xl font-bold text-slate-950">{nombreClienteActivo || 'Pendiente de seleccionar'}</p>
                        <p className="mt-1 text-sm text-slate-500">
                            Revisa bien el nombre antes de cobrar la venta.
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-950">Pago</h2>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {[
                            ['Efectivo', FaMoneyBillWave, 'emerald'],
                            ['Transferencia', FaExchangeAlt, 'blue'],
                            ['Tarjeta', FaCreditCard, 'violet']
                        ].map(([metodo, Icono]) => (
                            <button
                                key={metodo}
                                type="button"
                                onClick={() => {
                                    setMetodoPago(metodo)
                                    if (metodo === 'Efectivo') setReferenciaPago('')
                                }}
                                className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-bold transition ${metodoPago === metodo ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Icono />
                                {metodo}
                            </button>
                        ))}
                    </div>
                    {metodoPago !== 'Efectivo' && (
                        <input value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} placeholder="Referencia, folio o autorización" className="mt-4 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-slate-950" />
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Entrega del ticket</h2>
                            <p className="text-sm text-slate-500">Elige una o varias formas de entrega.</p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-700 text-white">
                            <FaTicketAlt />
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button type="button" onClick={() => toggleEntrega('descarga')} className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-bold transition ${entregaTicket.descarga ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
                            <FaDownload />
                            Descargar
                        </button>
                        <button type="button" onClick={() => toggleEntrega('correo')} className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-bold transition ${entregaTicket.correo ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
                            <FaEnvelope />
                            Correo
                        </button>
                    </div>

                    {tipoCliente === 'registrado' && entregaTicket.correo && (
                        <div className="mt-4">
                            <input value={correoTicket} onChange={(e) => setCorreoTicket(e.target.value)} placeholder="Correo electrónico" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-blue-700" />
                        </div>
                    )}
                </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Cliente para esta venta</p>
                                    <h2 className="mt-1 text-2xl font-bold text-slate-950">{nombreClienteActivo || 'Sin cliente seleccionado'}</h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {tipoCliente === 'registrado' ? 'Cliente registrado' : 'Cliente de paso'} · {metodoPago || 'Pago pendiente'}
                                    </p>
                                </div>
                                <div className={`rounded-full px-3 py-1 text-xs font-bold ${nombreClienteActivo ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {nombreClienteActivo ? 'Revisado' : 'Pendiente'}
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg bg-slate-950 px-5 py-4 text-right text-white">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Total</p>
                            <p className="text-3xl font-bold text-emerald-300">{formatoMoneda.format(total)}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-3">Producto</th>
                                    <th className="px-3 py-3 text-right">Cantidad</th>
                                    <th className="px-3 py-3 text-right">Precio</th>
                                    <th className="px-3 py-3 text-right">Subtotal</th>
                                    <th className="px-3 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carrito.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-3 py-8 text-center text-slate-500">No hay productos en el carrito.</td>
                                    </tr>
                                ) : carrito.map((item) => (
                                    <tr key={item.id_planta} className="border-b transition last:border-0 hover:bg-blue-50/60">
                                        <td className="px-3 py-4 font-semibold text-slate-900">{item.nombre}</td>
                                        <td className="px-3 py-4">
                                            <div className="flex justify-end">
                                                <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => actualizarCantidadCarrito(item.id_planta, item.cantidad - 1)}
                                                        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100"
                                                        aria-label="Restar cantidad"
                                                        title="Restar cantidad"
                                                    >
                                                        <FaMinus />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={obtenerStockPlanta(item.id_planta)}
                                                        value={item.cantidad}
                                                        onChange={(event) => actualizarCantidadCarrito(item.id_planta, event.target.value)}
                                                        className="h-9 w-14 border-x border-slate-200 text-center font-bold outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => actualizarCantidadCarrito(item.id_planta, item.cantidad + 1)}
                                                        className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100"
                                                        aria-label="Sumar cantidad"
                                                        title="Sumar cantidad"
                                                    >
                                                        <FaPlus />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => actualizarCantidadCarrito(item.id_planta, item.cantidad + 5)}
                                                        className="h-9 border-l border-slate-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                                        title="Agregar 5 unidades"
                                                    >
                                                        +5
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-right">{formatoMoneda.format(item.precio)}</td>
                                        <td className="px-3 py-4 text-right font-bold text-emerald-700">{formatoMoneda.format(item.subtotal)}</td>
                                        <td className="px-3 py-4 text-right">
                                            <button onClick={() => quitarDelCarrito(item.id_planta)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700" aria-label="Quitar producto" title="Quitar producto"><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">Resumen de cobro</p>
                            <p className="mt-2">Productos: {carrito.length}</p>
                            <p>Pago: {metodoPago || 'Pendiente'}{referenciaPago ? ` · ${referenciaPago}` : ''}</p>
                            <p>Ticket: {ticketSeleccionado.join(' + ') || 'Sin entrega'}</p>
                        </div>
                        <button onClick={realizarVenta} className={`flex h-full min-h-20 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition ${ventaLista ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-500 hover:bg-slate-600'}`}>
                            <FaCashRegister />
                            {ventaLista ? 'Cobrar venta' : 'Revisar venta'}
                        </button>
                    </div>
                </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-950 p-5 text-white">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-500 text-slate-950">
                                <FaReceipt />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Auditoría de ventas</p>
                                <h2 className="mt-1 text-2xl font-bold">Historial de ventas</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                            <div className="flex h-11 items-center rounded-md bg-white px-3 text-slate-900">
                                <FaSearch className="mr-2 text-slate-400" />
                                <input
                                    value={busquedaHistorial}
                                    onChange={(event) => setBusquedaHistorial(event.target.value)}
                                    placeholder="Buscar venta, cliente o empleado"
                                    className="w-full bg-transparent text-sm outline-none"
                                />
                            </div>
                            <div className="flex rounded-md bg-white/10 p-1">
                                {[
                                    ['hoy', 'Hoy'],
                                    ['todos', 'Todos']
                                ].map(([valor, label]) => (
                                    <button
                                        key={valor}
                                        type="button"
                                        onClick={() => setFiltroHistorial(valor)}
                                        className={`h-9 rounded px-4 text-sm font-bold transition ${filtroHistorial === valor ? 'bg-emerald-500 text-slate-950' : 'text-white hover:bg-white/10'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 border-b border-slate-200 md:grid-cols-3">
                    <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r">
                        <p className="text-sm font-semibold text-slate-500">Ventas encontradas</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">{historialFiltrado.length}</p>
                    </div>
                    <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r">
                        <p className="text-sm font-semibold text-slate-500">Monto filtrado</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-700">{formatoMoneda.format(totalHistorial)}</p>
                    </div>
                    <div className="p-5">
                        <p className="text-sm font-semibold text-slate-500">Promedio por venta</p>
                        <p className="mt-2 text-3xl font-bold text-blue-700">{formatoMoneda.format(promedioHistorial)}</p>
                    </div>
                </div>

                {ultimaVenta && (
                    <div className="border-b border-slate-200 bg-blue-50/60 p-5">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Último movimiento</p>
                                <p className="mt-1 font-bold text-slate-950">
                                    Venta #{ultimaVenta.id_venta} · {ultimaVenta.cliente_nombre || `Cliente #${ultimaVenta.id_cliente}`}
                                </p>
                                <p className="text-sm text-slate-500">
                                    Atendió: {ultimaVenta.empleado_nombre || `Empleado #${ultimaVenta.id_empleado}`}
                                </p>
                            </div>
                            <div className="rounded-lg bg-white px-4 py-3 text-right shadow-sm">
                                <p className="text-xs font-semibold text-slate-500">Total</p>
                                <p className="text-xl font-bold text-emerald-700">{formatoMoneda.format(Number(ultimaVenta.total || 0))}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1040px] text-left text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-4 py-3">Venta</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Atendió</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-right">Ticket</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historialFiltrado.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                                        No hay ventas que coincidan con el filtro.
                                    </td>
                                </tr>
                            ) : historialFiltrado.map((venta) => (
                                <tr key={venta.id_venta} className="border-b transition last:border-0 hover:bg-slate-50">
                                    <td className="px-4 py-4">
                                        <p className="font-bold text-slate-950">Venta #{venta.id_venta}</p>
                                        <p className="text-xs text-slate-500">Folio interno</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-semibold text-slate-900">{venta.cliente_nombre || `Cliente #${venta.id_cliente}`}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${venta.tipo_cliente === 'paso' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {venta.tipo_cliente === 'paso' ? 'Cliente de paso' : 'Registrado'}
                                            </span>
                                            <span className="text-xs text-slate-500">ID #{venta.id_cliente}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-semibold text-slate-900">{venta.empleado_nombre || `Empleado #${venta.id_empleado}`}</p>
                                        <span className={`mt-1 inline-block rounded-full px-2 py-1 text-[11px] font-bold ${Number(venta.empleado_rol) === 1 ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {Number(venta.empleado_rol) === 1 ? 'Administrador' : 'Empleado'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <FaCalendarAlt className="text-slate-400" />
                                            <div>
                                                <p>{new Date(venta.fecha_venta).toLocaleDateString('es-MX')}</p>
                                                <p className="text-xs text-slate-500">{new Date(venta.fecha_venta).toLocaleTimeString('es-MX')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <p className="text-lg font-bold text-emerald-700">{formatoMoneda.format(Number(venta.total || 0))}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {venta.ticket_descarga !== false && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirTicketImpresion(venta)}
                                                        disabled={ticketProcesandoId === venta.id_venta}
                                                        className="rounded-md bg-slate-950 p-2 text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                                                        aria-label="Reimprimir ticket"
                                                        title="Reimprimir ticket"
                                                    >
                                                        <FaPrint />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => descargarTicketHistorial(venta)}
                                                        disabled={ticketProcesandoId === venta.id_venta}
                                                        className="rounded-md bg-emerald-700 p-2 text-white transition hover:bg-emerald-800 disabled:bg-slate-400"
                                                        aria-label="Descargar ticket"
                                                        title="Descargar ticket"
                                                    >
                                                        <FaDownload />
                                                    </button>
                                                </>
                                            )}
                                            {venta.ticket_correo && (
                                                <button
                                                    type="button"
                                                    onClick={() => reenviarTicketCorreo(venta)}
                                                    disabled={ticketProcesandoId === venta.id_venta}
                                                    className="rounded-md bg-blue-700 p-2 text-white transition hover:bg-blue-800 disabled:bg-slate-400"
                                                    aria-label="Enviar ticket por correo"
                                                    title={venta.correo_ticket ? `Enviar a ${venta.correo_ticket}` : 'Enviar ticket por correo'}
                                                >
                                                    <FaEnvelope />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </DashboardLayout>
    )
}

export default Ventas
