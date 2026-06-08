export const limpiarTexto = (valor) => String(valor || '').trim()

export const validarCorreo = (valor) => {
    const correo = limpiarTexto(valor)
    if (!correo) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)
}

export const validarTelefono = (valor) => {
    const telefono = limpiarTexto(valor)
    if (!telefono) return true
    const digitos = telefono.replace(/\D/g, '')
    return /^\+?[\d\s().-]+$/.test(telefono) && digitos.length >= 7 && digitos.length <= 15
}

export const validarNombrePersona = (valor) => {
    const texto = limpiarTexto(valor)
    if (!texto) return true
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(texto)
}

export const validarUsuario = (valor) => {
    const usuario = limpiarTexto(valor)
    if (!usuario) return true
    return /^[a-zA-Z0-9._-]{3,30}$/.test(usuario)
}

export const validarSinSoloNumeros = (valor) => {
    const texto = limpiarTexto(valor)
    if (!texto) return true
    return !/^\d+$/.test(texto)
}

export const validarNumeroPositivo = (valor) => {
    const numero = Number(valor)
    return Number.isFinite(numero) && numero > 0
}

export const validarEnteroNoNegativo = (valor) => {
    const numero = Number(valor)
    return Number.isInteger(numero) && numero >= 0
}

export const validarLongitud = (valor, max) => limpiarTexto(valor).length <= max
