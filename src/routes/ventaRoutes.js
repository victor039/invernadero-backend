const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')

const {

    crearVenta,
    obtenerVentas,
    generarTicketVenta

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

router.post(

    '/:id/ticket',

    authMiddleware,

    generarTicketVenta

)

module.exports = router
