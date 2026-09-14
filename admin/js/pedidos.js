
const API_PEDIDOS = "/api/pedidos";

let pedidos = [];
let filtroActual = "todos";

const ordersList = document.getElementById("ordersList");
const pedidosNuevos = document.getElementById("pedidosNuevos");


// =====================================================
// CARGAR PEDIDOS
// =====================================================

async function cargarPedidos() {

    try {

        const respuesta = await fetch(API_PEDIDOS);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los pedidos.");
        }

        pedidos = await respuesta.json();

        mostrarPedidos();

    } catch (error) {

        console.error("ERROR PEDIDOS:", error);

        ordersList.innerHTML = `
            <div class="empty-orders">
                <div class="empty-icon">⚠️</div>

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


// =====================================================
// MOSTRAR PEDIDOS
// =====================================================

function mostrarPedidos() {

    ordersList.innerHTML = "";

    const cantidadNuevos = pedidos.filter(
        pedido => pedido.estado === "nuevo"
    ).length;

    pedidosNuevos.textContent =
        `${cantidadNuevos} pedido${cantidadNuevos !== 1 ? "s" : ""} nuevo${cantidadNuevos !== 1 ? "s" : ""}`;


    let pedidosFiltrados = pedidos.filter(
        pedido => pedido.estado !== "en_proceso_pago"
    );


    if (filtroActual !== "todos") {

        pedidosFiltrados = pedidosFiltrados.filter(
            pedido => pedido.estado === filtroActual
        );

    }


    if (pedidosFiltrados.length === 0) {

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


    pedidosFiltrados.forEach(pedido => {

        const tarjeta = crearTarjetaPedido(pedido);

        ordersList.appendChild(tarjeta);

    });
}


// =====================================================
// CREAR TARJETA
// =====================================================

function crearTarjetaPedido(pedido) {

    const tarjeta = document.createElement("div");

    tarjeta.className = "order-card";


    if (pedido.estado === "nuevo") {

        tarjeta.classList.add("new-order");

    }


    const fecha = formatearFecha(pedido.creado_en);

    const estadoTexto = obtenerTextoEstado(pedido.estado);

    const claseEstado = `status-${pedido.estado}`;


    // =================================================
    // CAMBIO
    // =================================================

    let informacionCambio = "";


    if (pedido.forma_pago === "efectivo") {

        if (
            pedido.necesita_cambio === true ||
            pedido.necesita_cambio === "true"
        ) {

            const total = Number(pedido.total || 0);

            const cambioDe = Number(pedido.cambio_de || 0);

            const vuelto = cambioDe - total;


            informacionCambio = `

                <div class="order-info">

                    <span>
                        CAMBIO
                    </span>

                    <strong>
                        💵 Sí
                    </strong>

                </div>


                <div class="order-info">

                    <span>
                        PAGA CON
                    </span>

                    <strong>
                        $${cambioDe.toLocaleString("es-UY")}
                    </strong>

                </div>


                <div class="order-info">

                    <span>
                        VUELTO
                    </span>

                    <strong>
                        $${vuelto.toLocaleString("es-UY")}
                    </strong>

                </div>

            `;

        } else {

            informacionCambio = `

                <div class="order-info">

                    <span>
                        CAMBIO
                    </span>

                    <strong>
                        ❌ No necesita
                    </strong>

                </div>

            `;
        }
    }


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
                    ? `
                        <span class="new-label">
                            🔔 NUEVO PEDIDO
                        </span>
                    `
                    : ""
                }

            </div>


            <span class="order-status ${claseEstado}">
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
                        pedido.cliente_nombre || "Sin nombre"
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


            ${informacionCambio}

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
            ? `
                <div class="order-observation">

                    <strong>
                        📝 Comentarios:
                    </strong>

                    <br>

                    ${escaparHTML(pedido.observaciones)}

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
                    $${Number(
                        pedido.total || 0
                    ).toLocaleString("es-UY")}
                </div>

            </div>


            <div class="order-actions">

                ${crearBotonesEstado(pedido)}

            </div>

        </div>

    `;


    cargarDetallePedido(pedido.id);


    return tarjeta;
}


// =====================================================
// BOTONES
// =====================================================

function crearBotonesEstado(pedido) {

    const estado = pedido.estado;


    const botonImprimir = `

        <button
            class="btn-print"
            onclick="imprimirPedido(${pedido.id})"
        >
            🖨️ Imprimir pedido
        </button>

    `;


    if (estado === "cancelado") {

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


    if (estado === "entregado") {

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


    if (estado === "nuevo") {

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


    if (estado === "preparando") {

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


    if (estado === "listo") {

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


// =====================================================
// DETALLE DEL PEDIDO
// =====================================================

async function cargarDetallePedido(pedidoId) {

    try {

        const respuesta = await fetch(
            `${API_PEDIDOS}/${pedidoId}`
        );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo obtener el detalle."
            );

        }


        const resultado = await respuesta.json();


        const contenedor = document.getElementById(
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


        resultado.productos.forEach(producto => {

            const elemento =
                document.createElement("div");


            elemento.className =
                "order-product";


            elemento.innerHTML = `

                <div>

                    <strong>
                        ${escaparHTML(
                            producto.nombre || "Producto"
                        )}
                    </strong>

                    <small>

                        ${producto.cantidad}
                        x
                        $${Number(
                            producto.precio_unitario || 0
                        ).toLocaleString("es-UY")}

                    </small>

                </div>


                <strong>

                    $${Number(
                        producto.subtotal || 0
                    ).toLocaleString("es-UY")}

                </strong>

            `;


            contenedor.appendChild(elemento);

        });


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
// IMPRIMIR TICKET
// =====================================================

async function imprimirPedido(pedidoId) {

    try {

        // Buscar el pedido
        const pedido = pedidos.find(
            p => Number(p.id) === Number(pedidoId)
        );


        if (!pedido) {

            alert(
                "❌ No se encontró el pedido."
            );

            return;
        }


        // Obtener productos
        const respuesta = await fetch(
            `${API_PEDIDOS}/${pedidoId}`
        );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los productos."
            );
        }


        const resultado = await respuesta.json();

        const productos =
            resultado.productos || [];


        // Generar productos del ticket
        let productosHTML = "";


        productos.forEach(producto => {

            productosHTML += `

                <div class="ticket-producto">

                    <div>

                        <strong>
                            ${escaparHTML(
                                producto.nombre ||
                                "Producto"
                            )}
                        </strong>

                        <br>

                        ${producto.cantidad}
                        x
                        $${Number(
                            producto.precio_unitario || 0
                        ).toLocaleString("es-UY")}

                    </div>


                    <strong>

                        $${Number(
                            producto.subtotal || 0
                        ).toLocaleString("es-UY")}

                    </strong>

                </div>

            `;
        });


        // Calcular vuelto
        let informacionCambio = "";


        if (
            pedido.forma_pago === "efectivo" &&
            (
                pedido.necesita_cambio === true ||
                pedido.necesita_cambio === "true"
            )
        ) {

            const cambioDe =
                Number(pedido.cambio_de || 0);


            const total =
                Number(pedido.total || 0);


            const vuelto =
                cambioDe - total;


            informacionCambio = `

                <div class="info">

                    <strong>
                        Paga con:
                    </strong>

                    $${cambioDe.toLocaleString("es-UY")}

                    <br>

                    <strong>
                        Vuelto:
                    </strong>

                    $${vuelto.toLocaleString("es-UY")}

                </div>

            `;
        }


        // Abrir ventana
        const ventana = window.open(
            "",
            "_blank",
            "width=420,height=750"
        );


        if (!ventana) {

            alert(
                "⚠️ El navegador bloqueó la ventana. Permití las ventanas emergentes para esta página."
            );

            return;
        }


        // Escribir ticket
        ventana.document.write(`

<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<title>
Ticket Pedido #${pedido.id}
</title>


<style>

* {
    box-sizing: border-box;
}


html,
body {

    margin: 0;
    padding: 0;

    background: white;

}


body {

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #000;

    font-size: 12px;

}


.ticket {

    width: 80mm;

    max-width: 80mm;

    margin: 0 auto;

    padding: 4mm;

}


.centrado {

    text-align: center;

}


.logo {

    font-size: 22px;

    font-weight: bold;

}


.titulo {

    font-size: 13px;

    font-weight: bold;

    margin-top: 4px;

}


.pedido {

    font-size: 22px;

    font-weight: bold;

    margin: 8px 0;

}


.linea {

    border-top:
        1px dashed #000;

    margin: 8px 0;

}


.info {

    line-height: 1.5;

}


.ticket-producto {

    display: flex;

    justify-content:
        space-between;

    gap: 8px;

    margin: 8px 0;

    line-height: 1.3;

}


.ticket-producto > div {

    flex: 1;

}


.ticket-producto > strong {

    white-space: nowrap;

}


.total {

    display: flex;

    justify-content:
        space-between;

    font-size: 20px;

    font-weight: bold;

    margin-top: 10px;

}


.observaciones {

    margin-top: 8px;

    line-height: 1.4;

}


.boton {

    width: 100%;

    border: none;

    background: #000;

    color: white;

    padding: 12px;

    margin-top: 20px;

    border-radius: 5px;

    font-size: 14px;

    font-weight: bold;

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

        width: 80mm;

        max-width: 80mm;

        padding: 3mm;

    }


    .boton {

        display: none;

    }

}

</style>

</head>


<body>


<div class="ticket">


    <div class="centrado">

        <div class="logo">

            FLAME BURGER

        </div>


        <div class="titulo">

            COMPROBANTE DE PEDIDO

        </div>


        <div class="pedido">

            PEDIDO #${pedido.id}

        </div>

    </div>


    <div class="linea"></div>


    <div class="info">

        <strong>
            Fecha:
        </strong>

        ${formatearFecha(pedido.creado_en)}

        <br>


        <strong>
            Cliente:
        </strong>

        ${escaparHTML(
            pedido.cliente_nombre ||
            "Sin nombre"
        )}

        <br>


        <strong>
            Teléfono:
        </strong>

        ${escaparHTML(
            pedido.cliente_telefono ||
            pedido.telefono ||
            "Sin teléfono"
        )}

        <br>


        <strong>
            Entrega:
        </strong>

        ${obtenerTextoEntrega(
            pedido.tipo_entrega
        )}

        <br>


        <strong>
            Dirección:
        </strong>

        ${escaparHTML(
            pedido.cliente_direccion ||
            pedido.direccion ||
            "—"
        )}

        <br>


        <strong>
            Pago:
        </strong>

        ${obtenerTextoPago(
            pedido.forma_pago
        )}

    </div>


    <div class="linea"></div>


    <strong>
        PRODUCTOS
    </strong>


    ${productosHTML}


    ${
        pedido.observaciones
        ? `

            <div class="linea"></div>

            <div class="observaciones">

                <strong>
                    OBSERVACIONES:
                </strong>

                <br>

                ${escaparHTML(
                    pedido.observaciones
                )}

            </div>

        `
        : ""
    }


    <div class="linea"></div>


    ${informacionCambio}


    <div class="total">

        <span>
            TOTAL
        </span>

        <span>

            $${Number(
                pedido.total || 0
            ).toLocaleString("es-UY")}

        </span>

    </div>


    <div class="linea"></div>


    <div class="centrado">

        Gracias por tu compra

    </div>


    <button
        class="boton"
        onclick="window.print()"
    >

        🖨️ IMPRIMIR TICKET

    </button>


</div>


</body>

</html>

        `);


        ventana.document.close();

        ventana.focus();


    } catch (error) {

        console.error(
            "ERROR IMPRIMIENDO:",
            error
        );


        alert(
            "❌ " + error.message
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

        const confirmar = confirm(
            `¿Cambiar el pedido #${pedidoId} a "${obtenerTextoEstado(nuevoEstado)}"?`
        );


        if (!confirmar) {
            return;
        }


        const respuesta = await fetch(
            `${API_PEDIDOS}/${pedidoId}/estado`,
            {

                method: "PATCH",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    estado: nuevoEstado
                })

            }
        );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                resultado.error ||
                "No se pudo cambiar el estado."
            );
        }


        const pedido = pedidos.find(
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
            "❌ " + error.message
        );
    }
}


// =====================================================
// FILTROS
// =====================================================

document
    .querySelectorAll(".order-filter")
    .forEach(boton => {

        boton.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".order-filter")
                    .forEach(b =>
                        b.classList.remove("active")
                    );


                boton.classList.add("active");


                filtroActual =
                    boton.dataset.filter;


                mostrarPedidos();

            }
        );

    });


// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }


    const fechaObjeto =
        new Date(fecha);


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
// TEXTO ESTADO
// =====================================================

function obtenerTextoEstado(estado) {

    const estados = {

        en_proceso_pago:
            "🟡 En proceso de pago",

        nuevo:
            "🆕 Nuevo",

        confirmado:
            "✅ Confirmado",

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

function obtenerTextoEntrega(entrega) {

    if (entrega === "delivery") {
        return "🛵 Delivery";
    }


    if (entrega === "retiro") {
        return "🏪 Retiro";
    }


    return entrega || "—";
}


// =====================================================
// TEXTO PAGO
// =====================================================

function obtenerTextoPago(pago) {

    if (pago === "efectivo") {
        return "💵 Efectivo";
    }


    if (pago === "mercado_pago") {
        return "💳 Mercado Pago";
    }


    return pago || "—";
}


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
