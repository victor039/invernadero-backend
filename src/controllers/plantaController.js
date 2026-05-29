const Planta = require('../models/Planta')

exports.crearPlanta = async (req, res) => {

    try {

        const {

            nombre_comun,
            nombre_cientifico,
            precio,
            stock,
            descripcion,
            id_categoria,
            id_proveedor

        } = req.body

        const imagen = req.file
            ? req.file.filename
            : null

        const planta = await Planta.create({

            nombre_comun,
            nombre_cientifico,
            precio,
            stock,
            descripcion,
            imagen,
            id_categoria,
            id_proveedor

        })

        res.status(201).json(planta)

    } catch (error) {

        console.log(error)

        res.status(500).json({

            mensaje: 'Error al crear planta',
            error: error.message

        })

    }

}

exports.obtenerPlantas = async (req, res) => {

    try {

        const plantas = await Planta.findAll({

            order: [

                ['id_planta', 'DESC']

            ]

        })

        res.json(plantas)

    } catch (error) {

        console.log(error)

        res.status(500).json({

            mensaje: 'Error al obtener plantas'

        })

    }

}

exports.obtenerPlanta = async (req, res) => {

    try {

        const planta = await Planta.findByPk(req.params.id)

        if (!planta) {

            return res.status(404).json({

                mensaje: 'Planta no encontrada'

            })

        }

        res.json(planta)

    } catch (error) {

        console.log(error)

        res.status(500).json({

            mensaje: 'Error al obtener planta'

        })

    }

}

exports.actualizarPlanta = async (req, res) => {

    try {

        const planta = await Planta.findByPk(req.params.id)

        if (!planta) {

            return res.status(404).json({

                mensaje: 'Planta no encontrada'

            })

        }

        const datosActualizar = {

            ...req.body

        }

        if (req.file) {

            datosActualizar.imagen = req.file.filename

        }

        await planta.update(datosActualizar)

        res.json({

            mensaje: 'Planta actualizada',
            planta

        })

    } catch (error) {

        console.log(error)

        res.status(500).json({

            mensaje: 'Error al actualizar planta'

        })

    }

}

exports.eliminarPlanta = async (req, res) => {

    try {

        const planta = await Planta.findByPk(req.params.id)

        if (!planta) {

            return res.status(404).json({

                mensaje: 'Planta no encontrada'

            })

        }

        await planta.destroy()

        res.json({

            mensaje: 'Planta eliminada'

        })

    } catch (error) {

        console.log(error)

        res.status(500).json({

            mensaje: 'Error al eliminar planta'

        })

    }

}