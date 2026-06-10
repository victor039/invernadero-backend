import { useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa'

import api from '../services/api'

import { mezclarPerfilLocal } from '../utils/perfilLocal'

const logoPath = '/naturaleza-viva-logo.svg'

function Login() {

    const navigate = useNavigate()

    const [form, setForm] = useState({

        usuario: '',

        contraseña: ''

    })

    const [errores, setErrores] = useState({})

    const [mensajeError, setMensajeError] = useState('')

    const [cargando, setCargando] = useState(false)

    const [mostrarPassword, setMostrarPassword] = useState(false)

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        })

        setErrores({
            ...errores,
            [e.target.name]: ''
        })

        setMensajeError('')

    }

    const validarFormulario = () => {

        const nuevosErrores = {}

        if (!form.usuario.trim()) {
            nuevosErrores.usuario = 'Ingresa tu usuario'
        }

        if (!form.contraseña) {
            nuevosErrores.contraseña = 'Ingresa tu contraseña'
        } else if (form.contraseña.length < 4) {
            nuevosErrores.contraseña = 'La contraseña es demasiado corta'
        }

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0

    }

    const handleSubmit = async (e) => {

        e.preventDefault()

        if (!validarFormulario()) return

        setCargando(true)
        setMensajeError('')

        try {

            const response = await api.post(

                '/auth/login',

                {
                    usuario: form.usuario.trim(),
                    contraseña: form.contraseña,
                    contrasena: form.contraseña,
                    password: form.contraseña
                }

            )

            localStorage.setItem(

                'token',

                response.data.token

            )

            const empleadoConPerfil = mezclarPerfilLocal(response.data.empleado)

            localStorage.setItem(

                'usuario',

                JSON.stringify(empleadoConPerfil)

            )

            localStorage.setItem(

                'id_empleado',

                empleadoConPerfil.id_empleado

            )

            setForm({ usuario: '', contraseña: '' })
            setErrores({})
            setMensajeError('')

            navigate('/bienvenida')

        } catch (error) {

            console.log(error)

            const mensaje =
                error.response?.data?.mensaje ||
                'No se pudo iniciar sesión. Revisa tus credenciales.'

            setMensajeError(mensaje)

        } finally {

            setCargando(false)

        }

    }

    return (

        <main className="min-h-screen bg-slate-950 text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">

            <section className="relative hidden overflow-hidden lg:block">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,.16),_transparent_26rem),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,.14),_transparent_22rem),linear-gradient(145deg,#020617,#0f172a_52%,#064e3b)]" />
                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />

                <div className="relative z-10 flex min-h-screen flex-col justify-between p-12 text-white">
                    <div className="max-w-xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200">
                            Invernadero
                        </p>

                        <h1 className="mt-6 text-5xl font-bold leading-tight">
                            Control profesional para ventas, stock y reportes.
                        </h1>

                        <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
                            Una interfaz sobria, rápida y lista para operar desde el navegador o instalada como app.
                        </p>
                    </div>

                    <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur">
                        <div className="flex items-center gap-4">
                            <img
                                src={logoPath}
                                alt="Naturaleza Viva Invernadero"
                                className="h-20 w-20 rounded-2xl bg-white p-2 shadow-lg shadow-slate-950/20"
                            />
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200">
                                    Naturaleza Viva
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    El sello visual del sistema para identidad, acceso y experiencia profesional.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    autoComplete="off"
                    className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10"
                >
                    <input type="text" name="fake-user" autoComplete="off" className="hidden" tabIndex="-1" aria-hidden="true" />
                    <input type="text" name="fake-pass" autoComplete="off" className="hidden" tabIndex="-1" aria-hidden="true" />

                    <div className="mb-7 flex items-center gap-4">
                        <img
                            src={logoPath}
                            alt="Naturaleza Viva Invernadero"
                            className="h-20 w-20 shrink-0 rounded-2xl bg-slate-950 p-2 shadow-lg shadow-emerald-950/10"
                        />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                Naturaleza Viva
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Invernadero
                            </p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            Acceso seguro
                        </p>

                        <h2 className="mt-3 text-3xl font-bold text-slate-950">
                            Iniciar sesión
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Ingresa con tu usuario autorizado para continuar.
                        </p>
                    </div>

                    {mensajeError && (
                        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {mensajeError}
                        </div>
                    )}

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Usuario
                    </label>

                    <div className={`mb-2 flex items-center rounded-md border bg-white px-3 transition focus-within:ring-2 ${
                        errores.usuario
                            ? 'border-red-300 focus-within:ring-red-100'
                            : 'border-slate-300 focus-within:border-emerald-600 focus-within:ring-emerald-100'
                    }`}>
                        <FaUser className="mr-3 text-slate-400" />

                        <input
                            type="text"
                            name="usuario"
                            placeholder="usuario"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            className="h-12 w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                            value={form.usuario}
                            onChange={handleChange}
                        />
                    </div>

                    <p className="mb-5 min-h-5 text-sm text-red-600">
                        {errores.usuario}
                    </p>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Contraseña
                    </label>

                    <div className={`mb-2 flex items-center rounded-md border bg-white px-3 transition focus-within:ring-2 ${
                        errores.contraseña
                            ? 'border-red-300 focus-within:ring-red-100'
                            : 'border-slate-300 focus-within:border-emerald-600 focus-within:ring-emerald-100'
                    }`}>
                        <FaLock className="mr-3 text-slate-400" />

                        <input
                            type="text"
                            name="contraseña"
                            placeholder="contraseña"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            className={`h-12 w-full border-0 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 ${mostrarPassword ? '' : 'password-mask'}`}
                            value={form.contraseña}
                            onChange={handleChange}
                        />

                        <button
                            type="button"
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                            className="ml-3 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <p className="mb-6 min-h-5 text-sm text-red-600">
                        {errores.contraseña}
                    </p>

                    <button
                        disabled={cargando}
                        className="flex h-12 w-full items-center justify-center rounded-md bg-emerald-700 px-4 font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >

                        {cargando ? 'Validando acceso...' : 'Entrar al sistema'}

                    </button>

                    <p className="mt-6 text-center text-xs text-slate-500">
                        Sistema de gestión de inventario y ventas
                    </p>

                </form>

            </section>

        </main>

    )

}

export default Login
