const Venta = require('../models/Venta')
const DetalleVenta = require('../models/DetalleVenta')
const Planta = require('../models/Planta')
const Cliente = require('../models/Cliente')
const Empleado = require('../models/Empleado')

const PDFDocument = require('pdfkit')
const nodemailer = require('nodemailer')

const fs = require('fs')
const path = require('path')
const {
    limpiarTexto,
    validarCorreo,
    validarLongitud,
    validarLongitudMinMax,
    validarNombrePersona,
    validarPayload
} = require('../utils/validaciones')

const metodosPagoPermitidos = ['Efectivo', 'Tarjeta', 'Transferencia']

const escaparHtml = (valor) => String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatoCorreoMoneda = (valor) => `$${Number(valor || 0).toFixed(2)}`

const crearHtmlTicket = ({ nombreCliente, venta, total, productos = [] }) => {
    const filasProductos = productos.map((item) => `
        <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                <strong style="color:#0f172a;">${escaparHtml(item.nombre)}</strong>
                <div style="font-size:12px;color:#64748b;margin-top:3px;">${escaparHtml(item.nombre_cientifico || 'Producto de invernadero')}</div>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:center;color:#0f172a;">${Number(item.cantidad || 0)}</td>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#0f172a;">${formatoCorreoMoneda(item.precio_unitario)}</td>
            <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#047857;">${formatoCorreoMoneda(item.subtotal)}</td>
        </tr>
    `).join('')

    return `
        <!doctype html>
        <html lang="es">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Ticket de compra #${venta.id_venta}</title>
        </head>
        <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
            <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
                Gracias por tu compra. Adjuntamos tu ticket PDF de Invernadero.
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.12);">
                            <tr>
                                <td style="background:#064e3b;padding:28px 28px 24px;">
                                    <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#bbf7d0;font-weight:700;">Invernadero</div>
                                    <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;color:#ffffff;">Gracias por tu compra</h1>
                                    <p style="margin:8px 0 0;color:#d1fae5;font-size:15px;">Tu ticket fue generado correctamente y también va adjunto en PDF.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:26px 28px;">
                                    <p style="margin:0 0 18px;font-size:16px;color:#334155;">Hola <strong>${escaparHtml(nombreCliente)}</strong>, estos son los datos de tu compra:</p>

                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
                                        <tr>
                                            <td style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;padding:18px;">
                                                <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#047857;font-weight:700;">Total pagado</div>
                                                <div style="margin-top:6px;font-size:34px;line-height:1;color:#065f46;font-weight:800;">${formatoCorreoMoneda(total)}</div>
                                            </td>
                                            <td width="12"></td>
                                            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;">
                                                <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;">Ticket</div>
                                                <div style="margin-top:6px;font-size:24px;color:#0f172a;font-weight:800;">#${venta.id_venta}</div>
                                            </td>
                                        </tr>
                                    </table>

                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                                        <thead>
                                            <tr>
                                                <th align="left" style="padding:10px 0;border-bottom:2px solid #047857;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.8px;">Producto</th>
                                                <th align="center" style="padding:10px 0;border-bottom:2px solid #047857;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.8px;">Cant.</th>
                                                <th align="right" style="padding:10px 0;border-bottom:2px solid #047857;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.8px;">Precio</th>
                                                <th align="right" style="padding:10px 0;border-bottom:2px solid #047857;color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:.8px;">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${filasProductos || '<tr><td colspan="4" style="padding:14px 0;color:#64748b;">Consulta el detalle completo en el PDF adjunto.</td></tr>'}
                                        </tbody>
                                    </table>

                                    <div style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
                                        <strong style="color:#0f172a;">Archivo adjunto</strong>
                                        <p style="margin:6px 0 0;color:#64748b;font-size:14px;">Incluimos el ticket en PDF para descargarlo, guardarlo o imprimirlo cuando lo necesites.</p>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="background:#0f172a;padding:18px 28px;text-align:center;">
                                    <p style="margin:0;color:#cbd5e1;font-size:13px;">Invernadero - Sistema de gestión inteligente</p>
                                    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Gracias por confiar en nosotros.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `
}

const enviarCorreoTicket = async ({ correo, rutaPDF, nombrePDF, nombreCliente, venta, total, productos = [] }) => {
    const correoDestino = String(correo || '').trim()

    if (!correoDestino) {
        return { canal: 'correo', enviado: false, mensaje: 'No se proporcionó correo' }
    }

    if (process.env.RESEND_API_KEY) {
        const remitente = process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER

        if (!remitente) {
            return { canal: 'correo', enviado: false, mensaje: 'Falta RESEND_FROM o SMTP_FROM en .env' }
        }

        const respuesta = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.SMTP_FROM_NAME
                    ? `${process.env.SMTP_FROM_NAME} <${remitente}>`
                    : remitente,
                to: [correoDestino],
                subject: `Ticket de compra #${venta.id_venta} - Invernadero`,
                text: `Hola ${nombreCliente}, gracias por tu compra.\n\nTicket: #${venta.id_venta}\nTotal: $${Number(total).toFixed(2)}\n\nAdjuntamos tu ticket en PDF.`,
                html: crearHtmlTicket({
                    nombreCliente,
                    venta,
                    total,
                    productos
                }),
                attachments: [
                    {
                        filename: nombrePDF,
                        content: fs.readFileSync(rutaPDF).toString('base64')
                    }
                ]
            })
        })
        const data = await respuesta.json().catch(() => ({}))

        if (!respuesta.ok) {
            throw new Error(data.message || data.error || 'No se pudo enviar el correo por Resend')
        }

        return { canal: 'correo', enviado: true, mensaje: `Correo enviado a ${correoDestino}` }
    }

    const requerido = [
        process.env.SMTP_HOST,
        process.env.SMTP_USER,
        process.env.SMTP_PASS
    ]

    if (requerido.some((valor) => !valor)) {
        return { canal: 'correo', enviado: false, mensaje: 'Faltan credenciales SMTP en .env' }
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })

    await transporter.sendMail({
        from: process.env.SMTP_FROM_NAME
            ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`
            : process.env.SMTP_FROM || process.env.SMTP_USER,
        to: correoDestino,
        subject: `Ticket de compra #${venta.id_venta} - Invernadero`,
        text: `Hola ${nombreCliente}, gracias por tu compra.\n\nTicket: #${venta.id_venta}\nTotal: $${Number(total).toFixed(2)}\n\nAdjuntamos tu ticket en PDF.`,
        html: crearHtmlTicket({
            nombreCliente,
            venta,
            total,
            productos
        }),
        attachments: [
            {
                filename: nombrePDF,
                path: rutaPDF
            }
        ]
    })

    return { canal: 'correo', enviado: true, mensaje: `Correo enviado a ${correoDestino}` }
}

const intentarEntrega = async (fn, fallback) => {
    try {
        return await fn()
    } catch (error) {
        const mensajeError = error.code === 'ETIMEDOUT' || /timeout/i.test(error.message || '')
            ? 'No se pudo conectar a Gmail SMTP. En Render gratis los puertos SMTP 25, 465 y 587 pueden estar bloqueados.'
            : error.response || error.message || fallback.mensaje

        return {
            ...fallback,
            enviado: false,
            mensaje: mensajeError
        }
    }
}

const obtenerBaseUrl = (req) => process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`

const generarTicketPDF = async ({
    venta,
    productosTicket,
    nombreCliente,
    nombreEmpleado,
    id_empleado,
    tipo_cliente = 'registrado',
    metodo_pago = 'Registrado',
    referencia_pago = ''
}) => {
    const carpetaTickets = path.join(__dirname, '../../tickets')

    if (!fs.existsSync(carpetaTickets)) {
        fs.mkdirSync(carpetaTickets)
    }

    const nombrePDF = `ticket-${venta.id_venta}.pdf`
    const rutaPDF = path.join(carpetaTickets, nombrePDF)
    const total = Number(venta.total || 0)
    const doc = new PDFDocument({
        margin: 45,
        size: 'A4'
    })
    const ticketStream = fs.createWriteStream(rutaPDF)

    doc.pipe(ticketStream)

    doc.rect(0, 0, 595, 96).fill('#064e3b')
    doc.fontSize(24).fillColor('#ffffff').text('INVERNADERO S.A. DE C.V.', 45, 28)
    doc.fontSize(10).fillColor('#bbf7d0').text('Sistema de ventas y control de plantas', 45, 60)
    doc.fontSize(10).fillColor('#ffffff').text(`Ticket #${venta.id_venta}`, 430, 30, {
        width: 115,
        align: 'right'
    })
    doc.fontSize(9).fillColor('#d1fae5').text(new Date(venta.fecha_venta || Date.now()).toLocaleString('es-MX'), 380, 52, {
        width: 165,
        align: 'right'
    })

    doc.y = 125
    doc.fontSize(12).fillColor('#0f172a').text('Datos de la venta', 45, doc.y)
    doc.moveDown(0.6)

    const infoY = doc.y
    doc.roundedRect(45, infoY, 505, referencia_pago ? 98 : 82, 8).fill('#f8fafc').stroke('#e2e8f0')
    doc.fontSize(10).fillColor('#475569').text('Cliente', 65, infoY + 16)
        .fillColor('#0f172a').fontSize(12).text(nombreCliente, 65, infoY + 31, { width: 210 })
    doc.fontSize(10).fillColor('#475569').text('Tipo', 65, infoY + 56)
        .fillColor('#0f172a').text(tipo_cliente === 'paso' ? 'Cliente de paso' : 'Cliente registrado', 65, infoY + 70)
    doc.fontSize(10).fillColor('#475569').text('Atendido por', 300, infoY + 16)
        .fillColor('#0f172a').fontSize(12).text(`${nombreEmpleado} (ID ${id_empleado})`, 300, infoY + 31, { width: 220 })
    doc.fontSize(10).fillColor('#475569').text('Pago', 300, infoY + 56)
        .fillColor('#0f172a').text(referencia_pago ? `${metodo_pago} · Ref. ${referencia_pago}` : metodo_pago, 300, infoY + 70, { width: 220 })

    doc.y = infoY + (referencia_pago ? 120 : 104)

    const tableTop = doc.y
    doc.fontSize(12).fillColor('#fff').roundedRect(45, tableTop, 505, 24, 4).fill('#047857')
    doc.fillColor('#fff').fontSize(10)
        .text('Producto', 55, tableTop + 7)
        .text('Cant.', 300, tableTop + 7)
        .text('P. Unit.', 365, tableTop + 7)
        .text('Subtotal', 455, tableTop + 7)

    doc.y = tableTop + 34

    productosTicket.forEach((item, index) => {
        const y = doc.y

        doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f8fafc').rect(45, y - 4, 505, 34).fill()
        doc.fillColor('#0f172a').fontSize(10).text(`${item.nombre} (ID ${item.id_planta})`, 55, y, { width: 220 })
        doc.fontSize(8).fillColor('#64748b').text(item.nombre_cientifico || 'Producto de invernadero', 55, y + 13, { width: 220 })
        doc.fontSize(10).fillColor('#0f172a')
            .text(String(item.cantidad), 305, y)
            .text(`$${Number(item.precio_unitario || 0).toFixed(2)}`, 365, y)
            .text(`$${Number(item.subtotal || 0).toFixed(2)}`, 455, y)

        doc.y = y + 34
    })

    doc.moveDown()
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown()
    doc.fontSize(20).fillColor('#047857').text(`TOTAL: $${total.toFixed(2)}`, { align: 'right' })
    doc.moveDown(2)
    doc.fontSize(12).fillColor('#475569').text('Gracias por su compra', { align: 'center' })
    doc.text('Invernadero - Sistema de gestión inteligente', { align: 'center' })
    doc.end()

    await new Promise((resolve, reject) => {
        ticketStream.on('finish', resolve)
        ticketStream.on('error', reject)
    })

    return { nombrePDF, rutaPDF }
}

const obtenerDatosTicketVenta = async (idVenta) => {
    const venta = await Venta.findByPk(idVenta)

    if (!venta) return null

    const [detalles, cliente, empleado] = await Promise.all([
        DetalleVenta.findAll({ where: { id_venta: venta.id_venta } }),
        Cliente.findByPk(venta.id_cliente),
        Empleado.findByPk(venta.id_empleado)
    ])
    const plantas = await Planta.findAll({
        where: {
            id_planta: detalles.map((detalle) => detalle.id_planta)
        }
    })
    const plantasPorId = new Map(plantas.map((planta) => [Number(planta.id_planta), planta]))
    const productosTicket = detalles.map((detalle) => {
        const data = detalle.toJSON()
        const planta = plantasPorId.get(Number(data.id_planta))

        return {
            id_planta: Number(data.id_planta),
            nombre: planta?.nombre_comun || `Planta #${data.id_planta}`,
            nombre_cientifico: planta?.nombre_cientifico || '',
            cantidad: Number(data.cantidad || 0),
            precio_unitario: Number(data.precio_unitario || 0),
            subtotal: Number(data.subtotal || 0)
        }
    })
    const ventaData = venta.toJSON ? venta.toJSON() : venta
    const nombreCliente = ventaData.tipo_cliente === 'paso'
        ? (ventaData.cliente_paso || 'Cliente de paso')
        : (cliente ? `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() : `Cliente #${venta.id_cliente}`)
    const nombreEmpleado = empleado ? `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim() || empleado.usuario : `Empleado #${venta.id_empleado}`

    return { venta, cliente, empleado, productosTicket, nombreCliente, nombreEmpleado }
}

exports.crearVenta = async (req, res) => {

    try {

        const {
            id_cliente = 1,
            id_empleado = 1,
            productos,
            tipo_cliente = 'registrado',
            cliente_paso = 'Cliente de paso',
            metodo_pago = 'Efectivo',
            referencia_pago = '',
            entrega_ticket = {},
            correo_ticket = ''
        } = req.body

        const tipoClienteFinal = ['registrado', 'paso'].includes(tipo_cliente) ? tipo_cliente : 'registrado'
        const metodoPagoFinal = limpiarTexto(metodo_pago || 'Efectivo')
        const referenciaPagoFinal = limpiarTexto(referencia_pago)
        const clientePasoFinal = limpiarTexto(cliente_paso || 'Cliente de paso') || 'Cliente de paso'
        const correoTicketRecibido = limpiarTexto(correo_ticket).toLowerCase()

        validarPayload([
            { condicion: !Array.isArray(productos) || productos.length === 0, mensaje: 'Agrega al menos un producto a la venta' },
            { condicion: productos?.length > 40, mensaje: 'La venta no puede tener más de 40 productos distintos' },
            { condicion: !Number.isInteger(Number(id_cliente)) || Number(id_cliente) <= 0, mensaje: 'El cliente seleccionado no es válido' },
            { condicion: !Number.isInteger(Number(id_empleado)) || Number(id_empleado) <= 0, mensaje: 'El empleado seleccionado no es válido' },
            { condicion: tipoClienteFinal === 'paso' && (!validarLongitudMinMax(clientePasoFinal, 2, 60) || !validarNombrePersona(clientePasoFinal)), mensaje: 'El cliente de paso debe tener de 2 a 60 caracteres y solo letras' },
            { condicion: !metodosPagoPermitidos.includes(metodoPagoFinal), mensaje: 'El método de pago no es válido' },
            { condicion: metodoPagoFinal !== 'Efectivo' && !referenciaPagoFinal, mensaje: 'La referencia de pago es obligatoria' },
            { condicion: referenciaPagoFinal && !validarLongitud(referenciaPagoFinal, 40), mensaje: 'La referencia puede tener máximo 40 caracteres' },
            { condicion: correoTicketRecibido && !validarCorreo(correoTicketRecibido), mensaje: 'El correo del ticket no tiene formato válido' }
        ])

        let total = 0
        const productosTicket = []

        // =========================
        // CALCULAR TOTAL
        // =========================

        for (const item of productos) {
            const cantidad = Number(item.cantidad)

            if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 9999) {
                return res.status(400).json({
                    mensaje: 'Cada producto debe tener una cantidad válida'
                })
            }

            const planta = await Planta.findByPk(
                item.id_planta
            )

            if (!planta) {

                return res.status(404).json({
                    mensaje: 'Planta no encontrada'
                })

            }

            if (planta.stock < cantidad) {

                return res.status(400).json({
                    mensaje: `Stock insuficiente para ${planta.nombre_comun}`
                })

            }

            const precioUnitario = Number(planta.precio)
            const subtotal = precioUnitario * cantidad

            total += subtotal

            productosTicket.push({
                id_planta: planta.id_planta,
                nombre: planta.nombre_comun,
                nombre_cientifico: planta.nombre_cientifico,
                cantidad,
                precio_unitario: precioUnitario,
                subtotal
            })

        }

        // =========================
        // CREAR VENTA
        // =========================

        const cliente = await Cliente.findByPk(id_cliente)
        const entregaTicketFinal = {
            descarga: true,
            correo: Boolean(entrega_ticket.correo)
        }
        const correoTicketFinal = tipoClienteFinal === 'paso'
            ? correoTicketRecibido
            : limpiarTexto(correoTicketRecibido || cliente?.correo).toLowerCase()

        const venta = await Venta.create({

            id_cliente: Number(id_cliente),
            id_empleado: Number(id_empleado),
            total,
            tipo_cliente: tipoClienteFinal,
            cliente_paso: tipoClienteFinal === 'paso' ? clientePasoFinal : null,
            metodo_pago: metodoPagoFinal,
            referencia_pago: referenciaPagoFinal,
            ticket_descarga: entregaTicketFinal.descarga,
            ticket_correo: entregaTicketFinal.correo,
            correo_ticket: correoTicketFinal

        })

        // =========================
        // DETALLE VENTA
        // =========================

        for (const item of productosTicket) {

            const planta = await Planta.findByPk(
                item.id_planta
            )

            await DetalleVenta.create({

                id_venta: venta.id_venta,
                id_planta: item.id_planta,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal

            })

            // =========================
            // DESCONTAR STOCK
            // =========================

            planta.stock =
                planta.stock - item.cantidad

            await planta.save()

        }

        // =========================
        // CLIENTE
        // =========================

        const empleado = await Empleado.findByPk(Number(id_empleado))

        const nombreCliente = tipoClienteFinal === 'paso'
            ? clientePasoFinal
            : (cliente ? `${cliente.nombre} ${cliente.apellido || ''}`.trim() : 'Cliente general')

        const nombreEmpleado = empleado
            ? `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim() || empleado.usuario
            : `Empleado #${id_empleado}`

        // =========================
        // CREAR PDF
        // =========================

        const carpetaTickets = path.join(
            __dirname,
            '../../tickets'
        )

        if (!fs.existsSync(carpetaTickets)) {

            fs.mkdirSync(carpetaTickets)

        }

        const nombrePDF =
            `ticket-${venta.id_venta}.pdf`

        const rutaPDF = path.join(
            carpetaTickets,
            nombrePDF
        )

const doc = new PDFDocument({
    margin: 45,
    size: 'A4'
})

const ticketStream = fs.createWriteStream(rutaPDF)

doc.pipe(ticketStream)

// =========================
// ENCABEZADO
// =========================
doc
    .rect(0, 0, 595, 96)
    .fill('#064e3b')

doc
    .fontSize(24)
    .fillColor('#ffffff')
    .text('INVERNADERO S.A. DE C.V.', 45, 28)

doc
    .fontSize(10)
    .fillColor('#bbf7d0')
    .text('Sistema de ventas y control de plantas', 45, 60)

doc
    .fontSize(10)
    .fillColor('#ffffff')
    .text(`Ticket #${venta.id_venta}`, 430, 30, {
        width: 115,
        align: 'right'
    })

doc
    .fontSize(9)
    .fillColor('#d1fae5')
    .text(new Date().toLocaleString(), 380, 52, {
        width: 165,
        align: 'right'
    })

doc.y = 125

// =========================
// INFO VENTA
// =========================
doc
    .fontSize(12)
    .fillColor('#0f172a')
    .text('Datos de la venta', 45, doc.y)

doc
    .moveDown(0.6)

const infoY = doc.y

doc
    .roundedRect(45, infoY, 505, referenciaPagoFinal ? 98 : 82, 8)
    .fill('#f8fafc')
    .stroke('#e2e8f0')

doc
    .fontSize(10)
    .fillColor('#475569')
    .text('Cliente', 65, infoY + 16)
    .fillColor('#0f172a')
    .fontSize(12)
    .text(nombreCliente, 65, infoY + 31, { width: 210 })

doc
    .fontSize(10)
    .fillColor('#475569')
    .text('Tipo', 65, infoY + 56)
    .fillColor('#0f172a')
    .text(tipoClienteFinal === 'paso' ? 'Cliente de paso' : 'Cliente registrado', 65, infoY + 70)

doc
    .fontSize(10)
    .fillColor('#475569')
    .text('Atendido por', 300, infoY + 16)
    .fillColor('#0f172a')
    .fontSize(12)
    .text(`${nombreEmpleado} (ID ${id_empleado})`, 300, infoY + 31, { width: 220 })

doc
    .fontSize(10)
    .fillColor('#475569')
    .text('Pago', 300, infoY + 56)
    .fillColor('#0f172a')
    .text(referenciaPagoFinal ? `${metodoPagoFinal} · Ref. ${referenciaPagoFinal}` : metodoPagoFinal, 300, infoY + 70, { width: 220 })

doc.y = infoY + (referenciaPagoFinal ? 120 : 104)

// =========================
// TABLA HEADER
// =========================
const tableTop = doc.y

doc
    .fontSize(12)
    .fillColor('#fff')
    .roundedRect(45, tableTop, 505, 24, 4)
    .fill('#047857')

doc
    .fillColor('#fff')
    .fontSize(10)
    .text('Producto', 55, tableTop + 7)
    .text('Cant.', 300, tableTop + 7)
    .text('P. Unit.', 365, tableTop + 7)
    .text('Subtotal', 455, tableTop + 7)

doc.y = tableTop + 34

// =========================
// PRODUCTOS
// =========================
productosTicket.forEach((item, index) => {

    const y = doc.y

    doc
        .fillColor(index % 2 === 0 ? '#ffffff' : '#f8fafc')
        .rect(45, y - 4, 505, 34)
        .fill()

    doc
        .fillColor('#0f172a')
        .fontSize(10)
        .text(`${item.nombre} (ID ${item.id_planta})`, 55, y, { width: 220 })

    doc
        .fontSize(8)
        .fillColor('#64748b')
        .text(item.nombre_cientifico || 'Sin nombre científico', 55, y + 13, { width: 220 })

    doc
        .fontSize(10)
        .fillColor('#0f172a')
        .text(String(item.cantidad), 305, y)
        .text(`$${item.precio_unitario.toFixed(2)}`, 365, y)
        .text(`$${item.subtotal.toFixed(2)}`, 455, y)

    doc.y = y + 34
})

// =========================
// TOTAL
// =========================
doc.moveDown()

doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(45, doc.y)
    .lineTo(550, doc.y)
    .stroke()

doc.moveDown()

doc
    .fontSize(20)
    .fillColor('#047857')
    .text(`TOTAL: $${Number(total).toFixed(2)}`, {
        align: 'right'
    })

doc.moveDown(2)

// =========================
// FOOTER
// =========================
doc
    .fontSize(12)
    .fillColor('#475569')
    .text('Gracias por su compra', {
        align: 'center'
    })

doc
    .text('Invernadero - Sistema de gestión inteligente', {
        align: 'center'
    })

doc.end()

await new Promise((resolve, reject) => {
    ticketStream.on('finish', resolve)
    ticketStream.on('error', reject)
})

const pdfUrl = `${obtenerBaseUrl(req)}/tickets/${nombrePDF}`
const entregas = []

if (entregaTicketFinal.correo) {
    entregas.push(
        await intentarEntrega(
            () => enviarCorreoTicket({
                correo: correoTicketFinal,
                rutaPDF,
                nombrePDF,
                nombreCliente,
                venta,
                total,
                productos: productosTicket
            }),
            { canal: 'correo', mensaje: 'No se pudo enviar el correo' }
        )
    )
}

if (entregaTicketFinal.descarga) {
    entregas.push({
        canal: 'descarga',
        enviado: true,
        mensaje: 'Ticket disponible para descarga'
    })
}

        res.json({

            mensaje: 'Venta realizada',
            venta,
            detalle: productosTicket,
            cliente: nombreCliente,
            empleado: nombreEmpleado,
            pago: {
                metodo: metodoPagoFinal,
                referencia: referenciaPagoFinal
            },
            entregas,
            pdf: pdfUrl

        })

    } catch (error) {

        console.log(error)

        res.status(error.status || 500).json({

            mensaje: error.status ? error.message : 'Error al realizar venta',
            error: error.message || error

        })

    }

}

exports.obtenerVentas = async (req, res) => {

    try {

        const ventas = await Venta.findAll({
            order: [['id_venta', 'DESC']]
        })
        const empleados = await Empleado.findAll({
            attributes: ['id_empleado', 'nombre', 'apellido', 'usuario', 'id_rol']
        })
        const clientes = await Cliente.findAll({
            attributes: ['id_cliente', 'nombre', 'apellido']
        })
        const empleadosPorId = new Map(
            empleados.map((empleado) => [Number(empleado.id_empleado), empleado])
        )
        const clientesPorId = new Map(
            clientes.map((cliente) => [Number(cliente.id_cliente), cliente])
        )
        const ventasConDetalle = ventas.map((venta) => {
            const data = venta.toJSON()
            const empleado = empleadosPorId.get(Number(data.id_empleado))
            const cliente = clientesPorId.get(Number(data.id_cliente))
            const esClientePaso = data.tipo_cliente === 'paso'

            return {
                ...data,
                tipo_cliente: data.tipo_cliente || 'registrado',
                ticket_descarga: data.ticket_descarga !== false,
                ticket_correo: Boolean(data.ticket_correo),
                empleado_nombre: empleado
                    ? `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim() || empleado.usuario
                    : `Empleado #${data.id_empleado}`,
                empleado_rol: empleado ? Number(empleado.id_rol) : null,
                cliente_nombre: esClientePaso
                    ? (data.cliente_paso || 'Cliente de paso')
                    : (cliente
                    ? `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim()
                    : `Cliente #${data.id_cliente}`)
            }
        })

        res.json(ventasConDetalle)

    } catch (error) {

        res.status(500).json({

            mensaje: 'Error al obtener ventas'

        })

    }

}

exports.generarTicketVenta = async (req, res) => {
    try {
        const datosTicket = await obtenerDatosTicketVenta(req.params.id)

        if (!datosTicket) {
            return res.status(404).json({ mensaje: 'Venta no encontrada' })
        }

        const {
            entrega_ticket = {},
            correo_ticket = ''
        } = req.body
        const {
            venta,
            cliente,
            productosTicket,
            nombreCliente,
            nombreEmpleado
        } = datosTicket
        const { nombrePDF, rutaPDF } = await generarTicketPDF({
            venta,
            productosTicket,
            nombreCliente,
            nombreEmpleado,
            id_empleado: venta.id_empleado,
            tipo_cliente: venta.tipo_cliente,
            metodo_pago: venta.metodo_pago || 'Registrado',
            referencia_pago: venta.referencia_pago || ''
        })
        const pdfUrl = `${obtenerBaseUrl(req)}/tickets/${nombrePDF}`
        const entregas = []

        if (entrega_ticket.correo) {
            entregas.push(
                await intentarEntrega(
                    () => enviarCorreoTicket({
                        correo: correo_ticket || venta.correo_ticket || cliente?.correo,
                        rutaPDF,
                        nombrePDF,
                        nombreCliente,
                        venta,
                        total: venta.total,
                        productos: productosTicket
                    }),
                    { canal: 'correo', mensaje: 'No se pudo enviar el correo' }
                )
            )
        }

        if (entrega_ticket.descarga) {
            entregas.push({
                canal: 'descarga',
                enviado: true,
                mensaje: 'Ticket disponible para descarga'
            })
        }

        res.json({
            mensaje: 'Ticket generado',
            venta: venta.id_venta,
            pdf: pdfUrl,
            entregas
        })
    } catch (error) {
        console.log(error)

        res.status(500).json({
            mensaje: 'Error al generar ticket',
            error: error.message
        })
    }
}
