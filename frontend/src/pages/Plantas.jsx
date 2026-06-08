import { useEffect, useMemo, useState, useRef } from 'react'
import { FaBoxes, FaCheckCircle, FaCloudUploadAlt, FaDollarSign, FaEdit, FaFlask, FaImage, FaLayerGroup, FaLeaf, FaPlus, FaSeedling, FaTag, FaTimesCircle, FaTrash, FaTruck, FaWarehouse } from 'react-icons/fa'
import Swal from 'sweetalert2'

import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { limpiarTexto, validarEnteroNoNegativo, validarLongitud, validarNumeroPositivo } from '../utils/validaciones'

const formInicial = {
    nombre_comun: '',
    nombre_cientifico: '',
    precio: '',
    stock: '',
    descripcion: '',
    imagen: null,
    id_categoria: '',
    id_proveedor: ''
}

const formatoMoneda = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
})

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'https://invernadero-backend-pfgt.onrender.com/api').replace(/\/api\/?$/, '')

function Plantas() {
    const [plantas, setPlantas] = useState([])
    const [categorias, setCategorias] = useState([])
    const [proveedores, setProveedores] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [modoEdicion, setModoEdicion] = useState(false)
    const [idEditar, setIdEditar] = useState(null)
    const [form, setForm] = useState(formInicial)
    const [errores, setErrores] = useState({})
    const [plantaVista, setPlantaVista] = useState(null)
    const imagenPreview = form.imagen ? URL.createObjectURL(form.imagen) : null
    const formRef = useRef(null)

    useEffect(() => {
        obtenerPlantas()
        obtenerCategorias()
        obtenerProveedores()
    }, [])

    const obtenerPlantas = async () => {
        const res = await api.get('/plantas')
        setPlantas(res.data)
    }

    const obtenerCategorias = async () => {
        const res = await api.get('/categorias')
        setCategorias(res.data)
    }

    const obtenerProveedores = async () => {
        const res = await api.get('/proveedores')
        setProveedores(res.data)
    }

    const handleChange = (e) => {
        const { name, value, files } = e.target
        setForm({ ...form, [name]: name === 'imagen' ? files[0] : value })
        setErrores({ ...errores, [name]: '' })
    }

    const limpiar = () => {
        setForm(formInicial)
        setErrores({})
        setModoEdicion(false)
        setIdEditar(null)
        setBusqueda('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const nuevosErrores = {}

        if (!limpiarTexto(form.nombre_comun)) nuevosErrores.nombre_comun = 'El nombre común es obligatorio'
        if (!validarLongitud(form.nombre_comun, 100)) nuevosErrores.nombre_comun = 'Máximo 100 caracteres'
        if (!validarLongitud(form.nombre_cientifico, 120)) nuevosErrores.nombre_cientifico = 'Máximo 120 caracteres'
        if (!validarNumeroPositivo(form.precio)) nuevosErrores.precio = 'Precio mayor a 0'
        if (!validarEnteroNoNegativo(Number(form.stock))) nuevosErrores.stock = 'Stock entero desde 0'
        if (!form.id_categoria) nuevosErrores.id_categoria = 'Selecciona categoría'
        if (!form.id_proveedor) nuevosErrores.id_proveedor = 'Selecciona proveedor'
        if (!validarLongitud(form.descripcion, 350)) nuevosErrores.descripcion = 'Máximo 350 caracteres'

        setErrores(nuevosErrores)

        if (Object.keys(nuevosErrores).length > 0) {
            Swal.fire('Revisa los datos', 'Hay campos incompletos o con formato incorrecto.', 'warning')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const formData = new FormData()

            Object.keys(form).forEach((key) => {
                if (form[key] !== '' && form[key] !== null) formData.append(key, form[key])
            })

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }

            if (modoEdicion) {
                await api.put(`/plantas/${idEditar}`, formData, config)
                Swal.fire('Listo', 'Planta actualizada', 'success')
            } else {
                await api.post('/plantas', formData, config)
                Swal.fire('Listo', 'Planta creada', 'success')
            }

            obtenerPlantas()
            limpiar()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo guardar la planta', 'error')
        }
    }

    const editar = (planta) => {
        setModoEdicion(true)
        setIdEditar(planta.id_planta)
        setForm({
            nombre_comun: planta.nombre_comun || '',
            nombre_cientifico: planta.nombre_cientifico || '',
            precio: planta.precio || '',
            stock: planta.stock || '',
            descripcion: planta.descripcion || '',
            imagen: null,
            id_categoria: planta.id_categoria || '',
            id_proveedor: planta.id_proveedor || ''
        })
        setPlantaVista(null)
        
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
    }

    const eliminar = async (id) => {
        const result = await Swal.fire({
            title: 'Eliminar planta',
            text: 'Esta acción quitará la planta del inventario.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        })

        if (!result.isConfirmed) return

        try {
            const token = localStorage.getItem('token')
            await api.delete(`/plantas/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            Swal.fire('Eliminada', 'Planta eliminada', 'success')
            obtenerPlantas()
        } catch (error) {
            console.log(error)
            Swal.fire('Error', 'No se pudo eliminar', 'error')
        }
    }

    const plantasFiltradas = plantas.filter((planta) =>
        `${planta.nombre_comun} ${planta.nombre_cientifico}`.toLowerCase().includes(busqueda.toLowerCase())
    )

    const resumen = useMemo(() => {
        const unidades = plantas.reduce((total, planta) => total + Number(planta.stock || 0), 0)
        const valor = plantas.reduce((total, planta) => total + (Number(planta.stock || 0) * Number(planta.precio || 0)), 0)
        const criticas = plantas.filter((planta) => Number(planta.stock) <= 5).length

        return { unidades, valor, criticas }
    }, [plantas])

    const obtenerCategoria = (idCategoria) => {
        return categorias.find((categoria) => Number(categoria.id_categoria) === Number(idCategoria))?.nombre_categoria || 'Sin categoría'
    }

    const obtenerProveedor = (idProveedor) => {
        return proveedores.find((proveedor) => Number(proveedor.id_proveedor) === Number(idProveedor))?.nombre_empresa || 'Sin proveedor'
    }

    const mostrarVistaRapida = (planta) => {
        setPlantaVista(planta)
    }

    return (
        <DashboardLayout>
            {plantaVista && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setPlantaVista(null)}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={`${API_ORIGIN}/uploads/${plantaVista.imagen}`}
                            alt={plantaVista.nombre_comun}
                            className="h-48 w-full object-cover"
                        />
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-lg font-bold text-slate-950">{plantaVista.nombre_comun}</p>
                                    <p className="text-xs italic text-slate-500">{plantaVista.nombre_cientifico || 'Sin nombre científico'}</p>
                                </div>
                                <span className={`rounded-md px-3 py-1 text-sm font-bold whitespace-nowrap ${Number(plantaVista.stock) <= 5 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {plantaVista.stock}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-md bg-slate-50 p-3">
                                    <p className="text-xs font-semibold text-slate-500">Precio</p>
                                    <p className="font-bold text-emerald-700">{formatoMoneda.format(Number(plantaVista.precio || 0))}</p>
                                </div>
                                <div className="rounded-md bg-slate-50 p-3">
                                    <p className="text-xs font-semibold text-slate-500">Valor stock</p>
                                    <p className="font-bold text-slate-950">{formatoMoneda.format(Number(plantaVista.precio || 0) * Number(plantaVista.stock || 0))}</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <p className="flex items-center gap-2"><FaTag className="text-emerald-700" /> {obtenerCategoria(plantaVista.id_categoria)}</p>
                                <p className="flex items-center gap-2"><FaTruck className="text-blue-700" /> {obtenerProveedor(plantaVista.id_proveedor)}</p>
                            </div>

                            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                                {plantaVista.descripcion || 'Sin descripción registrada.'}
                            </p>
                            <p className="mt-4 text-center text-xs text-slate-400">Haz click fuera para cerrar</p>
                        </div>
                    </div>
                </div>
            )}

            <section className="mb-6 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-emerald-600 via-lime-500 to-cyan-600" />
                <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Inventario</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-950">Plantas</h1>
                        <p className="mt-2 text-slate-500">Control de catálogo, precios, imágenes y existencias.</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600 text-white">
                        <FaLeaf />
                    </div>
                </div>
                </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaLeaf className="text-emerald-700" />
                    <p className="text-sm font-semibold text-slate-500">Plantas registradas</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{plantas.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaBoxes className="text-blue-700" />
                    <p className="text-sm font-semibold text-slate-500">Unidades disponibles</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{resumen.unidades}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <FaTag className="text-emerald-700" />
                    <p className="text-sm font-semibold text-slate-500">Valor estimado</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-700">{formatoMoneda.format(resumen.valor)}</p>
                </div>
            </section>

            <section className="space-y-6">
                <form ref={formRef} onSubmit={handleSubmit} autoComplete="off" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                {modoEdicion ? 'Actualización' : 'Alta de inventario'}
                            </p>
                            <h2 className="mt-2 text-xl font-bold text-slate-950">{modoEdicion ? 'Editar planta' : 'Nueva planta'}</h2>
                        </div>
                        <div className="rounded-md bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                            Formulario horizontal
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3">
                        {/* Columna izquierda - Campos de texto */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CampoPlanta label="Nombre común" icono={FaLeaf} error={errores.nombre_comun}>
                                    <input name="nombre_comun" value={form.nombre_comun} onChange={handleChange} placeholder="Ej. Monstera" className="h-11 w-full bg-transparent outline-none" />
                                </CampoPlanta>

                                <CampoPlanta label="Nombre científico" icono={FaFlask} error={errores.nombre_cientifico}>
                                    <input name="nombre_cientifico" value={form.nombre_cientifico} onChange={handleChange} placeholder="Ej. Monstera deliciosa" className="h-11 w-full bg-transparent outline-none" />
                                </CampoPlanta>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CampoPlanta label="Precio" icono={FaDollarSign} error={errores.precio}>
                                    <input name="precio" type="number" min="0.01" step="0.01" value={form.precio} onChange={handleChange} placeholder="0.00" className="h-11 w-full bg-transparent outline-none" />
                                </CampoPlanta>

                                <CampoPlanta label="Stock" icono={FaWarehouse} error={errores.stock}>
                                    <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} placeholder="0" className="h-11 w-full bg-transparent outline-none" />
                                </CampoPlanta>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <CampoPlanta label="Categoría" icono={FaLayerGroup} error={errores.id_categoria}>
                                    <select name="id_categoria" value={form.id_categoria} onChange={handleChange} className="h-11 w-full bg-transparent outline-none">
                                        <option value="">Selecciona categoría</option>
                                        {categorias.map((categoria) => <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nombre_categoria}</option>)}
                                    </select>
                                </CampoPlanta>

                                <CampoPlanta label="Proveedor" icono={FaTruck} error={errores.id_proveedor}>
                                    <select name="id_proveedor" value={form.id_proveedor} onChange={handleChange} className="h-11 w-full bg-transparent outline-none">
                                        <option value="">Selecciona proveedor</option>
                                        {proveedores.map((proveedor) => <option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>{proveedor.nombre_empresa}</option>)}
                                    </select>
                                </CampoPlanta>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                                <div className={`rounded-xl border bg-white p-4 shadow-sm transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 ${errores.descripcion ? 'border-red-300' : 'border-slate-300'}`}>
                                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                                        <FaSeedling className="text-emerald-700" />
                                        Descripción
                                    </div>
                                    <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Detalles de cuidado, tamaño, color o notas internas" className="min-h-28 w-full resize-none bg-transparent leading-6 outline-none" />
                                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                                        <span>Notas internas del inventario</span>
                                        <span>{form.descripcion.length} caracteres</span>
                                    </div>
                                    <p className="mt-2 min-h-5 text-xs text-red-600">{errores.descripcion}</p>
                                </div>

                                <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-slate-950 p-4 text-white shadow-lg shadow-slate-950/10">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Acciones</p>
                                        <p className="mt-2 text-sm text-slate-300">
                                            Guarda los cambios cuando la información esté completa.
                                        </p>
                                    </div>

                                    <div className="mt-5 space-y-2">
                                    <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
                                        <FaCheckCircle />
                                        {modoEdicion ? 'Actualizar' : 'Guardar'}
                                    </button>
                                    <button type="button" onClick={limpiar} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20">
                                        <FaTimesCircle />
                                        Cancelar
                                    </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha - Imagen */}
                        <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-lg shadow-emerald-950/5 lg:sticky lg:top-20 lg:h-fit">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FaImage className="text-emerald-700" />
                                Imagen
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                    Preview
                                </span>
                            </div>
                            {imagenPreview ? (
                                <div>
                                    <img src={imagenPreview} alt="Vista previa" className="h-44 w-full object-cover" />
                                    <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-slate-200 bg-emerald-50 px-3 py-3 transition hover:bg-emerald-100">
                                        <FaCloudUploadAlt className="text-emerald-600" />
                                        <span className="text-sm font-bold text-emerald-700">Cambiar imagen</span>
                                        <input type="file" name="imagen" onChange={handleChange} className="hidden" accept="image/*" />
                                    </label>
                                </div>
                            ) : (
                                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-50 to-emerald-50 px-3 py-10 transition hover:to-emerald-100">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                                        <FaCloudUploadAlt className="text-2xl text-emerald-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-900">Sube imagen</p>
                                        <p className="text-xs text-slate-500">Haz click aquí</p>
                                    </div>
                                    <input type="file" name="imagen" onChange={handleChange} className="hidden" accept="image/*" />
                                </label>
                            )}
                        </div>
                    </div>
                </form>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Listado de plantas</h2>
                            <p className="text-sm text-slate-500">{resumen.criticas} productos con stock crítico.</p>
                        </div>
                        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar planta" className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-3">Planta</th>
                                    <th className="px-3 py-3 text-right">Precio</th>
                                    <th className="px-3 py-3 text-right">Stock</th>
                                    <th className="px-3 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plantasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-3 py-10 text-center text-slate-500">
                                            No hay plantas para mostrar.
                                        </td>
                                    </tr>
                                ) : plantasFiltradas.map((planta) => (
                                     <tr
                                        key={planta.id_planta}
                                        onClick={() => mostrarVistaRapida(planta)}
                                        className="border-b transition last:border-0 hover:bg-emerald-50/60 cursor-pointer relative z-10"
                                    >
                                        <td className="px-3 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={`${API_ORIGIN}/uploads/${planta.imagen}`} alt={planta.nombre_comun} className="h-12 w-12 rounded-md object-cover" />
                                                <div>
                                                    <p className="font-semibold text-slate-900">{planta.nombre_comun}</p>
                                                    <p className="text-xs text-slate-500">{planta.nombre_cientifico || 'Sin nombre científico'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-right font-semibold">{formatoMoneda.format(Number(planta.precio || 0))}</td>
                                        <td className="px-3 py-4 text-right">
                                            <span className={`rounded-md px-3 py-1 font-bold ${Number(planta.stock) <= 5 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {planta.stock}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); editar(planta); }} className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 relative z-20" aria-label="Editar planta" title="Editar planta"><FaEdit /></button>
                                                <button onClick={(e) => { e.stopPropagation(); eliminar(planta.id_planta); }} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700 relative z-20" aria-label="Eliminar planta" title="Eliminar planta"><FaTrash /></button>
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

function CampoPlanta({ label, icono: Icono, error, children }) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Icono className="text-emerald-700" />
                {label}
            </span>
            <div className={`flex items-center rounded-lg border bg-white px-3 transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 ${error ? 'border-red-300' : 'border-slate-300'}`}>
                {children}
            </div>
            <p className="mt-1 min-h-5 text-xs text-red-600">{error}</p>
        </label>
    )
}

export default Plantas
