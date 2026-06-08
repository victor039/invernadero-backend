const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

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

const obtenerResumenTablas = async () => {
    const queryInterface = sequelize.getQueryInterface()
    const tablas = ordenarTablasParaImportacion(await queryInterface.showAllTables())
    const dialect = obtenerDialect()
    const resumen = []

    for (const tabla of tablas) {
        const nombreTabla = typeof tabla === 'string' ? tabla : tabla.tableName
        const tablaSql = entreComillas(nombreTabla, dialect)
        const [resultado] = await sequelize.query(`SELECT COUNT(*) AS total FROM ${tablaSql}`)
        const total = Number(resultado[0]?.total || resultado[0]?.count || 0)

        resumen.push({
            tabla: nombreTabla,
            total
        })
    }

    return resumen
}

const generarPdfRespaldo = async ({ nombreArchivo, resumenTablas, contenidoSql }) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 42
    })
    const chunks = []
    const fecha = new Date()
    const totalRegistros = resumenTablas.reduce((total, item) => total + item.total, 0)

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.rect(0, 0, doc.page.width, 120).fill('#020617')
    doc.rect(0, 120, doc.page.width, 5).fill('#10b981')
    doc.fillColor('#ffffff').fontSize(24).text('Reporte de respaldo', 42, 36)
    doc.fillColor('#a7f3d0').fontSize(10).text('Invernadero | Seguridad de datos', 42, 68)
    doc.fillColor('#e2e8f0').fontSize(10).text(fecha.toLocaleString('es-MX'), 42, 86)
    doc.roundedRect(420, 34, 132, 52, 8).fill('#064e3b')
    doc.fillColor('#d1fae5').fontSize(9).text('REGISTROS', 438, 45)
    doc.fillColor('#ffffff').fontSize(22).text(String(totalRegistros), 438, 58)

    doc.fillColor('#0f172a').fontSize(15).text('Resumen general', 42, 155)
    doc.fillColor('#64748b').fontSize(10).text(`Archivo sugerido: ${nombreArchivo}`, 42, 177)
    doc.text(`Formato SQL incluido: ${obtenerDialect()}`, 42, 193)

    const cards = [
        { label: 'Tablas', value: resumenTablas.length, color: '#0f766e' },
        { label: 'Registros', value: totalRegistros, color: '#2563eb' },
        { label: 'Base de datos', value: process.env.DB_NAME || 'DATABASE_URL', color: '#7c3aed' }
    ]

    cards.forEach((card, index) => {
        const x = 42 + (index * 178)
        doc.roundedRect(x, 222, 158, 70, 8).fill('#f8fafc').stroke('#e2e8f0')
        doc.fillColor(card.color).fontSize(18).text(String(card.value), x + 14, 239, { width: 130 })
        doc.fillColor('#64748b').fontSize(9).text(card.label.toUpperCase(), x + 14, 264)
    })

    doc.fillColor('#0f172a').fontSize(15).text('Tablas incluidas', 42, 325)

    let y = 352
    resumenTablas.forEach((item, index) => {
        if (y > 710) {
            doc.addPage()
            y = 42
        }

        doc.roundedRect(42, y, 510, 30, 5).fill(index % 2 === 0 ? '#f8fafc' : '#ffffff').stroke('#e2e8f0')
        doc.fillColor('#0f172a').fontSize(10).text(item.tabla, 56, y + 9)
        doc.fillColor('#047857').fontSize(10).text(`${item.total} registros`, 430, y + 9, { width: 100, align: 'right' })
        y += 34
    })

    if (y > 640) {
        doc.addPage()
        y = 42
    }

    doc.fillColor('#0f172a').fontSize(15).text('Vista previa SQL', 42, y + 18)
    doc.roundedRect(42, y + 48, 510, 140, 6).fill('#020617')
    doc.fillColor('#d1fae5').fontSize(8).text(
        contenidoSql.split('\n').slice(0, 14).join('\n'),
        56,
        y + 62,
        { width: 482, height: 112 }
    )

    doc.fillColor('#64748b').fontSize(8).text(
        'Este PDF documenta el respaldo generado. Para restaurar datos, usa el archivo SQL correspondiente.',
        42,
        doc.page.height - 54,
        { width: 510, align: 'center' }
    )

    doc.end()
})

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

exports.generarRespaldoPdf = async (req, res) => {
    try {
        if (Number(req.usuario.id_rol) !== 1) {
            return res.status(403).json({ mensaje: 'No autorizado' })
        }

        const nombreArchivo = `reporte_respaldo_${process.env.DB_NAME || 'database'}_${formatearFechaArchivo()}.pdf`
        const resumenTablas = await obtenerResumenTablas()
        const contenidoSql = await generarContenidoRespaldo(obtenerDialect())
        const pdfBuffer = await generarPdfRespaldo({
            nombreArchivo,
            resumenTablas,
            contenidoSql
        })

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`)
        res.send(pdfBuffer)
    } catch (error) {
        console.error('Error al generar PDF de respaldo:', error)

        res.status(500).json({
            mensaje: 'Error al generar PDF de respaldo'
        })
    }
}
