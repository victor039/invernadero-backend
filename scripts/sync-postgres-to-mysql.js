require('dotenv').config()

const { DataTypes, QueryTypes, Sequelize } = require('sequelize')

const sourceUrl = process.env.SOURCE_DATABASE_URL ||
    process.env.POSTGRES_DATABASE_URL ||
    process.env.RENDER_DATABASE_URL ||
    process.env.DATABASE_URL

if (!sourceUrl) {
    console.error('Falta SOURCE_DATABASE_URL con la External Database URL de Render/Postgres.')
    process.exit(1)
}

const source = new Sequelize(sourceUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
})

const target = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
    }
)

const tablas = [
    { nombre: 'roles', pk: 'id_rol' },
    { nombre: 'categorias', pk: 'id_categoria' },
    { nombre: 'proveedores', pk: 'id_proveedor' },
    { nombre: 'clientes', pk: 'id_cliente' },
    { nombre: 'empleados', pk: 'id_empleado' },
    { nombre: 'plantas', pk: 'id_planta' },
    { nombre: 'ventas', pk: 'id_venta' },
    { nombre: 'detalle_ventas', pk: 'id_detalle' },
    { nombre: 'envios', pk: 'id_envio' },
    { nombre: 'inventario', pk: 'id_inventario' },
    { nombre: 'usuarios', pk: 'id_usuario' }
]

async function asegurarColumnasVentas() {
    const qi = target.getQueryInterface()
    const tabla = await qi.describeTable('ventas')
    const columnas = {
        tipo_cliente: { type: DataTypes.STRING, defaultValue: 'registrado' },
        cliente_paso: { type: DataTypes.STRING, allowNull: true },
        metodo_pago: { type: DataTypes.STRING, allowNull: true },
        referencia_pago: { type: DataTypes.STRING, allowNull: true },
        ticket_descarga: { type: DataTypes.BOOLEAN, defaultValue: true },
        ticket_correo: { type: DataTypes.BOOLEAN, defaultValue: false },
        correo_ticket: { type: DataTypes.STRING, allowNull: true }
    }

    for (const [columna, definicion] of Object.entries(columnas)) {
        if (!tabla[columna]) {
            await qi.addColumn('ventas', columna, definicion)
        }
    }
}

async function obtenerFilas(tabla) {
    return source.query(
        `SELECT * FROM "${tabla.nombre}" ORDER BY "${tabla.pk}" ASC`,
        { type: QueryTypes.SELECT }
    ).catch((error) => {
        if (error.message.includes('does not exist')) return []
        throw error
    })
}

async function sincronizarTabla(tabla) {
    const qi = target.getQueryInterface()
    const filas = await obtenerFilas(tabla)
    const columnasTarget = await qi.describeTable(tabla.nombre)
    const columnasPermitidas = new Set(Object.keys(columnasTarget))
    const filasCompatibles = filas.map((fila) => {
        const limpio = {}

        for (const [columna, valor] of Object.entries(fila)) {
            if (columnasPermitidas.has(columna)) {
                limpio[columna] = valor
            }
        }

        return limpio
    })

    await qi.bulkDelete(tabla.nombre, null, {})

    if (filasCompatibles.length > 0) {
        await qi.bulkInsert(tabla.nombre, filasCompatibles)
    }

    const maxId = filas.reduce((max, fila) => Math.max(max, Number(fila[tabla.pk] || 0)), 0)
    if (maxId > 0) {
        await target.query(`ALTER TABLE \`${tabla.nombre}\` AUTO_INCREMENT = ${maxId + 1}`)
    }

    console.log(`OK ${tabla.nombre}: ${filasCompatibles.length} registros`)
}

async function main() {
    await source.authenticate()
    await target.authenticate()
    await asegurarColumnasVentas()

    await target.query('SET FOREIGN_KEY_CHECKS = 0')
    try {
        for (const tabla of tablas) {
            await sincronizarTabla(tabla)
        }
    } finally {
        await target.query('SET FOREIGN_KEY_CHECKS = 1')
        await source.close()
        await target.close()
    }

    console.log('Sincronizacion Postgres -> MySQL completada.')
}

main().catch(async (error) => {
    console.error('Error al sincronizar:', error.message)
    await source.close().catch(() => {})
    await target.close().catch(() => {})
    process.exit(1)
})
