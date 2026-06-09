const Planta = require('../models/Planta')
const {
    limpiarTexto,
    validarEnteroNoNegativo,
    validarLongitud,
    validarLongitudMinMax,
    validarNumeroPositivo,
    validarSinSoloNumeros,
    validarPayload
} = require('../utils/validaciones')

const normalizarPlanta = (body, parcial = false) => {
    const datos = {}
    const asignar = (key, valor) => {
        if (!parcial || Object.prototype.hasOwnProperty.call(body, key)) datos[key] = valor
    }

    asignar('nombre_comun', limpiarTexto(body.nombre_comun))
    asignar('nombre_cientifico', limpiarTexto(body.nombre_cientifico))
    asignar('precio', body.precio)
    asignar('stock', body.stock)
    asignar('descripcion', limpiarTexto(body.descripcion))
    asignar('id_categoria', body.id_categoria)
    asignar('id_proveedor', body.id_proveedor)

    return datos
}

const validarPlanta = (planta, parcial = false) => {
    validarPayload([
        { condicion: !parcial && !planta.nombre_comun, mensaje: 'El nombre común es obligatorio' },
        { condicion: planta.nombre_comun && !validarSinSoloNumeros(planta.nombre_comun), mensaje: 'El nombre común no puede ser solo números' },
        { condicion: planta.nombre_comun && !validarLongitudMinMax(planta.nombre_comun, 2, 40), mensaje: 'El nombre común debe tener de 2 a 40 caracteres' },
        { condicion: planta.nombre_cientifico && !validarLongitud(planta.nombre_cientifico, 60), mensaje: 'El nombre científico puede tener máximo 60 caracteres' },
        { condicion: !parcial && (planta.precio === undefined || planta.precio === ''), mensaje: 'El precio es obligatorio' },
        { condicion: (!parcial || planta.precio !== undefined) && !validarNumeroPositivo(planta.precio, 99999), mensaje: 'El precio debe estar entre 1 y 99,999' },
        { condicion: !parcial && (planta.stock === undefined || planta.stock === ''), mensaje: 'El stock es obligatorio' },
        { condicion: (!parcial || planta.stock !== undefined) && !validarEnteroNoNegativo(Number(planta.stock), 99999), mensaje: 'El stock debe ser un entero de 0 a 99,999' },
        { condicion: !parcial && !planta.id_categoria, mensaje: 'La categoría es obligatoria' },
        { condicion: !parcial && !planta.id_proveedor, mensaje: 'El proveedor es obligatorio' },
        { condicion: planta.descripcion && !validarLongitud(planta.descripcion, 300), mensaje: 'La descripción puede tener máximo 300 caracteres' }
    ])
}

exports.crearPlanta = async (req, res) => {

    try {

        const { nombre_comun, nombre_cientifico, precio, stock, descripcion, id_categoria, id_proveedor } = normalizarPlanta(req.body)
        validarPlanta({ nombre_comun, nombre_cientifico, precio, stock, descripcion, id_categoria, id_proveedor })

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

        res.status(error.status || 500).json({

            mensaje: error.status ? error.message : 'Error al crear planta',
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

        res.status(error.status || 500).json({

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

        const datosActualizar = normalizarPlanta(req.body, true)
        validarPlanta(datosActualizar, true)

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

            mensaje: error.status ? error.message : 'Error al actualizar planta'

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
