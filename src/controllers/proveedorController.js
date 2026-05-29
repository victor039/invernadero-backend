const { Op } = require('sequelize')

const Proveedor = require('../models/Proveedor')

exports.crearProveedor = async (req, res) => {
    try {
        const {
            nombre_empresa,
            contacto,
            correo,
            telefono,
            direccion
        } = req.body

        if (!nombre_empresa) {
            return res.status(400).json({
                mensaje: 'El nombre de la empresa es obligatorio'
            })
        }

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
        res.status(500).json({
            mensaje: 'Error al crear proveedor',
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

        const {
            nombre_empresa,
            contacto,
            correo,
            telefono,
            direccion
        } = req.body

        if (!nombre_empresa) {
            return res.status(400).json({
                mensaje: 'El nombre de la empresa es obligatorio'
            })
        }

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
        res.status(500).json({
            mensaje: 'Error al actualizar proveedor',
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
