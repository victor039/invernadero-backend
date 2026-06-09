export const limpiarTexto = (valor) => String(valor || '').trim()

export const soloDigitos = (valor) => limpiarTexto(valor).replace(/\D/g, '')

export const validarCorreo = (valor) => {
    const correo = limpiarTexto(valor)
    if (!correo) return true
    if (correo.length > 80) return false
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(correo)
}

export const validarTelefono = (valor) => {
    const telefono = limpiarTexto(valor)
    if (!telefono) return true
    return soloDigitos(telefono).length === 10
}

export const validarNombrePersona = (valor) => {
    const texto = limpiarTexto(valor)
    if (!texto) return true
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(texto)
}

export const validarUsuario = (valor) => {
    const usuario = limpiarTexto(valor)
    if (!usuario) return true
    return /^[a-zA-Z0-9._-]{3,30}$/.test(usuario) && !/^[._-]/.test(usuario) && !/[._-]$/.test(usuario)
}

export const validarPassword = (valor, obligatorio = true) => {
    const password = String(valor || '')
    if (!password) return !obligatorio
    return password.length >= 8 && password.length <= 60 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

export const validarSinSoloNumeros = (valor) => {
    const texto = limpiarTexto(valor)
    if (!texto) return true
    return !/^\d+$/.test(texto)
}

export const validarNumeroPositivo = (valor, max = Number.MAX_SAFE_INTEGER) => {
    const numero = Number(valor)
    return Number.isFinite(numero) && numero > 0 && numero <= max
}

export const validarEnteroNoNegativo = (valor, max = Number.MAX_SAFE_INTEGER) => {
    const numero = Number(valor)
    return Number.isInteger(numero) && numero >= 0 && numero <= max
}

export const validarLongitud = (valor, max) => limpiarTexto(valor).length <= max

export const validarLongitudMinMax = (valor, min, max) => {
    const longitud = limpiarTexto(valor).length
    return longitud >= min && longitud <= max
}

export const normalizarTelefono = (valor) => soloDigitos(valor).slice(0, 10)

export const normalizarNombre = (valor, max = 30) => String(valor || '')
    .replace(/[0-9]/g, '')
    .replace(/^\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, max)

export const capitalizarNombre = (valor) => String(valor || '')
    .replace(/\S+/g, (palabra) => palabra.charAt(0).toLocaleUpperCase('es-MX') + palabra.slice(1).toLocaleLowerCase('es-MX'))
