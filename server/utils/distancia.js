// =====================================================
// UTILIDAD: DISTANCIA RECTA (FÓRMULA DE HAVERSINE)
// =====================================================
//
// Calcula la distancia en línea recta (km) entre dos
// puntos geográficos, dados en latitud/longitud.
//
// No es la distancia real de manejo (por calles), es la
// distancia "en línea recta" tal como se pidió.

function gradosARadianes(grados) {
    return (grados * Math.PI) / 180;
}

function calcularDistanciaKm(lat1, lng1, lat2, lng2) {

    const RADIO_TIERRA_KM = 6371;

    const dLat = gradosARadianes(lat2 - lat1);
    const dLng = gradosARadianes(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(gradosARadianes(lat1)) *
            Math.cos(gradosARadianes(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distancia = RADIO_TIERRA_KM * c;

    return Number(distancia.toFixed(2));
}

module.exports = { calcularDistanciaKm };
