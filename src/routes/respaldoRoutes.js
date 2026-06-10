const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')
const { generarRespaldo, generarRespaldoPdf } = require('../controllers/respaldoController')

router.get('/generar', authMiddleware, generarRespaldo)
router.get('/pdf', authMiddleware, generarRespaldoPdf)

module.exports = router
