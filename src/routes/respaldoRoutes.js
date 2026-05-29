const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')
const { generarRespaldo } = require('../controllers/respaldoController')

router.get('/generar', authMiddleware, generarRespaldo)

module.exports = router
