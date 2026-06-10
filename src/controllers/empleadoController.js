const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const fs = require('fs')
const path = require('path')

const Empleado = require('../models/Empleado')
const Venta = require('../models/Venta')
const sequelize = require('../config/database')
const {
    limpiarTexto,
    normalizarTelefono,
    validarCorreo,
    validarLongitudMinMax,
    validarNombrePersona,
    validarPassword,
    validarTelefono,
    validarUsuario,
    validarPayload
} = require('../utils/validaciones')

const normalizarEmpleado = (body) => ({
    nombre: limpiarTexto(body.nombre),
    apellido: limpiarTexto(body.apellido),
    correo: limpiarTexto(body.correo).toLowerCase(),
    telefono: normalizarTelefono(body.telefono),
    foto: body.foto,
    usuario: limpiarTexto(body.usuario),
    contraseña: body.contraseña,
    password: body.password,
    id_rol: body.id_rol
})

const validarEmpleado = (empleado, { nuevo = false, perfilPropio = false } = {}) => {
    const password = empleado.contraseña || empleado.password

    validarPayload([
        { condicion: !perfilPropio && !empleado.nombre, mensaje: 'El nombre del empleado es obligatorio' },
        { condicion: empleado.nombre && !validarLongitudMinMax(empleado.nombre, 2, 30), mensaje: 'El nombre debe tener de 2 a 30 caracteres' },
        { condicion: empleado.nombre && !validarNombrePersona(empleado.nombre), mensaje: 'El nombre solo puede contener letras' },
        { condicion: empleado.apellido && !validarLongitudMinMax(empleado.apellido, 2, 40), mensaje: 'El apellido debe tener de 2 a 40 caracteres' },
        { condicion: empleado.apellido && !validarNombrePersona(empleado.apellido), mensaje: 'El apellido solo puede contener letras' },
        { condicion: !perfilPropio && !empleado.usuario, mensaje: 'El usuario es obligatorio' },
        { condicion: empleado.usuario && !validarUsuario(empleado.usuario), mensaje: 'El usuario debe tener 3-30 caracteres y no iniciar o terminar con símbolos' },
        { condicion: !perfilPropio && !empleado.correo, mensaje: 'El correo es obligatorio' },
        { condicion: empleado.correo && !validarCorreo(empleado.correo), mensaje: 'El correo no tiene un formato válido' },
        { condicion: empleado.telefono && !validarTelefono(empleado.telefono), mensaje: 'El teléfono debe tener 10 dígitos' },
        { condicion: !validarPassword(password, nuevo), mensaje: 'La contraseña debe tener mínimo 8 caracteres con letras y números' },
        { condicion: !perfilPropio && !empleado.id_rol, mensaje: 'El rol es obligatorio' },
        { condicion: empleado.id_rol && ![1, 2].includes(Number(empleado.id_rol)), mensaje: 'El rol seleccionado no es válido' }
    ])
}

const guardarFotoPerfil = (foto, idEmpleado) => {
    if (!foto || typeof foto !== 'string') return foto
    if (!foto.startsWith('data:image/')) return foto

    const match = foto.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/)

    if (!match) {
        throw new Error('Formato de imagen no válido')
    }

    const extension = match[1] === 'jpeg' ? 'jpg' : match[1]
    const buffer = Buffer.from(match[2], 'base64')

    if (buffer.length > 2 * 1024 * 1024) {
        throw new Error('La imagen de perfil sigue siendo demasiado grande')
    }

    const carpetaPerfiles = path.join(__dirname, '../../uploads/perfiles')
    fs.mkdirSync(carpetaPerfiles, { recursive: true })

    const nombreArchivo = `perfil-${idEmpleado}-${Date.now()}.${extension}`
    fs.writeFileSync(path.join(carpetaPerfiles, nombreArchivo), buffer)

    return `perfiles/${nombreArchivo}`
}

const obtenerFotoPerfilSubida = (file) => {
    if (!file) return undefined
    return `perfiles/${file.filename}`
}

const eliminarFotoPerfil = (foto) => {
    if (!foto || typeof foto !== 'string') return
    if (foto.startsWith('data:image/') || foto.startsWith('http')) return

    const rutaRelativa = foto.replace(/^\/?uploads\//, '').replace(/^\/+/, '')
    const rutaFoto = path.join(__dirname, '../../uploads', rutaRelativa)

    if (rutaFoto.startsWith(path.join(__dirname, '../../uploads')) && fs.existsSync(rutaFoto)) {
        fs.unlinkSync(rutaFoto)
    }
}

const limpiarEmpleado = (empleado) => {
    const data = empleado.toJSON()
    delete data.contraseña
    delete data.password_hash
    return data
}

exports.crearEmpleado = async (req, res) => {
    try {
        const { nombre, apellido, correo, telefono, foto, usuario, contraseña, password, id_rol } = normalizarEmpleado(req.body)
        validarEmpleado({ nombre, apellido, correo, telefono, usuario, contraseña, password, id_rol }, { nuevo: true })

        const existeEmpleado = await Empleado.findOne({
            where: {
                [Op.or]: [
                    { usuario },
                    ...(correo ? [{ correo }] : [])
                ]
            }
        })

        if (existeEmpleado) {
            return res.status(400).json({
                mensaje: 'Ya existe un empleado con ese usuario o correo'
            })
        }

        const passwordHash = await bcrypt.hash(contraseña || password, 10)

        const empleado = await Empleado.create({
            nombre,
            apellido,
            correo,
            telefono,
            foto: null,
            usuario,
            contraseña: passwordHash,
            password_hash: passwordHash,
            id_rol
        })

        if (foto) {
            await empleado.update({
                foto: obtenerFotoPerfilSubida(req.file) || guardarFotoPerfil(foto, empleado.id_empleado)
            })
        } else if (req.file) {
            await empleado.update({
                foto: obtenerFotoPerfilSubida(req.file)
            })
        }

        res.status(201).json(limpiarEmpleado(empleado))
    } catch (error) {
        res.status(error.status || 500).json({
            mensaje: error.status ? error.message : 'Error al crear empleado',
            error: error.message
        })
    }
}

exports.obtenerEmpleados = async (req, res) => {
    try {
        const empleados = await Empleado.findAll({
            attributes: {
                exclude: ['contraseña']
            },
            order: [['id_empleado', 'DESC']]
        })

        res.json(empleados)
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al obtener empleados'
        })
    }
}

exports.actualizarEmpleado = async (req, res) => {
    try {
        const esAdmin = Number(req.usuario?.id_rol) === 1
        const esPerfilPropio = Number(req.params.id) === Number(req.usuario?.id)

        if (!esAdmin && !esPerfilPropio) {
            return res.status(403).json({
                mensaje: 'Solo puedes actualizar tu propio perfil'
            })
        }

        const empleado = await Empleado.findByPk(req.params.id)

        if (!empleado) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        const fotoAnterior = empleado.foto
        const { nombre, apellido, correo, telefono, foto, usuario, contraseña, password, id_rol } = normalizarEmpleado(req.body)
        validarEmpleado(
            { nombre, apellido, correo, telefono, usuario, contraseña, password, id_rol },
            { nuevo: false, perfilPropio: !esAdmin }
        )

        if (usuario || correo) {
            const existeEmpleado = await Empleado.findOne({
                where: {
                    id_empleado: {
                        [Op.ne]: empleado.id_empleado
                    },
                    [Op.or]: [
                        ...(usuario ? [{ usuario }] : []),
                        ...(correo ? [{ correo }] : [])
                    ]
                }
            })

            if (existeEmpleado) {
                return res.status(400).json({
                    mensaje: 'Ya existe otro empleado con ese usuario o correo'
                })
            }
        }

        const fotoPerfil = obtenerFotoPerfilSubida(req.file)
            || (foto === undefined ? undefined : guardarFotoPerfil(foto, empleado.id_empleado))

        const datosActualizar = {
            nombre,
            apellido,
            correo,
            telefono,
            foto: fotoPerfil,
            usuario,
            id_rol
        }

        Object.keys(datosActualizar).forEach((key) => {
            if (datosActualizar[key] === undefined) {
                delete datosActualizar[key]
            }
        })

        if (contraseña || password) {
            const passwordHash = await bcrypt.hash(contraseña || password, 10)
            datosActualizar.contraseña = passwordHash
            datosActualizar.password_hash = passwordHash
        }

        await empleado.update(datosActualizar)
        await empleado.reload()

        if (fotoPerfil && fotoAnterior && fotoPerfil !== fotoAnterior) {
            eliminarFotoPerfil(fotoAnterior)
        }

        res.json({
            mensaje: 'Empleado actualizado',
            empleado: limpiarEmpleado(empleado)
        })
    } catch (error) {
        console.error('Error al actualizar empleado:', error)
        res.status(error.status || 500).json({
            mensaje: error.status ? error.message : 'Error al actualizar empleado',
            error: error.message
        })
    }
}

exports.eliminarEmpleado = async (req, res) => {
    const transaction = await sequelize.transaction()

    try {
        const idEmpleado = Number(req.params.id)
        const idUsuarioActual = Number(req.usuario?.id)

        if (idEmpleado === idUsuarioActual) {
            await transaction.rollback()
            return res.status(400).json({
                mensaje: 'No puedes eliminar tu propio usuario activo'
            })
        }

        const empleado = await Empleado.findByPk(idEmpleado, { transaction })

        if (!empleado) {
            await transaction.rollback()
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        const ventasAsociadas = await Venta.count({
            where: { id_empleado: empleado.id_empleado },
            transaction
        })

        if (ventasAsociadas > 0) {
            await Venta.update(
                { id_empleado: idUsuarioActual || 1 },
                {
                    where: { id_empleado: empleado.id_empleado },
                    transaction
                }
            )
        }

        const fotoEmpleado = empleado.foto

        await empleado.destroy({ transaction })
        await transaction.commit()
        eliminarFotoPerfil(fotoEmpleado)

        res.json({
            mensaje: 'Empleado eliminado',
            ventasReasignadas: ventasAsociadas
        })
    } catch (error) {
        await transaction.rollback()
        console.error('Error al eliminar empleado:', error)
        res.status(500).json({
            mensaje: 'Error al eliminar empleado',
            error: error.message
        })
    }
}
