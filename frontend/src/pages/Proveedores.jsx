import { useEffect, useMemo, useState } from 'react'
import { FaBuilding, FaEdit, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaPlus, FaSearch, FaShippingFast, FaTrash, FaUserCog } from 'react-icons/fa'
import Swal from 'sweetalert2'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

const proveedorInicial = {
    nombre_empresa: '',
    contacto: '',
    correo: '',
    telefono: '',
    direccion: ''
}

function Proveedores() {
    const [proveedores, setProveedores] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [form, setForm] = useState(proveedorInicial)
    const [errores, setErrores] = useState({})
    const [editandoId, setEditandoId] = useState(null)
    const [guardando, setGuardando] = useState(false)

    const token = localStorage.getItem('token')
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

    useEffect(() => {
        obtenerProveedores()
    }, [])

    const obtenerProveedores = async () => {
        try {
            const response = await api.get('/proveedores')
            setProveedores(response.data)
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error')
        }
    }

    const validar = () => {
        const nuevosErrores = {}

        if (!form.nombre_empresa.trim()) nuevosErrores.nombre_empresa = 'El nombre de la empresa es obligatorio'
        if (form.correo && !/^\S+@\S+\.\S+$/.test(form.correo)) nuevosErrores.correo = 'Correo no válido'

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setErrores({ ...errores, [e.target.name]: '' })
    }

    const limpiar = () => {
        setForm(proveedorInicial)
        setErrores({})
        setEditandoId(null)
    }

    const guardar = async (e) => {
        e.preventDefault()
        if (!validar()) return

        try {
            setGuardando(true)

            if (editandoId) {
                await api.put(`/proveedores/${editandoId}`, form, { headers })
                Swal.fire('Listo', 'Proveedor actualizado', 'success')
            } else {
                await api.post('/proveedores', form, { headers })
                Swal.fire('Listo', 'Proveedor creado', 'success')
            }

            limpiar()
            setBusqueda('')
            obtenerProveedores()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', error.response?.data?.mensaje || 'No se pudo guardar el proveedor', 'error')
        } finally {
            setGuardando(false)
        }
    }

    const editar = (proveedor) => {
        setEditandoId(proveedor.id_proveedor)
        setForm({
            nombre_empresa: proveedor.nombre_empresa || '',
            contacto: proveedor.contacto || '',
            correo: proveedor.correo || '',
            telefono: proveedor.telefono || '',
            direccion: proveedor.direccion || ''
        })
    }

    const eliminar = async (proveedor) => {
        const result = await Swal.fire({
            title: 'Eliminar proveedor',
            text: `Se eliminará ${proveedor.nombre_empresa}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        })

        if (!result.isConfirmed) return

        try {
            await api.delete(`/proveedores/${proveedor.id_proveedor}`, { headers })
            Swal.fire('Eliminado', 'Proveedor eliminado', 'success')
            obtenerProveedores()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo eliminar el proveedor', 'error')
        }
    }

    const proveedoresFiltrados = proveedores.filter((proveedor) => {
        const texto = `${proveedor.nombre_empresa} ${proveedor.contacto} ${proveedor.correo} ${proveedor.telefono}`.toLowerCase()
        return texto.includes(busqueda.toLowerCase())
    })

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-indigo-700 via-blue-600 to-emerald-600" />
                <div className="flex items-start justify-between gap-4 p-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Abastecimiento</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-950">Proveedores</h1>
                        <p className="mt-2 text-slate-500">Gestiona empresas proveedoras, contactos, teléfonos y ubicaciones.</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-700 text-white">
                        <FaShippingFast />
                    </div>
                </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaBuilding className="text-indigo-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Proveedores registrados</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{proveedores.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaEnvelope className="text-blue-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Con correo</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{proveedores.filter((proveedor) => proveedor.correo).length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaPhoneAlt className="text-emerald-700" />
                    <p className="mt-4 text-sm font-semibold text-slate-500">Con teléfono</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{proveedores.filter((proveedor) => proveedor.telefono).length}</p>
                </div>
            </section>

            <section className="space-y-6">
                <form onSubmit={guardar} autoComplete="off" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">
                                {editandoId ? 'Actualización' : 'Alta de proveedor'}
                            </p>
                            <h2 className="mt-2 text-xl font-bold text-slate-950">{editandoId ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
                        </div>
                        <div className="rounded-md bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800">
                            Directorio de abastecimiento
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <CampoProveedor icono={FaBuilding} error={errores.nombre_empresa}>
                            <input name="nombre_empresa" value={form.nombre_empresa} onChange={handleChange} placeholder="Empresa" className="h-11 w-full bg-transparent outline-none" />
                        </CampoProveedor>
                        <CampoProveedor icono={FaUserCog}>
                            <input name="contacto" value={form.contacto} onChange={handleChange} placeholder="Contacto" className="h-11 w-full bg-transparent outline-none" />
                        </CampoProveedor>
                        <CampoProveedor icono={FaEnvelope} error={errores.correo}>
                            <input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" className="h-11 w-full bg-transparent outline-none" />
                        </CampoProveedor>
                        <CampoProveedor icono={FaPhoneAlt}>
                            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="h-11 w-full bg-transparent outline-none" />
                        </CampoProveedor>

                        <div className="rounded-lg border border-slate-300 bg-white p-3 focus-within:border-indigo-700 md:col-span-2 xl:col-span-3">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                <FaMapMarkerAlt className="text-indigo-700" />
                                Dirección
                            </div>
                            <textarea name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección del proveedor" className="min-h-11 w-full resize-none bg-transparent outline-none" />
                        </div>

                        <div className="flex gap-2">
                            <button disabled={guardando} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 disabled:bg-slate-400">
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
                            <h2 className="text-xl font-bold text-slate-950">Directorio de proveedores</h2>
                            <p className="text-sm text-slate-500">Consulta contactos y datos de abastecimiento.</p>
                        </div>
                        <div className="flex h-11 items-center rounded-md border border-slate-300 px-3 focus-within:border-indigo-700">
                            <FaSearch className="mr-2 text-slate-400" />
                            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar proveedor" className="bg-transparent text-sm outline-none" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-3">Proveedor</th>
                                    <th className="px-3 py-3">Contacto</th>
                                    <th className="px-3 py-3">Dirección</th>
                                    <th className="px-3 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proveedoresFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-3 py-10 text-center text-slate-500">
                                            No hay proveedores para mostrar.
                                        </td>
                                    </tr>
                                ) : proveedoresFiltrados.map((proveedor) => (
                                    <tr key={proveedor.id_proveedor} className="border-b transition last:border-0 hover:bg-indigo-50/60">
                                        <td className="px-3 py-4">
                                            <p className="font-semibold text-slate-900">{proveedor.nombre_empresa}</p>
                                            <p className="text-xs text-slate-500">ID #{proveedor.id_proveedor}</p>
                                        </td>
                                        <td className="px-3 py-4">
                                            <p>{proveedor.contacto || 'Sin contacto'}</p>
                                            <p className="text-xs text-slate-500">{proveedor.correo || 'Sin correo'} · {proveedor.telefono || 'Sin teléfono'}</p>
                                        </td>
                                        <td className="px-3 py-4 text-slate-500">{proveedor.direccion || 'Sin dirección'}</td>
                                        <td className="px-3 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => editar(proveedor)} className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700" aria-label="Editar proveedor" title="Editar proveedor"><FaEdit /></button>
                                                <button onClick={() => eliminar(proveedor)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700" aria-label="Eliminar proveedor" title="Eliminar proveedor"><FaTrash /></button>
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

function CampoProveedor({ icono: Icono, error, children }) {
    return (
        <div>
            <div className={`flex items-center rounded-lg border bg-white px-3 focus-within:border-indigo-700 ${error ? 'border-red-300' : 'border-slate-300'}`}>
                <Icono className="mr-3 text-indigo-700" />
                {children}
            </div>
            <p className="mt-1 min-h-5 text-xs text-red-600">{error}</p>
        </div>
    )
}

export default Proveedores
