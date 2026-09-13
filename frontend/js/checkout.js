const API_PEDIDOS = "/api/pedidos";
const API_PAGOS = "/api/pagos/crear";

const carrito = JSON.parse(localStorage.getItem("flameCarrito")) || [];

const nombreInput = document.getElementById("nombre");
const telefonoInput = document.getElementById("telefono");
const direccionInput = document.getElementById("direccion");
const comentariosInput = document.getElementById("comentarios");

const confirmarPedidoBtn = document.getElementById("confirmarPedido");
const mensaje = document.getElementById("mensaje");
const resumenProductos = document.getElementById("resumenProductos");
const totalElemento = document.getElementById("total");
const opcionCambio = document.getElementById("opcionCambio");
const campoCambio = document.getElementById("campoCambio");
const cambioInput = document.getElementById("cambio");


// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}


// =====================================================
// MOSTRAR MENSAJE
// =====================================================

function mostrarMensaje(texto, tipo = "error") {
    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.className = "";

    if (tipo) {
        mensaje.classList.add(tipo);
    }
}


// =====================================================
// OBTENER ENTREGA
// =====================================================

function obtenerEntrega() {
    const seleccionado = document.querySelector(
        'input[name="entrega"]:checked'
    );

    return seleccionado ? seleccionado.value : null;
}


// =====================================================
// OBTENER PAGO
// =====================================================

function obtenerPago() {
    const seleccionado = document.querySelector(
        'input[name="pago"]:checked'
    );

    return seleccionado ? seleccionado.value : null;
}
// =====================================================
// ACTUALIZAR OPCIÓN DE CAMBIO
// =====================================================

function actualizarCambio() {

    const pago = obtenerPago();

    // Si no es efectivo, ocultar todo
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

    // Si es efectivo, mostrar "¿Necesitás cambio?"
    if (opcionCambio) {
        opcionCambio.style.display = "block";
    }

    const necesitaCambio =
        document.querySelector(
            'input[name="necesitaCambio"]:checked'
        );

    if (
        necesitaCambio &&
        necesitaCambio.value === "si"
    ) {

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


// =====================================================
// ACTUALIZAR DIRECCIÓN
// =====================================================

function actualizarDireccion() {
    const entrega = obtenerEntrega();

    if (!direccionInput) return;

    if (entrega === "retiro") {

        direccionInput.value = "";
        direccionInput.disabled = true;
        direccionInput.required = false;

        direccionInput.placeholder =
            "No necesaria para retiro";

    } else {

        direccionInput.disabled = false;
        direccionInput.required = true;

        direccionInput.placeholder =
            "Ej: Av. Italia 1234, apto 302";
    }
}


// =====================================================
// LIMPIAR TELÉFONO
// =====================================================

function limpiarTelefono() {

    if (!telefonoInput) return;

    // Solo números
    telefonoInput.value =
        telefonoInput.value.replace(/\D/g, "");

    // Máximo 9 dígitos
    if (telefonoInput.value.length > 9) {

        telefonoInput.value =
            telefonoInput.value.substring(0, 9);
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
    .querySelectorAll('input[name="entrega"]')
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            actualizarDireccion
        );

    });
// =====================================================
// EVENTOS PAGO
// =====================================================

document
    .querySelectorAll('input[name="pago"]')
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            actualizarCambio
        );

    });


document
    .querySelectorAll('input[name="necesitaCambio"]')
    .forEach((radio) => {

        radio.addEventListener(
            "change",
            actualizarCambio
        );

    });

// =====================================================
// VALIDAR DIRECCIÓN
// =====================================================

function validarDireccion(direccion) {

    // Eliminar espacios al principio/final
    direccion = direccion.trim();

    // Mínimo razonable
    if (direccion.length < 5) {
        return false;
    }

    // Debe contener al menos un número
    const tieneNumero = /\d/.test(direccion);

    if (!tieneNumero) {
        return false;
    }

    // Debe contener letras
    const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(
        direccion
    );

    if (!tieneLetras) {
        return false;
    }

    return true;
}


// =====================================================
// RENDERIZAR CARRITO
// =====================================================

function renderizarCarrito() {

    if (!resumenProductos || !totalElemento) {
        return;
    }

    resumenProductos.innerHTML = "";

    if (!carrito.length) {

        resumenProductos.innerHTML = `
            <p class="carrito-vacio">
                Tu carrito está vacío.
            </p>
        `;

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

    totalElemento.textContent =
        `$${total.toFixed(2)}`;
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


    if (nombre.length < 2) {

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


    if (!/^\d{9}$/.test(telefono)) {

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

    if (entrega === "delivery") {

        if (!direccion) {

            mostrarMensaje(
                "Por favor, ingresa tu dirección."
            );

            direccionInput?.focus();

            return false;
        }


        if (!validarDireccion(direccion)) {

            mostrarMensaje(
                "Ingresa una dirección válida con calle y número de puerta. Ej: Av. Italia 1234."
            );

            direccionInput?.focus();

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
// CAMBIO - EFECTIVO
// =================================================

if (pago === "efectivo") {

    const necesitaCambio =
        document.querySelector(
            'input[name="necesitaCambio"]:checked'
        );

    if (!necesitaCambio) {

        mostrarMensaje(
            "Indica si necesitas cambio."
        );

        return false;
    }


    if (necesitaCambio.value === "si") {

        const cambio =
            cambioInput?.value.trim() || "";

        if (!cambio) {

            mostrarMensaje(
                "Indica con cuánto vas a pagar para poder preparar el cambio."
            );

            cambioInput?.focus();

            return false;
        }


        const montoCambio =
            Number(cambio);

        if (
            !Number.isFinite(montoCambio) ||
            montoCambio <= 0
        ) {

            mostrarMensaje(
                "Ingresa un monto válido para el cambio."
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

        // Limpiar mensaje
        mostrarMensaje("", null);


        // Validar
        if (!validarFormulario()) {
            return;
        }


        // Desactivar botón
        if (confirmarPedidoBtn) {

            confirmarPedidoBtn.disabled = true;

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
        let necesitaCambio = false;
let cambio = null;

if (pago === "efectivo") {

    const cambioSeleccionado =
        document.querySelector(
            'input[name="necesitaCambio"]:checked'
        );

    necesitaCambio =
        cambioSeleccionado?.value === "si";

    if (necesitaCambio) {

        cambio =
            Number(cambioInput.value);

    }
}


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

    productos: carrito.map(
        (producto) => ({

            producto_id:
                producto.producto_id,

            cantidad:
                Number(producto.cantidad)

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
            await fetch(API_PEDIDOS, {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(pedido)

            });


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
            JSON.stringify(resultado)
        );


        // =================================================
        // MERCADO PAGO
        // =================================================

        if (pago === "mercado_pago") {

            mostrarMensaje(
                "Generando pago con Mercado Pago...",
                "success"
            );


            console.log(
                "🟡 CREANDO PREFERENCIA DE MERCADO PAGO..."
            );


            const respuestaPago =
                await fetch(API_PAGOS, {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        pedidoId:
                            resultado.id

                    })

                });


            const resultadoPago =
                await respuestaPago.json();


            console.log(
                "🟢 RESPUESTA MERCADO PAGO:",
                resultadoPago
            );


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


            // Guardar pago
            localStorage.setItem(
                "flamePagoActual",
                JSON.stringify(resultadoPago)
            );


            // Vaciar carrito
            localStorage.removeItem(
                "flameCarrito"
            );


            // Ir a Mercado Pago
            window.location.href =
                resultadoPago.initPoint;

            return;
        }


        // =================================================
        // EFECTIVO
        // =================================================

        if (pago === "efectivo") {

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


// =====================================================
// BOTÓN CONFIRMAR
// =====================================================

if (confirmarPedidoBtn) {

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


    // =================================================
    // APROBADO
    // =================================================

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


    // =================================================
    // PENDIENTE
    // =================================================

    if (estado === "pending") {

        mostrarMensaje(
            "El pago está pendiente. Estamos esperando la confirmación de Mercado Pago.",
            "success"
        );

        return;
    }


    // =================================================
    // FALLIDO
    // =================================================

    if (estado === "failure") {

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
