import { useEffect, useMemo, useRef, useState } from 'react'
import { FaAddressCard, FaEdit, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaPlus, FaSearch, FaTrash, FaUserTie } from 'react-icons/fa'
import Swal from 'sweetalert2'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { limpiarTexto, validarCorreo, validarLongitud, validarTelefono } from '../utils/validaciones'

const clienteInicial = {
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    direccion: ''
}

function Clientes() {
    const [clientes, setClientes] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [form, setForm] = useState(clienteInicial)
    const [errores, setErrores] = useState({})
    const [editandoId, setEditandoId] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const formRef = useRef(null)

    const token = localStorage.getItem('token')
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

    useEffect(() => {
        obtenerClientes()
    }, [])

    const obtenerClientes = async () => {
        try {
            const response = await api.get('/clientes', { headers })
            setClientes(response.data)
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudieron cargar los clientes', 'error')
        }
    }

    const validar = () => {
        const nuevosErrores = {}

        if (!limpiarTexto(form.nombre)) nuevosErrores.nombre = 'El nombre es obligatorio'
        if (!validarLongitud(form.nombre, 80)) nuevosErrores.nombre = 'Máximo 80 caracteres'
        if (!validarLongitud(form.apellido, 80)) nuevosErrores.apellido = 'Máximo 80 caracteres'
        if (!validarCorreo(form.correo)) nuevosErrores.correo = 'Correo no válido'
        if (!validarTelefono(form.telefono)) nuevosErrores.telefono = 'Teléfono no válido'
        if (!validarLongitud(form.direccion, 180)) nuevosErrores.direccion = 'Máximo 180 caracteres'

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm({ ...form, [name]: value })
        setErrores({ ...errores, [e.target.name]: '' })
    }

    const limpiar = () => {
        setForm(clienteInicial)
        setErrores({})
        setEditandoId(null)
    }

    const guardar = async (e) => {
        e.preventDefault()
        if (!validar()) return

        try {
            setGuardando(true)

            if (editandoId) {
                await api.put(`/clientes/${editandoId}`, form, { headers })
                Swal.fire('Listo', 'Cliente actualizado', 'success')
            } else {
                await api.post('/clientes', form, { headers })
                Swal.fire('Listo', 'Cliente creado', 'success')
            }

            limpiar()
            setBusqueda('')
            obtenerClientes()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', error.response?.data?.mensaje || 'No se pudo guardar el cliente', 'error')
        } finally {
            setGuardando(false)
        }
    }

    const editar = (cliente) => {
        setEditandoId(cliente.id_cliente)
        setForm({
            nombre: cliente.nombre || '',
            apellido: cliente.apellido || '',
            correo: cliente.correo || '',
            telefono: cliente.telefono || '',
            direccion: cliente.direccion || ''
        })

        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    const eliminar = async (cliente) => {
        const result = await Swal.fire({
            title: 'Eliminar cliente',
            text: `Se eliminará a ${cliente.nombre} ${cliente.apellido || ''}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        })

        if (!result.isConfirmed) return

        try {
            await api.delete(`/clientes/${cliente.id_cliente}`, { headers })
            Swal.fire('Eliminado', 'Cliente eliminado', 'success')
            obtenerClientes()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo eliminar el cliente', 'error')
        }
    }

    const clientesFiltrados = clientes.filter((cliente) => {
        const texto = `${cliente.nombre} ${cliente.apellido} ${cliente.correo} ${cliente.telefono}`.toLowerCase()
        return texto.includes(busqueda.toLowerCase())
    })

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-cyan-100 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-cyan-700 via-blue-600 to-emerald-600" />
                <div className="flex items-start justify-between gap-4 p-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Relaciones</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-950">Clientes</h1>
                        <p className="mt-2 text-slate-500">Administra contactos, datos de compra y ubicación de tus clientes.</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-cyan-700 text-white">
                        <FaUserTie />
                    </div>
                </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaAddressCard className="text-cyan-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Clientes registrados</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{clientes.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaEnvelope className="text-blue-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Con correo</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{clientes.filter((cliente) => cliente.correo).length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaPhoneAlt className="text-emerald-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Con teléfono</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{clientes.filter((cliente) => cliente.telefono).length}</p>
                </div>
            </section>

            <section className="space-y-6">
                <form ref={formRef} onSubmit={guardar} autoComplete="off" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                                {editandoId ? 'Actualización' : 'Alta de cliente'}
                            </p>
                            <h2 className="mt-2 text-xl font-bold text-slate-950">{editandoId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
                        </div>
                        <div className="rounded-md bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
                            {clientes.length} clientes registrados
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Campo icono={FaUserTie} error={errores.nombre}>
                            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="h-11 w-full bg-transparent outline-none" />
                        </Campo>
                        <Campo icono={FaAddressCard} error={errores.apellido}>
                            <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className="h-11 w-full bg-transparent outline-none" />
                        </Campo>
                        <Campo icono={FaEnvelope} error={errores.correo}>
                            <input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" className="h-11 w-full bg-transparent outline-none" />
                        </Campo>
                        <Campo icono={FaPhoneAlt} error={errores.telefono}>
                            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="h-11 w-full bg-transparent outline-none" />
                        </Campo>

                        <div className={`rounded-lg border bg-white p-3 focus-within:border-cyan-700 md:col-span-2 xl:col-span-3 ${errores.direccion ? 'border-red-300' : 'border-slate-300'}`}>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                <FaMapMarkerAlt className="text-cyan-700" />
                                Dirección
                            </div>
                            <textarea name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección del cliente" className="min-h-11 w-full resize-none bg-transparent outline-none" />
                            <p className="mt-1 min-h-5 text-xs text-red-600">{errores.direccion}</p>
                        </div>

                        <div className="flex gap-2">
                            <button disabled={guardando} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:bg-slate-400">
                                <FaPlus />
                                {editandoId ? 'Actualizar' : 'Guardar'}
                            </button>
                            {editandoId && <button type="button" onClick={limpiar} className="h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancelar</button>}
                        </div>
                    </div>
                </form>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Directorio de clientes</h2>
                            <p className="text-sm text-slate-500">Consulta y administra datos de contacto.</p>
                        </div>
                        <div className="flex h-11 items-center rounded-md border border-slate-300 px-3 focus-within:border-cyan-700">
                            <FaSearch className="mr-2 text-slate-400" />
                            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente" className="bg-transparent text-sm outline-none" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-3">Cliente</th>
                                    <th className="px-3 py-3">Contacto</th>
                                    <th className="px-3 py-3">Dirección</th>
                                    <th className="px-3 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientesFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-3 py-10 text-center text-slate-500">
                                            No hay clientes para mostrar.
                                        </td>
                                    </tr>
                                ) : clientesFiltrados.map((cliente) => (
                                    <tr key={cliente.id_cliente} className="border-b transition last:border-0 hover:bg-cyan-50/60">
                                        <td className="px-3 py-4">
                                            <p className="font-semibold text-slate-900">{cliente.nombre} {cliente.apellido}</p>
                                            <p className="text-xs text-slate-500">ID #{cliente.id_cliente}</p>
                                        </td>
                                        <td className="px-3 py-4">
                                            <p>{cliente.correo || 'Sin correo'}</p>
                                            <p className="text-xs text-slate-500">{cliente.telefono || 'Sin teléfono'}</p>
                                        </td>
                                        <td className="px-3 py-4 text-slate-500">{cliente.direccion || 'Sin dirección'}</td>
                                        <td className="px-3 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => editar(cliente)} className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700" aria-label="Editar cliente" title="Editar cliente"><FaEdit /></button>
                                                <button onClick={() => eliminar(cliente)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700" aria-label="Eliminar cliente" title="Eliminar cliente"><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </DashboardLayout>
    )
}

function Campo({ icono: Icono, error, children }) {
    return (
        <div>
            <div className={`flex items-center rounded-lg border bg-white px-3 focus-within:border-cyan-700 ${error ? 'border-red-300' : 'border-slate-300'}`}>
                <Icono className="mr-3 text-cyan-700" />
                {children}
            </div>
            <p className="mt-1 min-h-5 text-xs text-red-600">{error}</p>
        </div>
    )
}

export default Clientes
