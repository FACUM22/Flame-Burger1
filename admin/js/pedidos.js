// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_PEDIDOS = "/api/pedidos";

let pedidos = [];
let filtroActual = "todos";

// =====================================================
// CARGAR PEDIDOS
// =====================================================

async function cargarPedidos() {

    try {

        const respuesta = await fetch(
            API_PEDIDOS,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        const datos = await respuesta.json();

        console.log(
            "RESPUESTA API PEDIDOS:",
            datos
        );

        if (Array.isArray(datos)) {

            pedidos = datos;

        } else if (
            datos &&
            Array.isArray(datos.pedidos)
        ) {

            pedidos = datos.pedidos;

        } else {

            pedidos = [];
        }

        actualizarContador();
        renderizarPedidos();

    } catch (error) {

        console.error(
            "ERROR PEDIDOS:",
            error
        );

    }

}

// =====================================================
// CONTADOR DE PEDIDOS NUEVOS
// =====================================================

function actualizarContador() {

    const contador =
        document.getElementById(
            "pedidosNuevos"
        );

    if (!contador) {
        return;
    }

    const nuevos =
        pedidos.filter(
            pedido =>
                pedido.estado === "nuevo"
        ).length;

    contador.textContent =
        `${nuevos} ${nuevos === 1 ? "pedido" : "pedidos"} nuevo${nuevos === 1 ? "" : "s"}`;
}

// =====================================================
// RENDERIZAR PEDIDOS
// =====================================================

function renderizarPedidos() {

    const contenedor =
        document.getElementById(
            "ordersList"
        );

    if (!contenedor) {

        console.error(
            "No existe el elemento #ordersList en pedidos.html"
        );

        return;
    }

    let pedidosFiltrados =
        [...pedidos];

    if (
        filtroActual !== "todos"
    ) {

        pedidosFiltrados =
            pedidos.filter(
                pedido =>
                    pedido.estado ===
                    filtroActual
            );
    }

    if (
        pedidosFiltrados.length === 0
    ) {

        contenedor.innerHTML = `
            <div class="empty-orders">

                <div class="empty-icon">
                    🛒
                </div>

                <strong>
                    No hay pedidos
                </strong>

                <p>
                    No hay pedidos para este filtro.
                </p>

            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        pedidosFiltrados
            .map(
                pedido =>
                    crearPedidoHTML(
                        pedido
                    )
            )
            .join("");
}

// =====================================================
// CREAR HTML DE PEDIDO
// =====================================================

function crearPedidoHTML(pedido) {

    const estado =
        pedido.estado || "nuevo";

    const claseNuevo =
        estado === "nuevo"
            ? "new-order"
            : "";

    const etiquetaNuevo =
        estado === "nuevo"
            ? `
                <div class="new-label">
                    NUEVO PEDIDO
                </div>
            `
            : "";

    const productos =
        Array.isArray(
            pedido.detalles
        )
            ? pedido.detalles
            : Array.isArray(
                pedido.productos
            )
                ? pedido.productos
                : [];

    const productosHTML =
        productos.length > 0
            ? productos
                .map(
                    producto => {

                        const cantidad =
                            Number(
                                producto.cantidad || 1
                            );

                        const nombre =
                            producto.nombre ||
                            producto.producto_nombre ||
                            "Producto";

                        const precio =
                            Number(
                                producto.precio ||
                                producto.precio_unitario ||
                                0
                            );

                        const subtotal =
                            cantidad * precio;

                        return `
                            <div class="order-product">

                                <div>

                                    <strong>
                                        ${escaparHTML(nombre)}
                                    </strong>

                                    <small>
                                        ${cantidad} x $${precio.toLocaleString("es-UY")}
                                    </small>

                                </div>

                                <strong>
                                    $${subtotal.toLocaleString("es-UY")}
                                </strong>

                            </div>
                        `;
                    }
                )
                .join("")
            : `
                <div class="order-product">
                    <strong>
                        Sin productos
                    </strong>
                </div>
            `;

    const tipoEntrega =
        pedido.tipo_entrega ||
        pedido.tipoEntrega ||
        "retiro";

    const costoEnvio =
        Number(
            pedido.costo_envio || 0
        );

    const distancia =
        pedido.distancia_delivery !== null &&
        pedido.distancia_delivery !== undefined
            ? Number(
                pedido.distancia_delivery
            )
            : null;

    let informacionDelivery = "";

    if (
        tipoEntrega === "delivery"
    ) {

        informacionDelivery = `
            <div class="order-info">

                <span>
                    DELIVERY
                </span>

                <strong>
                    ${
                        distancia !== null
                            ? `${distancia.toFixed(2)} km`
                            : "Distancia no disponible"
                    }
                </strong>

                <small>
                    Envío:
                    ${
                        costoEnvio === 0
                            ? "GRATIS"
                            : `$${costoEnvio.toLocaleString("es-UY")}`
                    }
                </small>

            </div>
        `;

    } else {

        informacionDelivery = `
            <div class="order-info">

                <span>
                    ENTREGA
                </span>

                <strong>
                    Retira en local
                </strong>

                <small>
                    Sin costo
                </small>

            </div>
        `;
    }

    const metodoPago =
        pedido.forma_pago ||
        pedido.metodo_pago ||
        "No especificado";

    const cambio =
        pedido.cambio;

    let informacionCambio = "";

    if (
        metodoPago === "efectivo" &&
        cambio !== null &&
        cambio !== undefined &&
        cambio !== ""
    ) {

        informacionCambio = `
            <div class="order-info">

                <span>
                    CAMBIO
                </span>

                <strong>
                    $${Number(cambio).toLocaleString("es-UY")}
                </strong>

            </div>
        `;
    }

    const observacion =
        pedido.observacion ||
        pedido.observaciones ||
        "";

    const cliente =
        pedido.nombre ||
        pedido.cliente_nombre ||
        pedido.nombre_cliente ||
        "Sin nombre";

    const telefono =
        pedido.telefono ||
        pedido.cliente_telefono ||
        "Sin teléfono";

    const direccion =
        pedido.direccion ||
        pedido.cliente_direccion ||
        "Sin dirección";

    const total =
        Number(
            pedido.total || 0
        );

    return `
        <article
            class="order-card ${claseNuevo}"
        >

            <div class="order-top">

                <div>

                    <div class="order-number">
                        PEDIDO #${pedido.id}
                    </div>

                    <div class="order-date">
                        ${formatearFecha(pedido.fecha)}
                    </div>

                    ${etiquetaNuevo}

                </div>

                <div
                    class="order-status status-${estado}"
                >
                    ${formatearEstado(estado)}
                </div>

            </div>


            <div class="order-info-grid">

                <div class="order-info">

                    <span>
                        CLIENTE
                    </span>

                    <strong>
                        ${escaparHTML(cliente)}
                    </strong>

                </div>


                <div class="order-info">

                    <span>
                        TELÉFONO
                    </span>

                    <strong>
                        ${escaparHTML(telefono)}
                    </strong>

                </div>


                <div class="order-info">

                    <span>
                        DIRECCIÓN
                    </span>

                    <strong>
                        ${escaparHTML(direccion)}
                    </strong>

                </div>


                <div class="order-info">

                    <span>
                        FORMA DE PAGO
                    </span>

                    <strong>
                        ${formatearPago(metodoPago)}
                    </strong>

                </div>


                ${informacionDelivery}


                ${informacionCambio}

            </div>


            <div class="order-products">

                ${productosHTML}

            </div>


            ${
                observacion
                    ? `
                        <div class="order-observation">

                            <strong>
                                Observación:
                            </strong>

                            ${escaparHTML(observacion)}

                        </div>
                    `
                    : ""
            }


            <div class="order-bottom">

                <div>

                    <div class="order-total-label">
                        TOTAL
                    </div>

                    <div class="order-total">
                        $${total.toLocaleString("es-UY")}
                    </div>

                </div>


                <div class="order-actions">

                    ${crearBotonesEstado(pedido)}

                    <button
                        type="button"
                        onclick="verPedido(${pedido.id})"
                    >
                        VER
                    </button>

                    <button
                        type="button"
                        onclick="imprimirPedido(${pedido.id})"
                    >
                        IMPRIMIR
                    </button>

                </div>

            </div>

        </article>
    `;
}

// =====================================================
// BOTONES SEGÚN ESTADO
// =====================================================

function crearBotonesEstado(pedido) {

    const estado =
        pedido.estado;

    let botones = "";

    if (
        estado === "nuevo"
    ) {

        botones += `
            <button
                type="button"
                class="btn-preparing"
                onclick="cambiarEstado(${pedido.id}, 'preparando')"
            >
                COMENZAR A PREPARAR
            </button>
        `;

    }

    if (
        estado === "preparando"
    ) {

        botones += `
            <button
                type="button"
                class="btn-ready"
                onclick="cambiarEstado(${pedido.id}, 'listo')"
            >
                MARCAR LISTO
            </button>
        `;

    }

    if (
        estado === "listo"
    ) {

        botones += `
            <button
                type="button"
                class="btn-delivered"
                onclick="cambiarEstado(${pedido.id}, 'entregado')"
            >
                ENTREGADO
            </button>
        `;

    }

    if (
        estado !== "cancelado" &&
        estado !== "entregado"
    ) {

        botones += `
            <button
                type="button"
                class="btn-cancel"
                onclick="cancelarPedido(${pedido.id})"
            >
                CANCELAR
            </button>
        `;

    }

    return botones;
}

// =====================================================
// CAMBIAR ESTADO
// =====================================================

async function cambiarEstado(
    id,
    estado
) {

    try {

        const respuesta =
            await fetch(
                `${API_PEDIDOS}/${id}/estado`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        estado
                    })
                }
            );

        const datos =
            await respuesta.json();

        if (
            !respuesta.ok
        ) {

            throw new Error(
                datos.error ||
                "No se pudo cambiar el estado."
            );
        }

        await cargarPedidos();

    } catch (error) {

        console.error(
            "ERROR CAMBIANDO ESTADO:",
            error
        );

        alert(
            error.message
        );
    }
}

// =====================================================
// CANCELAR PEDIDO
// =====================================================

async function cancelarPedido(id) {

    const confirmar =
        confirm(
            `¿Seguro que querés cancelar el pedido #${id}?`
        );

    if (!confirmar) {
        return;
    }

    try {

        const respuesta =
            await fetch(
                `${API_PEDIDOS}/${id}/cancelar`,
                {
                    method: "PATCH"
                }
            );

        const datos =
            await respuesta.json();

        if (
            !respuesta.ok
        ) {

            throw new Error(
                datos.error ||
                "No se pudo cancelar el pedido."
            );
        }

        await cargarPedidos();

    } catch (error) {

        console.error(
            "ERROR CANCELANDO PEDIDO:",
            error
        );

        alert(
            error.message
        );
    }
}

// =====================================================
// VER PEDIDO
// =====================================================

function verPedido(id) {

    const pedido =
        pedidos.find(
            p =>
                Number(p.id) ===
                Number(id)
        );

    if (!pedido) {

        alert(
            "No se encontró el pedido."
        );

        return;
    }

    const productos =
        Array.isArray(
            pedido.detalles
        )
            ? pedido.detalles
            : Array.isArray(
                pedido.productos
            )
                ? pedido.productos
                : [];

    let texto =
        `PEDIDO #${pedido.id}\n\n`;

    texto +=
        `Cliente: ${
            pedido.nombre ||
            pedido.cliente_nombre ||
            "Sin nombre"
        }\n`;

    texto +=
        `Teléfono: ${
            pedido.telefono ||
            "Sin teléfono"
        }\n`;

    texto +=
        `Dirección: ${
            pedido.direccion ||
            "Sin dirección"
        }\n`;

    texto +=
        `Pago: ${
            formatearPago(
                pedido.forma_pago ||
                pedido.metodo_pago
            )
        }\n`;

    texto +=
        `Entrega: ${
            pedido.tipo_entrega === "delivery"
                ? "Delivery"
                : "Retira en local"
        }\n`;

    if (
        pedido.tipo_entrega ===
        "delivery"
    ) {

        const distancia =
            pedido.distancia_delivery != null
                ? Number(
                    pedido.distancia_delivery
                ).toFixed(2)
                : "-";

        const envio =
            Number(
                pedido.costo_envio || 0
            );

        texto +=
            `Distancia: ${distancia} km\n`;

        texto +=
            `Envío: ${
                envio === 0
                    ? "GRATIS"
                    : `$${envio.toLocaleString("es-UY")}`
            }\n`;
    }

    if (
        pedido.cambio !== null &&
        pedido.cambio !== undefined &&
        pedido.cambio !== ""
    ) {

        texto +=
            `Cambio: $${Number(
                pedido.cambio
            ).toLocaleString("es-UY")}\n`;
    }

    texto +=
        `\nPRODUCTOS\n`;

    productos.forEach(
        producto => {

            const cantidad =
                Number(
                    producto.cantidad || 1
                );

            const nombre =
                producto.nombre ||
                producto.producto_nombre ||
                "Producto";

            texto +=
                `${cantidad} x ${nombre}\n`;
        }
    );

    texto +=
        `\nTOTAL: $${Number(
            pedido.total || 0
        ).toLocaleString("es-UY")}`;

    alert(
        texto
    );
}

// =====================================================
// IMPRIMIR PEDIDO
// =====================================================

function imprimirPedido(id) {

    const pedido =
        pedidos.find(
            p =>
                Number(p.id) ===
                Number(id)
        );

    if (!pedido) {

        alert(
            "No se encontró el pedido."
        );

        return;
    }

    const productos =
        Array.isArray(
            pedido.detalles
        )
            ? pedido.detalles
            : Array.isArray(
                pedido.productos
            )
                ? pedido.productos
                : [];

    const productosHTML =
        productos
            .map(
                producto => {

                    const cantidad =
                        Number(
                            producto.cantidad || 1
                        );

                    const nombre =
                        producto.nombre ||
                        producto.producto_nombre ||
                        "Producto";

                    const precio =
                        Number(
                            producto.precio ||
                            producto.precio_unitario ||
                            0
                        );

                    const subtotal =
                        cantidad * precio;

                    return `
                        <tr>

                            <td>
                                ${cantidad}x
                            </td>

                            <td>
                                ${escaparHTML(nombre)}
                            </td>

                            <td
                                style="text-align:right"
                            >
                                $${subtotal.toLocaleString("es-UY")}
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");

    const tipoEntrega =
        pedido.tipo_entrega ||
        "retiro";

    const costoEnvio =
        Number(
            pedido.costo_envio || 0
        );

    const distancia =
        pedido.distancia_delivery != null
            ? Number(
                pedido.distancia_delivery
            ).toFixed(2)
            : null;

    let deliveryHTML = "";

    if (
        tipoEntrega === "delivery"
    ) {

        deliveryHTML = `
            <div>

                <strong>
                    DELIVERY
                </strong>

                <br>

                Distancia:
                ${
                    distancia !== null
                        ? `${distancia} km`
                        : "-"
                }

                <br>

                Envío:
                ${
                    costoEnvio === 0
                        ? "GRATIS"
                        : `$${costoEnvio.toLocaleString("es-UY")}`
                }

            </div>
        `;

    } else {

        deliveryHTML = `
            <div>
                <strong>
                    RETIRA EN LOCAL
                </strong>
            </div>
        `;
    }

    let cambioHTML = "";

    if (
        pedido.cambio !== null &&
        pedido.cambio !== undefined &&
        pedido.cambio !== ""
    ) {

        cambioHTML = `
            <div>
                Cambio:
                $${Number(
                    pedido.cambio
                ).toLocaleString("es-UY")}
            </div>
        `;
    }

    const ventana =
        window.open(
            "",
            "_blank",
            "width=400,height=700"
        );

    if (!ventana) {

        alert(
            "El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes."
        );

        return;
    }

    ventana.document.write(`
        <!DOCTYPE html>

        <html lang="es">

        <head>

            <meta charset="UTF-8">

            <title>
                Pedido #${pedido.id}
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    width: 80mm;
                    margin: 0;
                    padding: 5mm;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    color: #000;
                }

                h1 {
                    text-align: center;
                    font-size: 20px;
                    margin: 0 0 5px;
                }

                .center {
                    text-align: center;
                }

                .linea {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }

                .dato {
                    margin: 4px 0;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 8px;
                }

                td {
                    padding: 3px 0;
                    vertical-align: top;
                }

                .total {
                    font-size: 18px;
                    font-weight: bold;
                    text-align: right;
                    margin-top: 10px;
                }

                .observacion {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed #000;
                }

                @media print {

                    body {
                        width: 80mm;
                    }

                }

            </style>

        </head>

        <body>

            <h1>
                FLAME BURGER
            </h1>

            <div class="center">
                PEDIDO #${pedido.id}
            </div>

            <div class="linea"></div>

            <div class="dato">
                <strong>Cliente:</strong>
                ${escaparHTML(
                    pedido.nombre ||
                    pedido.cliente_nombre ||
                    "Sin nombre"
                )}
            </div>

            <div class="dato">
                <strong>Teléfono:</strong>
                ${escaparHTML(
                    pedido.telefono ||
                    "Sin teléfono"
                )}
            </div>

            <div class="dato">
                <strong>Dirección:</strong>
                ${escaparHTML(
                    pedido.direccion ||
                    "Sin dirección"
                )}
            </div>

            <div class="dato">
                <strong>Pago:</strong>
                ${formatearPago(
                    pedido.forma_pago ||
                    pedido.metodo_pago
                )}
            </div>

            <div class="linea"></div>

            ${deliveryHTML}

            ${cambioHTML}

            <div class="linea"></div>

            <table>

                ${productosHTML}

            </table>

            <div class="linea"></div>

            <div class="total">
                TOTAL:
                $${Number(
                    pedido.total || 0
                ).toLocaleString("es-UY")}
            </div>

            ${
                pedido.observacion
                    ? `
                        <div class="observacion">
                            <strong>
                                Observación:
                            </strong>

                            ${escaparHTML(
                                pedido.observacion
                            )}
                        </div>
                    `
                    : ""
            }

            <div class="linea"></div>

            <div class="center">
                Gracias por tu compra
            </div>

        </body>

        </html>
    `);

    ventana.document.close();

    setTimeout(
        () => {

            ventana.focus();

            ventana.print();

        },
        500
    );
}

// =====================================================
// FILTROS
// =====================================================

function configurarFiltros() {

    const botones =
        document.querySelectorAll(
            ".order-filter"
        );

    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    botones.forEach(
                        otroBoton => {

                            otroBoton.classList.remove(
                                "active"
                            );

                        }
                    );

                    boton.classList.add(
                        "active"
                    );

                    filtroActual =
                        boton.dataset.filter ||
                        "todos";

                    renderizarPedidos();

                }
            );

        }
    );
}

// =====================================================
// FORMATEAR ESTADO
// =====================================================

function formatearEstado(estado) {

    const estados = {

        en_proceso_pago:
            "Esperando pago",

        nuevo:
            "Nuevo",

        confirmado:
            "Confirmado",

        preparando:
            "Preparando",

        listo:
            "Listo",

        entregado:
            "Entregado",

        cancelado:
            "Cancelado"

    };

    return (
        estados[estado] ||
        estado ||
        "Desconocido"
    );
}

// =====================================================
// FORMATEAR PAGO
// =====================================================

function formatearPago(pago) {

    const pagos = {

        efectivo:
            "Efectivo",

        mercado_pago:
            "Mercado Pago",

        tarjeta:
            "Tarjeta",

        transferencia:
            "Transferencia"

    };

    return (
        pagos[pago] ||
        pago ||
        "No especificado"
    );
}

// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "-";
    }

    const fechaObjeto =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {

        return "-";
    }

    return fechaObjeto.toLocaleString(
        "es-UY",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";
    }

    return String(valor)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

// =====================================================
// INICIAR
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarFiltros();

        cargarPedidos();

        setInterval(
            cargarPedidos,
            10000
        );

    }
);
