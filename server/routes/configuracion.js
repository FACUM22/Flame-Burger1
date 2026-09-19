const express = require("express");

const router = express.Router();

const pool = require("../database");
const { esMiercolesEnMontevideo } = require("../utils/horario");


// =====================================================
// OBTENER ESTADO DE LA PÁGINA
// =====================================================
// La página se apaga AUTOMÁTICAMENTE todos los miércoles
// (hora de Montevideo), sin importar lo que diga la base
// de datos. El resto de los días, manda el valor que el
// local haya elegido manualmente desde el panel.
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


        const cerradoPorHorario = esMiercolesEnMontevideo();

        const paginaActivaManual =
            resultado.rows[0].pagina_activa;

        const paginaActivaEfectiva =
            cerradoPorHorario
                ? false
                : paginaActivaManual;


        res.json({
            ok: true,
            pagina_activa: paginaActivaEfectiva,
            pagina_activa_manual: paginaActivaManual,
            cerrado_por_horario: cerradoPorHorario
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
// El local puede prender/apagar la página a mano cualquier
// día... excepto los miércoles, que quedan cerrados sí o sí.
// Guardamos igual la preferencia manual para que, al llegar
// el jueves, la página vuelva sola al estado que dejaron.
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


        if (pagina_activa === true && esMiercolesEnMontevideo()) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Los miércoles Flame Burger permanece cerrado automáticamente. La página vuelve a encenderse sola a partir del jueves."
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
                resultado.rows[0].pagina_activa,
            cerrado_por_horario: false
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
