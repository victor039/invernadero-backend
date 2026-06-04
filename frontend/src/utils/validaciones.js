export const limpiarTexto = (valor) => String(valor || '').trim()

export const validarCorreo = (valor) => {
    const correo = limpiarTexto(valor)
    if (!correo) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)
}

export const validarTelefono = (valor) => {
    const telefono = limpiarTexto(valor)
    if (!telefono) return true
    return /^\+?[\d\s().-]{7,20}$/.test(telefono)
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
