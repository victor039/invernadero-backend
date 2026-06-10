const { Op } = require('sequelize')

const Cliente = require('../models/Cliente')
const {
    limpiarTexto,
    normalizarTelefono,
    validarCorreo,
    validarLongitud,
    validarLongitudMinMax,
    validarNombrePersona,
    validarTelefono,
    validarPayload
} = require('../utils/validaciones')

const normalizarCliente = (body) => ({
    nombre: limpiarTexto(body.nombre),
    apellido: limpiarTexto(body.apellido),
    correo: limpiarTexto(body.correo).toLowerCase(),
    telefono: normalizarTelefono(body.telefono),
    direccion: limpiarTexto(body.direccion)
})

const validarCliente = (cliente) => {
    validarPayload([
        { condicion: !cliente.nombre, mensaje: 'El nombre del cliente es obligatorio' },
        { condicion: cliente.nombre && !validarLongitudMinMax(cliente.nombre, 2, 30), mensaje: 'El nombre debe tener de 2 a 30 caracteres' },
        { condicion: cliente.nombre && !validarNombrePersona(cliente.nombre), mensaje: 'El nombre solo puede contener letras' },
        { condicion: cliente.apellido && !validarLongitudMinMax(cliente.apellido, 2, 40), mensaje: 'El apellido debe tener de 2 a 40 caracteres' },
        { condicion: cliente.apellido && !validarNombrePersona(cliente.apellido), mensaje: 'El apellido solo puede contener letras' },
        { condicion: cliente.correo && !validarCorreo(cliente.correo), mensaje: 'El correo no tiene un formato válido' },
        { condicion: cliente.telefono && !validarTelefono(cliente.telefono), mensaje: 'El teléfono debe tener 10 dígitos' },
        { condicion: !validarLongitud(cliente.direccion, 180), mensaje: 'La dirección puede tener máximo 180 caracteres' }
    ])
}

exports.crearCliente = async (req, res) => {
    try {
        const { nombre, apellido, correo, telefono, direccion } = normalizarCliente(req.body)
        validarCliente({ nombre, apellido, correo, telefono, direccion })

        if (correo) {
            const existeCorreo = await Cliente.findOne({ where: { correo } })

            if (existeCorreo) {
                return res.status(400).json({
                    mensaje: 'Ya existe un cliente con ese correo'
                })
            }
        }

        const cliente = await Cliente.create({
            nombre,
            apellido,
            correo,
            telefono,
            direccion
        })

        res.status(201).json(cliente)
    } catch (error) {
        res.status(error.status || 500).json({
            mensaje: error.status ? error.message : 'Error al crear cliente',
            error: error.message
        })
    }
}

exports.obtenerClientes = async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            order: [['id_cliente', 'DESC']]
        })

        res.json(clientes)
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al obtener clientes'
        })
    }
}

exports.actualizarCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findByPk(req.params.id)

        if (!cliente) {
            return res.status(404).json({
                mensaje: 'Cliente no encontrado'
            })
        }

        const { nombre, apellido, correo, telefono, direccion } = normalizarCliente(req.body)
        validarCliente({ nombre, apellido, correo, telefono, direccion })

        if (correo) {
            const existeCorreo = await Cliente.findOne({
                where: {
                    correo,
                    id_cliente: {
                        [Op.ne]: cliente.id_cliente
                    }
                }
            })

            if (existeCorreo) {
                return res.status(400).json({
                    mensaje: 'Ya existe otro cliente con ese correo'
                })
            }
        }

        await cliente.update({
            nombre,
            apellido,
            correo,
            telefono,
            direccion
        })
        await cliente.reload()

        res.json({
            mensaje: 'Cliente actualizado',
            cliente
        })
    } catch (error) {
        res.status(error.status || 500).json({
            mensaje: error.status ? error.message : 'Error al actualizar cliente',
            error: error.message
        })
    }
}

exports.eliminarCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findByPk(req.params.id)

        if (!cliente) {
            return res.status(404).json({
                mensaje: 'Cliente no encontrado'
            })
        }

        await cliente.destroy()

        res.json({
            mensaje: 'Cliente eliminado'
        })
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({
                mensaje: 'No se puede eliminar este cliente porque tiene ventas relacionadas'
            })
        }

        res.status(500).json({
            mensaje: 'Error al eliminar cliente',
            error: error.message
        })
    }
}
