// =====================================================
// ESTADO MANUAL DE LA PÁGINA - FLAME BURGER
// =====================================================

let flamePaginaActiva = true;


// =====================================================
// ELEMENTOS
// =====================================================

const flameAvisoCerrado =
    document.getElementById("avisoCerrado");

const flameMensajeCerrado =
    document.getElementById("mensajeCerrado");

const flameBotonPedirAhora =
    document.querySelector(".hero-button");

const flameBotonCheckout =
    document.getElementById("irCheckout");

const flameBotonAbrirCarrito =
    document.getElementById("abrirCarrito");


// =====================================================
// COMPROBAR ESTADO EN EL SERVIDOR
// =====================================================

async function flameComprobarEstadoPagina() {

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


        flamePaginaActiva =
            datos.pagina_activa === true;


        flameActualizarPagina();


    } catch (error) {

        console.error(
            "ERROR ESTADO PÁGINA:",
            error
        );
    }
}


// =====================================================
// ACTUALIZAR ESTADO VISUAL
// =====================================================

function flameActualizarPagina() {

    if (flamePaginaActiva) {

        // =============================================
        // PÁGINA ENCENDIDA
        // =============================================

        if (flameAvisoCerrado) {

            flameAvisoCerrado.style.display =
                "none";
        }


        flameActivarBoton(
            flameBotonPedirAhora
        );


        flameActivarBoton(
            flameBotonCheckout
        );


        flameActivarBoton(
            flameBotonAbrirCarrito
        );


    } else {

        // =============================================
        // PÁGINA APAGADA
        // =============================================

        if (flameAvisoCerrado) {

            flameAvisoCerrado.style.display =
                "flex";
        }


        if (flameMensajeCerrado) {

            flameMensajeCerrado.textContent =
                "En este momento no estamos tomando pedidos. Volvé a visitarnos más tarde.";
        }


        flameDesactivarBoton(
            flameBotonPedirAhora
        );


        flameDesactivarBoton(
            flameBotonCheckout
        );


        flameDesactivarBoton(
            flameBotonAbrirCarrito
        );


        const flameCarritoOverlay =
            document.getElementById(
                "carritoOverlay"
            );


        if (flameCarritoOverlay) {

            flameCarritoOverlay.classList.remove(
                "active"
            );
        }
    }
}


// =====================================================
// DESACTIVAR BOTÓN
// =====================================================

function flameDesactivarBoton(boton) {

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

function flameActivarBoton(boton) {

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
// BLOQUEAR CLICS CUANDO LA PÁGINA ESTÁ APAGADA
// =====================================================

document.addEventListener(
    "click",
    function (evento) {

        if (flamePaginaActiva) {
            return;
        }


        const boton =
            evento.target.closest(
                "#abrirCarrito, #irCheckout, .hero-button"
            );


        if (!boton) {
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
// INICIAR
// =====================================================

flameComprobarEstadoPagina();


// =====================================================
// ACTUALIZAR CADA 10 SEGUNDOS
// =====================================================

setInterval(
    flameComprobarEstadoPagina,
    10000
);
