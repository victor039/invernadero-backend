import { useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { FaEdit, FaPlus, FaTrash, FaUsers } from 'react-icons/fa'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { limpiarTexto, validarCorreo, validarLongitud, validarTelefono } from '../utils/validaciones'

const empleadoInicial = {
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    usuario: '',
    contraseña: '',
    id_rol: '2'
}

function Empleados() {
    const [empleados, setEmpleados] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [form, setForm] = useState(empleadoInicial)
    const [errores, setErrores] = useState({})
    const [editandoId, setEditandoId] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const formRef = useRef(null)

    const token = localStorage.getItem('token')
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

    useEffect(() => {
        obtenerEmpleados()
    }, [])

    const obtenerEmpleados = async () => {
        try {
            const response = await api.get('/empleados', { headers })
            setEmpleados(response.data)
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudieron cargar los empleados', 'error')
        }
    }

    const validar = () => {
        const nuevosErrores = {}

        if (!limpiarTexto(form.nombre)) nuevosErrores.nombre = 'El nombre es obligatorio'
        if (!validarLongitud(form.nombre, 80)) nuevosErrores.nombre = 'Máximo 80 caracteres'
        if (!validarLongitud(form.apellido, 80)) nuevosErrores.apellido = 'Máximo 80 caracteres'
        if (!limpiarTexto(form.usuario)) nuevosErrores.usuario = 'El usuario es obligatorio'
        if (!/^[a-zA-Z0-9._-]{3,30}$/.test(limpiarTexto(form.usuario))) nuevosErrores.usuario = 'Usa 3-30 caracteres, letras/números/punto/guion'
        if (!validarCorreo(form.correo)) nuevosErrores.correo = 'Correo no válido'
        if (!validarTelefono(form.telefono)) nuevosErrores.telefono = 'Teléfono no válido'
        if (!editandoId && form.contraseña.length < 4) nuevosErrores.contraseña = 'Mínimo 4 caracteres'
        if (editandoId && form.contraseña && form.contraseña.length < 4) nuevosErrores.contraseña = 'Mínimo 4 caracteres'

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const limpiar = () => {
        setForm(empleadoInicial)
        setErrores({})
        setEditandoId(null)
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setErrores({ ...errores, [e.target.name]: '' })
    }

    const guardar = async (e) => {
        e.preventDefault()
        if (!validar()) return

        try {
            setGuardando(true)
            const payload = { ...form, id_rol: Number(form.id_rol) }

            if (editandoId && !payload.contraseña) delete payload.contraseña

            if (editandoId) {
                await api.put(`/empleados/${editandoId}`, payload, { headers })
                Swal.fire('Listo', 'Empleado actualizado', 'success')
            } else {
                await api.post('/empleados', payload, { headers })
                Swal.fire('Listo', 'Empleado creado', 'success')
            }

            limpiar()
            setBusqueda('')
            obtenerEmpleados()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', error.response?.data?.mensaje || 'No se pudo guardar el empleado', 'error')
        } finally {
            setGuardando(false)
        }
    }

    const editar = (empleado) => {
        setEditandoId(empleado.id_empleado)
        setForm({
            nombre: empleado.nombre || '',
            apellido: empleado.apellido || '',
            correo: empleado.correo || '',
            telefono: empleado.telefono || '',
            usuario: empleado.usuario || '',
            contraseña: '',
            id_rol: String(empleado.id_rol || '2')
        })

        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    const eliminar = async (empleado) => {
        const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}')

        if (usuarioActual.id_empleado === empleado.id_empleado) {
            Swal.fire('Atención', 'No puedes eliminar tu propio usuario activo', 'warning')
            return
        }

        const result = await Swal.fire({
            title: 'Eliminar empleado',
            text: `Se eliminará a ${empleado.nombre || empleado.usuario}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        })

        if (!result.isConfirmed) return

        try {
            await api.delete(`/empleados/${empleado.id_empleado}`, { headers })
            Swal.fire('Eliminado', 'Empleado eliminado', 'success')
            obtenerEmpleados()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo eliminar el empleado', 'error')
        }
    }

    const empleadosFiltrados = empleados.filter((empleado) => {
        const texto = `${empleado.nombre} ${empleado.apellido} ${empleado.usuario} ${empleado.correo}`.toLowerCase()
        return texto.includes(busqueda.toLowerCase())
    })

    return (
        <DashboardLayout>
            <section className="mb-6 overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-amber-600 via-orange-500 to-emerald-600" />
                <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Personal</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-950">Empleados</h1>
                        <p className="mt-2 text-slate-500">Administra usuarios, roles y datos de contacto del personal.</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber-600 text-white">
                        <FaUsers />
                    </div>
                </div>
                </div>
            </section>

            <section ref={formRef} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <h2 className="text-xl font-bold text-slate-950">{editandoId ? 'Editar empleado' : 'Nuevo empleado'}</h2>
                    <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar empleado" className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600" />
                </div>

                <form onSubmit={guardar} autoComplete="off" className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
                    <input type="text" name="fake-employee-user" autoComplete="off" className="hidden" tabIndex="-1" aria-hidden="true" />
                    <input type="text" name="fake-employee-pass" autoComplete="off" className="hidden" tabIndex="-1" aria-hidden="true" />
                    <div>
                        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.nombre}</p>
                    </div>
                    <div>
                        <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.apellido}</p>
                    </div>
                    <div>
                        <input name="usuario" value={form.usuario} onChange={handleChange} placeholder="Usuario" autoComplete="off" data-lpignore="true" data-1p-ignore="true" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.usuario}</p>
                    </div>
                    <div>
                        <input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.correo}</p>
                    </div>
                    <div>
                        <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.telefono}</p>
                    </div>
                    <div>
                        <select name="id_rol" value={form.id_rol} onChange={handleChange} className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600">
                            <option value="1">Administrador</option>
                            <option value="2">Empleado</option>
                        </select>
                        <p className="mt-1 min-h-5 text-xs text-red-600"></p>
                    </div>
                    <div>
                        <input name="contraseña" type="text" value={form.contraseña} onChange={handleChange} placeholder={editandoId ? 'Nueva contraseña opcional' : 'Contraseña'} autoComplete="off" data-lpignore="true" data-1p-ignore="true" className="password-mask h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.contraseña}</p>
                    </div>
                    <div className="flex gap-2">
                        <button disabled={guardando} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-400">
                            <FaPlus />
                            {editandoId ? 'Actualizar' : 'Crear'}
                        </button>
                        {editandoId && <button type="button" onClick={limpiar} className="h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancelar</button>}
                    </div>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-3 py-3">Empleado</th>
                                <th className="px-3 py-3">Usuario</th>
                                <th className="px-3 py-3">Contacto</th>
                                <th className="px-3 py-3">Rol</th>
                                <th className="px-3 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empleadosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-3 py-10 text-center text-slate-500">
                                        No hay empleados para mostrar.
                                    </td>
                                </tr>
                            ) : empleadosFiltrados.map((empleado) => (
                                <tr key={empleado.id_empleado} className="border-b transition last:border-0 hover:bg-amber-50/60">
                                    <td className="px-3 py-4">
                                        <p className="font-semibold text-slate-900">{empleado.nombre} {empleado.apellido}</p>
                                        <p className="text-xs text-slate-500">ID #{empleado.id_empleado}</p>
                                    </td>
                                    <td className="px-3 py-4">{empleado.usuario}</td>
                                    <td className="px-3 py-4">
                                        <p>{empleado.correo || 'Sin correo'}</p>
                                        <p className="text-xs text-slate-500">{empleado.telefono || 'Sin teléfono'}</p>
                                    </td>
                                    <td className="px-3 py-4">
                                        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                            {Number(empleado.id_rol) === 1 ? 'Administrador' : 'Empleado'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => editar(empleado)} className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700" aria-label="Editar empleado" title="Editar empleado"><FaEdit /></button>
                                            <button onClick={() => eliminar(empleado)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700" aria-label="Eliminar empleado" title="Eliminar empleado"><FaTrash /></button>
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

export default Empleados
