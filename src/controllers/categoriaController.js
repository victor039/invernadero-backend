const Categoria = require('../models/Categoria')

exports.crearCategoria = async (req, res) => {

    try {

        const categoria = await Categoria.create(req.body)

        res.status(201).json(categoria)

    } catch (error) {

        res.status(500).json({

            mensaje: 'Error al crear categoría'

        })

    }

}

exports.obtenerCategorias = async (req, res) => {

    try {

        const categorias = await Categoria.findAll({

            order: [

                ['id_categoria', 'DESC']

            ]

        })

        res.json(categorias)

    } catch (error) {

        res.status(500).json({

            mensaje: 'Error al obtener categorías'

        })

    }

}