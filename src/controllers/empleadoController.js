const { Op } = require('sequelize')
const bcrypt = require('bcrypt')

const Empleado = require('../models/Empleado')

const limpiarEmpleado = (empleado) => {
    const data = empleado.toJSON()
    delete data.contraseña
    return data
}

exports.crearEmpleado = async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            correo,
            telefono,
            foto,
            usuario,
            contraseña,
            password,
            id_rol
        } = req.body

        if (!nombre || !usuario || !(contraseña || password) || !id_rol) {
            return res.status(400).json({
                mensaje: 'Nombre, usuario, contraseña y rol son obligatorios'
            })
        }

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
            foto,
            usuario,
            contraseña: passwordHash,
            id_rol
        })

        res.status(201).json(limpiarEmpleado(empleado))
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al crear empleado',
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
        const empleado = await Empleado.findByPk(req.params.id)

        if (!empleado) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        const {
            nombre,
            apellido,
            correo,
            telefono,
            foto,
            usuario,
            contraseña,
            password,
            id_rol
        } = req.body

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

        const datosActualizar = {
            nombre,
            apellido,
            correo,
            telefono,
            foto,
            usuario,
            id_rol
        }

        Object.keys(datosActualizar).forEach((key) => {
            if (datosActualizar[key] === undefined) {
                delete datosActualizar[key]
            }
        })

        if (contraseña || password) {
            datosActualizar.contraseña = await bcrypt.hash(contraseña || password, 10)
        }

        await empleado.update(datosActualizar)

        res.json({
            mensaje: 'Empleado actualizado',
            empleado: limpiarEmpleado(empleado)
        })
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al actualizar empleado',
            error: error.message
        })
    }
}

exports.eliminarEmpleado = async (req, res) => {
    try {
        const empleado = await Empleado.findByPk(req.params.id)

        if (!empleado) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        await empleado.destroy()

        res.json({
            mensaje: 'Empleado eliminado'
        })
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al eliminar empleado',
            error: error.message
        })
    }
}
