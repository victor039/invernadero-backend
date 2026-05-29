const jwt = require('jsonwebtoken');

require('dotenv').config();

module.exports = (req, res, next) => {

    try {

        const token = req.header('Authorization');

        if (!token) {

            return res.status(401).json({
                mensaje: 'Acceso denegado'
            });

        }

        const tokenLimpio = token.replace('Bearer ', '');

        const verified = jwt.verify(
            tokenLimpio,
            process.env.JWT_SECRET
        );

        req.usuario = verified;

        next();

    } catch (error) {

        res.status(401).json({
            mensaje: 'Token inválido'
        });

    }

};