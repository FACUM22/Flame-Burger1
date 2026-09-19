const API_PEDIDOS = "/api/pedidos";
const API_PAGOS = "/api/pagos/crear";

const carrito =
    JSON.parse(localStorage.getItem("flameCarrito")) || [];

const nombreInput =
    document.getElementById("nombre");

const telefonoInput =
    document.getElementById("telefono");

const direccionInput =
    document.getElementById("direccion");

const comentariosInput =
    document.getElementById("comentarios");

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


// =====================================================
// CONFIGURACIÓN DELIVERY
// =====================================================

// Dirección del local
const DIRECCION_FLAME_BURGER =
    "Av. Gral. San Martín 5306, Montevideo, Uruguay";

// Límites de distancia
const DISTANCIA_ENVIO_GRATIS = 3;
const DISTANCIA_MAXIMA_DELIVERY = 6;

// Precio del envío entre 3 y 6 km
const PRECIO_ENVIO = 100;


// =====================================================
// VARIABLES DELIVERY
// =====================================================

let costoEnvio = 0;

let distanciaDelivery = null;

let calculandoDistancia = false;


// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto ?? "";

    return div.innerHTML;
}


// =====================================================
// MOSTRAR MENSAJE
// =====================================================

function mostrarMensaje(
    texto,
    tipo = "error"
) {

    if (!mensaje) return;

    mensaje.textContent =
        texto;

    mensaje.className = "";

    if (tipo) {
        mensaje.classList.add(tipo);
    }
}


// =====================================================
// OBTENER ENTREGA
// =====================================================

function obtenerEntrega() {

    const seleccionado =
        document.querySelector(
            'input[name="entrega"]:checked'
        );

    return seleccionado
        ? seleccionado.value
        : null;
}


// =====================================================
// OBTENER PAGO
// =====================================================

function obtenerPago() {

    const seleccionado =
        document.querySelector(
            'input[name="pago"]:checked'
        );

    return seleccionado
        ? seleccionado.value
        : null;
}


// =====================================================
// OBTENER SI NECESITA CAMBIO
// =====================================================

function obtenerNecesitaCambio() {

    const seleccionado =
        document.querySelector(
            'input[name="necesitaCambio"]:checked'
        );

    return seleccionado
        ? seleccionado.value
        : "no";
}


// =====================================================
// ACTUALIZAR DIRECCIÓN
// =====================================================

function actualizarDireccion() {

    const entrega =
        obtenerEntrega();

    if (!direccionInput) return;


    if (entrega === "retiro") {

        direccionInput.value = "";

        direccionInput.disabled = true;

        direccionInput.required = false;

        direccionInput.placeholder =
            "No necesaria para retiro";

        costoEnvio = 0;

        distanciaDelivery = null;

        actualizarResumenTotal();

        mostrarMensaje("", null);

    } else {

        direccionInput.disabled = false;

        direccionInput.required = true;

        direccionInput.placeholder =
            "Ej: Av. Italia 1234, apto 302";

        costoEnvio = 0;

        distanciaDelivery = null;

        actualizarResumenTotal();
    }
}


// =====================================================
// ACTUALIZAR CAMBIO
// =====================================================

function actualizarCambio() {

    const pago =
        obtenerPago();


    // POS y Mercado Pago no necesitan cambio

    if (pago !== "efectivo") {

        if (opcionCambio) {

            opcionCambio.style.display =
                "none";
        }

        if (campoCambio) {

            campoCambio.style.display =
                "none";
        }

        if (cambioInput) {

            cambioInput.value = "";

            cambioInput.required =
                false;
        }

        return;
    }


    // Solo efectivo

    if (opcionCambio) {

        opcionCambio.style.display =
            "block";
    }


    const necesitaCambio =
        obtenerNecesitaCambio();


    if (necesitaCambio === "si") {

        if (campoCambio) {

            campoCambio.style.display =
                "block";
        }

        if (cambioInput) {

            cambioInput.required =
                true;
        }

    } else {

        if (campoCambio) {

            campoCambio.style.display =
                "none";
        }

        if (cambioInput) {

            cambioInput.value = "";

            cambioInput.required =
                false;
        }
    }
}


// =====================================================
// LIMPIAR TELÉFONO
// =====================================================

function limpiarTelefono() {

    if (!telefonoInput) return;

    telefonoInput.value =
        telefonoInput.value.replace(
            /\D/g,
            ""
        );

    if (
        telefonoInput.value.length > 9
    ) {

        telefonoInput.value =
            telefonoInput.value.substring(
                0,
                9
            );
    }
}


// =====================================================
// EVENTO TELÉFONO
// =====================================================

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


// =====================================================
// EVENTOS ENTREGA
// =====================================================

document
    .querySelectorAll(
        'input[name="entrega"]'
    )
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            async () => {

                actualizarDireccion();

                if (
                    obtenerEntrega() ===
                    "delivery"
                ) {

                    await calcularEnvio();
                }

            }
        );

    });


// =====================================================
// EVENTOS PAGO
// =====================================================

document
    .querySelectorAll(
        'input[name="pago"]'
    )
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            actualizarCambio
        );

    });


// =====================================================
// EVENTOS CAMBIO
// =====================================================

document
    .querySelectorAll(
        'input[name="necesitaCambio"]'
    )
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            actualizarCambio
        );

    });


// =====================================================
// VALIDAR DIRECCIÓN
// =====================================================

function validarDireccion(
    direccion
) {

    direccion =
        direccion.trim();

    if (
        direccion.length < 5
    ) {

        return false;
    }

    const tieneNumero =
        /\d/.test(direccion);

    if (!tieneNumero) {

        return false;
    }

    const tieneLetras =
        /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(
            direccion
        );

    if (!tieneLetras) {

        return false;
    }

    return true;
}


// =====================================================
// OBTENER SUBTOTAL
// =====================================================

function obtenerSubtotal() {

    return carrito.reduce(
        (total, producto) => {

            const precio =
                Number(producto.precio) || 0;

            const cantidad =
                Number(producto.cantidad) || 0;

            return total +
                (
                    precio *
                    cantidad
                );

        },
        0
    );
}


// =====================================================
// OBTENER TOTAL FINAL
// =====================================================

function obtenerTotalFinal() {

    return (
        obtenerSubtotal() +
        Number(costoEnvio || 0)
    );
}


// =====================================================
// CREAR LÍNEA DE ENVÍO
// =====================================================

function obtenerLineaEnvio() {

    let linea =
        document.getElementById(
            "lineaEnvioCheckout"
        );

    if (linea) {

        return linea;
    }


    const lineaSeparadora =
        document.createElement("div");

    lineaSeparadora.className =
        "linea";

    lineaSeparadora.id =
        "separadorEnvioCheckout";


    linea =
        document.createElement("div");

    linea.id =
        "lineaEnvioCheckout";

    linea.className =
        "resumen-total";


    if (totalElemento) {

        const contenedor =
            totalElemento.parentElement;

        if (contenedor) {

            contenedor.parentNode.insertBefore(
                lineaSeparadora,
                contenedor
            );

            contenedor.parentNode.insertBefore(
                linea,
                contenedor
            );
        }
    }


    return linea;
}


// =====================================================
// MOSTRAR COSTO ENVÍO
// =====================================================

function actualizarLineaEnvio() {

    const linea =
        obtenerLineaEnvio();

    if (!linea) return;


    const entrega =
        obtenerEntrega();


    if (entrega !== "delivery") {

        linea.innerHTML = `
            <span>
                Envío
            </span>

            <strong>
                $0
            </strong>
        `;

        return;
    }


    if (
        distanciaDelivery === null
    ) {

        linea.innerHTML = `
            <span>
                Envío
            </span>

            <strong>
                —
            </strong>
        `;

        return;
    }


    if (
        distanciaDelivery <=
        DISTANCIA_ENVIO_GRATIS
    ) {

        linea.innerHTML = `
            <span>
                Envío
            </span>

            <strong>
                GRATIS
            </strong>
        `;

        return;
    }


    if (
        distanciaDelivery <=
        DISTANCIA_MAXIMA_DELIVERY
    ) {

        linea.innerHTML = `
            <span>
                Envío
            </span>

            <strong>
                $${PRECIO_ENVIO}
            </strong>
        `;

        return;
    }


    linea.innerHTML = `
        <span>
            Envío
        </span>

        <strong>
            No disponible
        </strong>
    `;
}


// =====================================================
// ACTUALIZAR TOTAL
// =====================================================

function actualizarResumenTotal() {

    const subtotal =
        obtenerSubtotal();

    const total =
        subtotal +
        Number(costoEnvio || 0);


    actualizarLineaEnvio();


    if (totalElemento) {

        totalElemento.textContent =
            `$${total.toFixed(2)}`;
    }
}


// =====================================================
// RENDERIZAR CARRITO
// =====================================================

function renderizarCarrito() {

    if (
        !resumenProductos ||
        !totalElemento
    ) {

        return;
    }


    resumenProductos.innerHTML =
        "";


    if (!carrito.length) {

        resumenProductos.innerHTML = `
            <p class="carrito-vacio">
                Tu carrito está vacío.
            </p>
        `;

        totalElemento.textContent =
            "$0";

        return;
    }


    carrito.forEach(
        (producto) => {

            const precio =
                Number(producto.precio) || 0;

            const cantidad =
                Number(producto.cantidad) || 0;

            const subtotal =
                precio *
                cantidad;


            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "resumen-producto";


            div.innerHTML = `
                <div>

                    <strong>
                        ${escaparHTML(
                            producto.nombre
                        )}
                    </strong>

                    <span>
                        ${cantidad}
                        ×
                        $${precio.toFixed(2)}
                    </span>

                </div>

                <strong>
                    $${subtotal.toFixed(2)}
                </strong>
            `;


            resumenProductos.appendChild(
                div
            );

        }
    );


    actualizarResumenTotal();
}


// =====================================================
// GEOCODIFICAR DIRECCIÓN
// =====================================================

async function geocodificarDireccion(
    direccion
) {

    const consulta =
        `${direccion}, Montevideo, Uruguay`;


    const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json" +
        "&limit=1" +
        "&countrycodes=uy" +
        "&q=" +
        encodeURIComponent(consulta);


    const respuesta =
        await fetch(url, {

            headers: {

                "Accept":
                    "application/json"

            }

        });


    if (!respuesta.ok) {

        throw new Error(
            "No se pudo consultar la dirección."
        );
    }


    const resultados =
        await respuesta.json();


    if (
        !resultados ||
        !resultados.length
    ) {

        throw new Error(
            "No encontramos esa dirección. Revisá la calle y el número."
        );
    }


    return {

        lat:
            Number(
                resultados[0].lat
            ),

        lon:
            Number(
                resultados[0].lon
            )

    };
}


// =====================================================
// OBTENER COORDENADAS FLAME BURGER
// =====================================================

async function obtenerCoordenadasFlameBurger() {

    const consulta =
        DIRECCION_FLAME_BURGER;


    const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json" +
        "&limit=1" +
        "&countrycodes=uy" +
        "&q=" +
        encodeURIComponent(consulta);


    const respuesta =
        await fetch(url, {

            headers: {

                "Accept":
                    "application/json"

            }

        });


    if (!respuesta.ok) {

        throw new Error(
            "No se pudo localizar Flame Burger."
        );
    }


    const resultados =
        await respuesta.json();


    if (
        !resultados ||
        !resultados.length
    ) {

        throw new Error(
            "No se pudo localizar la dirección de Flame Burger."
        );
    }


    return {

        lat:
            Number(
                resultados[0].lat
            ),

        lon:
            Number(
                resultados[0].lon
            )

    };
}


// =====================================================
// CALCULAR DISTANCIA POR CALLES
// =====================================================

async function calcularDistanciaPorCalles(
    origen,
    destino
) {

    const coordenadas =
        `${origen.lon},${origen.lat};` +
        `${destino.lon},${destino.lat}`;


    const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        coordenadas +
        "?overview=false";


    const respuesta =
        await fetch(url);


    if (!respuesta.ok) {

        throw new Error(
            "No se pudo calcular la ruta."
        );
    }


    const resultado =
        await respuesta.json();


    if (
        resultado.code !==
        "Ok" ||
        !resultado.routes ||
        !resultado.routes.length
    ) {

        throw new Error(
            "No se encontró una ruta hasta esa dirección."
        );
    }


    // OSRM devuelve metros
    const metros =
        Number(
            resultado.routes[0].distance
        );


    // Convertir a kilómetros
    const kilometros =
        metros / 1000;


    return kilometros;
}


// =====================================================
// CALCULAR ENVÍO
// =====================================================

async function calcularEnvio() {

    const entrega =
        obtenerEntrega();


    // Retiro = envío gratis

    if (entrega !== "delivery") {

        costoEnvio = 0;

        distanciaDelivery = null;

        actualizarResumenTotal();

        return true;
    }


    const direccion =
        direccionInput?.value.trim() || "";


    if (!direccion) {

        costoEnvio = 0;

        distanciaDelivery = null;

        actualizarResumenTotal();

        return false;
    }


    if (
        !validarDireccion(
            direccion
        )
    ) {

        costoEnvio = 0;

        distanciaDelivery = null;

        actualizarResumenTotal();

        return false;
    }


    if (calculandoDistancia) {

        return false;
    }


    try {

        calculandoDistancia = true;


        if (confirmarPedidoBtn) {

            confirmarPedidoBtn.disabled =
                true;

            confirmarPedidoBtn.textContent =
                "Calculando envío...";
        }


        mostrarMensaje(
            "Calculando distancia hasta tu domicilio...",
            "success"
        );


        // Coordenadas del local

        const origen =
            await obtenerCoordenadasFlameBurger();


        // Coordenadas del cliente

        const destino =
            await geocodificarDireccion(
                direccion
            );


        // Distancia REAL por calles

        const distancia =
            await calcularDistanciaPorCalles(
                origen,
                destino
            );


        distanciaDelivery =
            distancia;


        console.log(
            "📍 Distancia por calles:",
            distanciaDelivery.toFixed(2),
            "km"
        );


        // =============================================
        // MÁS DE 6 KM
        // =============================================

        if (
            distanciaDelivery >
            DISTANCIA_MAXIMA_DELIVERY
        ) {

            costoEnvio = 0;

            actualizarResumenTotal();


            mostrarMensaje(
                `La dirección está a ${distanciaDelivery.toFixed(2)} km de Flame Burger. No realizamos delivery a más de 6 km.`,
                "error"
            );


            return false;
        }


        // =============================================
        // HASTA 3 KM
        // =============================================

        if (
            distanciaDelivery <=
            DISTANCIA_ENVIO_GRATIS
        ) {

            costoEnvio = 0;

            actualizarResumenTotal();


            mostrarMensaje(
                `Estás a ${distanciaDelivery.toFixed(2)} km. ¡El envío es GRATIS!`,
                "success"
            );


            return true;
        }


        // =============================================
        // MÁS DE 3 HASTA 6 KM
        // =============================================

        costoEnvio =
            PRECIO_ENVIO;


        actualizarResumenTotal();


        mostrarMensaje(
            `Estás a ${distanciaDelivery.toFixed(2)} km. El envío tiene un costo de $${PRECIO_ENVIO}.`,
            "success"
        );


        return true;

    } catch (error) {

        console.error(
            "❌ ERROR CALCULANDO ENVÍO:",
            error
        );


        costoEnvio = 0;

        distanciaDelivery = null;

        actualizarResumenTotal();


        mostrarMensaje(
            "No pudimos calcular la distancia de tu dirección. Revisá la dirección e intentá nuevamente."
        );


        return false;

    } finally {

        calculandoDistancia =
            false;


        if (
            confirmarPedidoBtn
        ) {

            confirmarPedidoBtn.disabled =
                false;

            confirmarPedidoBtn.textContent =
                "Confirmar pedido";
        }

    }
}


// =====================================================
// EVENTO AL SALIR DEL CAMPO DIRECCIÓN
// =====================================================

if (direccionInput) {

    direccionInput.addEventListener(
        "blur",
        async () => {

            if (
                obtenerEntrega() !==
                "delivery"
            ) {

                return;
            }


            const direccion =
                direccionInput.value.trim();


            if (!direccion) {

                return;
            }


            if (
                !validarDireccion(
                    direccion
                )
            ) {

                return;
            }


            await calcularEnvio();

        }
    );

}


// =====================================================
// VALIDAR FORMULARIO
// =====================================================

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


    // =================================================
    // NOMBRE
    // =================================================

    if (!nombre) {

        mostrarMensaje(
            "Por favor, ingresa tu nombre."
        );

        nombreInput?.focus();

        return false;
    }


    if (
        nombre.length < 2
    ) {

        mostrarMensaje(
            "El nombre debe tener al menos 2 caracteres."
        );

        nombreInput?.focus();

        return false;
    }


    // =================================================
    // TELÉFONO
    // =================================================

    if (!telefono) {

        mostrarMensaje(
            "Por favor, ingresa tu número de teléfono."
        );

        telefonoInput?.focus();

        return false;
    }


    if (
        !/^\d{9}$/.test(
            telefono
        )
    ) {

        mostrarMensaje(
            "El número de teléfono debe tener exactamente 9 números."
        );

        telefonoInput?.focus();

        return false;
    }


    // =================================================
    // ENTREGA
    // =================================================

    if (!entrega) {

        mostrarMensaje(
            "Selecciona si quieres delivery o retirar el pedido."
        );

        return false;
    }


    // =================================================
    // DIRECCIÓN DELIVERY
    // =================================================

    if (
        entrega === "delivery"
    ) {

        if (!direccion) {

            mostrarMensaje(
                "Por favor, ingresa tu dirección."
            );

            direccionInput?.focus();

            return false;
        }


        if (
            !validarDireccion(
                direccion
            )
        ) {

            mostrarMensaje(
                "Ingresa una dirección válida con calle y número de puerta. Ej: Av. Italia 1234."
            );

            direccionInput?.focus();

            return false;
        }


        // La dirección debe haber sido calculada

        if (
            distanciaDelivery === null
        ) {

            mostrarMensaje(
                "Primero debemos calcular la distancia de tu domicilio."
            );

            return false;
        }


        // Más de 6 km

        if (
            distanciaDelivery >
            DISTANCIA_MAXIMA_DELIVERY
        ) {

            mostrarMensaje(
                "No realizamos delivery a más de 6 km de Flame Burger."
            );

            return false;
        }

    }


    // =================================================
    // PAGO
    // =================================================

    if (!pago) {

        mostrarMensaje(
            "Selecciona una forma de pago."
        );

        return false;
    }


    // =================================================
    // CAMBIO
    // =================================================

    let necesitaCambio =
        false;

    let cambio =
        null;


    if (
        pago === "efectivo"
    ) {

        necesitaCambio =
            obtenerNecesitaCambio() ===
            "si";


        if (necesitaCambio) {

            cambio =
                Number(
                    cambioInput?.value
                );


            if (
                !Number.isFinite(
                    cambio
                ) ||
                cambio <= 0
            ) {

                mostrarMensaje(
                    "Ingresa con cuánto vas a pagar."
                );

                cambioInput?.focus();

                return false;
            }


            // IMPORTANTE:
            // Ahora se usa el total
            // incluyendo envío.

            const totalPedido =
                obtenerTotalFinal();


            if (
                cambio <
                totalPedido
            ) {

                mostrarMensaje(
                    `El monto ingresado debe ser igual o mayor al total de $${totalPedido.toFixed(2)}.`
                );

                cambioInput?.focus();

                return false;
            }

        }

    }


    // =================================================
    // CARRITO
    // =================================================

    if (!carrito.length) {

        mostrarMensaje(
            "Tu carrito está vacío."
        );

        return false;
    }


    return true;
}


// =====================================================
// CONFIRMAR PEDIDO
// =====================================================

async function confirmarPedido() {

    try {

        mostrarMensaje(
            "",
            null
        );


        if (
            !validarFormulario()
        ) {

            return;
        }


        // =================================================
        // VOLVER A CALCULAR DELIVERY
        // =================================================

        if (
            obtenerEntrega() ===
            "delivery"
        ) {

            const envioValido =
                await calcularEnvio();


            if (!envioValido) {

                return;
            }

        }


        // Volver a validar después
        // del cálculo

        if (
            !validarFormulario()
        ) {

            return;
        }


        if (
            confirmarPedidoBtn
        ) {

            confirmarPedidoBtn.disabled =
                true;

            confirmarPedidoBtn.textContent =
                "Procesando...";
        }


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
            obtenerNecesitaCambio() ===
            "si";


        const cambio =
            necesitaCambio
                ? Number(
                    cambioInput.value
                )
                : null;


        // =================================================
        // PREPARAR PEDIDO
        // =================================================

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

            // Envío

            costo_envio:
                Number(costoEnvio || 0),

            distancia_delivery:
                distanciaDelivery !== null
                    ? Number(
                        distanciaDelivery.toFixed(2)
                    )
                    : null,

            productos:
                carrito.map(
                    (producto) => ({

                        producto_id:
                            producto.producto_id,

                        cantidad:
                            Number(
                                producto.cantidad
                            )

                    })
                )

        };


        console.log(
            "🟡 ENVIANDO PEDIDO:",
            pedido
        );


        // =================================================
        // CREAR PEDIDO
        // =================================================

        const respuesta =
            await fetch(
                API_PEDIDOS,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            pedido
                        )

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


        // =================================================
        // GUARDAR PEDIDO ACTUAL
        // =================================================

        localStorage.setItem(
            "flamePedidoActual",
            JSON.stringify(
                resultado
            )
        );


        // =================================================
        // MERCADO PAGO
        // =================================================

        if (
            pago ===
            "mercado_pago"
        ) {

            mostrarMensaje(
                "Generando pago con Mercado Pago...",
                "success"
            );


            const respuestaPago =
                await fetch(
                    API_PAGOS,
                    {

                        method:
                            "POST",

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


            if (
                !resultadoPago.initPoint
            ) {

                throw new Error(
                    "Mercado Pago no devolvió el enlace de pago."
                );
            }


            localStorage.setItem(
                "flamePagoActual",
                JSON.stringify(
                    resultadoPago
                )
            );


            localStorage.removeItem(
                "flameCarrito"
            );


            window.location.href =
                resultadoPago.initPoint;


            return;
        }


        // =================================================
        // EFECTIVO / POS
        // =================================================

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


            if (
                confirmarPedidoBtn
            ) {

                confirmarPedidoBtn.textContent =
                    "Pedido realizado";
            }


            setTimeout(
                () => {

                    window.location.href =
                        "/";

                },
                4000
            );


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


        if (
            confirmarPedidoBtn
        ) {

            confirmarPedidoBtn.disabled =
                false;

            confirmarPedidoBtn.textContent =
                "Confirmar pedido";
        }

    }

}


// =====================================================
// BOTÓN CONFIRMAR
// =====================================================

if (
    confirmarPedidoBtn
) {

    confirmarPedidoBtn.addEventListener(
        "click",
        confirmarPedido
    );

}


// =====================================================
// RESULTADO MERCADO PAGO
// =====================================================

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


    if (
        estado ===
        "success"
    ) {

        mostrarMensaje(
            "¡Pago aprobado! Tu pedido fue recibido correctamente.",
            "success"
        );


        localStorage.removeItem(
            "flameCarrito"
        );


        return;
    }


    if (
        estado ===
        "pending"
    ) {

        mostrarMensaje(
            "El pago está pendiente. Estamos esperando la confirmación de Mercado Pago.",
            "success"
        );


        return;
    }


    if (
        estado ===
        "failure"
    ) {

        mostrarMensaje(
            "El pago no pudo completarse. Puedes intentarlo nuevamente."
        );


        return;
    }

}


// =====================================================
// INICIO
// =====================================================

renderizarCarrito();

actualizarDireccion();

actualizarCambio();

procesarResultadoMercadoPago();
