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
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        const datos = await respuesta.json();

        /*
         * El backend puede devolver:
         *
         * [
         *   {...},
         *   {...}
         * ]
         *
         * o:
         *
         * {
         *   ok: true,
         *   pedidos: [...]
         * }
         */

        if (Array.isArray(datos)) {

            pedidos = datos;

        } else if (
            datos &&
            Array.isArray(datos.pedidos)
        ) {

            pedidos = datos.pedidos;

        } else {

            console.error(
                "La API no devolvió un array de pedidos:",
                datos
            );

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
// CONTADOR PEDIDOS NUEVOS
// =====================================================

function actualizarContador() {

    const contador =
        document.getElementById(
            "pedidosNuevos"
        );

    if (!contador) {
        return;
    }

    const nuevos = pedidos.filter(
        pedido =>
            pedido.estado === "nuevo"
    ).length;

    contador.textContent =
        `${nuevos} ${
            nuevos === 1
                ? "pedido nuevo"
                : "pedidos nuevos"
        }`;

}

// =====================================================
// RENDERIZAR PEDIDOS
// =====================================================

function renderizarPedidos() {

    const lista =
        document.getElementById(
            "listaPedidos"
        );

    if (!lista) {

        console.error(
            "No existe el elemento #listaPedidos en pedidos.html"
        );

        return;

    }

    let pedidosFiltrados = pedidos;

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

        lista.innerHTML = `
            <div class="sin-pedidos">

                <p>
                    No hay pedidos para mostrar.
                </p>

            </div>
        `;

        return;

    }

    lista.innerHTML =
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
// CREAR HTML DEL PEDIDO
// =====================================================

function crearPedidoHTML(
    pedido
) {

    const productos =
        Array.isArray(
            pedido.productos
        )
            ? pedido.productos
            : [];

    const productosHTML =
        productos
            .map(
                producto => {

                    return `
                        <div
                            class="producto-pedido"
                        >

                            <div>

                                <strong>
                                    ${producto.cantidad}x
                                    ${producto.nombre}
                                </strong>

                            </div>

                            <div>

                                $${Number(
                                    producto.subtotal || 0
                                ).toLocaleString(
                                    "es-UY"
                                )}

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

    // =================================================
    // INFORMACIÓN DE DELIVERY
    // =================================================

    let informacionDelivery = "";

    if (
        pedido.tipo_entrega ===
        "delivery"
    ) {

        const costoEnvio =
            Number(
                pedido.costo_envio || 0
            );

        const distancia =
            pedido.distancia_delivery !==
                null &&
            pedido.distancia_delivery !==
                undefined
                ? Number(
                    pedido.distancia_delivery
                )
                : null;

        informacionDelivery = `
            <div
                class="pedido-delivery"
                style="
                    margin-top:10px;
                    padding:10px;
                    border:1px solid #ddd;
                    border-radius:8px;
                "
            >

                <p>
                    <strong>
                        DELIVERY
                    </strong>
                </p>

                ${
                    distancia !== null
                        ? `
                            <p>
                                <strong>
                                    Distancia:
                                </strong>

                                ${distancia.toFixed(2)}
                                km
                            </p>
                        `
                        : ""
                }

                <p>
                    <strong>
                        Envío:
                    </strong>

                    ${
                        costoEnvio === 0
                            ? "GRATIS"
                            : `$${costoEnvio.toLocaleString(
                                "es-UY"
                            )}`
                    }

                </p>

            </div>
        `;

    }

    // =================================================
    // CAMBIO EN EFECTIVO
    // =================================================

    let informacionCambio = "";

    if (
        pedido.metodo_pago ===
            "efectivo" &&
        pedido.cambio !== null &&
        pedido.cambio !== undefined &&
        pedido.cambio !== ""
    ) {

        informacionCambio = `
            <p>

                <strong>
                    Cambio para:
                </strong>

                $${Number(
                    pedido.cambio
                ).toLocaleString(
                    "es-UY"
                )}

            </p>
        `;

    }

    return `
        <div
            class="pedido-card"
            data-id="${pedido.id}"
        >

            <!-- =============================== -->
            <!-- CABECERA -->
            <!-- =============================== -->

            <div
                class="pedido-header"
            >

                <div>

                    <h3>
                        Pedido #${pedido.id}
                    </h3>

                    <span
                        class="pedido-fecha"
                    >
                        ${formatearFecha(
                            pedido.fecha
                        )}
                    </span>

                </div>

                <span
                    class="estado estado-${pedido.estado}"
                >
                    ${formatearEstado(
                        pedido.estado
                    )}
                </span>

            </div>


            <!-- =============================== -->
            <!-- CLIENTE -->
            <!-- =============================== -->

            <div
                class="pedido-cliente"
            >

                <p>

                    <strong>
                        Cliente:
                    </strong>

                    ${pedido.nombre || "-"}

                </p>

                <p>

                    <strong>
                        Teléfono:
                    </strong>

                    ${pedido.telefono || "-"}

                </p>

                ${
                    pedido.tipo_entrega ===
                    "delivery"
                        ? `
                            <p>

                                <strong>
                                    Dirección:
                                </strong>

                                ${pedido.direccion || "-"}

                            </p>
                        `
                        : `
                            <p>

                                <strong>
                                    Entrega:
                                </strong>

                                Retira en local

                            </p>
                        `
                }

                ${informacionDelivery}

            </div>


            <!-- =============================== -->
            <!-- PRODUCTOS -->
            <!-- =============================== -->

            <div
                class="pedido-productos"
            >

                <h4>
                    Productos
                </h4>

                ${productosHTML}

            </div>


            <!-- =============================== -->
            <!-- PAGO -->
            <!-- =============================== -->

            <div
                class="pedido-pago"
            >

                <p>

                    <strong>
                        Forma de pago:
                    </strong>

                    ${formatearPago(
                        pedido.metodo_pago
                    )}

                </p>

                ${informacionCambio}

            </div>


            <!-- =============================== -->
            <!-- TOTAL -->
            <!-- =============================== -->

            <div
                class="pedido-total"
            >

                <strong>
                    TOTAL
                </strong>

                <span>

                    $${Number(
                        pedido.total || 0
                    ).toLocaleString(
                        "es-UY"
                    )}

                </span>

            </div>


            <!-- =============================== -->
            <!-- ACCIONES -->
            <!-- =============================== -->

            <div
                class="pedido-acciones"
            >

                <button
                    onclick="verPedido(
                        ${pedido.id}
                    )"
                    class="btn-ver"
                >
                    VER PEDIDO
                </button>


                <button
                    onclick="imprimirPedido(
                        ${pedido.id}
                    )"
                    class="btn-imprimir"
                >
                    IMPRIMIR PEDIDO
                </button>


                ${
                    pedido.estado ===
                    "nuevo"
                        ? `
                            <button
                                onclick="cambiarEstado(
                                    ${pedido.id},
                                    'preparando'
                                )"
                                class="btn-preparar"
                            >
                                COMENZAR A PREPARAR
                            </button>
                        `
                        : ""
                }


                ${
                    pedido.estado ===
                    "preparando"
                        ? `
                            <button
                                onclick="cambiarEstado(
                                    ${pedido.id},
                                    'listo'
                                )"
                                class="btn-listo"
                            >
                                MARCAR COMO LISTO
                            </button>
                        `
                        : ""
                }


                ${
                    pedido.estado ===
                    "listo"
                        ? `
                            <button
                                onclick="cambiarEstado(
                                    ${pedido.id},
                                    'entregado'
                                )"
                                class="btn-entregado"
                            >
                                MARCAR ENTREGADO
                            </button>
                        `
                        : ""
                }


                ${
                    pedido.estado !==
                        "entregado" &&
                    pedido.estado !==
                        "cancelado"
                        ? `
                            <button
                                onclick="cancelarPedido(
                                    ${pedido.id}
                                )"
                                class="btn-cancelar"
                            >
                                CANCELAR
                            </button>
                        `
                        : ""
                }

            </div>

        </div>
    `;

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

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );

        }

        await cargarPedidos();

    } catch (error) {

        console.error(
            "Error cambiando estado:",
            error
        );

        alert(
            "No se pudo cambiar el estado del pedido."
        );

    }

}

// =====================================================
// CANCELAR PEDIDO
// =====================================================

async function cancelarPedido(
    id
) {

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

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );

        }

        await cargarPedidos();

    } catch (error) {

        console.error(
            "Error cancelando pedido:",
            error
        );

        alert(
            "No se pudo cancelar el pedido."
        );

    }

}

// =====================================================
// VER PEDIDO
// =====================================================

function verPedido(
    id
) {

    const pedido =
        pedidos.find(
            p =>
                p.id === id
        );

    if (!pedido) {
        return;
    }

    const productos =
        Array.isArray(
            pedido.productos
        )
            ? pedido.productos
            : [];

    let textoProductos =
        productos
            .map(
                producto =>
                    `${producto.cantidad}x ${producto.nombre} - $${Number(
                        producto.subtotal || 0
                    ).toLocaleString(
                        "es-UY"
                    )}`
            )
            .join("\n");

    let informacionEnvio = "";

    if (
        pedido.tipo_entrega ===
        "delivery"
    ) {

        const distancia =
            pedido.distancia_delivery !==
                null &&
            pedido.distancia_delivery !==
                undefined
                ? Number(
                    pedido.distancia_delivery
                )
                : null;

        const costo =
            Number(
                pedido.costo_envio || 0
            );

        informacionEnvio =
            `

DELIVERY:
Distancia: ${
                distancia !== null
                    ? `${distancia.toFixed(2)} km`
                    : "-"
            }
Envío: ${
                costo === 0
                    ? "GRATIS"
                    : `$${costo.toLocaleString(
                        "es-UY"
                    )}`
            }
`;

    }

    alert(
        `PEDIDO #${pedido.id}

CLIENTE:
${pedido.nombre || "-"}

TELÉFONO:
${pedido.telefono || "-"}

DIRECCIÓN:
${
    pedido.direccion ||
    "Retira en local"
}

FORMA DE PAGO:
${formatearPago(
    pedido.metodo_pago
)}
${informacionEnvio}

PRODUCTOS:

${textoProductos}

TOTAL:
$${Number(
    pedido.total || 0
).toLocaleString(
    "es-UY"
)}`
    );

}

// =====================================================
// IMPRIMIR PEDIDO
// =====================================================

function imprimirPedido(
    id
) {

    const pedido =
        pedidos.find(
            p =>
                p.id === id
        );

    if (!pedido) {
        return;
    }

    const productos =
        Array.isArray(
            pedido.productos
        )
            ? pedido.productos
            : [];

    const productosHTML =
        productos
            .map(
                producto => {

                    return `
                        <tr>

                            <td>
                                ${producto.cantidad}x
                            </td>

                            <td>
                                ${producto.nombre}
                            </td>

                            <td>
                                $${Number(
                                    producto.subtotal || 0
                                ).toLocaleString(
                                    "es-UY"
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

    // =================================================
    // INFORMACIÓN DELIVERY PARA TICKET
    // =================================================

    let deliveryHTML = "";

    if (
        pedido.tipo_entrega ===
        "delivery"
    ) {

        const costoEnvio =
            Number(
                pedido.costo_envio || 0
            );

        const distancia =
            pedido.distancia_delivery !==
                null &&
            pedido.distancia_delivery !==
                undefined
                ? Number(
                    pedido.distancia_delivery
                )
                : null;

        deliveryHTML = `

            <div class="linea"></div>

            <strong>
                DELIVERY
            </strong>

            <br>

            Dirección:
            ${pedido.direccion || "-"}

            <br>

            Distancia:
            ${
                distancia !== null
                    ? `${distancia.toFixed(2)} km`
                    : "-"
            }

            <br>

            Envío:
            ${
                costoEnvio === 0
                    ? "GRATIS"
                    : `$${costoEnvio.toLocaleString(
                        "es-UY"
                    )}`
            }

        `;

    } else {

        deliveryHTML = `

            <div class="linea"></div>

            <strong>
                RETIRA EN LOCAL
            </strong>

        `;

    }

    // =================================================
    // CAMBIO
    // =================================================

    let cambioHTML = "";

    if (
        pedido.metodo_pago ===
            "efectivo" &&
        pedido.cambio !== null &&
        pedido.cambio !== undefined &&
        pedido.cambio !== ""
    ) {

        cambioHTML = `

            <br>

            Cambio para:
            $${Number(
                pedido.cambio
            ).toLocaleString(
                "es-UY"
            )}

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
            "El navegador bloqueó la ventana de impresión."
        );

        return;

    }

    ventana.document.write(`

        <!DOCTYPE html>

        <html>

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

                    padding: 10px;

                    font-family:
                        Arial,
                        sans-serif;

                    font-size: 13px;

                    color: #000;

                }

                h1 {

                    text-align: center;

                    font-size: 20px;

                    margin:
                        0 0 10px;

                }

                .centrado {

                    text-align: center;

                }

                .linea {

                    border-top:
                        1px dashed #000;

                    margin:
                        10px 0;

                }

                table {

                    width: 100%;

                    border-collapse:
                        collapse;

                }

                td {

                    padding:
                        4px 0;

                    vertical-align:
                        top;

                }

                .total {

                    font-size: 18px;

                    font-weight: bold;

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

            <div class="centrado">

                PEDIDO #${pedido.id}

            </div>

            <div class="linea"></div>

            <strong>
                Cliente:
            </strong>

            ${pedido.nombre || "-"}

            <br>

            <strong>
                Teléfono:
            </strong>

            ${pedido.telefono || "-"}

            ${deliveryHTML}

            <div class="linea"></div>

            <table>

                ${productosHTML}

            </table>

            <div class="linea"></div>

            <div class="total">

                TOTAL:

                $${Number(
                    pedido.total || 0
                ).toLocaleString(
                    "es-UY"
                )}

            </div>

            <div class="linea"></div>

            <strong>
                Pago:
            </strong>

            ${formatearPago(
                pedido.metodo_pago
            )}

            ${cambioHTML}

            <br>
            <br>

            <div class="centrado">

                Gracias por tu compra

            </div>

        </body>

        </html>

    `);

    ventana.document.close();

    ventana.focus();

    setTimeout(
        () => {

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
            "[data-filtro]"
        );

    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    botones.forEach(
                        b =>
                            b.classList.remove(
                                "activo"
                            )
                    );

                    boton.classList.add(
                        "activo"
                    );

                    filtroActual =
                        boton.dataset.filtro;

                    renderizarPedidos();

                }
            );

        }
    );

}

// =====================================================
// FORMATEAR ESTADO
// =====================================================

function formatearEstado(
    estado
) {

    const estados = {

        en_proceso_pago:
            "EN PROCESO DE PAGO",

        nuevo:
            "NUEVO",

        preparando:
            "PREPARANDO",

        listo:
            "LISTO",

        entregado:
            "ENTREGADO",

        cancelado:
            "CANCELADO"

    };

    return estados[estado]
        || estado
        || "-";

}

// =====================================================
// FORMATEAR PAGO
// =====================================================

function formatearPago(
    metodo
) {

    const pagos = {

        efectivo:
            "EFECTIVO",

        mercado_pago:
            "MERCADO PAGO",

        tarjeta:
            "TARJETA",

        transferencia:
            "TRANSFERENCIA"

    };

    return pagos[metodo]
        || metodo
        || "-";

}

// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "-";
    }

    const date =
        new Date(fecha);

    return date.toLocaleString(
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
// INICIO
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
