```javascript
const API_PEDIDOS = "/api/pedidos";

let pedidos = [];
let pedidosAnteriores = [];
let filtroActual = "todos";

let sonidoActivado = false;
let audioContext = null;

const ordersList = document.getElementById("ordersList");
const pedidosNuevos = document.getElementById("pedidosNuevos");


// =====================================================
// SONIDO DE NUEVO PEDIDO
// =====================================================

// Inicializar sonido
function iniciarSonido() {

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }

        if (audioContext.state === "suspended") {

            audioContext.resume();

        }

        sonidoActivado = true;

        console.log("🔔 Sonido de pedidos activado.");

    } catch (error) {

        console.error(
            "ERROR ACTIVANDO SONIDO:",
            error
        );

    }

}


// Activar el sonido cuando el usuario interactúa
document.addEventListener(
    "click",
    iniciarSonido,
    { once: true }
);


// =====================================================
// GENERAR SONIDO
// =====================================================

function reproducirSonidoPedido() {

    if (!sonidoActivado || !audioContext) {

        return;

    }


    try {

        const ahora =
            audioContext.currentTime;


        // =============================================
        // PRIMER TONO
        // =============================================

        const oscilador1 =
            audioContext.createOscillator();

        const ganancia1 =
            audioContext.createGain();


        oscilador1.type = "sine";


        oscilador1.frequency.setValueAtTime(
            880,
            ahora
        );


        ganancia1.gain.setValueAtTime(
            0.001,
            ahora
        );


        ganancia1.gain.exponentialRampToValueAtTime(
            0.35,
            ahora + 0.03
        );


        ganancia1.gain.exponentialRampToValueAtTime(
            0.001,
            ahora + 0.35
        );


        oscilador1.connect(
            ganancia1
        );


        ganancia1.connect(
            audioContext.destination
        );


        oscilador1.start(
            ahora
        );


        oscilador1.stop(
            ahora + 0.35
        );


        // =============================================
        // SEGUNDO TONO
        // =============================================

        const oscilador2 =
            audioContext.createOscillator();

        const ganancia2 =
            audioContext.createGain();


        oscilador2.type = "sine";


        oscilador2.frequency.setValueAtTime(
            1174,
            ahora + 0.18
        );


        ganancia2.gain.setValueAtTime(
            0.001,
            ahora + 0.18
        );


        ganancia2.gain.exponentialRampToValueAtTime(
            0.35,
            ahora + 0.21
        );


        ganancia2.gain.exponentialRampToValueAtTime(
            0.001,
            ahora + 0.55
        );


        oscilador2.connect(
            ganancia2
        );


        ganancia2.connect(
            audioContext.destination
        );


        oscilador2.start(
            ahora + 0.18
        );


        oscilador2.stop(
            ahora + 0.55
        );


    } catch (error) {

        console.error(
            "ERROR SONIDO:",
            error
        );

    }

}


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


        const nuevosPedidos =
            await respuesta.json();


        // =============================================
        // DETECTAR PEDIDOS NUEVOS
        // =============================================

        if (pedidosAnteriores.length > 0) {

            const idsAnteriores =
                pedidosAnteriores.map(
                    pedido =>
                        Number(pedido.id)
                );


            const pedidosNuevosDetectados =
                nuevosPedidos.filter(pedido =>

                    pedido.estado === "nuevo" &&

                    !idsAnteriores.includes(
                        Number(pedido.id)
                    )

                );


            if (
                pedidosNuevosDetectados.length > 0
            ) {

                console.log(
                    "🔔 NUEVO PEDIDO DETECTADO:",
                    pedidosNuevosDetectados
                );


                reproducirSonidoPedido();

            }

        }


        // =============================================
        // GUARDAR PEDIDOS ACTUALES
        // =============================================

        pedidos =
            nuevosPedidos;


        pedidosAnteriores =
            nuevosPedidos.map(pedido => ({

                id: pedido.id,

                estado: pedido.estado

            }));


        mostrarPedidos();


    } catch (error) {

        console.error(
            "ERROR PEDIDOS:",
            error
        );


        if (ordersList) {

            ordersList.innerHTML = `

                <div class="empty-orders">

                    <h3>
                        Error al cargar los pedidos
                    </h3>

                    <p>
                        ${escaparHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    }

}


// =====================================================
// MOSTRAR PEDIDOS
// =====================================================

function mostrarPedidos() {

    if (!ordersList) {

        return;

    }


    ordersList.innerHTML = "";


    const cantidadNuevos =
        pedidos.filter(
            pedido =>
                pedido.estado === "nuevo"
        ).length;


    if (pedidosNuevos) {

        pedidosNuevos.textContent =

            `${cantidadNuevos} pedido${
                cantidadNuevos !== 1
                    ? "s"
                    : ""
            } nuevo${
                cantidadNuevos !== 1
                    ? "s"
                    : ""
            }`;

    }


    let pedidosFiltrados =
        pedidos.filter(
            pedido =>
                pedido.estado !==
                "en_proceso_pago"
        );


    if (filtroActual !== "todos") {

        pedidosFiltrados =
            pedidosFiltrados.filter(
                pedido =>
                    pedido.estado ===
                    filtroActual
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

function crearTarjetaPedido(pedido) {

    const tarjeta =
        document.createElement("div");


    tarjeta.className =
        "order-card";


    if (pedido.estado === "nuevo") {

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


    let informacionCambio = "";


    if (
        pedido.forma_pago ===
        "efectivo"
    ) {

        if (

            pedido.necesita_cambio === true ||

            pedido.necesita_cambio ===
                "true"

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

                    ? `

                        <span class="new-label">
                            🔔 NUEVO PEDIDO
                        </span>

                    `

                    : ""

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

            ? `

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
// BOTONES
// =====================================================

function crearBotonesEstado(pedido) {

    const botonImprimir = `

        <button
            class="btn-print"
            onclick="imprimirPedido(${pedido.id})"
        >
            🖨️ Imprimir ticket
        </button>

    `;


    const botonPDF = `

        <button
            class="btn-print"
            onclick="guardarPDF(${pedido.id})"
        >
            📄 Guardar PDF
        </button>

    `;


    if (
        pedido.estado ===
        "cancelado"
    ) {

        return `

            ${botonImprimir}

            ${botonPDF}

            <button
                class="btn-confirm"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'nuevo'
                )"
            >

                ↩️ Reactivar

            </button>

        `;

    }


    if (
        pedido.estado ===
        "entregado"
    ) {

        return `

            ${botonImprimir}

            ${botonPDF}

            <button
                class="btn-cancel"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'cancelado'
                )"
            >

                ❌ Cancelar

            </button>

        `;

    }


    if (
        pedido.estado ===
        "nuevo"
    ) {

        return `

            ${botonImprimir}

            ${botonPDF}

            <button
                class="btn-preparing"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'preparando'
                )"
            >

                👨‍🍳 Comenzar a preparar

            </button>


            <button
                class="btn-cancel"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'cancelado'
                )"
            >

                ❌ Cancelar

            </button>

        `;

    }


    if (
        pedido.estado ===
        "preparando"
    ) {

        return `

            ${botonImprimir}

            ${botonPDF}

            <button
                class="btn-ready"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'listo'
                )"
            >

                🍔 Listo

            </button>


            <button
                class="btn-cancel"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'cancelado'
                )"
            >

                ❌ Cancelar

            </button>

        `;

    }


    if (
        pedido.estado ===
        "listo"
    ) {

        return `

            ${botonImprimir}

            ${botonPDF}

            <button
                class="btn-delivered"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'entregado'
                )"
            >

                🛵 Entregado

            </button>


            <button
                class="btn-cancel"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'cancelado'
                )"
            >

                ❌ Cancelar

            </button>

        `;

    }


    return `

        ${botonImprimir}

        ${botonPDF}

    `;

}


// =====================================================
// DETALLE DEL PEDIDO
// =====================================================

async function cargarDetallePedido(
    pedidoId
) {

    try {

        const respuesta =
            await fetch(
                `${API_PEDIDOS}/${pedidoId}`
            );


        if (!respuesta.ok) {

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
// OBTENER DATOS DEL PEDIDO
// =====================================================

async function obtenerDatosPedido(
    pedidoId
) {

    const pedido =
        pedidos.find(
            p =>
                Number(p.id) ===
                Number(pedidoId)
        );


    if (!pedido) {

        throw new Error(
            "No se encontró el pedido."
        );

    }


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


    return {

        pedido: pedido,

        productos:
            resultado.productos || []

    };

}


// =====================================================
// CREAR CONTENIDO DEL TICKET
// =====================================================

function crearTicketHTML(
    pedido,
    productos
) {

    let productosHTML = "";


    productos.forEach(
        producto => {

            productosHTML += `

                <div class="producto">

                    <div class="producto-nombre">

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
                            producto.precio_unitario ||
                            0
                        ).toLocaleString(
                            "es-UY"
                        )}

                    </div>


                    <strong
                        class="producto-precio"
                    >

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


    let cambioHTML = "";


    if (

        pedido.forma_pago ===
            "efectivo" &&

        (

            pedido.necesita_cambio ===
                true ||

            pedido.necesita_cambio ===
                "true"

        )

    ) {

        const pagaCon =
            Number(
                pedido.cambio_de || 0
            );


        const total =
            Number(
                pedido.total || 0
            );


        const vuelto =
            pagaCon - total;


        cambioHTML = `

            <div class="info cambio">

                <strong>
                    PAGA CON:
                </strong>

                $${pagaCon.toLocaleString(
                    "es-UY"
                )}

                <br>

                <strong>
                    VUELTO:
                </strong>

                $${vuelto.toLocaleString(
                    "es-UY"
                )}

            </div>

        `;

    }


    return `

        <div class="ticket">


            <div class="logo-container">

                <img
                    src="/img/logoim.jpeg"
                    class="logo-imagen"
                    alt="Flame Burger"
                >

            </div>


            <div class="centro">

                <div class="titulo-ticket">
                    COMPROBANTE DE PEDIDO
                </div>

                <div class="pedido">
                    PEDIDO #${pedido.id}
                </div>

            </div>


            <div class="linea"></div>


            <div class="info">

                <strong>
                    FECHA:
                </strong>

                ${formatearFecha(
                    pedido.creado_en
                )}

                <br>


                <strong>
                    CLIENTE:
                </strong>

                ${escaparHTML(
                    pedido.cliente_nombre ||
                    "Sin nombre"
                )}

                <br>


                <strong>
                    TELÉFONO:
                </strong>

                ${escaparHTML(
                    pedido.cliente_telefono ||
                    pedido.telefono ||
                    "Sin teléfono"
                )}

                <br>


                <strong>
                    ENTREGA:
                </strong>

                ${obtenerTextoEntrega(
                    pedido.tipo_entrega
                )}

                <br>


                ${
                    pedido.tipo_entrega ===
                    "delivery"

                    ? `

                        <strong>
                            DIRECCIÓN:
                        </strong>

                        ${escaparHTML(
                            pedido.cliente_direccion ||
                            pedido.direccion ||
                            "—"
                        )}

                        <br>

                    `

                    : ""

                }


                <strong>
                    PAGO:
                </strong>

                ${obtenerTextoPago(
                    pedido.forma_pago
                )}

            </div>


            <div class="linea"></div>


            <div class="titulo-productos">
                PRODUCTOS
            </div>


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


            ${cambioHTML}


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


            <div class="centro gracias">

                Gracias por tu compra

            </div>


            <div class="botones">

                <button
                    class="boton"
                    onclick="window.print()"
                >

                    🖨️ IMPRIMIR TICKET

                </button>


                <button
                    class="boton pdf"
                    onclick="window.print()"
                >

                    📄 GUARDAR PDF

                </button>

            </div>


        </div>

    `;

}


// =====================================================
// ABRIR TICKET
// =====================================================

async function abrirTicket(
    pedidoId
) {

    try {

        const datos =
            await obtenerDatosPedido(
                pedidoId
            );


        const ventana =
            window.open(
                "",
                "_blank",
                "width=450,height=800"
            );


        if (!ventana) {

            alert(
                "⚠️ El navegador bloqueó la ventana. Permití las ventanas emergentes para esta página."
            );

            return;

        }


        ventana.document.write(`

<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<title>
Pedido #${datos.pedido.id}
</title>


<style>

@page {

    size: 80mm auto;

    margin: 0;

}


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

    color: black;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    font-size: 12px;

}


.ticket {

    width: 80mm;

    max-width: 80mm;

    margin: auto;

    padding: 4mm;

}


.centro {

    text-align: center;

}


.logo-container {

    width: 100%;

    display: flex;

    justify-content: center;

    align-items: center;

    margin-bottom: 3mm;

}


.logo-imagen {

    display: block;

    width: 48mm;

    max-width: 100%;

    max-height: 30mm;

    height: auto;

    object-fit: contain;

}


.titulo-ticket {

    font-size: 12px;

    font-weight: bold;

    margin-top: 2mm;

}


.pedido {

    font-size: 20px;

    font-weight: bold;

    margin: 5px 0;

}


.linea {

    border-top: 1px dashed black;

    margin: 8px 0;

}


.info {

    line-height: 1.6;

}


.producto {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 8px;

    margin: 8px 0;

    line-height: 1.3;

}


.producto-nombre {

    flex: 1;

    min-width: 0;

}


.producto-precio {

    white-space: nowrap;

}


.titulo-productos {

    font-weight: bold;

    margin-bottom: 5px;

}


.cambio {

    line-height: 1.7;

}


.total {

    display: flex;

    justify-content: space-between;

    font-size: 20px;

    font-weight: bold;

    margin-top: 10px;

}


.observaciones {

    margin-top: 8px;

    line-height: 1.4;

}


.gracias {

    font-weight: bold;

    margin-top: 5px;

    margin-bottom: 5px;

}


.botones {

    margin-top: 20px;

}


.boton {

    width: 100%;

    border: 0;

    padding: 12px;

    margin-top: 8px;

    background: black;

    color: white;

    font-size: 14px;

    font-weight: bold;

    cursor: pointer;

    border-radius: 4px;

}


.boton.pdf {

    background: #555;

}


@media print {

    .botones {

        display: none !important;

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

        margin: 0 auto;

    }


    .logo-imagen {

        width: 48mm;

        max-width: 100%;

        max-height: 30mm;

    }

}

</style>

</head>


<body>

${crearTicketHTML(
    datos.pedido,
    datos.productos
)}


<script>

window.onload = function() {

    setTimeout(function() {

        window.print();

    }, 500);

};


window.onafterprint = function() {

    setTimeout(function() {

        window.close();

    }, 300);

};

</script>


</body>

</html>

        `);


        ventana.document.close();

        ventana.focus();


    } catch (error) {

        console.error(
            "ERROR TICKET:",
            error
        );


        alert(
            "❌ " + error.message
        );

    }

}


// =====================================================
// IMPRIMIR TICKET
// =====================================================

async function imprimirPedido(
    pedidoId
) {

    await abrirTicket(
        pedidoId
    );

}


// =====================================================
// GUARDAR PDF
// =====================================================

async function guardarPDF(
    pedidoId
) {

    await abrirTicket(
        pedidoId
    );

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
                `¿Cambiar el pedido #${pedidoId} a "${obtenerTextoEstado(
                    nuevoEstado
                )}"?`
            );


        if (!confirmar) {

            return;

        }


        const respuesta =
            await fetch(
                `${API_PEDIDOS}/${pedidoId}/estado`,
                {

                    method: "PATCH",

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


        if (!respuesta.ok) {

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
            "❌ " + error.message
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
// FECHA
// =====================================================

function formatearFecha(
    fecha
) {

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
// ESTADO
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
// ENTREGA
// =====================================================

function obtenerTextoEntrega(
    entrega
) {

    if (
        entrega ===
        "delivery"
    ) {

        return "🛵 Delivery";

    }


    if (
        entrega ===
        "retiro"
    ) {

        return "🏪 Retiro";

    }


    return entrega || "—";

}


// =====================================================
// PAGO
// =====================================================

function obtenerTextoPago(
    pago
) {

    if (
        pago ===
        "efectivo"
    ) {

        return "💵 Efectivo";

    }


    if (
        pago ===
        "mercado_pago"
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
// ACTUALIZAR PEDIDOS
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
