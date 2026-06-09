const limpiarTexto = (valor) => String(valor || '').trim().replace(/\s{2,}/g, ' ')
const soloDigitos = (valor) => limpiarTexto(valor).replace(/\D/g, '')

const validarCorreo = (valor) => {
    const correo = limpiarTexto(valor)
    if (!correo) return true
    return correo.length <= 80 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(correo)
}

const validarTelefono = (valor) => {
    const telefono = limpiarTexto(valor)
    if (!telefono) return true
    return soloDigitos(telefono).length === 10
}

const validarNombrePersona = (valor) => {
    const texto = limpiarTexto(valor)
    if (!texto) return true
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(texto)
}

const validarUsuario = (valor) => {
    const usuario = limpiarTexto(valor)
    if (!usuario) return true
    return /^[a-zA-Z0-9._-]{3,30}$/.test(usuario) && !/^[._-]/.test(usuario) && !/[._-]$/.test(usuario)
}

const validarPassword = (valor, obligatorio = true) => {
    const password = String(valor || '')
    if (!password) return !obligatorio
    return password.length >= 8 && password.length <= 60 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

const validarLongitud = (valor, max) => limpiarTexto(valor).length <= max
const validarLongitudMinMax = (valor, min, max) => {
    const longitud = limpiarTexto(valor).length
    return longitud >= min && longitud <= max
}

const validarSinSoloNumeros = (valor) => {
    const texto = limpiarTexto(valor)
    if (!texto) return true
    return !/^\d+$/.test(texto)
}

const validarNumeroPositivo = (valor, max = 999999.99) => {
    const numero = Number(valor)
    return Number.isFinite(numero) && numero > 0 && numero <= max
}

const validarEnteroNoNegativo = (valor, max = 99999) => {
    const numero = Number(valor)
    return Number.isInteger(numero) && numero >= 0 && numero <= max
}

const normalizarTelefono = (valor) => soloDigitos(valor).slice(0, 10)

const crearErrorValidacion = (mensaje) => {
    const error = new Error(mensaje)
    error.status = 400
    return error
}

const validarPayload = (reglas) => {
    const error = reglas.find((regla) => regla.condicion)
    if (error) throw crearErrorValidacion(error.mensaje)
}

module.exports = {
    limpiarTexto,
    soloDigitos,
    validarCorreo,
    validarTelefono,
    validarNombrePersona,
    validarUsuario,
    validarPassword,
    validarLongitud,
    validarLongitudMinMax,
    validarSinSoloNumeros,
    validarNumeroPositivo,
    validarEnteroNoNegativo,
    normalizarTelefono,
    validarPayload
}
