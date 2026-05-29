const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')

const {

    crearVenta,
    obtenerVentas

} = require('../controllers/ventaController')

router.post(

    '/',

    authMiddleware,

    crearVenta

)

router.get(

    '/',

    authMiddleware,

    obtenerVentas

)

module.exports = router