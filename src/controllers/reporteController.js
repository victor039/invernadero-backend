const Planta = require('../models/Planta')

const Venta = require('../models/Venta')

const DetalleVenta = require('../models/DetalleVenta')

const Empleado = require('../models/Empleado')

const { Sequelize } = require('sequelize')

const sequelize = require('../config/database')

const obtenerRangoPeriodo = (periodo = 'mes') => {

    const fin = new Date()
    fin.setHours(23, 59, 59, 999)

    const inicio = new Date(fin)

    if (periodo === 'dia') {
        inicio.setHours(0, 0, 0, 0)
        return { inicio, fin }
    }

    if (periodo === 'semana') {
        const dia = inicio.getDay()
        const diferenciaLunes = dia === 0 ? 6 : dia - 1
        inicio.setDate(inicio.getDate() - diferenciaLunes)
        inicio.setHours(0, 0, 0, 0)
        return { inicio, fin }
    }

    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)

    return { inicio, fin }

}

exports.obtenerResumen = async (req, res) => {

    try {
        const { inicio, fin } = obtenerRangoPeriodo(req.query.periodo)
        const filtroVentas = {
            fecha_venta: {
                [Sequelize.Op.between]: [inicio, fin]
            }
        }

        const totalPlantas = await Planta.count()

        const totalVentas = await Venta.count({ where: filtroVentas })

        const ganancias = await Venta.sum('total', { where: filtroVentas })

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
        const { inicio, fin } = obtenerRangoPeriodo(req.query.periodo)

        const ventasPorPlanta = await sequelize.query(
            `SELECT d.id_planta,
                    SUM(d.cantidad) AS total_vendido,
                    SUM(d.subtotal) AS total_ingresos
             FROM detalle_ventas d
             INNER JOIN ventas v ON v.id_venta = d.id_venta
             WHERE v.fecha_venta BETWEEN :inicio AND :fin
             GROUP BY d.id_planta
             ORDER BY total_vendido DESC`,
            {
                replacements: { inicio, fin },
                type: Sequelize.QueryTypes.SELECT
            }
        )

        const plantas = await Planta.findAll({
            attributes: ['id_planta', 'nombre_comun', 'nombre_cientifico', 'stock']
        })

        const plantasPorId = new Map(
            plantas.map((planta) => [Number(planta.id_planta), planta])
        )

        const productos = ventasPorPlanta.map((item) => {
            const data = item.toJSON ? item.toJSON() : item
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
