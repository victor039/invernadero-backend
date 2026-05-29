const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')

const {

    obtenerResumen,
    obtenerResumenAdmin,
    productosMasVendidos

} = require('../controllers/reporteController')

router.get(

    '/resumen',

    authMiddleware,

    obtenerResumen

)

router.get(

    '/admin',

    authMiddleware,

    obtenerResumenAdmin

)

router.get(

    '/productos-mas-vendidos',

    authMiddleware,

    productosMasVendidos

)

module.exports = router
