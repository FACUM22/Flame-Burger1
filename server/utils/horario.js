// =====================================================
// HORARIO / DÍA DE LA SEMANA - FLAME BURGER
// =====================================================
// Punto único donde se decide si "hoy" (según la hora de
// Montevideo, sin importar en qué servidor/zona horaria
// esté corriendo Render) es miércoles.
//
// Se usa para:
//   - Apagar automáticamente la página los miércoles
//     (routes/configuracion.js)
//   - Rechazar pedidos nuevos los miércoles
//     (routes/pedidos.js)
// =====================================================

function obtenerDiaEnMontevideo(fecha = new Date()) {

    const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Montevideo",
        weekday: "short"
    }).formatToParts(fecha);

    return partes.find(p => p.type === "weekday")?.value || "";
}

function esMiercolesEnMontevideo(fecha = new Date()) {

    // "en-US" -> "Wed" (evitamos comparar contra "mié",
    // que puede variar según la versión de Node/ICU)
    return obtenerDiaEnMontevideo(fecha) === "Wed";
}

module.exports = {
    obtenerDiaEnMontevideo,
    esMiercolesEnMontevideo
};
