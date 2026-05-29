const Planta = require('../models/Planta')

const Venta = require('../models/Venta')

const DetalleVenta = require('../models/DetalleVenta')

const Empleado = require('../models/Empleado')

const { Sequelize } = require('sequelize')

exports.obtenerResumen = async (req, res) => {

    try {

        const totalPlantas = await Planta.count()

        const totalVentas = await Venta.count()

        const ganancias = await Venta.sum('total')

        const stockBajo = await Planta.findAll({

            where: {

                stock: {

                    [Sequelize.Op.lte]: 5

                }

            }

        })

        res.json({

            totalPlantas,
            totalVentas,
            ganancias: ganancias || 0,
            stockBajo

        })

    } catch (error) {

        res.status(500).json({

            mensaje: 'Error al obtener reportes'

        })

    }

}

exports.obtenerResumenAdmin = async (req, res) => {

    try {

        const inicioHoy = new Date()
        inicioHoy.setHours(0, 0, 0, 0)

        const finHoy = new Date()
        finHoy.setHours(23, 59, 59, 999)

        const [
            totalPlantas,
            totalEmpleados,
            totalVentas,
            ganancias,
            ventasHoy,
            gananciasHoy,
            unidadesInventario,
            stockBajo,
            ventasRecientes
        ] = await Promise.all([
            Planta.count(),
            Empleado.count(),
            Venta.count(),
            Venta.sum('total'),
            Venta.count({
                where: {
                    fecha_venta: {
                        [Sequelize.Op.between]: [inicioHoy, finHoy]
                    }
                }
            }),
            Venta.sum('total', {
                where: {
                    fecha_venta: {
                        [Sequelize.Op.between]: [inicioHoy, finHoy]
                    }
                }
            }),
            Planta.sum('stock'),
            Planta.findAll({
                where: {
                    stock: {
                        [Sequelize.Op.lte]: 5
                    }
                },
                order: [['stock', 'ASC']],
                limit: 8
            }),
            Venta.findAll({
                order: [['fecha_venta', 'DESC']],
                limit: 8
            })
        ])

        res.json({
            totalPlantas,
            totalEmpleados,
            totalVentas,
            ganancias: ganancias || 0,
            ventasHoy,
            gananciasHoy: gananciasHoy || 0,
            unidadesInventario: unidadesInventario || 0,
            stockBajo,
            ventasRecientes
        })

    } catch (error) {

        res.status(500).json({
            mensaje: 'Error al obtener resumen admin',
            error: error.message
        })

    }

}

exports.productosMasVendidos = async (req, res) => {

    try {

        const ventasPorPlanta = await DetalleVenta.findAll({
            attributes: [
                'id_planta',
                [Sequelize.fn('SUM', Sequelize.col('cantidad')), 'total_vendido'],
                [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'total_ingresos']
            ],
            group: ['id_planta'],
            order: [[Sequelize.literal('total_vendido'), 'DESC']]
        })

        const plantas = await Planta.findAll({
            attributes: ['id_planta', 'nombre_comun', 'nombre_cientifico', 'stock']
        })

        const plantasPorId = new Map(
            plantas.map((planta) => [Number(planta.id_planta), planta])
        )

        const productos = ventasPorPlanta.map((item) => {
            const data = item.toJSON()
            const planta = plantasPorId.get(Number(data.id_planta))

            return {
                id_planta: Number(data.id_planta),
                nombre_planta: planta?.nombre_comun || `Planta #${data.id_planta}`,
                nombre_cientifico: planta?.nombre_cientifico || '',
                stock: Number(planta?.stock || 0),
                total_vendido: Number(data.total_vendido || 0),
                total_ingresos: Number(data.total_ingresos || 0)
            }
        })

        res.json(productos)

    } catch (error) {

        res.status(500).json({

            mensaje: 'Error al obtener productos',
            error: error.message

        })

    }

}
