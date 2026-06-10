const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')
const { generarRespaldo, generarRespaldoPdf, generarRespaldoCsv } = require('../controllers/respaldoController')

router.get('/generar', authMiddleware, generarRespaldo)
router.get('/pdf', authMiddleware, generarRespaldoPdf)
router.get('/csv', authMiddleware, generarRespaldoCsv)

module.exports = router
