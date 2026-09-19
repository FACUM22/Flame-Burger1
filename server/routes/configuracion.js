const express = require("express");

const router = express.Router();

const pool = require("../database");


// =====================================================
// OBTENER ESTADO DE LA PÁGINA
// =====================================================

router.get("/estado", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT pagina_activa
            FROM configuracion
            WHERE id = 1
            LIMIT 1
        `);


        if (resultado.rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "No se encontró la configuración."
            });

        }


        res.json({
            ok: true,
            pagina_activa: resultado.rows[0].pagina_activa
        });


    } catch (error) {

        console.error(
            "ERROR OBTENIENDO ESTADO:",
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: "Error obteniendo el estado de la página."
        });

    }

});


// =====================================================
// CAMBIAR ESTADO DE LA PÁGINA
// =====================================================

router.patch("/estado", async (req, res) => {

    try {

        const { pagina_activa } = req.body;


        if (typeof pagina_activa !== "boolean") {

            return res.status(400).json({
                ok: false,
                mensaje: "El estado debe ser true o false."
            });

        }


        const resultado = await pool.query(`
            UPDATE configuracion
            SET pagina_activa = $1
            WHERE id = 1
            RETURNING pagina_activa
        `, [
            pagina_activa
        ]);


        if (resultado.rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "No se encontró la configuración."
            });

        }


        res.json({
            ok: true,
            pagina_activa:
                resultado.rows[0].pagina_activa
        });


    } catch (error) {

        console.error(
            "ERROR CAMBIANDO ESTADO:",
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: "Error cambiando el estado de la página."
        });

    }

});


module.exports = router;