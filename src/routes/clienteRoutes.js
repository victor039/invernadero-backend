const express = require('express')

const authMiddleware = require('../middlewares/authMiddleware')

const {
    crearCliente,
    obtenerClientes,
    actualizarCliente,
    eliminarCliente
} = require('../controllers/clienteController')

const router = express.Router()

router.get('/', authMiddleware, obtenerClientes)

router.post('/', authMiddleware, crearCliente)

router.put('/:id', authMiddleware, actualizarCliente)

router.delete('/:id', authMiddleware, eliminarCliente)

module.exports = router
