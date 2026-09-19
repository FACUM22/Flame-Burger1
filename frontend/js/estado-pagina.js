// =====================================================
// ESTADO MANUAL DE LA PÁGINA - FLAME BURGER
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
// COMPROBAR ESTADO
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
                "No se pudo consultar el estado."
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

    if (paginaActiva) {

        // =============================================
        // PÁGINA ENCENDIDA
        // =============================================

        if (avisoCerrado) {

            avisoCerrado.style.display =
                "none";
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


    } else {

        // =============================================
        // PÁGINA APAGADA
        // =============================================

        if (avisoCerrado) {

            avisoCerrado.style.display =
                "flex";
        }


        if (mensajeCerrado) {

            mensajeCerrado.textContent =
                "En este momento no estamos tomando pedidos. Volvé a visitarnos más tarde.";
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
// BLOQUEAR CLICS CUANDO ESTÁ APAGADA
// =====================================================

document.addEventListener(
    "click",
    function (evento) {

        if (paginaActiva) {
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
// COMPROBAR AL CARGAR
// =====================================================

comprobarEstadoPagina();


// =====================================================
// COMPROBAR CADA 10 SEGUNDOS
// =====================================================

setInterval(
    comprobarEstadoPagina,
    10000
);
