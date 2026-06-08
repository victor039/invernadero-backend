const STORAGE_KEY = 'perfiles_usuario'

export const obtenerPerfilesLocales = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch (error) {
        console.log(error)
        return {}
    }
}

export const obtenerPerfilLocal = (idEmpleado) => {
    if (!idEmpleado) return {}
    const perfiles = obtenerPerfilesLocales()
    return perfiles[String(idEmpleado)] || {}
}

export const guardarPerfilLocal = (usuario) => {
    if (!usuario?.id_empleado) return usuario

    const perfiles = obtenerPerfilesLocales()
    const usuarioGuardado = {
        ...perfiles[String(usuario.id_empleado)],
        ...usuario
    }

    perfiles[String(usuario.id_empleado)] = usuarioGuardado
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perfiles))

    return usuarioGuardado
}

export const mezclarPerfilLocal = (usuario) => {
    const perfilLocal = obtenerPerfilLocal(usuario?.id_empleado)

    return {
        puesto: perfilLocal.puesto,
        ubicacion: perfilLocal.ubicacion,
        notas: perfilLocal.notas,
        ...usuario
    }
}
