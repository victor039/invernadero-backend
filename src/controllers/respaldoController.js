const fs = require('fs')
const path = require('path')

const sequelize = require('../config/database')

const carpetaRespaldos = path.join(__dirname, '../../respaldos')

const obtenerDialect = () => sequelize.getDialect()

const entreComillas = (identificador, dialect = obtenerDialect()) => {
    const limpio = String(identificador).replace(/"/g, '""').replace(/`/g, '')

    return dialect === 'postgres' ? `"${limpio}"` : `\`${limpio}\``
}

const formatearFechaArchivo = () => {
    const ahora = new Date()

    return ahora
        .toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, 19)
}

const escaparValorSql = (valor) => {
    if (valor === null || valor === undefined) return 'NULL'
    if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : 'NULL'
    if (typeof valor === 'boolean') return valor ? '1' : '0'
    if (valor instanceof Date) {
        return `'${valor.toISOString().slice(0, 19).replace('T', ' ')}'`
    }
    if (Buffer.isBuffer(valor)) {
        return `X'${valor.toString('hex')}'`
    }

    return `'${String(valor)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')}'`
}

const obtenerModeloPorTabla = (nombreTabla) => Object.values(sequelize.models)
    .find((model) => model.getTableName() === nombreTabla || model.tableName === nombreTabla)

const obtenerColumnaAutoIncremental = (nombreTabla) => {
    const modelo = obtenerModeloPorTabla(nombreTabla)
    if (!modelo) return null

    return Object.entries(modelo.rawAttributes)
        .find(([, atributo]) => atributo.autoIncrement)?.[0] || null
}

const ordenarTablasParaImportacion = (tablas) => {
    const prioridad = [
        'roles',
        'categorias',
        'proveedores',
        'clientes',
        'empleados',
        'plantas',
        'ventas',
        'detalle_ventas'
    ]

    return [...tablas].sort((a, b) => {
        const tablaA = typeof a === 'string' ? a : a.tableName
        const tablaB = typeof b === 'string' ? b : b.tableName
        const indiceA = prioridad.indexOf(tablaA)
        const indiceB = prioridad.indexOf(tablaB)

        return (indiceA === -1 ? prioridad.length : indiceA) - (indiceB === -1 ? prioridad.length : indiceB)
    })
}

const generarContenidoRespaldo = async (formatoSalida = obtenerDialect()) => {
    const nombreBD = process.env.DB_NAME
    const queryInterface = sequelize.getQueryInterface()
    const tablas = ordenarTablasParaImportacion(await queryInterface.showAllTables())
    const dialectOrigen = obtenerDialect()
    const dialectSalida = formatoSalida === 'postgres' ? 'postgres' : dialectOrigen
    const lineas = [
        '-- Respaldo de base de datos',
        `-- Base de datos: ${nombreBD || 'DATABASE_URL'}`,
        `-- Fecha: ${new Date().toLocaleString('es-MX')}`,
        `-- Formato: ${dialectSalida}`,
        ''
    ]

    if (dialectSalida !== 'postgres') {
        lineas.push('SET FOREIGN_KEY_CHECKS=0;')
        lineas.push('')
    }

    for (const tabla of tablas) {
        const nombreTabla = typeof tabla === 'string' ? tabla : tabla.tableName
        const tablaOrigenSql = entreComillas(nombreTabla, dialectOrigen)
        const tablaSalidaSql = entreComillas(nombreTabla, dialectSalida)
        const [filas] = await sequelize.query(`SELECT * FROM ${tablaOrigenSql}`)

        lineas.push(`-- Tabla: ${nombreTabla}`)

        if (filas.length > 0) {
            const columnas = Object.keys(filas[0])
            const columnasSql = columnas.map((columna) => entreComillas(columna, dialectSalida)).join(', ')

            for (const fila of filas) {
                const valores = columnas.map((columna) => escaparValorSql(fila[columna])).join(', ')
                lineas.push(`INSERT INTO ${tablaSalidaSql} (${columnasSql}) VALUES (${valores});`)
            }

            const columnaAutoIncremental = obtenerColumnaAutoIncremental(nombreTabla)
            if (dialectSalida === 'postgres' && columnaAutoIncremental) {
                const valorMaximo = Math.max(...filas.map((fila) => Number(fila[columnaAutoIncremental] || 0)))
                lineas.push(`SELECT setval(pg_get_serial_sequence('${nombreTabla}', '${columnaAutoIncremental}'), ${valorMaximo}, true);`)
            }

            lineas.push('')
        } else {
            lineas.push('-- Sin registros')
            lineas.push('')
        }
    }

    if (dialectSalida !== 'postgres') {
        lineas.push('SET FOREIGN_KEY_CHECKS=1;')
    }

    lineas.push('')

    return lineas.join('\n')
}

exports.generarRespaldo = async (req, res) => {
    try {
        if (Number(req.usuario.id_rol) !== 1) {
            return res.status(403).json({ mensaje: 'No autorizado' })
        }

        await fs.promises.mkdir(carpetaRespaldos, { recursive: true })

        const formato = req.query.formato === 'postgres' ? 'postgres' : obtenerDialect()
        const nombreArchivo = `respaldo_${formato}_${process.env.DB_NAME || 'database'}_${formatearFechaArchivo()}.sql`
        const rutaArchivo = path.join(carpetaRespaldos, nombreArchivo)
        const contenido = await generarContenidoRespaldo(formato)

        await fs.promises.writeFile(rutaArchivo, contenido, 'utf8')

        res.download(rutaArchivo, nombreArchivo)
    } catch (error) {
        console.error('Error al generar respaldo:', error)

        res.status(500).json({
            mensaje: 'Error al generar respaldo'
        })
    }
}
