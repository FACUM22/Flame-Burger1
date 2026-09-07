const API_PEDIDOS = "/api/pedidos";

let pedidos = [];
let filtroActual = "todos";

const ordersList =
document.getElementById("ordersList");

const pedidosNuevos =
document.getElementById("pedidosNuevos");

async function cargarPedidos() {

try {

const respuesta =
    await fetch(API_PEDIDOS);

if (!respuesta.ok) {

    throw new Error(
        "No se pudieron cargar los pedidos."
    );

}

pedidos =
    await respuesta.json();

mostrarPedidos();

} catch (error) {

console.error(
    "❌ ERROR PEDIDOS:",
    error
);

ordersList.innerHTML = `

    <div class="empty-orders">

        <div class="empty-icon">
            ⚠️
        </div>

        <h3>
            Error al cargar los pedidos
        </h3>

        <p>
            ${escaparHTML(error.message)}
        </p>

    </div>

`;

}

}

function mostrarPedidos() {

ordersList.innerHTML = "";

const cantidadNuevos =
pedidos.filter(
pedido =>
pedido.estado === "nuevo"
).length;
pedidosNuevos.textContent =
    `${cantidadNuevos} pedido${cantidadNuevos !== 1 ? "s" : ""} nuevo${cantidadNuevos !== 1 ? "s" : ""}`;

let pedidosFiltrados =
pedidos.filter(
pedido =>
pedido.estado !== "en_proceso_pago"
);

if (
filtroActual !== "todos"
) {

pedidosFiltrados =
    pedidosFiltrados.filter(
        pedido =>
            pedido.estado ===
            filtroActual
    );

}

if (
pedidosFiltrados.length === 0
) {

ordersList.innerHTML = `

    <div class="empty-orders">

        <div class="empty-icon">
            🛒
        </div>

        <h3>
            No hay pedidos
        </h3>

        <p>
            No hay pedidos en esta categoría.
        </p>

    </div>

`;

return;

}

pedidosFiltrados.forEach(
pedido => {

    const tarjeta =
        crearTarjetaPedido(
            pedido
        );

    ordersList.appendChild(
        tarjeta
    );

}

);

}

function crearTarjetaPedido(
pedido
) {

const tarjeta =
document.createElement(
"div"
);

tarjeta.className =
"order-card";

if (
pedido.estado === "nuevo"
) {

tarjeta.classList.add(
    "new-order"
);

}

const fecha =
formatearFecha(
pedido.creado_en
);

const estadoTexto =
obtenerTextoEstado(
pedido.estado
);

const claseEstado =
    `status-${pedido.estado}`;

tarjeta.innerHTML = `

<div class="order-top">

    <div>

        <div class="order-number">

            Pedido #${pedido.id}

        </div>

        <div class="order-date">

            ${fecha}

        </div>

        ${
            pedido.estado === "nuevo"
            ?
            `
            <span class="new-label">
                🔔 NUEVO PEDIDO
            </span>
            `
            :
            ""
        }

    </div>

    <span
        class="order-status ${claseEstado}"
    >

        ${estadoTexto}

    </span>

</div>

<div class="order-info-grid">

    <div class="order-info">

        <span>
            CLIENTE
        </span>

        <strong>
            ${escaparHTML(
                pedido.cliente_nombre ||
                "Sin nombre"
            )}
        </strong>

    </div>

    <div class="order-info">

        <span>
            TELÉFONO
        </span>

        <strong>
            ${escaparHTML(
                pedido.cliente_telefono ||
                pedido.telefono ||
                "Sin teléfono"
            )}
        </strong>

    </div>

    <div class="order-info">

        <span>
            ENTREGA
        </span>

        <strong>
            ${obtenerTextoEntrega(
                pedido.tipo_entrega
            )}
        </strong>

    </div>

    <div class="order-info">

        <span>
            DIRECCIÓN
        </span>

        <strong>
            ${escaparHTML(
                pedido.cliente_direccion ||
                pedido.direccion ||
                "—"
            )}
        </strong>

    </div>

    <div class="order-info">

        <span>
            PAGO
        </span>

        <strong>
            ${obtenerTextoPago(
                pedido.forma_pago
            )}
        </strong>

    </div>

    <div class="order-info">

        <span>
            ESTADO
        </span>

        <strong>
            ${estadoTexto}
        </strong>

    </div>

</div>

<div
    class="order-products"
    id="productos-${pedido.id}"
>

    <div>
        ⏳ Cargando productos...
    </div>

</div>

${
    pedido.observaciones
    ?
    `
    <div class="order-observation">

        <strong>
            📝 Comentarios:
        </strong>

        <br>

        ${escaparHTML(
            pedido.observaciones
        )}

    </div>
    `
    :
    ""
}

<div class="order-bottom">

    <div>

        <div class="order-total-label">
            TOTAL
        </div>

        <div class="order-total">

            $${Number(
                pedido.total || 0
            ).toLocaleString(
                "es-UY"
            )}

        </div>

    </div>

    <div class="order-actions">

        ${crearBotonesEstado(
            pedido
        )}

    </div>

</div>

`;

cargarDetallePedido(
pedido.id
);

return tarjeta;

}

function crearBotonesEstado(
pedido
) {

const estado =
pedido.estado;

const botonImprimir = `

<button
    class="btn-print"
    onclick="imprimirPedido(${pedido.id})"
>
    🖨️ Imprimir pedido
</button>

`;

if (
estado === "cancelado"
) {

return `

    ${botonImprimir}

    <button
        class="btn-confirm"
        onclick="cambiarEstado(${pedido.id}, 'nuevo')"
    >
        ↩️ Reactivar
    </button>

`;

}

if (
estado === "entregado"
) {

return `

    ${botonImprimir}

    <button
        class="btn-cancel"
        onclick="cambiarEstado(${pedido.id}, 'cancelado')"
    >
        ❌ Cancelar
    </button>

`;

}

if (
estado === "nuevo"
) {

return `

    ${botonImprimir}

    <button
        class="btn-preparing"
        onclick="cambiarEstado(${pedido.id}, 'preparando')"
    >
        👨‍🍳 Comenzar a preparar
    </button>

    <button
        class="btn-cancel"
        onclick="cambiarEstado(${pedido.id}, 'cancelado')"
    >
        ❌ Cancelar
    </button>

`;

}

if (
estado === "preparando"
) {

return `

    ${botonImprimir}

    <button
        class="btn-ready"
        onclick="cambiarEstado(${pedido.id}, 'listo')"
    >
        🍔 Listo
    </button>

    <button
        class="btn-cancel"
        onclick="cambiarEstado(${pedido.id}, 'cancelado')"
    >
        ❌ Cancelar
    </button>

`;

}

if (
estado === "listo"
) {

return `

    ${botonImprimir}

    <button
        class="btn-delivered"
        onclick="cambiarEstado(${pedido.id}, 'entregado')"
    >
        🛵 Entregado
    </button>

    <button
        class="btn-cancel"
        onclick="cambiarEstado(${pedido.id}, 'cancelado')"
    >
        ❌ Cancelar
    </button>

`;

}

return botonImprimir;

}

async function cargarDetallePedido(
pedidoId
) {

try {

const respuesta =
    await fetch(
        `${API_PEDIDOS}/${pedidoId}`
    );

if (
    !respuesta.ok
) {

    throw new Error(
        "No se pudo obtener el detalle."
    );

}

const resultado =
    await respuesta.json();

const contenedor =
    document.getElementById(
        `productos-${pedidoId}`
    );

if (!contenedor) {
    return;
}

if (
    !resultado.productos ||
    resultado.productos.length === 0
) {

    contenedor.innerHTML = `
        <div>
            Sin productos
        </div>
    `;

    return;

}

contenedor.innerHTML = "";

resultado.productos.forEach(
    producto => {

        const elemento =
            document.createElement(
                "div"
            );

        elemento.className =
            "order-product";

        elemento.innerHTML = `

            <div>

                <strong>
                    ${escaparHTML(
                        producto.nombre ||
                        "Producto"
                    )}
                </strong>

                <small>

                    ${producto.cantidad}
                    x
                    $${Number(
                        producto.precio_unitario ||
                        0
                    ).toLocaleString(
                        "es-UY"
                    )}

                </small>

            </div>

            <strong>

                $${Number(
                    producto.subtotal ||
                    0
                ).toLocaleString(
                    "es-UY"
                )}

            </strong>

        `;

        contenedor.appendChild(
            elemento
        );

    }
);

} catch (error) {

console.error(
    "ERROR DETALLE:",
    error
);

const contenedor =
    document.getElementById(
        `productos-${pedidoId}`
    );

if (contenedor) {

    contenedor.innerHTML = `
        <div>
            ⚠️ No se pudo cargar el detalle
        </div>
    `;

}

}

}

// =====================================================
// IMPRIMIR PEDIDO - TICKET TERMICO 80MM
// =====================================================

async function imprimirPedido(
pedidoId
) {

try {

const respuesta =
    await fetch(
        `${API_PEDIDOS}/${pedidoId}`
    );

if (
    !respuesta.ok
) {

    throw new Error(
        "No se pudo obtener el pedido."
    );

}

const resultado =
    await respuesta.json();

const pedido =
    resultado.pedido;

const productos =
    resultado.productos || [];

if (!pedido) {

    throw new Error(
        "No se encontró la información del pedido."
    );

}

const ventana =
    window.open(
        "",
        "_blank",
        "width=400,height=700"
    );

if (!ventana) {

    alert(
        "⚠️ El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes."
    );

    return;

}

const numeroPedido =
    pedido.id;

const cliente =
    pedido.cliente_nombre ||
    pedido.nombre ||
    "Sin nombre";

const telefono =
    pedido.cliente_telefono ||
    pedido.telefono ||
    "Sin teléfono";

const direccion =
    pedido.cliente_direccion ||
    pedido.direccion ||
    "—";

const entrega =
    obtenerTextoEntrega(
        pedido.tipo_entrega
    );

const pago =
    obtenerTextoPago(
        pedido.forma_pago
    );

const estado =
    obtenerTextoEstado(
        pedido.estado
    );

const fecha =
    formatearFecha(
        pedido.creado_en
    );

const total =
    Number(
        pedido.total || 0
    ).toLocaleString(
        "es-UY",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

const productosHTML =
    productos.map(
        producto => {

            const nombre =
                escaparHTML(
                    producto.nombre ||
                    "Producto"
                );

            const cantidad =
                Number(
                    producto.cantidad || 0
                );

            const precioUnitario =
                Number(
                    producto.precio_unitario || 0
                ).toLocaleString(
                    "es-UY",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

            const subtotal =
                Number(
                    producto.subtotal || 0
                ).toLocaleString(
                    "es-UY",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

            return `

                <div class="producto">

                    <div class="producto-principal">

                        <div class="producto-nombre">
                            ${cantidad}x ${nombre}
                        </div>

                        <div class="producto-unitario">
                            $${precioUnitario} c/u
                        </div>

                    </div>

                    <div class="producto-subtotal">
                        $${subtotal}
                    </div>

                </div>

            `;

        }
    ).join("");

const observaciones =
    pedido.observaciones
    ?
    `
        <div class="observaciones">

            <div class="titulo-seccion">
                📝 COMENTARIOS
            </div>

            <div class="texto-observaciones">
                ${escaparHTML(
                    pedido.observaciones
                )}
            </div>

        </div>
    `
    :
    "";

ventana.document.write(`

    <!DOCTYPE html>

    <html lang="es">

    <head>

        <meta charset="UTF-8">

        <title>
            Pedido #${numeroPedido}
        </title>

        <style>

            * {
                box-sizing: border-box;
            }

            html,
            body {
                margin: 0;
                padding: 0;
                width: 80mm;
                background: #fff;
                color: #000;
            }

            body {

                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;

                font-size: 12px;

                line-height: 1.25;

            }

            .ticket {

                width: 72mm;

                margin: 0 auto;

                padding: 3mm 0 5mm 0;

            }

            .cabecera {

                text-align: center;

                padding-bottom: 3mm;

                border-bottom:
                    1px dashed #000;

                margin-bottom: 3mm;

            }

            .logo {

                font-size: 20px;

                font-weight: 900;

                letter-spacing: 0.5px;

            }

            .subtitulo {

                font-size: 10px;

                margin-top: 1mm;

            }

            .numero-pedido {

                font-size: 22px;

                font-weight: 900;

                margin-top: 3mm;

            }

            .fecha {

                font-size: 10px;

                margin-top: 1mm;

            }

            .seccion {

                border-bottom:
                    1px dashed #000;

                padding-bottom: 3mm;

                margin-bottom: 3mm;

            }

            .fila {

                display: block;

                margin-bottom: 2mm;

            }

            .fila:last-child {
                margin-bottom: 0;
            }

            .etiqueta {

                font-size: 9px;

                font-weight: bold;

                text-transform: uppercase;

            }

            .valor {

                font-size: 12px;

                font-weight: bold;

                word-break: break-word;

            }

            .titulo-seccion {

                font-size: 12px;

                font-weight: 900;

                margin-bottom: 2mm;

            }

            .producto {

                display: flex;

                justify-content:
                    space-between;

                align-items:
                    flex-start;

                gap: 3mm;

                padding: 2mm 0;

                border-bottom:
                    1px dotted #999;

            }

            .producto:last-child {
                border-bottom: none;
            }

            .producto-principal {

                flex: 1;

                min-width: 0;

            }

            .producto-nombre {

                font-size: 12px;

                font-weight: bold;

                line-height: 1.25;

                word-break: break-word;

            }

            .producto-unitario {

                font-size: 9px;

                margin-top: 1mm;

            }

            .producto-subtotal {

                font-size: 12px;

                font-weight: bold;

                white-space: nowrap;

            }

            .total {

                display: flex;

                justify-content:
                    space-between;

                align-items:
                    center;

                border-top:
                    2px solid #000;

                margin-top: 3mm;

                padding-top: 3mm;

                font-size: 19px;

                font-weight: 900;

            }

            .observaciones {

                border:
                    1px solid #000;

                padding: 3mm;

                margin-bottom: 3mm;

            }

            .texto-observaciones {

                font-size: 11px;

                font-weight: bold;

                margin-top: 2mm;

                word-break: break-word;

            }

            .estado {

                text-align: center;

                font-size: 13px;

                font-weight: 900;

                border:
                    2px solid #000;

                padding: 2mm;

                margin-bottom: 3mm;

            }

            .footer {

                text-align: center;

                border-top:
                    1px dashed #000;

                padding-top: 3mm;

                font-size: 10px;

            }

            .footer strong {

                display: block;

                font-size: 12px;

                margin-top: 1mm;

            }

            @media print {

                @page {

                    size: 80mm auto;

                    margin: 0;

                }

                html,
                body {

                    width: 80mm;

                    margin: 0;

                    padding: 0;

                }

                .ticket {

                    width: 72mm;

                    margin: 0 auto;

                    padding:
                        3mm 0 5mm 0;

                }

            }

        </style>

    </head>

    <body>

        <div class="ticket">

            <div class="cabecera">

                <div class="logo">
                    🔥 FLAME BURGER
                </div>

                <div class="subtitulo">
                    PEDIDO
                </div>

                <div class="numero-pedido">
                    #${numeroPedido}
                </div>

                <div class="fecha">
                    ${fecha}
                </div>

            </div>


            <div class="seccion">

                <div class="fila">

                    <div class="etiqueta">
                        Cliente
                    </div>

                    <div class="valor">
                        ${escaparHTML(cliente)}
                    </div>

                </div>

                <div class="fila">

                    <div class="etiqueta">
                        Teléfono
                    </div>

                    <div class="valor">
                        ${escaparHTML(telefono)}
                    </div>

                </div>

                <div class="fila">

                    <div class="etiqueta">
                        Entrega
                    </div>

                    <div class="valor">
                        ${entrega}
                    </div>

                </div>

                ${
                    pedido.tipo_entrega === "delivery"
                    ?
                    `
                    <div class="fila">

                        <div class="etiqueta">
                            Dirección
                        </div>

                        <div class="valor">
                            ${escaparHTML(direccion)}
                        </div>

                    </div>
                    `
                    :
                    ""
                }

                <div class="fila">

                    <div class="etiqueta">
                        Pago
                    </div>

                    <div class="valor">
                        ${pago}
                    </div>

                </div>

            </div>


            <div class="seccion">

                <div class="titulo-seccion">
                    PRODUCTOS
                </div>

                ${productosHTML}

                <div class="total">

                    <span>
                        TOTAL
                    </span>

                    <span>
                        $${total}
                    </span>

                </div>

            </div>


            ${observaciones}


            <div class="estado">

                ${estado}

            </div>


            <div class="footer">

                Gracias por elegir

                <strong>
                    Flame Burger 🔥
                </strong>

            </div>

        </div>


        <script>

            window.onload = function() {

                setTimeout(
                    function() {

                        window.print();

                    },
                    250
                );

            };

        </script>

    </body>

    </html>

`);

ventana.document.close();

} catch (error) {

console.error(
    "❌ ERROR IMPRIMIENDO PEDIDO:",
    error
);

alert(
    "❌ " +
    error.message
);

}

}

// =====================================================
// CAMBIAR ESTADO
// =====================================================

async function cambiarEstado(
pedidoId,
nuevoEstado
) {

try {

const confirmar =
    confirm(
        `¿Cambiar el pedido #${pedidoId} a "${obtenerTextoEstado(nuevoEstado)}"?`
    );

if (!confirmar) {
    return;
}

const respuesta =
    await fetch(
        `${API_PEDIDOS}/${pedidoId}/estado`,
        {

            method:
                "PATCH",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body:
                JSON.stringify({

                    estado:
                        nuevoEstado

                })

        }
    );

const resultado =
    await respuesta.json();

if (
    !respuesta.ok
) {

    throw new Error(
        resultado.error ||
        "No se pudo cambiar el estado."
    );

}

const pedido =
    pedidos.find(
        p =>
            Number(p.id) ===
            Number(pedidoId)
    );

if (pedido) {

    pedido.estado =
        nuevoEstado;

}

mostrarPedidos();

} catch (error) {

console.error(
    "ERROR CAMBIANDO ESTADO:",
    error
);

alert(
    "❌ " +
    error.message
);

}

}

// =====================================================
// FILTROS
// =====================================================

document
.querySelectorAll(
".order-filter"
)
.forEach(
boton => {

    boton.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".order-filter"
                )
                .forEach(
                    b =>
                        b.classList.remove(
                            "active"
                        )
                );

            boton.classList.add(
                "active"
            );

            filtroActual =
                boton.dataset.filter;

            mostrarPedidos();

        }
    );

}

);

// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(
fecha
) {

if (!fecha) {
return "";
}

const fechaObjeto =
new Date(
fecha
);

return fechaObjeto.toLocaleString(
"es-UY",
{

    day:
        "2-digit",

    month:
        "2-digit",

    year:
        "numeric",

    hour:
        "2-digit",

    minute:
        "2-digit"

}

);

}

// =====================================================
// TEXTO ESTADO
// =====================================================

function obtenerTextoEstado(
estado
) {

const estados = {

en_proceso_pago:
    "🟡 En proceso de pago",

nuevo:
    "🆕 Nuevo",

preparando:
    "👨‍🍳 Preparando",

listo:
    "🍔 Listo",

entregado:
    "🛵 Entregado",

cancelado:
    "❌ Cancelado"

};

return estados[estado] ||
estado ||
"Desconocido";

}

// =====================================================
// TEXTO ENTREGA
// =====================================================

function obtenerTextoEntrega(
entrega
) {

if (
entrega === "delivery"
) {

return "🛵 Delivery";

}

if (
entrega === "retiro"
) {

return "🏪 Retiro";

}

return entrega || "—";

}

// =====================================================
// TEXTO PAGO
// =====================================================

function obtenerTextoPago(
pago
) {

if (
pago === "efectivo"
) {

return "💵 Efectivo";

}

if (
pago === "mercado_pago"
) {

return "💳 Mercado Pago";

}

return pago || "—";

}

// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTML(
texto
) {

const div =
document.createElement(
"div"
);

div.textContent =
texto ?? "";

return div.innerHTML;

}

// =====================================================
// ACTUALIZACIÓN AUTOMÁTICA
// =====================================================

setInterval(
cargarPedidos,
10000
);

// =====================================================
// INICIAR
// =====================================================

cargarPedidos();