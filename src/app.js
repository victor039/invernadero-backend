const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/authRoutes')
const plantaRoutes = require('./routes/plantaRoutes')
const categoriaRoutes = require('./routes/categoriaRoutes')
const proveedorRoutes = require('./routes/proveedorRoutes')
const empleadoRoutes = require('./routes/empleadoRoutes')
const clienteRoutes = require('./routes/clienteRoutes')
const ventaRoutes = require('./routes/ventaRoutes')
const reporteRoutes = require('./routes/reporteRoutes')
const respaldoRoutes = require('./routes/respaldoRoutes')

const app = express()

app.set('trust proxy', 1)

app.use(cors())
app.use(express.json({ limit: '20mb' }))

// 🔥 ARCHIVOS DE IMÁGENES
app.use('/uploads', express.static(
    path.join(__dirname, '../uploads')
))

// 🔥 TICKETS PDF (ESTO TE FALTABA)
app.use('/tickets', express.static(
    path.join(__dirname, '../tickets')
))

app.use('/api/empleados', empleadoRoutes)
app.use('/api/clientes', clienteRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/plantas', plantaRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/proveedores', proveedorRoutes)
app.use('/api/ventas', ventaRoutes)
app.use('/api/reportes', reporteRoutes)
app.use('/api/respaldos', respaldoRoutes)

app.get('/', (req, res) => {
    res.json({ mensaje: 'API funcionando correctamente' })
})

module.exports = app
