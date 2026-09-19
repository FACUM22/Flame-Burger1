const API_PEDIDOS = "/api/pedidos";

let pedidos = [];
let filtroActual = "todos";

const listaPedidos = document.getElementById("ordersList");
const contadorNuevos = document.getElementById("pedidosNuevos");

let pedidosAnteriores = [];
let audioContext = null;
let sonidoActivado = false;


// =====================================================
// ACTIVAR SONIDO
// =====================================================

function activarSonido() {

    try {

        if (!audioContext) {

            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        sonidoActivado = true;

    } catch (error) {

        console.error(
            "No se pudo activar el sonido:",
            error
        );

    }

}


// El primer clic en la página habilita el audio
document.addEventListener(
    "click",
    activarSonido,
    { once: true }
);


// =====================================================
// SONIDO DE NUEVO PEDIDO
// =====================================================

function reproducirSonidoPedido() {

    if (!sonidoActivado || !audioContext) {
        return;
    }

    try {

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const ahora =
            audioContext.currentTime;


        // ==========================================
        // NOTIFICACIÓN ORIGINAL
        // ==========================================

        const notas = [

            {
                frecuencia: 1046.50,
                inicio: 0,
                duracion: 0.16,
                volumen: 0.18
            },

            {
                frecuencia: 1318.51,
                inicio: 0.07,
                duracion: 0.20,
                volumen: 0.20
            },

            {
                frecuencia: 1567.98,
                inicio: 0.15,
                duracion: 0.28,
                volumen: 0.16
            }

        ];


        notas.forEach(nota => {

            const oscilador =
                audioContext.createOscillator();

            const ganancia =
                audioContext.createGain();


            oscilador.type = "sine";


            oscilador.frequency.setValueAtTime(
                nota.frecuencia,
                ahora + nota.inicio
            );


            // Pequeño brillo
            oscilador.detune.setValueAtTime(
                8,
                ahora + nota.inicio
            );


            ganancia.gain.setValueAtTime(
                0.0001,
                ahora + nota.inicio
            );


            ganancia.gain.exponentialRampToValueAtTime(
                nota.volumen,
                ahora +
                nota.inicio +
                0.015
            );


            ganancia.gain.exponentialRampToValueAtTime(
                0.0001,
                ahora +
                nota.inicio +
                nota.duracion
            );


            oscilador.connect(
                ganancia
            );


            ganancia.connect(
                audioContext.destination
            );


            oscilador.start(
                ahora + nota.inicio
            );


            oscilador.stop(
                ahora +
                nota.inicio +
                nota.duracion +
                0.05
            );

        });

    } catch (error) {

        console.error(
            "Error reproduciendo sonido:",
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
                "Error al obtener los pedidos"
            );

        }


        const nuevosPedidos =
            await respuesta.json();


        // ==========================================
        // PRIMERA CARGA
        // No hace sonar nada
        // ==========================================

        if (
            pedidosAnteriores.length === 0
        ) {

            pedidosAnteriores =
                nuevosPedidos.map(
                    pedido => ({
                        id: pedido.id,
                        estado: pedido.estado
                    })
                );

        }


        // ==========================================
        // SIGUIENTES CARGAS
        // ==========================================

        else {

            const hayPedidoNuevo =
                nuevosPedidos.some(pedido => {

                    const pedidoAnterior =
                        pedidosAnteriores.find(
                            anterior =>
                                anterior.id ===
                                pedido.id
                        );


                    return (
                        pedido.estado === "nuevo" &&
                        !pedidoAnterior
                    );

                });


            if (hayPedidoNuevo) {

                reproducirSonidoPedido();

            }


            pedidosAnteriores =
                nuevosPedidos.map(
                    pedido => ({
                        id: pedido.id,
                        estado: pedido.estado
                    })
                );

        }


        pedidos =
            nuevosPedidos;


        mostrarPedidos();


    } catch (error) {

        console.error(
            "Error cargando pedidos:",
            error
        );


        if (listaPedidos) {

            listaPedidos.innerHTML = `
                <div class="error">
                    No se pudieron cargar los pedidos.
                </div>
            `;

        }

    }

}


// =====================================================
// MOSTRAR PEDIDOS
// =====================================================

function mostrarPedidos() {

    if (!listaPedidos) {
        return;
    }


    // No mostrar pedidos esperando pago
    const pedidosVisibles =
        pedidos.filter(
            pedido =>
                pedido.estado !==
                "en_proceso_pago"
        );


    // Contar pedidos nuevos
    const nuevos =
        pedidosVisibles.filter(
            pedido =>
                pedido.estado === "nuevo"
        );


    if (contadorNuevos) {

        contadorNuevos.textContent =
            nuevos.length;

    }


    let pedidosFiltrados =
        pedidosVisibles;


    // ==========================================
    // FILTRO
    // ==========================================

    if (filtroActual !== "todos") {

        pedidosFiltrados =
            pedidosVisibles.filter(
                pedido =>
                    pedido.estado ===
                    filtroActual
            );

    }


    // Más recientes primero
    pedidosFiltrados.sort(
        (a, b) => {

            return (
                new Date(b.creado_en) -
                new Date(a.creado_en)
            );

        }
    );


    // ==========================================
    // SIN PEDIDOS
    // ==========================================

    if (
        pedidosFiltrados.length === 0
    ) {

        listaPedidos.innerHTML = `
            <div class="sin-pedidos">
                No hay pedidos para mostrar.
            </div>
        `;

        return;

    }


    listaPedidos.innerHTML = "";


    pedidosFiltrados.forEach(
        pedido => {

            listaPedidos.appendChild(
                crearTarjetaPedido(pedido)
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


    tarjeta.innerHTML = `

        <div class="order-header">

            <div>

                <h3>
                    PEDIDO #${pedido.id}
                </h3>

                <span class="order-date">
                    ${formatearFecha(
                        pedido.creado_en
                    )}
                </span>

            </div>


            <span
                class="estado estado-${pedido.estado}"
            >
                ${obtenerTextoEstado(
                    pedido.estado
                )}
            </span>

        </div>


        <div class="order-body">


            <div class="cliente-info">


                <p>

                    <strong>
                        CLIENTE:
                    </strong>

                    ${escaparHTML(
                        pedido.nombre ||
                        "Sin nombre"
                    )}

                </p>


                <p>

                    <strong>
                        TELÉFONO:
                    </strong>

                    ${escaparHTML(
                        pedido.telefono ||
                        "No indicado"
                    )}

                </p>


                <p>

                    <strong>
                        ENTREGA:
                    </strong>

                    ${obtenerTextoEntrega(
                        pedido
                    )}

                </p>


                ${
                    pedido.direccion
                        ? `

                            <p>

                                <strong>
                                    DIRECCIÓN:
                                </strong>

                                ${escaparHTML(
                                    pedido.direccion
                                )}

                            </p>

                        `
                        : ""
                }


                <p>

                    <strong>
                        PAGO:
                    </strong>

                    ${obtenerTextoPago(
                        pedido
                    )}

                </p>


                ${
                    pedido.cambio
                        ? `

                            <p>

                                <strong>
                                    PRECISA CAMBIO DE:
                                </strong>

                                $${pedido.cambio}

                            </p>

                        `
                        : ""
                }


            </div>


            <div class="productos-pedido">

                <h4>
                    PRODUCTOS
                </h4>


                <div
                    id="productos-${pedido.id}"
                >
                    Cargando productos...
                </div>

            </div>


            ${
                pedido.observaciones
                    ? `

                        <div class="observaciones">

                            <strong>
                                OBSERVACIONES:
                            </strong>

                            <p>
                                ${escaparHTML(
                                    pedido.observaciones
                                )}
                            </p>

                        </div>

                    `
                    : ""
            }


            <div class="order-total">

                <strong>
                    TOTAL:
                </strong>

                <span>
                    $${Number(
                        pedido.total || 0
                    ).toFixed(2)}
                </span>

            </div>


        </div>


        <div class="order-actions">

            ${crearBotonesEstado(
                pedido
            )}

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

function crearBotonesEstado(pedido) {

    let botones = `

        <button
            class="btn-print"
            onclick="imprimirPedido(${pedido.id})"
        >
            🖨️ IMPRIMIR PEDIDO
        </button>


        <button
            class="btn-pdf"
            onclick="guardarPDF(${pedido.id})"
        >
            📄 GUARDAR PDF
        </button>

    `;


    // ==========================================
    // NUEVO
    // ==========================================

    if (
        pedido.estado === "nuevo"
    ) {

        botones += `

            <button
                class="btn-preparar"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'preparando'
                )"
            >
                🍔 COMENZAR A PREPARAR
            </button>


            <button
                class="btn-cancelar"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'cancelado'
                )"
            >
                ❌ CANCELAR
            </button>

        `;

    }


    // ==========================================
    // PREPARANDO
    // ==========================================

    else if (
        pedido.estado === "preparando"
    ) {

        botones += `

            <button
                class="btn-listo"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'listo'
                )"
            >
                ✅ MARCAR COMO LISTO
            </button>

        `;

    }


    // ==========================================
    // LISTO
    // ==========================================

    else if (
        pedido.estado === "listo"
    ) {

        botones += `

            <button
                class="btn-entregado"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'entregado'
                )"
            >
                🏁 MARCAR COMO ENTREGADO
            </button>

        `;

    }


    // ==========================================
    // CANCELADO
    // ==========================================

    else if (
        pedido.estado === "cancelado"
    ) {

        botones += `

            <button
                class="btn-reactivar"
                onclick="cambiarEstado(
                    ${pedido.id},
                    'nuevo'
                )"
            >
                🔄 REACTIVAR PEDIDO
            </button>

        `;

    }


    return botones;

}


// =====================================================
// CARGAR DETALLE
// =====================================================

async function cargarDetallePedido(id) {

    try {

        const respuesta =
            await fetch(
                `${API_PEDIDOS}/${id}`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo obtener el detalle"
            );

        }


        const pedido =
            await respuesta.json();


        const contenedor =
            document.getElementById(
                `productos-${id}`
            );


        if (!contenedor) {
            return;
        }


        const detalles =
            pedido.detalles ||
            pedido.productos ||
            pedido.detalle_pedidos ||
            [];


        if (!detalles.length) {

            contenedor.innerHTML = `
                <p>
                    No hay productos registrados.
                </p>
            `;

            return;

        }


        contenedor.innerHTML =
            detalles.map(
                detalle => {

                    const cantidad =
                        detalle.cantidad || 1;


                    const nombre =
                        detalle.nombre ||
                        detalle.producto_nombre ||
                        detalle.producto?.nombre ||
                        "Producto";


                    const precio =
                        detalle.precio ||
                        detalle.precio_unitario ||
                        detalle.producto?.precio ||
                        0;


                    return `

                        <div
                            class="producto-linea"
                        >

                            <span>

                                ${cantidad} x
                                ${escaparHTML(
                                    nombre
                                )}

                            </span>


                            <strong>

                                $${(
                                    Number(precio) *
                                    Number(cantidad)
                                ).toFixed(2)}

                            </strong>

                        </div>

                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            `Error cargando detalle del pedido ${id}:`,
            error
        );


        const contenedor =
            document.getElementById(
                `productos-${id}`
            );


        if (contenedor) {

            contenedor.innerHTML = `
                <p>
                    No se pudieron cargar los productos.
                </p>
            `;

        }

    }

}


// =====================================================
// OBTENER DATOS DEL PEDIDO
// =====================================================

async function obtenerDatosPedido(id) {

    const respuesta =
        await fetch(
            `${API_PEDIDOS}/${id}`
        );


    if (!respuesta.ok) {

        throw new Error(
            "No se pudo obtener el pedido"
        );

    }


    return await respuesta.json();

}


// =====================================================
// CREAR TICKET
// =====================================================

function crearTicketHTML(pedido) {

    const detalles =
        pedido.detalles ||
        pedido.productos ||
        pedido.detalle_pedidos ||
        [];


    const productosHTML =
        detalles.map(
            detalle => {

                const cantidad =
                    detalle.cantidad || 1;


                const nombre =
                    detalle.nombre ||
                    detalle.producto_nombre ||
                    detalle.producto?.nombre ||
                    "Producto";


                const precio =
                    detalle.precio ||
                    detalle.precio_unitario ||
                    detalle.producto?.precio ||
                    0;


                return `

                    <div class="producto">

                        <div>
                            ${cantidad} x
                            ${escaparHTML(
                                nombre
                            )}
                        </div>


                        <div>

                            $${(
                                Number(precio) *
                                Number(cantidad)
                            ).toFixed(2)}

                        </div>

                    </div>

                `;

            }
        ).join("");


    return `

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

    margin: 0;

    padding: 10px;

    width: 80mm;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    font-size: 12px;

    color: #000;

}


.ticket {

    width: 100%;

}


.logo {

    text-align: center;

    margin-bottom: 8px;

}


.logo img {

    max-width: 55mm;

    max-height: 25mm;

    object-fit: contain;

}


h1 {

    text-align: center;

    font-size: 18px;

    margin: 5px 0;

}


.line {

    border-top:
        1px dashed #000;

    margin: 8px 0;

}


.info {

    margin-bottom: 5px;

}


.producto {

    display: flex;

    justify-content:
        space-between;

    gap: 5px;

    margin: 4px 0;

}


.total {

    display: flex;

    justify-content:
        space-between;

    font-size: 17px;

    font-weight: bold;

    margin-top: 8px;

}


.cambio {

    font-weight: bold;

    margin-top: 8px;

}


.observaciones {

    margin-top: 8px;

}


.footer {

    text-align: center;

    margin-top: 15px;

    font-size: 10px;

}


@media print {

    body {

        padding: 0;

    }

}

</style>

</head>


<body>

<div class="ticket">


    <div class="logo">

        <img
            src="/img/logoim.jpeg"
            alt="Flame Burger"
        >

    </div>


    <h1>
        PEDIDO #${pedido.id}
    </h1>


    <div class="line"></div>


    <div class="info">

        <strong>
            CLIENTE:
        </strong>

        ${escaparHTML(
            pedido.nombre ||
            "Sin nombre"
        )}

    </div>


    <div class="info">

        <strong>
            TELÉFONO:
        </strong>

        ${escaparHTML(
            pedido.telefono ||
            "No indicado"
        )}

    </div>


    <div class="info">

        <strong>
            ENTREGA:
        </strong>

        ${obtenerTextoEntrega(
            pedido
        )}

    </div>


    ${
        pedido.direccion
            ? `

                <div class="info">

                    <strong>
                        DIRECCIÓN:
                    </strong>

                    ${escaparHTML(
                        pedido.direccion
                    )}

                </div>

            `
            : ""
    }


    <div class="info">

        <strong>
            PAGO:
        </strong>

        ${obtenerTextoPago(
            pedido
        )}

    </div>


    ${
        pedido.cambio
            ? `

                <div class="cambio">

                    PRECISA CAMBIO DE:

                    $${pedido.cambio}

                </div>

            `
            : ""
    }


    <div class="line"></div>


    ${productosHTML}


    ${
        pedido.observaciones
            ? `

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


    <div class="line"></div>


    <div class="total">

        <span>
            TOTAL
        </span>

        <span>

            $${Number(
                pedido.total || 0
            ).toFixed(2)}

        </span>

    </div>


    <div class="footer">

        Flame Burger

        <br>

        ¡Gracias por tu compra!

    </div>


</div>

</body>

</html>

    `;

}


// =====================================================
// ABRIR TICKET
// =====================================================

function abrirTicket(pedido) {

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


    ventana.document.write(
        crearTicketHTML(pedido)
    );


    ventana.document.close();

    ventana.focus();


    setTimeout(
        () => {

            ventana.print();


            setTimeout(
                () => {

                    ventana.close();

                },
                1000
            );

        },
        500
    );

}


// =====================================================
// IMPRIMIR PEDIDO
// =====================================================

async function imprimirPedido(id) {

    try {

        const pedido =
            await obtenerDatosPedido(id);


        abrirTicket(pedido);


    } catch (error) {

        console.error(error);


        alert(
            "No se pudo preparar el pedido para imprimir."
        );

    }

}


// =====================================================
// GUARDAR PDF
// =====================================================

async function guardarPDF(id) {

    try {

        const pedido =
            await obtenerDatosPedido(id);


        const ventana =
            window.open(
                "",
                "_blank",
                "width=400,height=700"
            );


        if (!ventana) {

            alert(
                "Permití las ventanas emergentes para guardar el PDF."
            );

            return;

        }


        ventana.document.write(
            crearTicketHTML(pedido)
        );


        ventana.document.close();

        ventana.focus();


        setTimeout(
            () => {

                ventana.print();

            },
            500
        );


    } catch (error) {

        console.error(error);


        alert(
            "No se pudo generar el PDF."
        );

    }

}


// =====================================================
// CAMBIAR ESTADO
// =====================================================

async function cambiarEstado(
    id,
    nuevoEstado
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
                        estado: nuevoEstado
                    })

                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo cambiar el estado"
            );

        }


        await cargarPedidos();


    } catch (error) {

        console.error(error);


        alert(
            "No se pudo actualizar el estado del pedido."
        );

    }

}


// =====================================================
// FILTROS
// =====================================================

document
    .querySelectorAll(".order-filter")
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
                            btn =>
                                btn.classList.remove(
                                    "active"
                                )
                        );


                    boton.classList.add(
                        "active"
                    );


                    filtroActual =
                        boton.dataset.filter ||
                        "todos";


                    mostrarPedidos();

                }
            );

        }
    );


// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }


    const fechaObj =
        new Date(fecha);


    return fechaObj.toLocaleString(
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
// TEXTO DEL ESTADO
// =====================================================

function obtenerTextoEstado(estado) {

    const estados = {

        nuevo:
            "NUEVO",

        preparando:
            "PREPARANDO",

        listo:
            "LISTO",

        entregado:
            "ENTREGADO",

        cancelado:
            "CANCELADO",

        en_proceso_pago:
            "ESPERANDO PAGO"

    };


    return (
        estados[estado] ||
        estado
    );

}


// =====================================================
// TEXTO ENTREGA
// =====================================================

function obtenerTextoEntrega(pedido) {

    if (

        pedido.tipo_entrega ===
            "delivery"

        ||

        pedido.entrega ===
            "delivery"

    ) {

        return "DELIVERY";

    }


    return "RETIRO EN LOCAL";

}


// =====================================================
// TEXTO PAGO
// =====================================================

function obtenerTextoPago(pedido) {

    const metodo =
        pedido.metodo_pago ||
        pedido.pago ||
        "";


    const metodoNormalizado =
        metodo.toLowerCase();


    if (
        metodoNormalizado.includes(
            "mercado"
        )
    ) {

        return "MERCADO PAGO";

    }


    if (
        metodoNormalizado.includes(
            "efectivo"
        )
    ) {

        return "EFECTIVO";

    }


    return metodo ||
        "No indicado";

}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTML(texto) {

    return String(texto)

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
// ACTUALIZAR CADA 10 SEGUNDOS
// =====================================================

setInterval(
    cargarPedidos,
    10000
);


// =====================================================
// CARGA INICIAL
// =====================================================

cargarPedidos();
