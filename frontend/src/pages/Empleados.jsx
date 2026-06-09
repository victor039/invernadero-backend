import { useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { FaCamera, FaEdit, FaIdBadge, FaPlus, FaShieldAlt, FaTrash, FaUserTie, FaUsers } from 'react-icons/fa'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { limpiarTexto, normalizarNombre, normalizarTelefono, validarCorreo, validarLongitudMinMax, validarNombrePersona, validarPassword, validarTelefono, validarUsuario } from '../utils/validaciones'

const empleadoInicial = {
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    usuario: '',
    contraseña: '',
    id_rol: '2'
}

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'https://invernadero-backend-pfgt.onrender.com/api').replace(/\/api\/?$/, '')

const obtenerFotoEmpleadoSrc = (foto) => {
    if (!foto) return ''
    if (foto.startsWith('data:image/') || foto.startsWith('http')) return foto

    const ruta = foto.replace(/^\/?uploads\//, '').replace(/^\/+/, '')
    return `${API_ORIGIN}/uploads/${ruta}`
}

const dataUrlToBlob = (dataUrl) => {
    const [metadata, base64] = dataUrl.split(',')
    const mime = metadata.match(/data:(.*);base64/)?.[1] || 'image/jpeg'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }

    return new Blob([bytes], { type: mime })
}

const comprimirImagenEmpleado = (file) => new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
        const size = 320
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const escala = Math.max(size / image.width, size / image.height)
        const ancho = image.width * escala
        const alto = image.height * escala

        canvas.width = size
        canvas.height = size
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(image, (size - ancho) / 2, (size - alto) / 2, ancho, alto)

        URL.revokeObjectURL(objectUrl)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
    }

    image.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('No se pudo procesar la imagen'))
    }

    image.src = objectUrl
})

function Empleados() {
    const [empleados, setEmpleados] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [form, setForm] = useState(empleadoInicial)
    const [errores, setErrores] = useState({})
    const [editandoId, setEditandoId] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [fotoPreview, setFotoPreview] = useState('')
    const [fotoArchivo, setFotoArchivo] = useState(null)
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
        if (limpiarTexto(form.nombre) && !validarLongitudMinMax(form.nombre, 2, 30)) nuevosErrores.nombre = 'Usa de 2 a 30 caracteres'
        if (limpiarTexto(form.nombre) && !validarNombrePersona(form.nombre)) nuevosErrores.nombre = 'Solo letras, espacios, apóstrofes o guiones'
        if (limpiarTexto(form.apellido) && !validarLongitudMinMax(form.apellido, 2, 40)) nuevosErrores.apellido = 'Usa de 2 a 40 caracteres'
        if (limpiarTexto(form.apellido) && !validarNombrePersona(form.apellido)) nuevosErrores.apellido = 'Solo letras, espacios, apóstrofes o guiones'
        if (!limpiarTexto(form.usuario)) nuevosErrores.usuario = 'El usuario es obligatorio'
        if (!validarUsuario(form.usuario)) nuevosErrores.usuario = 'Usa 3-30 caracteres, letras/números/punto/guion'
        if (!limpiarTexto(form.correo)) nuevosErrores.correo = 'El correo es obligatorio'
        if (!validarCorreo(form.correo)) nuevosErrores.correo = 'Correo no válido'
        if (!validarTelefono(form.telefono)) nuevosErrores.telefono = 'Teléfono de 10 dígitos'
        if (!validarPassword(form.contraseña, !editandoId)) nuevosErrores.contraseña = 'Mínimo 8 caracteres con letras y números'

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const limpiar = () => {
        setForm(empleadoInicial)
        setErrores({})
        setEditandoId(null)
        setFotoPreview('')
        setFotoArchivo(null)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        let valorLimpio = value
        if (name === 'nombre') valorLimpio = normalizarNombre(value, 30)
        if (name === 'apellido') valorLimpio = normalizarNombre(value, 40)
        if (name === 'telefono') valorLimpio = normalizarTelefono(value)
        if (name === 'correo') valorLimpio = value.trim().slice(0, 80)
        if (name === 'usuario') valorLimpio = value.trim().slice(0, 30)
        if (name === 'contraseña') valorLimpio = value.slice(0, 60)

        setForm({ ...form, [name]: valorLimpio })
        setErrores({ ...errores, [name]: '' })
    }

    const cambiarFoto = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            Swal.fire('Archivo no válido', 'Selecciona una imagen para el empleado.', 'warning')
            event.target.value = ''
            return
        }

        try {
            const fotoComprimida = await comprimirImagenEmpleado(file)
            setFotoPreview(fotoComprimida)
            setFotoArchivo(dataUrlToBlob(fotoComprimida))
        } catch (error) {
            console.log(error)
            Swal.fire('Imagen no procesada', 'No se pudo preparar la foto del empleado.', 'error')
        } finally {
            event.target.value = ''
        }
    }

    const guardar = async (e) => {
        e.preventDefault()
        if (!validar()) return

        try {
            setGuardando(true)
            const payload = new FormData()

            payload.append('nombre', form.nombre)
            payload.append('apellido', form.apellido)
            payload.append('correo', form.correo)
            payload.append('telefono', form.telefono)
            payload.append('usuario', form.usuario)
            payload.append('id_rol', Number(form.id_rol))

            if (form.contraseña) {
                payload.append('password', form.contraseña)
            }

            if (fotoArchivo) {
                payload.append('foto', fotoArchivo, `empleado-${form.usuario || 'perfil'}.jpg`)
            }

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
        setFotoPreview(empleado.foto || '')
        setFotoArchivo(null)

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
            html: `
                <div style="text-align:left">
                    <p>Se eliminará a <strong>${empleado.nombre || empleado.usuario}</strong>.</p>
                    <p style="margin-top:8px;color:#64748b">Si tiene ventas registradas, se conservarán y pasarán al administrador activo para no perder historial.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        })

        if (!result.isConfirmed) return

        try {
            const response = await api.delete(`/empleados/${empleado.id_empleado}`, { headers })
            const ventasReasignadas = Number(response.data?.ventasReasignadas || 0)

            Swal.fire(
                'Eliminado',
                ventasReasignadas > 0
                    ? `Empleado eliminado. ${ventasReasignadas} ventas se conservaron en el historial.`
                    : 'Empleado eliminado correctamente.',
                'success'
            )
            obtenerEmpleados()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', error.response?.data?.mensaje || 'No se pudo eliminar el empleado', 'error')
        }
    }

    const empleadosFiltrados = empleados.filter((empleado) => {
        const texto = `${empleado.nombre} ${empleado.apellido} ${empleado.usuario} ${empleado.correo}`.toLowerCase()
        return texto.includes(busqueda.toLowerCase())
    })
    const totalAdmins = empleados.filter((empleado) => Number(empleado.id_rol) === 1).length
    const totalOperativos = empleados.filter((empleado) => Number(empleado.id_rol) !== 1).length
    const conFoto = empleados.filter((empleado) => Boolean(empleado.foto)).length

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
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3 xl:row-span-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xl text-white">
                                {fotoPreview ? (
                                    <img src={obtenerFotoEmpleadoSrc(fotoPreview)} alt="Foto del empleado" className="h-full w-full object-cover" />
                                ) : (
                                    <FaUserTie />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">Foto del empleado</p>
                                <p className="text-xs text-slate-500">Se ajusta automáticamente.</p>
                            </div>
                        </div>
                        <label className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 text-sm font-bold text-amber-800 transition hover:bg-amber-100">
                            <FaCamera />
                            {fotoPreview ? 'Cambiar foto' : 'Agregar foto'}
                            <input type="file" accept="image/*" onChange={cambiarFoto} className="hidden" />
                        </label>
                    </div>
                    <div>
                        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" maxLength={30} className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.nombre}</p>
                    </div>
                    <div>
                        <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" maxLength={40} className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.apellido}</p>
                    </div>
                    <div>
                        <input name="usuario" value={form.usuario} onChange={handleChange} placeholder="Usuario" maxLength={30} autoComplete="off" data-lpignore="true" data-1p-ignore="true" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.usuario}</p>
                    </div>
                    <div>
                        <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="Correo" maxLength={80} className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
                        <p className="mt-1 min-h-5 text-xs text-red-600">{errores.correo}</p>
                    </div>
                    <div>
                        <input name="telefono" inputMode="numeric" value={form.telefono} onChange={handleChange} placeholder="Teléfono" maxLength={10} className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
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
                        <input name="contraseña" type="text" value={form.contraseña} onChange={handleChange} placeholder={editandoId ? 'Nueva contraseña opcional' : 'Contraseña'} maxLength={60} autoComplete="off" data-lpignore="true" data-1p-ignore="true" className="password-mask h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600" />
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

                <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-500">Personal activo</p>
                            <FaUsers className="text-emerald-700" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-950">{empleados.length}</p>
                    </div>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-blue-700">Operativos</p>
                            <FaIdBadge className="text-blue-700" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-blue-950">{totalOperativos}</p>
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-amber-700">Admins / fotos</p>
                            <FaShieldAlt className="text-amber-700" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-amber-950">{totalAdmins} / {conFoto}</p>
                    </div>
                </section>

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
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-bold text-white">
                                                {empleado.foto ? (
                                                    <img src={obtenerFotoEmpleadoSrc(empleado.foto)} alt={`${empleado.nombre} ${empleado.apellido}`} className="h-full w-full object-cover" />
                                                ) : (
                                                    <FaUserTie />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{empleado.nombre} {empleado.apellido}</p>
                                                <p className="text-xs text-slate-500">ID #{empleado.id_empleado}</p>
                                            </div>
                                        </div>
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
