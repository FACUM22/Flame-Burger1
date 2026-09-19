const API_PEDIDOS = "/api/pedidos";
const API_PAGOS = "/api/pagos/crear";

/* =========================================================
   CONFIGURACIÓN DE FLAME BURGER
========================================================= */

// Dirección del local
const DIRECCION_FLAME_BURGER =
    "Av. Gral. San Martín 5306, Montevideo, Uruguay";

// Coordenadas del local.
// IMPORTANTE: verificar estas coordenadas antes de producción.
const FLAME_BURGER_COORDENADAS = {
    lat: -34.8358,
    lon: -56.1627
};

// Reglas de delivery
const DISTANCIA_ENVIO_GRATIS = 3;
const DISTANCIA_MAXIMA_DELIVERY = 6;
const PRECIO_ENVIO = 100;


/* =========================================================
   DATOS DEL CARRITO
========================================================= */

const carrito =
    JSON.parse(localStorage.getItem("flameCarrito")) || [];


/* =========================================================
   ELEMENTOS DEL HTML
========================================================= */

const nombreInput = document.getElementById("nombre");
const telefonoInput = document.getElementById("telefono");
const direccionInput = document.getElementById("direccion");
const comentariosInput = document.getElementById("comentarios");

const confirmarPedidoBtn =
    document.getElementById("confirmarPedido");

const mensaje =
    document.getElementById("mensaje");

const resumenProductos =
    document.getElementById("resumenProductos");

const totalElemento =
    document.getElementById("total");

const opcionCambio =
    document.getElementById("opcionCambio");

const campoCambio =
    document.getElementById("campoCambio");

const cambioInput =
    document.getElementById("cambio");


/* =========================================================
   VARIABLES DELIVERY
========================================================= */

let costoEnvio = 0;
let distanciaDelivery = null;
let calculandoDistancia = false;


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}


/* =========================================================
   MENSAJES
========================================================= */

function mostrarMensaje(texto, tipo = "error") {

    if (!mensaje) return;

    mensaje.textContent = texto;

    mensaje.className = "";

    if (tipo) {
        mensaje.classList.add(tipo);
    }
}


/* =========================================================
   OBTENER FORMA DE ENTREGA
========================================================= */

function obtenerEntrega() {

    const seleccionado =
        document.querySelector(
            'input[name="entrega"]:checked'
        );

    return seleccionado
        ? seleccionado.value
        : null;
}


/* =========================================================
   OBTENER FORMA DE PAGO
========================================================= */

function obtenerPago() {

    const seleccionado =
        document.querySelector(
            'input[name="pago"]:checked'
        );

    return seleccionado
        ? seleccionado.value
        : null;
}


/* =========================================================
   OBTENER SI NECESITA CAMBIO
========================================================= */

function obtenerNecesitaCambio() {

    const seleccionado =
        document.querySelector(
            'input[name="necesitaCambio"]:checked'
        );

    return seleccionado
        ? seleccionado.value
        : "no";
}


/* =========================================================
   OBTENER SUBTOTAL
========================================================= */

function obtenerSubtotal() {

    return carrito.reduce((total, producto) => {

        const precio =
            Number(producto.precio) || 0;

        const cantidad =
            Number(producto.cantidad) || 0;

        return total + precio * cantidad;

    }, 0);
}


/* =========================================================
   OBTENER TOTAL FINAL
========================================================= */

function obtenerTotalFinal() {

    return obtenerSubtotal() + Number(costoEnvio || 0);
}


/* =========================================================
   ACTUALIZAR DIRECCIÓN SEGÚN ENTREGA
========================================================= */

function actualizarDireccion() {

    const entrega = obtenerEntrega();

    if (!direccionInput) return;

    if (entrega === "retiro") {

        direccionInput.value = "";

        direccionInput.disabled = true;

        direccionInput.required = false;

        direccionInput.placeholder =
            "No necesaria para retiro";

        // Resetear delivery
        distanciaDelivery = null;
        costoEnvio = 0;

        actualizarResumenTotal();

    } else {

        direccionInput.disabled = false;

        direccionInput.required = true;

        direccionInput.placeholder =
            "Ej: Av. Italia 1234, apto 302";
    }
}


/* =========================================================
   ACTUALIZAR CAMBIO
========================================================= */

function actualizarCambio() {

    const pago = obtenerPago();

    if (pago !== "efectivo") {

        if (opcionCambio) {
            opcionCambio.style.display = "none";
        }

        if (campoCambio) {
            campoCambio.style.display = "none";
        }

        if (cambioInput) {

            cambioInput.value = "";

            cambioInput.required = false;
        }

        return;
    }

    if (opcionCambio) {
        opcionCambio.style.display = "block";
    }

    const necesitaCambio =
        obtenerNecesitaCambio();

    if (necesitaCambio === "si") {

        if (campoCambio) {
            campoCambio.style.display = "block";
        }

        if (cambioInput) {
            cambioInput.required = true;
        }

    } else {

        if (campoCambio) {
            campoCambio.style.display = "none";
        }

        if (cambioInput) {

            cambioInput.value = "";

            cambioInput.required = false;
        }
    }
}


/* =========================================================
   TELÉFONO
========================================================= */

function limpiarTelefono() {

    if (!telefonoInput) return;

    telefonoInput.value =
        telefonoInput.value.replace(/\D/g, "");

    if (telefonoInput.value.length > 9) {

        telefonoInput.value =
            telefonoInput.value.substring(0, 9);
    }
}


if (telefonoInput) {

    telefonoInput.addEventListener(
        "input",
        limpiarTelefono
    );

    telefonoInput.addEventListener(
        "paste",
        () => {

            setTimeout(() => {

                limpiarTelefono();

            }, 0);

        }
    );
}


/* =========================================================
   EVENTOS ENTREGA
========================================================= */

document
    .querySelectorAll('input[name="entrega"]')
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            async () => {

                actualizarDireccion();

                if (
                    obtenerEntrega() === "delivery" &&
                    direccionInput &&
                    direccionInput.value.trim()
                ) {

                    await calcularEnvio();
                }
            }
        );

    });


/* =========================================================
   EVENTOS PAGO
========================================================= */

document
    .querySelectorAll('input[name="pago"]')
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            actualizarCambio
        );

    });


/* =========================================================
   EVENTOS CAMBIO
========================================================= */

document
    .querySelectorAll('input[name="necesitaCambio"]')
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            actualizarCambio
        );

    });


/* =========================================================
   VALIDAR DIRECCIÓN
========================================================= */

function validarDireccion(direccion) {

    direccion = direccion.trim();

    if (direccion.length < 5) {
        return false;
    }

    const tieneNumero =
        /\d/.test(direccion);

    if (!tieneNumero) {
        return false;
    }

    const tieneLetras =
        /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(direccion);

    if (!tieneLetras) {
        return false;
    }

    return true;
}


/* =========================================================
   RENDERIZAR CARRITO
========================================================= */

function renderizarCarrito() {

    if (!resumenProductos || !totalElemento) {
        return;
    }

    resumenProductos.innerHTML = "";

    if (!carrito.length) {

        resumenProductos.innerHTML =
            `<p class="carrito-vacio">
                Tu carrito está vacío.
            </p>`;

        totalElemento.textContent = "$0";

        return;
    }

    let total = 0;

    carrito.forEach((producto) => {

        const precio =
            Number(producto.precio) || 0;

        const cantidad =
            Number(producto.cantidad) || 0;

        const subtotal =
            precio * cantidad;

        total += subtotal;

        const div =
            document.createElement("div");

        div.className =
            "resumen-producto";

        div.innerHTML = `
            <div>
                <strong>
                    ${escaparHTML(producto.nombre)}
                </strong>

                <span>
                    ${cantidad} × $${precio.toFixed(2)}
                </span>
            </div>

            <strong>
                $${subtotal.toFixed(2)}
            </strong>
        `;

        resumenProductos.appendChild(div);
    });

    actualizarResumenTotal();
}


/* =========================================================
   ACTUALIZAR TOTAL DEL CHECKOUT
========================================================= */

function actualizarResumenTotal() {

    if (!totalElemento) return;

    const subtotal =
        obtenerSubtotal();

    const total =
        obtenerTotalFinal();

    let lineaEnvio =
        document.getElementById(
            "lineaEnvioCheckout"
        );

    if (!lineaEnvio) {

        lineaEnvio =
            document.createElement("div");

        lineaEnvio.id =
            "lineaEnvioCheckout";

        lineaEnvio.className =
            "resumen-envio";

        const linea =
            document.querySelector(
                ".resumen-card .linea"
            );

        if (linea) {

            linea.parentNode.insertBefore(
                lineaEnvio,
                linea
            );
        }
    }

    const entrega =
        obtenerEntrega();

    if (entrega === "retiro") {

        lineaEnvio.innerHTML = `
            <span>Envío</span>
            <strong>$0</strong>
        `;

    } else if (
        distanciaDelivery !== null
    ) {

        if (costoEnvio === 0) {

            lineaEnvio.innerHTML = `
                <span>
                    Envío
                    (${distanciaDelivery.toFixed(2)} km)
                </span>

                <strong>
                    GRATIS
                </strong>
            `;

        } else {

            lineaEnvio.innerHTML = `
                <span>
                    Envío
                    (${distanciaDelivery.toFixed(2)} km)
                </span>

                <strong>
                    $${costoEnvio.toFixed(2)}
                </strong>
            `;
        }

    } else {

        lineaEnvio.innerHTML = `
            <span>Envío</span>
            <strong>--</strong>
        `;
    }

    totalElemento.textContent =
        `$${total.toFixed(2)}`;
}


/* =========================================================
   GEOCODIFICAR DIRECCIÓN DEL CLIENTE
========================================================= */

async function geocodificarDireccion(direccion) {

    const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
            q: `${direccion}, Montevideo, Uruguay`,
            format: "json",
            limit: "1",
            countrycodes: "uy"
        });

    const respuesta =
        await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

    if (!respuesta.ok) {
        throw new Error(
            "No se pudo consultar la dirección."
        );
    }

    const resultados =
        await respuesta.json();

    if (!resultados.length) {

        throw new Error(
            "No se pudo localizar la dirección ingresada."
        );
    }

    return {
        lat: Number(resultados[0].lat),
        lon: Number(resultados[0].lon)
    };
}


/* =========================================================
   CALCULAR DISTANCIA POR CALLES CON OSRM
========================================================= */

async function obtenerDistanciaPorCalles(
    origen,
    destino
) {

    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${origen.lon},${origen.lat};` +
        `${destino.lon},${destino.lat}` +
        `?overview=false`;

    const respuesta =
        await fetch(url);

    if (!respuesta.ok) {

        throw new Error(
            "No se pudo calcular la distancia."
        );
    }

    const datos =
        await respuesta.json();

    if (
        datos.code !== "Ok" ||
        !datos.routes ||
        !datos.routes.length
    ) {

        throw new Error(
            "No se pudo calcular la ruta."
        );
    }

    const distanciaMetros =
        datos.routes[0].distance;

    return distanciaMetros / 1000;
}


/* =========================================================
   CALCULAR ENVÍO
========================================================= */

async function calcularEnvio() {

    const entrega =
        obtenerEntrega();

    if (entrega !== "delivery") {

        distanciaDelivery = null;

        costoEnvio = 0;

        actualizarResumenTotal();

        return true;
    }

    const direccion =
        direccionInput?.value.trim() || "";

    if (!direccion) {

        distanciaDelivery = null;

        costoEnvio = 0;

        actualizarResumenTotal();

        return false;
    }

    if (!validarDireccion(direccion)) {

        mostrarMensaje(
            "Ingresá una dirección válida con calle y número.",
            "error"
        );

        return false;
    }

    if (calculandoDistancia) {
        return false;
    }

    try {

        calculandoDistancia = true;

        if (confirmarPedidoBtn) {

            confirmarPedidoBtn.disabled = true;

            confirmarPedidoBtn.textContent =
                "Calculando envío...";
        }

        mostrarMensaje(
            "Calculando distancia de delivery...",
            "success"
        );

        console.log(
            "📍 Dirección cliente:",
            direccion
        );

        console.log(
            "📍 Local Flame Burger:",
            DIRECCION_FLAME_BURGER
        );

        const destino =
            await geocodificarDireccion(
                direccion
            );

        const origen = {
            lat: FLAME_BURGER_COORDENADAS.lat,
            lon: FLAME_BURGER_COORDENADAS.lon
        };

        console.log(
            "📍 Coordenadas cliente:",
            destino
        );

        console.log(
            "📍 Coordenadas Flame Burger:",
            origen
        );

        const distancia =
            await obtenerDistanciaPorCalles(
                origen,
                destino
            );

        distanciaDelivery =
            Number(distancia.toFixed(2));

        console.log(
            "🚗 Distancia por calles:",
            distanciaDelivery,
            "km"
        );

        if (
            distanciaDelivery <=
            DISTANCIA_ENVIO_GRATIS
        ) {

            costoEnvio = 0;

            mostrarMensaje(
                `Delivery gratis. Estás a ${distanciaDelivery.toFixed(2)} km.`,
                "success"
            );

        } else if (
            distanciaDelivery <=
            DISTANCIA_MAXIMA_DELIVERY
        ) {

            costoEnvio =
                PRECIO_ENVIO;

            mostrarMensaje(
                `El envío cuesta $${PRECIO_ENVIO}. Distancia: ${distanciaDelivery.toFixed(2)} km.`,
                "success"
            );

        } else {

            costoEnvio = 0;

            mostrarMensaje(
                `No realizamos delivery a más de ${DISTANCIA_MAXIMA_DELIVERY} km. La distancia calculada es ${distanciaDelivery.toFixed(2)} km.`
            );

            actualizarResumenTotal();

            return false;
        }

        actualizarResumenTotal();

        return true;

    } catch (error) {

        console.error(
            "❌ ERROR CALCULANDO ENVÍO:",
            error
        );

        distanciaDelivery = null;

        costoEnvio = 0;

        actualizarResumenTotal();

        mostrarMensaje(
            error.message ||
            "No se pudo calcular el costo del envío."
        );

        return false;

    } finally {

        calculandoDistancia = false;

        if (confirmarPedidoBtn) {

            confirmarPedidoBtn.disabled = false;

            confirmarPedidoBtn.textContent =
                "Confirmar pedido";
        }
    }
}


/* =========================================================
   CUANDO TERMINA DE ESCRIBIR LA DIRECCIÓN
========================================================= */

if (direccionInput) {

    direccionInput.addEventListener(
        "blur",
        async () => {

            if (
                obtenerEntrega() ===
                "delivery"
            ) {

                await calcularEnvio();
            }

        }
    );

    direccionInput.addEventListener(
        "change",
        async () => {

            if (
                obtenerEntrega() ===
                "delivery"
            ) {

                await calcularEnvio();
            }

        }
    );
}


/* =========================================================
   VALIDAR FORMULARIO
========================================================= */

function validarFormulario() {

    const nombre =
        nombreInput?.value.trim() || "";

    const telefono =
        telefonoInput?.value.trim() || "";

    const direccion =
        direccionInput?.value.trim() || "";

    const entrega =
        obtenerEntrega();

    const pago =
        obtenerPago();


    /* NOMBRE */

    if (!nombre) {

        mostrarMensaje(
            "Por favor, ingresá tu nombre."
        );

        nombreInput?.focus();

        return false;
    }


    if (nombre.length < 2) {

        mostrarMensaje(
            "El nombre debe tener al menos 2 caracteres."
        );

        nombreInput?.focus();

        return false;
    }


    /* TELÉFONO */

    if (!telefono) {

        mostrarMensaje(
            "Por favor, ingresá tu número de teléfono."
        );

        telefonoInput?.focus();

        return false;
    }


    if (!/^\d{9}$/.test(telefono)) {

        mostrarMensaje(
            "El número de teléfono debe tener exactamente 9 números."
        );

        telefonoInput?.focus();

        return false;
    }


    /* ENTREGA */

    if (!entrega) {

        mostrarMensaje(
            "Seleccioná si querés delivery o retirar el pedido."
        );

        return false;
    }


    /* DELIVERY */

    if (entrega === "delivery") {

        if (!direccion) {

            mostrarMensaje(
                "Por favor, ingresá tu dirección."
            );

            direccionInput?.focus();

            return false;
        }


        if (!validarDireccion(direccion)) {

            mostrarMensaje(
                "Ingresá una dirección válida con calle y número de puerta. Ej: Av. Italia 1234."
            );

            direccionInput?.focus();

            return false;
        }


        if (
            distanciaDelivery === null
        ) {

            mostrarMensaje(
                "Esperá a que se calcule la distancia del delivery."
            );

            return false;
        }


        if (
            distanciaDelivery >
            DISTANCIA_MAXIMA_DELIVERY
        ) {

            mostrarMensaje(
                `No realizamos delivery a más de ${DISTANCIA_MAXIMA_DELIVERY} km.`
            );

            return false;
        }
    }


    /* PAGO */

    if (!pago) {

        mostrarMensaje(
            "Seleccioná una forma de pago."
        );

        return false;
    }


    /* EFECTIVO */

    let necesitaCambio = false;
    let cambio = null;

    if (pago === "efectivo") {

        necesitaCambio =
            obtenerNecesitaCambio() === "si";


        if (necesitaCambio) {

            cambio =
                Number(cambioInput?.value);


            if (
                !Number.isFinite(cambio) ||
                cambio <= 0
            ) {

                mostrarMensaje(
                    "Ingresá con cuánto vas a pagar."
                );

                cambioInput?.focus();

                return false;
            }


            const totalFinal =
                obtenerTotalFinal();


            if (cambio < totalFinal) {

                mostrarMensaje(
                    `El monto ingresado debe ser igual o mayor al total de $${totalFinal.toFixed(2)}.`
                );

                cambioInput?.focus();

                return false;
            }
        }
    }


    /* CARRITO */

    if (!carrito.length) {

        mostrarMensaje(
            "Tu carrito está vacío."
        );

        return false;
    }


    return true;
}


/* =========================================================
   CONFIRMAR PEDIDO
========================================================= */

async function confirmarPedido() {

    try {

        mostrarMensaje(
            "",
            null
        );


        /* -----------------------------------------
           SI ES DELIVERY, CALCULAMOS ANTES
        ----------------------------------------- */

        if (
            obtenerEntrega() ===
            "delivery"
        ) {

            const direccion =
                direccionInput?.value.trim() || "";

            if (!direccion) {

                mostrarMensaje(
                    "Por favor, ingresá tu dirección."
                );

                direccionInput?.focus();

                return;
            }

            if (
                distanciaDelivery === null
            ) {

                const envioCalculado =
                    await calcularEnvio();

                if (!envioCalculado) {
                    return;
                }
            }
        }


        /* -----------------------------------------
           VALIDAR
        ----------------------------------------- */

        if (!validarFormulario()) {
            return;
        }


        /* -----------------------------------------
           DESACTIVAR BOTÓN
        ----------------------------------------- */

        if (confirmarPedidoBtn) {

            confirmarPedidoBtn.disabled =
                true;

            confirmarPedidoBtn.textContent =
                "Procesando...";
        }


        /* -----------------------------------------
           DATOS
        ----------------------------------------- */

        const nombre =
            nombreInput.value.trim();

        const telefono =
            telefonoInput.value.trim();

        const direccion =
            direccionInput.value.trim();

        const comentarios =
            comentariosInput
                ? comentariosInput.value.trim()
                : "";

        const entrega =
            obtenerEntrega();

        const pago =
            obtenerPago();


        const necesitaCambio =
            pago === "efectivo" &&
            obtenerNecesitaCambio() === "si";


        const cambio =
            necesitaCambio
                ? Number(cambioInput.value)
                : null;


        /* -----------------------------------------
           PEDIDO
        ----------------------------------------- */

        const pedido = {

            cliente: {
                nombre,
                telefono,
                direccion,
                comentarios
            },

            entrega,

            pago,

            necesitaCambio,

            cambio,

            costo_envio:
                Number(costoEnvio || 0),

            distancia_delivery:
                distanciaDelivery !== null
                    ? Number(
                        distanciaDelivery.toFixed(2)
                    )
                    : null,

            productos:
                carrito.map((producto) => ({

                    producto_id:
                        producto.producto_id,

                    cantidad:
                        Number(producto.cantidad)

                }))
        };


        console.log(
            "🟡 ENVIANDO PEDIDO:",
            pedido
        );


        /* -----------------------------------------
           CREAR PEDIDO
        ----------------------------------------- */

        const respuesta =
            await fetch(
                API_PEDIDOS,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(pedido)
                }
            );


        const resultado =
            await respuesta.json();


        console.log(
            "🟢 RESPUESTA PEDIDO:",
            resultado
        );


        if (
            !respuesta.ok ||
            !resultado.ok
        ) {

            throw new Error(
                resultado.error ||
                "No se pudo crear el pedido."
            );
        }


        /* -----------------------------------------
           GUARDAR PEDIDO
        ----------------------------------------- */

        localStorage.setItem(
            "flamePedidoActual",
            JSON.stringify(resultado)
        );


        /* =================================================
           MERCADO PAGO
        ================================================= */

        if (pago === "mercado_pago") {

            mostrarMensaje(
                "Generando pago con Mercado Pago...",
                "success"
            );


            const respuestaPago =
                await fetch(
                    API_PAGOS,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                pedidoId:
                                    resultado.id
                            })
                    }
                );


            const resultadoPago =
                await respuestaPago.json();


            if (
                !respuestaPago.ok ||
                !resultadoPago.ok
            ) {

                throw new Error(
                    resultadoPago.error ||
                    "No se pudo generar el pago."
                );
            }


            if (!resultadoPago.initPoint) {

                throw new Error(
                    "Mercado Pago no devolvió el enlace de pago."
                );
            }


            localStorage.setItem(
                "flamePagoActual",
                JSON.stringify(resultadoPago)
            );


            localStorage.removeItem(
                "flameCarrito"
            );


            window.location.href =
                resultadoPago.initPoint;

            return;
        }


        /* =================================================
           EFECTIVO / POS
        ================================================= */

        if (
            pago === "efectivo" ||
            pago === "pos"
        ) {

            localStorage.removeItem(
                "flameCarrito"
            );


            mostrarMensaje(
                `¡Pedido realizado correctamente! Número de pedido: #${resultado.id}`,
                "success"
            );


            if (confirmarPedidoBtn) {

                confirmarPedidoBtn.textContent =
                    "Pedido realizado";
            }


            setTimeout(() => {

                window.location.href = "/";

            }, 4000);


            return;
        }

    } catch (error) {

        console.error(
            "❌ ERROR PEDIDO:",
            error
        );


        mostrarMensaje(
            error.message ||
            "Ocurrió un error al realizar el pedido."
        );


        if (confirmarPedidoBtn) {

            confirmarPedidoBtn.disabled =
                false;

            confirmarPedidoBtn.textContent =
                "Confirmar pedido";
        }
    }
}


/* =========================================================
   BOTÓN CONFIRMAR
========================================================= */

if (confirmarPedidoBtn) {

    confirmarPedidoBtn.addEventListener(
        "click",
        confirmarPedido
    );
}


/* =========================================================
   RESULTADO MERCADO PAGO
========================================================= */

function procesarResultadoMercadoPago() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const estado =
        parametros.get("estado");


    if (!estado) {
        return;
    }


    if (estado === "success") {

        mostrarMensaje(
            "¡Pago aprobado! Tu pedido fue recibido correctamente.",
            "success"
        );

        localStorage.removeItem(
            "flameCarrito"
        );

        return;
    }


    if (estado === "pending") {

        mostrarMensaje(
            "El pago está pendiente. Estamos esperando la confirmación de Mercado Pago.",
            "success"
        );

        return;
    }


    if (estado === "failure") {

        mostrarMensaje(
            "El pago no pudo completarse. Podés intentarlo nuevamente."
        );

        return;
    }
}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

renderizarCarrito();

actualizarDireccion();

actualizarCambio();

procesarResultadoMercadoPago();

actualizarResumenTotal();
