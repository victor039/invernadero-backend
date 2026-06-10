const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

const sequelize = require('../config/database')

const carpetaRespaldos = path.join(__dirname, '../../respaldos')

const obtenerDialect = () => sequelize.getDialect()
const obtenerNombreSistema = () => 'Invernadero'

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

const formatearFechaCarpeta = () => new Date().toISOString().slice(0, 10)

const prepararCarpetaTemporalFecha = async () => {
    const carpetaFecha = path.join(carpetaRespaldos, 'temporales', formatearFechaCarpeta())

    await fs.promises.mkdir(carpetaFecha, { recursive: true })

    return carpetaFecha
}

const escaparValorSql = (valor, dialect = obtenerDialect()) => {
    if (valor === null || valor === undefined) return 'NULL'
    if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : 'NULL'
    if (typeof valor === 'boolean') return dialect === 'postgres' ? (valor ? 'TRUE' : 'FALSE') : (valor ? '1' : '0')
    if (valor instanceof Date) {
        return `'${valor.toISOString().slice(0, 19).replace('T', ' ')}'`
    }
    if (Buffer.isBuffer(valor)) {
        return `X'${valor.toString('hex')}'`
    }

    const texto = String(valor)

    if (dialect === 'postgres') {
        return `'${texto
            .replace(/'/g, "''")
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')}'`
    }

    return `'${texto
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
    const fecha = new Date()
    const lineas = [
        `-- ${obtenerNombreSistema()} | Respaldo profesional de base de datos`,
        `-- Base de datos: ${nombreBD || 'DATABASE_URL'}`,
        `-- Fecha: ${fecha.toLocaleString('es-MX')}`,
        `-- ISO: ${fecha.toISOString()}`,
        `-- Formato: ${dialectSalida}`,
        `-- Tablas incluidas: ${tablas.length}`,
        '-- Recomendación: restaurar primero en un ambiente de prueba antes de producción.',
        ''
    ]

    if (dialectSalida === 'postgres') {
        lineas.push('BEGIN;')
        lineas.push("SET client_encoding = 'UTF8';")
        lineas.push('')
    } else {
        lineas.push('START TRANSACTION;')
        lineas.push('SET FOREIGN_KEY_CHECKS=0;')
        lineas.push("SET NAMES utf8mb4;")
        lineas.push('')
    }

    if (dialectSalida === 'postgres') {
        const tablasTruncate = tablas
            .map((tabla) => entreComillas(typeof tabla === 'string' ? tabla : tabla.tableName, dialectSalida))
            .join(', ')

        if (tablasTruncate) {
            lineas.push('-- Limpieza previa ordenada para restauración completa')
            lineas.push(`TRUNCATE TABLE ${tablasTruncate} RESTART IDENTITY CASCADE;`)
            lineas.push('')
        }
    } else {
        lineas.push('-- Limpieza previa ordenada para restauración completa')
        for (const tabla of [...tablas].reverse()) {
            const nombreTabla = typeof tabla === 'string' ? tabla : tabla.tableName
            lineas.push(`DELETE FROM ${entreComillas(nombreTabla, dialectSalida)};`)
        }
        for (const tabla of tablas) {
            const nombreTabla = typeof tabla === 'string' ? tabla : tabla.tableName
            const columnaAutoIncremental = obtenerColumnaAutoIncremental(nombreTabla)
            if (columnaAutoIncremental) {
                lineas.push(`ALTER TABLE ${entreComillas(nombreTabla, dialectSalida)} AUTO_INCREMENT=1;`)
            }
        }
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
                const valores = columnas.map((columna) => escaparValorSql(fila[columna], dialectSalida)).join(', ')
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

    if (dialectSalida === 'postgres') {
        lineas.push('COMMIT;')
    } else {
        lineas.push('SET FOREIGN_KEY_CHECKS=1;')
        lineas.push('COMMIT;')
    }

    lineas.push('')
    lineas.push(`-- Fin del respaldo ${obtenerNombreSistema()}`)
    lineas.push('')

    return lineas.join('\n')
}

const obtenerResumenTablas = async () => {
    const queryInterface = sequelize.getQueryInterface()
    const tablas = ordenarTablasParaImportacion(await queryInterface.showAllTables())
    const dialect = obtenerDialect()
    const resumen = []
    const columnasSensibles = new Set(['contraseña', 'password_hash', 'password'])

    for (const tabla of tablas) {
        const nombreTabla = typeof tabla === 'string' ? tabla : tabla.tableName
        const tablaSql = entreComillas(nombreTabla, dialect)
        const [resultado] = await sequelize.query(`SELECT COUNT(*) AS total FROM ${tablaSql}`)
        const [muestras] = await sequelize.query(`SELECT * FROM ${tablaSql} LIMIT 3`)
        const total = Number(resultado[0]?.total || resultado[0]?.count || 0)
        const columnas = muestras[0]
            ? Object.keys(muestras[0])
            : Object.keys(obtenerModeloPorTabla(nombreTabla)?.rawAttributes || {})
        const columnasVisibles = columnas.filter((columna) => !columnasSensibles.has(columna))
        const registros = muestras.map((fila) => {
            const registro = {}
            columnasVisibles.slice(0, 5).forEach((columna) => {
                const valor = fila[columna]
                if (valor === null || valor === undefined || valor === '') {
                    registro[columna] = 'Sin dato'
                    return
                }

                if (valor instanceof Date) {
                    registro[columna] = valor.toISOString().slice(0, 10)
                    return
                }

                const texto = String(valor)
                registro[columna] = texto.length > 42 ? `${texto.slice(0, 39)}...` : texto
            })
            return registro
        })

        resumen.push({
            tabla: nombreTabla,
            total,
            columnas: columnasVisibles,
            registros
        })
    }

    return resumen
}

const generarContenidoCsv = async () => {
    const queryInterface = sequelize.getQueryInterface()
    const tablas = ordenarTablasParaImportacion(await queryInterface.showAllTables())
    const dialect = obtenerDialect()
    const lineas = [
        ['tabla', 'registros', 'columnas', 'muestra'].join(',')
    ]

    for (const tabla of tablas) {
        const nombreTabla = typeof tabla === 'string' ? tabla : tabla.tableName
        const tablaSql = entreComillas(nombreTabla, dialect)
        const [resultado] = await sequelize.query(`SELECT COUNT(*) AS total FROM ${tablaSql}`)
        const [muestras] = await sequelize.query(`SELECT * FROM ${tablaSql} LIMIT 1`)
        const total = Number(resultado[0]?.total || resultado[0]?.count || 0)
        const columnas = muestras[0]
            ? Object.keys(muestras[0]).filter((columna) => !['contraseña', 'password_hash', 'password'].includes(columna))
            : Object.keys(obtenerModeloPorTabla(nombreTabla)?.rawAttributes || {})
        const muestra = muestras[0]
            ? columnas.slice(0, 4).map((columna) => `${columna}: ${String(muestras[0][columna] ?? 'Sin dato').replace(/\s+/g, ' ')}`).join(' | ')
            : 'Sin registros'
        const fila = [nombreTabla, total, columnas.join(' | '), muestra]
            .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
            .join(',')

        lineas.push(fila)
    }

    return lineas.join('\n')
}

const generarPdfRespaldo = async ({ nombreArchivo, resumenTablas, contenidoSql }) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 42,
        bufferPages: true
    })
    const chunks = []
    const fecha = new Date()
    const totalRegistros = resumenTablas.reduce((total, item) => total + item.total, 0)
    const tablaMayor = resumenTablas.reduce((mayor, item) => item.total > mayor.total ? item : mayor, { tabla: 'Sin datos', total: 0 })
    const tamanoSqlKb = Math.max(1, Math.round(Buffer.byteLength(contenidoSql, 'utf8') / 1024))
    const maxRegistros = Math.max(1, ...resumenTablas.map((item) => item.total))
    let pagina = 1
    let y = 0

    const piePagina = (numeroPagina) => {
        doc.save()
        doc.fillColor('#64748b').fontSize(8).text(
            `${obtenerNombreSistema()} | Respaldo y auditoría | Página ${numeroPagina} | ${fecha.toLocaleDateString('es-MX')}`,
            42,
            doc.page.height - 34,
            { width: 510, align: 'center', lineBreak: false }
        )
        doc.restore()
    }

    const prepararPagina = ({ encabezado = false } = {}) => {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc')
        if (encabezado) {
            doc.rect(0, 0, doc.page.width, 78).fill('#020617')
            doc.rect(0, 78, doc.page.width, 5).fill('#10b981')
            doc.fillColor('#ffffff').fontSize(16).text('Reporte de respaldo', 42, 28)
            doc.fillColor('#a7f3d0').fontSize(9).text('Invernadero | Auditoría de datos', 42, 50)
            y = 112
        } else {
            y = 42
        }
    }

    const nuevaPagina = () => {
        doc.addPage()
        pagina += 1
        prepararPagina({ encabezado: true })
    }

    const numerarPaginas = () => {
        const rango = doc.bufferedPageRange()
        for (let index = rango.start; index < rango.start + rango.count; index += 1) {
            doc.switchToPage(index)
            piePagina(index - rango.start + 1)
        }
    }

    const asegurarEspacio = (alto) => {
        if (y + alto > doc.page.height - 72) {
            nuevaPagina()
        }
    }

    const textoSeguro = (valor, max = 80) => {
        const texto = String(valor || 'Sin dato').replace(/\s+/g, ' ').trim()
        return texto.length > max ? `${texto.slice(0, max - 3)}...` : texto
    }

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    prepararPagina()
    doc.rect(0, 0, doc.page.width, 152).fill('#020617')
    doc.rect(0, 152, doc.page.width, 7).fill('#10b981')
    doc.fillColor('#ffffff').fontSize(28).text('Reporte profesional de respaldo', 42, 38)
    doc.fillColor('#a7f3d0').fontSize(10).text('INVERNADERO | Seguridad, auditoría y continuidad operativa', 42, 75)
    doc.fillColor('#e2e8f0').fontSize(11).text(`Generado: ${fecha.toLocaleString('es-MX')}`, 42, 98)
    doc.fillColor('#94a3b8').fontSize(9).text(`Archivo: ${nombreArchivo}`, 42, 118, { width: 355 })
    doc.roundedRect(415, 38, 138, 70, 10).fill('#064e3b')
    doc.fillColor('#d1fae5').fontSize(9).text('TOTAL REGISTROS', 432, 52)
    doc.fillColor('#ffffff').fontSize(28).text(String(totalRegistros), 432, 68)

    y = 190
    doc.fillColor('#0f172a').fontSize(15).text('Resumen ejecutivo', 42, y)
    doc.fillColor('#64748b').fontSize(10).text(
        'Este documento acompaña al archivo SQL descargable y sirve como evidencia de qué tablas y registros fueron incluidos.',
        42,
        y + 23,
        { width: 510, lineGap: 3 }
    )

    const cards = [
        { label: 'Tablas incluidas', value: resumenTablas.length, color: '#0f766e' },
        { label: 'Registros', value: totalRegistros, color: '#2563eb' },
        { label: 'SQL estimado', value: `${tamanoSqlKb} KB`, color: '#b45309' },
        { label: 'Tabla mayor', value: tablaMayor.tabla, color: '#7c3aed' }
    ]

    cards.forEach((card, index) => {
        const x = 42 + ((index % 2) * 262)
        const y = 252 + (Math.floor(index / 2) * 86)
        doc.roundedRect(x, y, 240, 68, 8).fill('#ffffff').stroke('#e2e8f0')
        doc.rect(x, y, 5, 68).fill(card.color)
        doc.fillColor(card.color).fontSize(17).text(String(card.value), x + 18, y + 18, { width: 205, ellipsis: true })
        doc.fillColor('#64748b').fontSize(8).text(card.label.toUpperCase(), x + 18, y + 43)
    })

    y = 435
    doc.fillColor('#0f172a').fontSize(15).text('Distribución por tabla', 42, y)

    y = 462
    resumenTablas.forEach((item, index) => {
        asegurarEspacio(38)

        const anchoBarra = Math.round((item.total / maxRegistros) * 210)
        doc.roundedRect(42, y, 510, 34, 5).fill(index % 2 === 0 ? '#ffffff' : '#f1f5f9').stroke('#e2e8f0')
        doc.fillColor('#0f172a').fontSize(10).text(item.tabla, 56, y + 10, { width: 145 })
        doc.roundedRect(210, y + 12, 218, 8, 4).fill('#e2e8f0')
        doc.roundedRect(210, y + 12, Math.max(6, anchoBarra), 8, 4).fill(item.total > 0 ? '#10b981' : '#94a3b8')
        doc.fillColor('#047857').fontSize(10).text(`${item.total} registros`, 440, y + 10, { width: 90, align: 'right' })
        y += 38
    })

    nuevaPagina()

    doc.fillColor('#0f172a').fontSize(17).text('Detalle de tablas respaldadas', 42, y)
    doc.fillColor('#64748b').fontSize(10).text(
        'Cada bloque muestra el nombre de la tabla, su cantidad de registros, sus columnas principales y una muestra breve de datos. Las contraseñas y hashes se omiten del reporte visual.',
        42,
        y + 24,
        { width: 510, lineGap: 3 }
    )
    y += 72

    resumenTablas.forEach((item, index) => {
        const columnas = item.columnas.slice(0, 8)
        const altoBase = 96
        const altoRegistros = item.registros.length ? item.registros.length * 42 : 24
        asegurarEspacio(altoBase + altoRegistros)

        doc.roundedRect(42, y, 510, altoBase + altoRegistros - 8, 8).fill('#ffffff').stroke('#e2e8f0')
        doc.rect(42, y, 6, altoBase + altoRegistros - 8).fill(index % 2 === 0 ? '#10b981' : '#2563eb')
        doc.fillColor('#0f172a').fontSize(14).text(item.tabla, 60, y + 16)
        doc.fillColor('#047857').fontSize(10).text(`${item.total} registros`, 430, y + 17, { width: 90, align: 'right' })
        doc.fillColor('#64748b').fontSize(8).text('COLUMNAS PRINCIPALES', 60, y + 42)
        doc.fillColor('#334155').fontSize(8).text(columnas.join('  |  ') || 'Sin columnas detectadas', 60, y + 56, { width: 470, height: 24 })

        let filaY = y + 88
        if (!item.registros.length) {
            doc.fillColor('#94a3b8').fontSize(9).text('Sin registros para mostrar.', 60, filaY)
        } else {
            item.registros.forEach((registro, filaIndex) => {
                const contenido = Object.entries(registro)
                    .slice(0, 4)
                    .map(([columna, valor]) => `${columna}: ${textoSeguro(valor, 36)}`)
                    .join('   ')
                doc.roundedRect(60, filaY, 472, 28, 5).fill(filaIndex % 2 === 0 ? '#f8fafc' : '#f1f5f9')
                doc.fillColor('#334155').fontSize(8).text(contenido, 72, filaY + 8, { width: 448, height: 12 })
                filaY += 38
            })
        }

        y += altoBase + altoRegistros + 12
    })

    asegurarEspacio(364)
    doc.fillColor('#0f172a').fontSize(15).text('Checklist de restauración', 42, y + 10)
    const checks = [
        'Verificar que el archivo SQL corresponda a la fecha requerida.',
        'Restaurar primero en una base de prueba.',
        'Confirmar usuarios, inventario, ventas y catálogos antes de operar.',
        'Guardar una copia externa del archivo descargado.'
    ]

    checks.forEach((check, index) => {
        const checkY = y + 42 + (index * 24)
        doc.circle(50, checkY + 6, 4).fill('#10b981')
        doc.fillColor('#334155').fontSize(9).text(check, 64, checkY)
    })

    const previewY = y + 150
    doc.fillColor('#0f172a').fontSize(15).text('Vista previa SQL', 42, previewY)
    doc.roundedRect(42, previewY + 30, 510, 154, 6).fill('#020617')
    doc.fillColor('#d1fae5').fontSize(8).text(
        contenidoSql.split('\n').slice(0, 17).join('\n'),
        56,
        previewY + 44,
        { width: 482, height: 126 }
    )

    numerarPaginas()

    doc.end()
})

exports.generarRespaldo = async (req, res) => {
    try {
        if (Number(req.usuario.id_rol) !== 1) {
            return res.status(403).json({ mensaje: 'No autorizado' })
        }

        const carpetaFecha = await prepararCarpetaTemporalFecha()

        const formato = req.query.formato === 'postgres' ? 'postgres' : obtenerDialect()
        const nombreArchivo = `respaldo_${formato}_${process.env.DB_NAME || 'database'}_${formatearFechaArchivo()}.sql`
        const rutaArchivo = path.join(carpetaFecha, nombreArchivo)
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

exports.generarRespaldoCsv = async (req, res) => {
    try {
        if (Number(req.usuario.id_rol) !== 1) {
            return res.status(403).json({ mensaje: 'No autorizado' })
        }

        const carpetaFecha = await prepararCarpetaTemporalFecha()

        const nombreArchivo = `resumen_respaldo_${process.env.DB_NAME || 'database'}_${formatearFechaArchivo()}.csv`
        const rutaArchivo = path.join(carpetaFecha, nombreArchivo)
        const contenido = await generarContenidoCsv()

        await fs.promises.writeFile(rutaArchivo, contenido, 'utf8')

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.download(rutaArchivo, nombreArchivo)
    } catch (error) {
        console.error('Error al generar CSV de respaldo:', error)

        res.status(500).json({
            mensaje: 'Error al generar CSV de respaldo'
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
        const carpetaFecha = await prepararCarpetaTemporalFecha()
        const rutaArchivo = path.join(carpetaFecha, nombreArchivo)
        const pdfBuffer = await generarPdfRespaldo({
            nombreArchivo,
            resumenTablas,
            contenidoSql
        })

        await fs.promises.writeFile(rutaArchivo, pdfBuffer)

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
