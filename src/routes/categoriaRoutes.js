const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')

const {
    crearCategoria,
    obtenerCategorias
} = require('../controllers/categoriaController')

/* =========================
   CREAR CATEGORÍA (PROTEGIDO)
========================= */
router.post(
    '/',
    authMiddleware,
    crearCategoria
)

/* =========================
   OBTENER CATEGORÍAS (PÚBLICO)
   para selects en frontend
========================= */
router.get(
    '/',
    obtenerCategorias
)

module.exports = router