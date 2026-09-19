const API_PEDIDOS = "/api/pedidos";

let pedidos = [];
let filtroActual = "todos";

// =====================================================
// CARGAR PEDIDOS
// =====================================================

async function cargarPedidos() {

    try {

        const respuesta = await fetch(API_PEDIDOS);

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        const nuevosPedidos = await respuesta.json();

        pedidos = nuevosPedidos;

        renderizarPedidos();

    } catch (error) {

        console.error(
            "ERROR PEDIDOS:",
            error
        );

    }

}

// =====================================================
// RENDERIZAR PEDIDOS
// =====================================================

function renderizarPedidos() {

    const lista = document.getElementById(
        "listaPedidos"
    );

    if (!lista) {

        console.error(
            "No existe el elemento #listaPedidos en pedidos.html"
        );

        return;

    }

    let pedidosFiltrados = pedidos;

    if (filtroActual !== "todos") {

        pedidosFiltrados = pedidos.filter(
            pedido =>
                pedido.estado === filtroActual
        );

    }

    if (pedidosFiltrados.length === 0) {

        lista.innerHTML = `
            <div class="sin-pedidos">
                <p>No hay pedidos para mostrar.</p>
            </div>
        `;

        return;

    }

    lista.innerHTML = pedidosFiltrados
        .map(pedido => crearPedidoHTML(pedido))
        .join("");

}

// =====================================================
// CREAR HTML DEL PEDIDO
// =====================================================

function crearPedidoHTML(pedido) {

    const productosHTML = pedido.productos
        .map(producto => {

            return `
                <div class="producto-pedido">

                    <div>
                        <strong>
                            ${producto.cantidad}x
                            ${producto.nombre}
                        </strong>
                    </div>

                    <div>
                        $${Number(
                            producto.subtotal
                        ).toLocaleString("es-UY")}
                    </div>

                </div>
            `;

        })
        .join("");

    return `
        <div
            class="pedido-card"
            data-id="${pedido.id}"
        >

            <div class="pedido-header">

                <div>

                    <h3>
                        Pedido #${pedido.id}
                    </h3>

                    <span class="pedido-fecha">
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


            <div class="pedido-cliente">

                <p>
                    <strong>Cliente:</strong>
                    ${pedido.nombre}
                </p>

                <p>
                    <strong>Teléfono:</strong>
                    ${pedido.telefono}
                </p>

                ${
                    pedido.tipo_entrega === "delivery"
                        ? `
                            <p>
                                <strong>Dirección:</strong>
                                ${pedido.direccion || "-"}
                            </p>
                        `
                        : `
                            <p>
                                <strong>Entrega:</strong>
                                Retira en local
                            </p>
                        `
                }

            </div>


            <div class="pedido-productos">

                <h4>
                    Productos
                </h4>

                ${productosHTML}

            </div>


            <div class="pedido-pago">

                <p>
                    <strong>
                        Forma de pago:
                    </strong>

                    ${formatearPago(
                        pedido.metodo_pago
                    )}
                </p>

                ${
                    pedido.metodo_pago === "efectivo"
                    &&
                    pedido.cambio
                        ? `
                            <p>
                                <strong>
                                    Cambio para:
                                </strong>

                                $${Number(
                                    pedido.cambio
                                ).toLocaleString("es-UY")}
                            </p>
                        `
                        : ""
                }

            </div>


            <div class="pedido-total">

                <strong>
                    TOTAL
                </strong>

                <span>
                    $${Number(
                        pedido.total
                    ).toLocaleString("es-UY")}
                </span>

            </div>


            <div class="pedido-acciones">

                <button
                    onclick="verPedido(${pedido.id})"
                    class="btn-ver"
                >
                    VER PEDIDO
                </button>

                <button
                    onclick="imprimirPedido(${pedido.id})"
                    class="btn-imprimir"
                >
                    IMPRIMIR PEDIDO
                </button>

                ${
                    pedido.estado === "nuevo"
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
                    pedido.estado === "preparando"
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
                    pedido.estado === "listo"
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
                    pedido.estado !== "entregado"
                    &&
                    pedido.estado !== "cancelado"
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

        const respuesta = await fetch(
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

async function cancelarPedido(id) {

    const confirmar = confirm(
        `¿Seguro que querés cancelar el pedido #${id}?`
    );

    if (!confirmar) {
        return;
    }

    try {

        const respuesta = await fetch(
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

function verPedido(id) {

    const pedido = pedidos.find(
        p => p.id === id
    );

    if (!pedido) {
        return;
    }

    let productos = pedido.productos
        .map(producto => {

            return `
                ${producto.cantidad}x
                ${producto.nombre}
                - $${Number(
                    producto.subtotal
                ).toLocaleString("es-UY")}
            `;

        })
        .join("\n");

    alert(
        `PEDIDO #${pedido.id}

CLIENTE:
${pedido.nombre}

TELÉFONO:
${pedido.telefono}

DIRECCIÓN:
${pedido.direccion || "Retira en local"}

FORMA DE PAGO:
${formatearPago(
    pedido.metodo_pago
)}

PRODUCTOS:

${productos}

TOTAL:
$${Number(
    pedido.total
).toLocaleString("es-UY")}`
    );

}

// =====================================================
// IMPRIMIR PEDIDO
// =====================================================

function imprimirPedido(id) {

    const pedido = pedidos.find(
        p => p.id === id
    );

    if (!pedido) {
        return;
    }

    const productosHTML = pedido.productos
        .map(producto => {

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
                            producto.subtotal
                        ).toLocaleString("es-UY")}
                    </td>

                </tr>
            `;

        })
        .join("");

    const ventana = window.open(
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
                    font-family: Arial, sans-serif;
                    font-size: 13px;
                    color: #000;
                }

                h1 {
                    text-align: center;
                    font-size: 20px;
                    margin: 0 0 10px;
                }

                .centrado {
                    text-align: center;
                }

                .linea {
                    border-top: 1px dashed #000;
                    margin: 10px 0;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                td {
                    padding: 4px 0;
                    vertical-align: top;
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

            ${pedido.nombre}

            <br>

            <strong>
                Teléfono:
            </strong>

            ${pedido.telefono}

            <br>

            <strong>
                Entrega:
            </strong>

            ${
                pedido.tipo_entrega === "delivery"
                    ? pedido.direccion || "-"
                    : "Retira en local"
            }

            <div class="linea"></div>

            <table>

                ${productosHTML}

            </table>

            <div class="linea"></div>

            <div class="total">

                TOTAL:
                $${Number(
                    pedido.total
                ).toLocaleString("es-UY")}

            </div>

            <div class="linea"></div>

            <strong>
                Pago:
            </strong>

            ${formatearPago(
                pedido.metodo_pago
            )}

            ${
                pedido.metodo_pago === "efectivo"
                &&
                pedido.cambio
                    ? `
                        <br>
                        Cambio para:
                        $${Number(
                            pedido.cambio
                        ).toLocaleString("es-UY")}
                    `
                    : ""
            }

            <br><br>

            <div class="centrado">
                Gracias por tu compra
            </div>

        </body>

        </html>

    `);

    ventana.document.close();

    ventana.focus();

    setTimeout(() => {

        ventana.print();

    }, 500);

}

// =====================================================
// FILTROS
// =====================================================

function configurarFiltros() {

    const botones = document.querySelectorAll(
        "[data-filtro]"
    );

    botones.forEach(boton => {

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

    });

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

    const date = new Date(fecha);

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
