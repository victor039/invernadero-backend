const { Op } = require('sequelize')

const Proveedor = require('../models/Proveedor')
const {
    limpiarTexto,
    normalizarTelefono,
    validarCorreo,
    validarLongitud,
    validarLongitudMinMax,
    validarNombrePersona,
    validarSinSoloNumeros,
    validarTelefono,
    validarPayload
} = require('../utils/validaciones')

const normalizarProveedor = (body) => ({
    nombre_empresa: limpiarTexto(body.nombre_empresa),
    contacto: limpiarTexto(body.contacto),
    correo: limpiarTexto(body.correo).toLowerCase(),
    telefono: normalizarTelefono(body.telefono),
    direccion: limpiarTexto(body.direccion)
})

const validarProveedor = (proveedor) => {
    validarPayload([
        { condicion: !proveedor.nombre_empresa, mensaje: 'El nombre de la empresa es obligatorio' },
        { condicion: proveedor.nombre_empresa && !validarSinSoloNumeros(proveedor.nombre_empresa), mensaje: 'El nombre de la empresa no puede ser solo números' },
        { condicion: proveedor.nombre_empresa && !validarLongitudMinMax(proveedor.nombre_empresa, 2, 60), mensaje: 'La empresa debe tener de 2 a 60 caracteres' },
        { condicion: proveedor.contacto && !validarLongitudMinMax(proveedor.contacto, 2, 40), mensaje: 'El contacto debe tener de 2 a 40 caracteres' },
        { condicion: proveedor.contacto && !validarNombrePersona(proveedor.contacto), mensaje: 'El contacto solo puede contener letras' },
        { condicion: proveedor.correo && !validarCorreo(proveedor.correo), mensaje: 'El correo no tiene un formato válido' },
        { condicion: proveedor.telefono && !validarTelefono(proveedor.telefono), mensaje: 'El teléfono debe tener 10 dígitos' },
        { condicion: !validarLongitud(proveedor.direccion, 180), mensaje: 'La dirección puede tener máximo 180 caracteres' }
    ])
}

exports.crearProveedor = async (req, res) => {
    try {
        const { nombre_empresa, contacto, correo, telefono, direccion } = normalizarProveedor(req.body)
        validarProveedor({ nombre_empresa, contacto, correo, telefono, direccion })

        if (correo) {
            const existeCorreo = await Proveedor.findOne({ where: { correo } })

            if (existeCorreo) {
                return res.status(400).json({
                    mensaje: 'Ya existe un proveedor con ese correo'
                })
            }
        }

        const proveedor = await Proveedor.create({
            nombre_empresa,
            contacto,
            correo,
            telefono,
            direccion
        })

        res.status(201).json(proveedor)
    } catch (error) {
        res.status(error.status || 500).json({
            mensaje: error.status ? error.message : 'Error al crear proveedor',
            error: error.message
        })
    }
}

exports.obtenerProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll({
            order: [['id_proveedor', 'DESC']]
        })

        res.json(proveedores)
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al obtener proveedores'
        })
    }
}

exports.actualizarProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id)

        if (!proveedor) {
            return res.status(404).json({
                mensaje: 'Proveedor no encontrado'
            })
        }

        const { nombre_empresa, contacto, correo, telefono, direccion } = normalizarProveedor(req.body)
        validarProveedor({ nombre_empresa, contacto, correo, telefono, direccion })

        if (correo) {
            const existeCorreo = await Proveedor.findOne({
                where: {
                    correo,
                    id_proveedor: {
                        [Op.ne]: proveedor.id_proveedor
                    }
                }
            })

            if (existeCorreo) {
                return res.status(400).json({
                    mensaje: 'Ya existe otro proveedor con ese correo'
                })
            }
        }

        await proveedor.update({
            nombre_empresa,
            contacto,
            correo,
            telefono,
            direccion
        })

        res.json({
            mensaje: 'Proveedor actualizado',
            proveedor
        })
    } catch (error) {
        res.status(error.status || 500).json({
            mensaje: error.status ? error.message : 'Error al actualizar proveedor',
            error: error.message
        })
    }
}

exports.eliminarProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id)

        if (!proveedor) {
            return res.status(404).json({
                mensaje: 'Proveedor no encontrado'
            })
        }

        await proveedor.destroy()

        res.json({
            mensaje: 'Proveedor eliminado'
        })
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al eliminar proveedor',
            error: error.message
        })
    }
}
