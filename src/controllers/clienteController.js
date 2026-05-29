const { Op } = require('sequelize')

const Cliente = require('../models/Cliente')

exports.crearCliente = async (req, res) => {
    try {
        const { nombre, apellido, correo, telefono, direccion } = req.body

        if (!nombre) {
            return res.status(400).json({
                mensaje: 'El nombre del cliente es obligatorio'
            })
        }

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
        res.status(500).json({
            mensaje: 'Error al crear cliente',
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

        const { nombre, apellido, correo, telefono, direccion } = req.body

        if (!nombre) {
            return res.status(400).json({
                mensaje: 'El nombre del cliente es obligatorio'
            })
        }

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

        res.json({
            mensaje: 'Cliente actualizado',
            cliente
        })
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al actualizar cliente',
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
        res.status(500).json({
            mensaje: 'Error al eliminar cliente',
            error: error.message
        })
    }
}
