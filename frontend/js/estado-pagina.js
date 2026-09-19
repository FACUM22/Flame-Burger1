// =====================================================
// ESTADO DE LA PÁGINA - FLAME BURGER
// =====================================================

let paginaActiva = true;


// =====================================================
// ELEMENTOS
// =====================================================

const avisoCerrado =
    document.getElementById("avisoCerrado");

const mensajeCerrado =
    document.getElementById("mensajeCerrado");

const botonPedirAhora =
    document.querySelector(".hero-button");

const botonCheckout =
    document.getElementById("irCheckout");

const botonAbrirCarrito =
    document.getElementById("abrirCarrito");


// =====================================================
// COMPROBAR HORARIO DE FLAME BURGER
// =====================================================

function restauranteEstaAbierto() {

    const ahora = new Date();

    // Convertimos la hora actual a Montevideo
    const partes =
        new Intl.DateTimeFormat("es-UY", {
            timeZone: "America/Montevideo",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23"
        }).formatToParts(ahora);


    const dia =
        partes.find(
            parte => parte.type === "weekday"
        )?.value;


    const hora =
        Number(
            partes.find(
                parte => parte.type === "hour"
            )?.value
        );


    // =====================================================
    // MIÉRCOLES CERRADO
    // =====================================================

    if (dia === "mié") {
        return false;
    }


    // =====================================================
    // 20:00 A 23:59
    // =====================================================

    if (hora >= 20 && hora <= 23) {
        return true;
    }


    // =====================================================
    // RESTO DEL DÍA CERRADO
    // =====================================================

    return false;
}


// =====================================================
// COMPROBAR ESTADO DESDE RENDER
// =====================================================

async function comprobarEstadoPagina() {

    try {

        const respuesta =
            await fetch(
                "/api/configuracion/estado",
                {
                    cache: "no-store"
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo consultar el estado de la página."
            );
        }


        const datos =
            await respuesta.json();


        paginaActiva =
            datos.pagina_activa === true;


        actualizarPagina();


    } catch (error) {

        console.error(
            "ERROR ESTADO PÁGINA:",
            error
        );

    }
}


// =====================================================
// ACTUALIZAR PÁGINA
// =====================================================

function actualizarPagina() {

    const abiertoPorHorario =
        restauranteEstaAbierto();


    // =====================================================
    // CASO 1
    // APAGADA MANUALMENTE
    // =====================================================

    if (!paginaActiva) {

        mostrarPaginaCerrada(
            "En este momento no estamos tomando pedidos. Volvé a visitarnos durante nuestro horario de atención."
        );

        return;
    }


    // =====================================================
    // CASO 2
    // CERRADA POR HORARIO
    // =====================================================

    if (!abiertoPorHorario) {

        mostrarPaginaCerrada(
            "En este momento estamos cerrados. Nuestro horario de atención es de 20:00 a 00:00. Los miércoles permanecemos cerrados."
        );

        return;
    }


    // =====================================================
    // CASO 3
    // ACTIVA Y DENTRO DEL HORARIO
    // =====================================================

    mostrarPaginaAbierta();
}


// =====================================================
// MOSTRAR PÁGINA CERRADA
// =====================================================

function mostrarPaginaCerrada(mensaje) {

    if (avisoCerrado) {

        avisoCerrado.style.display = "flex";
    }


    if (mensajeCerrado) {

        mensajeCerrado.textContent = mensaje;
    }


    desactivarBoton(
        botonPedirAhora
    );


    desactivarBoton(
        botonCheckout
    );


    desactivarBoton(
        botonAbrirCarrito
    );


    const carritoOverlay =
        document.getElementById(
            "carritoOverlay"
        );


    if (carritoOverlay) {

        carritoOverlay.classList.remove(
            "active"
        );
    }
}


// =====================================================
// MOSTRAR PÁGINA ABIERTA
// =====================================================

function mostrarPaginaAbierta() {

    if (avisoCerrado) {

        avisoCerrado.style.display = "none";
    }


    activarBoton(
        botonPedirAhora
    );


    activarBoton(
        botonCheckout
    );


    activarBoton(
        botonAbrirCarrito
    );
}


// =====================================================
// DESACTIVAR BOTÓN
// =====================================================

function desactivarBoton(boton) {

    if (!boton) {
        return;
    }


    boton.classList.add(
        "pagina-apagada"
    );


    boton.setAttribute(
        "aria-disabled",
        "true"
    );


    boton.dataset.paginaBloqueada =
        "true";
}


// =====================================================
// ACTIVAR BOTÓN
// =====================================================

function activarBoton(boton) {

    if (!boton) {
        return;
    }


    boton.classList.remove(
        "pagina-apagada"
    );


    boton.removeAttribute(
        "aria-disabled"
    );


    delete boton.dataset.paginaBloqueada;
}


// =====================================================
// BLOQUEAR CLICS SI ESTÁ CERRADA
// =====================================================

document.addEventListener(
    "click",
    function (evento) {

        const boton =
            evento.target.closest(
                "#abrirCarrito, #irCheckout, .hero-button"
            );


        if (!boton) {
            return;
        }


        const abiertoPorHorario =
            restauranteEstaAbierto();


        if (
            paginaActiva &&
            abiertoPorHorario
        ) {

            return;
        }


        evento.preventDefault();

        evento.stopPropagation();


        alert(
            "Flame Burger está cerrado y no está tomando pedidos en este momento."
        );

    },
    true
);


// =====================================================
// COMPROBACIÓN INICIAL
// =====================================================

comprobarEstadoPagina();


// =====================================================
// ACTUALIZAR CADA 10 SEGUNDOS
// =====================================================

setInterval(
    comprobarEstadoPagina,
    10000
);
