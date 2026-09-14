```javascript
const API_PEDIDOS = "/api/pedidos";

let pedidos = [];
let filtroActual = "todos";

const ordersList =
    document.getElementById("ordersList");

const pedidosNuevos =
    document.getElementById("pedidosNuevos");


// =====================================================
// CARGAR PEDIDOS
// =====================================================

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


// =====================================================
// MOSTRAR PEDIDOS
// =====================================================

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


// =====================================================
// CREAR TARJETA DEL PEDIDO
// =====================================================

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


    // =====================================================
    // INFORMACIÓN DE CAMBIO
    // =====================================================

    let informacionCambio = "";


    if (
        pedido.forma_pago === "efectivo"
    ) {

        if (
            pedido.necesita_cambio === true ||
            pedido.necesita_cambio === "true"
        ) {

            const total =
                Number(
                    pedido.total || 0
                );


            const cambioDe =
                Number(
                    pedido.cambio_de || 0
                );


            const vuelto =
                cambioDe - total;


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
                        $${cambioDe.toLocaleString(
                            "es-UY"
                        )}
                    </strong>

                </div>


                <div class="order-info">

                    <span>
                        VUELTO
                    </span>

                    <strong>
                        $${vuelto.toLocaleString(
                            "es-UY"
                        )}
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


// =====================================================
// BOTONES DE ESTADO
// =====================================================

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


// =====================================================
// CARGAR DETALLE DEL PEDIDO
// =====================================================

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
// IMPRIMIR PEDIDO
// =====================================================
// Genera un ticket HTML y lo abre en una nueva ventana.
// NO utiliza /imprimir, TCP ni agente local.
// La impresión se hace mediante el navegador.

// =====================================================

async function imprimirPedido(
    pedidoId
) {

    try {

        // -------------------------------------------------
        // BUSCAR PEDIDO
        // -------------------------------------------------

        const pedido =
            pedidos.find(
                p =>
                    Number(p.id) ===
                    Number(pedidoId)
            );


        if (!pedido) {

            alert(
                "❌ No se encontró el pedido."
            );

            return;

        }


        // -------------------------------------------------
        // OBTENER PRODUCTOS
        // -------------------------------------------------

        const respuesta =
            await fetch(
                `${API_PEDIDOS}/${pedidoId}`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar los productos."
            );

        }


        const resultado =
            await respuesta.json();


        const productos =
            resultado.productos || [];


        // -------------------------------------------------
        // GENERAR PRODUCTOS
        // -------------------------------------------------

        let productosHTML = "";


        productos.forEach(
            producto => {

                productosHTML += `

                    <div class="ticket-producto">

                        <div>

                            <strong>
                                ${escaparHTML(
                                    producto.nombre ||
                                    "Producto"
                                )}
                            </strong>

                            <div>

                                ${producto.cantidad}
                                x
                                $${Number(
                                    producto.precio_unitario ||
                                    0
                                ).toLocaleString(
                                    "es-UY"
                                )}

                            </div>

                        </div>


                        <strong>

                            $${Number(
                                producto.subtotal ||
                                0
                            ).toLocaleString(
                                "es-UY"
                            )}

                        </strong>

                    </div>

                `;

            }
        );


        // -------------------------------------------------
        // CAMBIO
        // -------------------------------------------------

        const cambio =
            pedido.cambio_de
                ? Number(pedido.cambio_de)
                : null;


        const vuelto =
            cambio !== null
                ? cambio -
                    Number(
                        pedido.total || 0
                    )
                : null;


        // -------------------------------------------------
        // ABRIR VENTANA
        // -------------------------------------------------

        const ventana =
            window.open(
                "",
                "_blank",
                "width=420,height=750"
            );


        if (!ventana) {

            alert(
                "⚠️ El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes para este sitio."
            );

            return;

        }


        // -------------------------------------------------
        // TICKET
        // -------------------------------------------------

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

                        font-size: 13px;

                    }


                    .ticket {

                        width: 80mm;

                        max-width: 80mm;

                        margin: 0 auto;

                        padding:
                            5mm 3mm;

                    }


                    .centrado {

                        text-align: center;

                    }


                    .logo {

                        font-size: 22px;

                        font-weight: bold;

                        margin-bottom: 4px;

                    }


                    .titulo {

                        font-size: 14px;

                        font-weight: bold;

                    }


                    .pedido-numero {

                        font-size: 22px;

                        font-weight: bold;

                        margin:
                            8px 0;

                    }


                    .linea {

                        border-top:
                            1px dashed #000;

                        margin:
                            8px 0;

                    }


                    .info {

                        font-size: 12px;

                        line-height: 1.5;

                    }


                    .ticket-producto {

                        display: flex;

                        justify-content:
                            space-between;

                        align-items:
                            flex-start;

                        gap: 8px;

                        margin:
                            8px 0;

                        line-height: 1.35;

                    }


                    .ticket-producto > div:first-child {

                        flex: 1;

                        min-width: 0;

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

                        font-size: 12px;

                        margin-top: 8px;

                        line-height: 1.4;

                    }


                    .boton-imprimir {

                        width: 100%;

                        padding: 12px;

                        margin-top: 20px;

                        border: none;

                        border-radius: 6px;

                        background: #000;

                        color: #fff;

                        font-size: 15px;

                        font-weight: bold;

                        cursor: pointer;

                    }


                    @media print {

                        @page {

                            size: 80mm auto;

                            margin: 0;

                        }


                        body {

                            width: 80mm;

                            margin: 0;

                            padding: 0;

                        }


                        .ticket {

                            width: 80mm;

                            max-width: 80mm;

                            padding:
                                3mm;

                            margin: 0;

                        }


                        .boton-imprimir {

                            display: none;

                        }

                    }

                </style>

            </head>


            <body>


                <div class="ticket">


                    <div class="centrado">


                        <div class="logo">

                            🍔 FLAME BURGER

                        </div>


                        <div class="titulo">

                            COMPROBANTE DE PEDIDO

                        </div>


                        <div class="pedido-numero">

                            PEDIDO #${pedido.id}

                        </div>


                    </div>


                    <div class="linea"></div>


                    <div class="info">


                        <strong>
                            Fecha:
                        </strong>

                        ${formatearFecha(
                            pedido.creado_en
                        )}

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


                    <div class="linea"></div>


                    ${
                        pedido.observaciones
                        ?
                        `

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
                        :
                        ""
                    }


                    ${
                        cambio !== null
                        ?
                        `

                        <div class="info">

                            <br>

                            <strong>
                                Paga con:
                            </strong>

                            $${cambio.toLocaleString(
                                "es-UY"
                            )}

                            <br>


                            <strong>
                                Vuelto:
                            </strong>

                            $${vuelto.toLocaleString(
                                "es-UY"
                            )}

                        </div>

                        `
                        :
                        ""
                    }


                    <div class="total">

                        <span>
                            TOTAL
                        </span>


                        <span>

                            $${Number(
                                pedido.total || 0
                            ).toLocaleString(
                                "es-UY"
                            )}

                        </span>

                    </div>


                    <div class="linea"></div>


                    <div class="centrado">

                        Gracias por tu compra ❤️

                    </div>


                    <button
                        class="boton-imprimir"
                        onclick="window.print()"
                    >

                        🖨️ IMPRIMIR TICKET

                    </button>


                </div>


            </body>

            </html>

        `);


        ventana.document.close();


        // Llevar el foco a la ventana
        ventana.focus();


    } catch (error) {

        console.error(
            "❌ ERROR GENERANDO TICKET:",
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
```
