const API_BASE =
    "/api/dashboard/resumen";


let periodoActual = "hoy";


// =====================================================
// ELEMENTOS
// =====================================================

const fechaDesde =
    document.getElementById(
        "fechaDesde"
    );

const fechaHasta =
    document.getElementById(
        "fechaHasta"
    );

const aplicarFechas =
    document.getElementById(
        "aplicarFechas"
    );

const periodoTexto =
    document.getElementById(
        "periodoTexto"
    );


// =====================================================
// FORMATO DINERO
// =====================================================

function dinero(valor) {

    return "$" +
        Number(
            valor || 0
        ).toLocaleString(
            "es-UY",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}


// =====================================================
// FORMATO FECHA
// =====================================================

function formatoFecha(
    fecha
) {

    const partes =
        fecha.split("-");

    return `${partes[2]}/${partes[1]}`;

}


// =====================================================
// FECHA LOCAL YYYY-MM-DD
// =====================================================

function fechaLocal(
    fecha = new Date()
) {

    const year =
        fecha.getFullYear();

    const month =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// =====================================================
// DEFINIR PERÍODO
// =====================================================

function obtenerPeriodo(
    periodo
) {

    const hoy =
        new Date();


    let desde;
    let hasta;


    // HOY
    if (
        periodo === "hoy"
    ) {

        desde =
            fechaLocal(hoy);

        hasta =
            fechaLocal(hoy);

        periodoTexto.textContent =
            "Hoy";

    }


    // AYER
    else if (
        periodo === "ayer"
    ) {

        const ayer =
            new Date(hoy);

        ayer.setDate(
            ayer.getDate() - 1
        );


        desde =
            fechaLocal(ayer);

        hasta =
            fechaLocal(ayer);

        periodoTexto.textContent =
            "Ayer";

    }


    // ÚLTIMOS 7 DÍAS
    else if (
        periodo === "7dias"
    ) {

        const inicio =
            new Date(hoy);

        inicio.setDate(
            inicio.getDate() - 6
        );


        desde =
            fechaLocal(inicio);

        hasta =
            fechaLocal(hoy);

        periodoTexto.textContent =
            "Últimos 7 días";

    }


    // ESTE MES
    else if (
        periodo === "mes"
    ) {

        const inicio =
            new Date(
                hoy.getFullYear(),
                hoy.getMonth(),
                1
            );


        desde =
            fechaLocal(inicio);

        hasta =
            fechaLocal(hoy);

        periodoTexto.textContent =
            "Este mes";

    }


    // MES ANTERIOR
    else if (
        periodo === "mesAnterior"
    ) {

        const inicio =
            new Date(
                hoy.getFullYear(),
                hoy.getMonth() - 1,
                1
            );


        const fin =
            new Date(
                hoy.getFullYear(),
                hoy.getMonth(),
                0
            );


        desde =
            fechaLocal(inicio);

        hasta =
            fechaLocal(fin);

        periodoTexto.textContent =
            "Mes anterior";

    }


    return {
        desde,
        hasta
    };

}


// =====================================================
// CARGAR DASHBOARD
// =====================================================

async function cargarDashboard(
    desde,
    hasta
) {

    try {

        const url =
            `${API_BASE}?desde=${desde}&hasta=${hasta}`;


        const respuesta =
            await fetch(url);


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo cargar el dashboard."
            );

        }


        const datos =
            await respuesta.json();


        mostrarResumen(
            datos
        );


    } catch (error) {

        console.error(
            "Dashboard:",
            error
        );

    }

}


// =====================================================
// MOSTRAR RESUMEN
// =====================================================

function mostrarResumen(
    datos
) {

    const resumen =
        datos.resumen;


    document.getElementById(
        "ventasHoy"
    ).textContent =
        dinero(
            resumen.ventas
        );


    document.getElementById(
        "pedidosHoy"
    ).textContent =
        resumen.pedidos;


    document.getElementById(
        "canceladosHoy"
    ).textContent =
        resumen.cancelados;


    document.getElementById(
        "ticketPromedio"
    ).textContent =
        dinero(
            resumen.ticketPromedio
        );


    document.getElementById(
        "deliveryHoy"
    ).textContent =
        resumen.delivery;


    document.getElementById(
        "retiroHoy"
    ).textContent =
        resumen.retiro;


    mostrarFormasPago(
        datos.formasPago
    );


    mostrarVentasPorDia(
        datos.ventasPorDia
    );


    mostrarProductosVendidos(
        datos.productosVendidos
    );

}


// =====================================================
// FORMAS DE PAGO
// =====================================================

function mostrarFormasPago(
    formasPago
) {

    const contenedor =
        document.getElementById(
            "formasPago"
        );


    if (
        !formasPago ||
        formasPago.length === 0
    ) {

        contenedor.innerHTML = `
            <div class="empty-dashboard">
                💳
                <p>
                    No hay ventas en este período.
                </p>
            </div>
        `;

        return;
    }


    contenedor.innerHTML = "";


    formasPago.forEach(
        forma => {

            const fila =
                document.createElement(
                    "div"
                );


            fila.className =
                "dashboard-row";


            fila.innerHTML = `

                <div>

                    <strong>
                        ${textoPago(
                            forma.forma_pago
                        )}
                    </strong>

                    <small>
                        ${forma.cantidad}
                        pedidos
                    </small>

                </div>


                <span>
                    ${dinero(
                        forma.total
                    )}
                </span>

            `;


            contenedor.appendChild(
                fila
            );

        }
    );

}


// =====================================================
// PRODUCTOS
// =====================================================

function mostrarProductosVendidos(
    productos
) {

    const contenedor =
        document.getElementById(
            "productosVendidos"
        );


    if (
        !productos ||
        productos.length === 0
    ) {

        contenedor.innerHTML = `
            <div class="empty-dashboard">
                🍔
                <p>
                    No hay productos vendidos.
                </p>
            </div>
        `;

        return;
    }


    contenedor.innerHTML = "";


    productos.forEach(
        (producto, index) => {

            const fila =
                document.createElement(
                    "div"
                );


            fila.className =
                "dashboard-row";


            fila.innerHTML = `

                <div>

                    <strong>
                        ${index + 1}.
                        ${escaparHTML(
                            producto.nombre
                        )}
                    </strong>

                    <small>
                        ${producto.cantidad}
                        unidades
                    </small>

                </div>


                <span>
                    ${dinero(
                        producto.ventas
                    )}
                </span>

            `;


            contenedor.appendChild(
                fila
            );

        }
    );

}


// =====================================================
// VENTAS POR DÍA
// =====================================================

function mostrarVentasPorDia(
    ventas
) {

    const contenedor =
        document.getElementById(
            "ventasPorDia"
        );


    if (
        !ventas ||
        ventas.length === 0
    ) {

        contenedor.innerHTML = `
            <div class="empty-dashboard">
                📊
                <p>
                    No hay ventas en este período.
                </p>
            </div>
        `;

        return;
    }


    contenedor.innerHTML = "";


    const maxVentas =
        Math.max(
            ...ventas.map(
                item =>
                    Number(
                        item.ventas
                    )
            ),
            1
        );


    ventas.forEach(
        item => {

            const porcentaje =
                (
                    Number(
                        item.ventas
                    ) /
                    maxVentas
                ) *
                100;


            const fila =
                document.createElement(
                    "div"
                );


            fila.className =
                "venta-dia";


            fila.innerHTML = `

                <div class="venta-dia-header">

                    <strong>
                        ${formatoFecha(
                            item.fecha
                        )}
                    </strong>

                    <span>
                        ${dinero(
                            item.ventas
                        )}
                    </span>

                </div>


                <div
                    class="venta-barra-fondo"
                >

                    <div
                        class="venta-barra"
                        style="
                            width:${porcentaje}%;
                        "
                    ></div>

                </div>


                <small>
                    ${item.pedidos}
                    pedidos
                    ${
                        Number(
                            item.cancelados
                        ) > 0
                            ? ` · ${item.cancelados} cancelados`
                            : ""
                    }
                </small>

            `;


            contenedor.appendChild(
                fila
            );

        }
    );

}
// =====================================================
// CONTROL DE ESTADO DE LA PÁGINA
// =====================================================

const estadoPaginaPunto =
    document.getElementById("estadoPaginaPunto");

const estadoPaginaTexto =
    document.getElementById("estadoPaginaTexto");

const estadoPaginaDescripcion =
    document.getElementById("estadoPaginaDescripcion");

const botonEstadoPagina =
    document.getElementById("botonEstadoPagina");


// =====================================================
// CARGAR ESTADO DE LA PÁGINA
// =====================================================

async function cargarEstadoPagina() {

    try {

        const respuesta = await fetch(
            "/api/configuracion/estado",
            {
                cache: "no-store"
            }
        );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo obtener el estado de la página."
            );

        }


        const datos =
            await respuesta.json();


        actualizarEstadoPagina(
            datos.pagina_activa,
            datos.cerrado_por_horario
        );


    } catch (error) {

        console.error(
            "ERROR ESTADO PÁGINA:",
            error
        );


        if (estadoPaginaTexto) {

            estadoPaginaTexto.textContent =
                "Error";

        }


        if (estadoPaginaDescripcion) {

            estadoPaginaDescripcion.textContent =
                "No se pudo consultar el estado.";

        }


        if (botonEstadoPagina) {

            botonEstadoPagina.textContent =
                "Reintentar";

        }

    }

}


// =====================================================
// ACTUALIZAR VISUALMENTE EL ESTADO
// =====================================================

function actualizarEstadoPagina(activa, cerradoPorHorario) {

    if (
        !estadoPaginaPunto ||
        !estadoPaginaTexto ||
        !estadoPaginaDescripcion ||
        !botonEstadoPagina
    ) {

        return;

    }


    // =====================================================
    // MIÉRCOLES: CERRADO AUTOMÁTICO
    // =====================================================
    // Ese día no tiene sentido dejar tocar el botón: la
    // página se apaga sola y se vuelve a encender sola
    // el jueves.

    if (cerradoPorHorario) {

        estadoPaginaPunto.classList.remove("active");
        estadoPaginaPunto.classList.add("inactive");

        estadoPaginaTexto.textContent =
            "Página apagada (miércoles)";

        estadoPaginaDescripcion.textContent =
            "Hoy es miércoles: la página se cierra automáticamente y se vuelve a encender sola el jueves.";

        botonEstadoPagina.textContent =
            "Cerrado los miércoles";

        botonEstadoPagina.disabled = true;

        botonEstadoPagina.classList.remove("turn-off");
        botonEstadoPagina.classList.add("turn-on");

        return;

    }


    botonEstadoPagina.disabled = false;


    if (activa) {

        // PUNTO VERDE

        estadoPaginaPunto.classList.remove(
            "inactive"
        );

        estadoPaginaPunto.classList.add(
            "active"
        );


        // TEXTO

        estadoPaginaTexto.textContent =
            "Página activa";


        estadoPaginaDescripcion.textContent =
            "La web está recibiendo pedidos.";


        // BOTÓN

        botonEstadoPagina.textContent =
            "🔴 Apagar página";


        botonEstadoPagina.classList.remove(
            "turn-on"
        );

        botonEstadoPagina.classList.add(
            "turn-off"
        );


    } else {

        // PUNTO ROJO

        estadoPaginaPunto.classList.remove(
            "active"
        );

        estadoPaginaPunto.classList.add(
            "inactive"
        );


        // TEXTO

        estadoPaginaTexto.textContent =
            "Página apagada";


        estadoPaginaDescripcion.textContent =
            "La web no está recibiendo pedidos.";


        // BOTÓN

        botonEstadoPagina.textContent =
            "🟢 Encender página";


        botonEstadoPagina.classList.remove(
            "turn-off"
        );

        botonEstadoPagina.classList.add(
            "turn-on"
        );

    }

}


// =====================================================
// CAMBIAR ESTADO
// =====================================================

async function cambiarEstadoPagina() {

    try {

        if (!botonEstadoPagina) {
            return;
        }


        botonEstadoPagina.disabled = true;

        botonEstadoPagina.textContent =
            "Guardando...";


        // Obtener estado actual

        const respuestaEstado =
            await fetch(
                "/api/configuracion/estado",
                {
                    cache: "no-store"
                }
            );


        if (!respuestaEstado.ok) {

            throw new Error(
                "No se pudo consultar el estado actual."
            );

        }


        const datosEstado =
            await respuestaEstado.json();


        const nuevoEstado =
            !datosEstado.pagina_activa;


        // Confirmación

        const confirmar = confirm(
            nuevoEstado
                ? "¿Querés ENCENDER la página y volver a recibir pedidos?"
                : "¿Querés APAGAR la página y dejar de recibir pedidos?"
        );


        if (!confirmar) {

            actualizarEstadoPagina(
                datosEstado.pagina_activa,
                datosEstado.cerrado_por_horario
            );

            return;

        }


        // Guardar nuevo estado

        const respuesta =
            await fetch(
                "/api/configuracion/estado",
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        pagina_activa: nuevoEstado
                    })
                }
            );


        if (!respuesta.ok) {

            const error =
                await respuesta.json()
                    .catch(() => ({}));


            throw new Error(
                error.mensaje ||
                "No se pudo cambiar el estado."
            );

        }


        const resultado =
            await respuesta.json();


        actualizarEstadoPagina(
            resultado.pagina_activa
        );


        alert(
            resultado.pagina_activa
                ? "La página está nuevamente ACTIVA."
                : "La página fue APAGADA."
        );


    } catch (error) {

        console.error(
            "ERROR CAMBIANDO ESTADO:",
            error
        );


        alert(
            "No se pudo cambiar el estado de la página.\n\n" +
            error.message
        );


        cargarEstadoPagina();

    }

}


// =====================================================
// EVENTO DEL BOTÓN
// =====================================================

if (botonEstadoPagina) {

    botonEstadoPagina.addEventListener(
        "click",
        cambiarEstadoPagina
    );

}


// =====================================================
// CARGAR ESTADO AL ABRIR DASHBOARD
// =====================================================

cargarEstadoPagina();


// =====================================================
// BOTONES DE PERÍODO
// =====================================================

document
    .querySelectorAll(
        ".period-btn"
    )
    .forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".period-btn"
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


                    periodoActual =
                        boton.dataset.period;


                    const periodo =
                        obtenerPeriodo(
                            periodoActual
                        );


                    fechaDesde.value =
                        periodo.desde;


                    fechaHasta.value =
                        periodo.hasta;


                    cargarDashboard(
                        periodo.desde,
                        periodo.hasta
                    );

                }
            );

        }
    );


// =====================================================
// FECHAS PERSONALIZADAS
// =====================================================

aplicarFechas.addEventListener(
    "click",
    () => {

        const desde =
            fechaDesde.value;

        const hasta =
            fechaHasta.value;


        if (!desde || !hasta) {

            alert(
                "Seleccioná las dos fechas."
            );

            return;
        }


        if (desde > hasta) {

            alert(
                "La fecha desde no puede ser posterior a la fecha hasta."
            );

            return;
        }


        document
            .querySelectorAll(
                ".period-btn"
            )
            .forEach(
                b =>
                    b.classList.remove(
                        "active"
                    )
            );


        periodoTexto.textContent =
            `${desde} → ${hasta}`;


        cargarDashboard(
            desde,
            hasta
        );

    }
);


// =====================================================
// TEXTO PAGO
// =====================================================

function textoPago(
    pago
) {

    const pagos = {

        efectivo:
            "💵 Efectivo",

        mercado_pago:
            "💳 Mercado Pago",

        tarjeta:
            "💳 Tarjeta"

    };


    return pagos[pago] ||
        pago;

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
// INICIAR
// =====================================================

const inicial =
    obtenerPeriodo(
        "hoy"
    );


fechaDesde.value =
    inicial.desde;


fechaHasta.value =
    inicial.hasta;


cargarDashboard(
    inicial.desde,
    inicial.hasta
);
