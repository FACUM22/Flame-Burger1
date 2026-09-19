// =====================================================
// CONTROL DE ESTADO DE LA PÁGINA
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
// CONSULTAR ESTADO
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
        // PÁGINA ACTIVA
        // =============================================

        if (avisoCerrado) {

            avisoCerrado.style.display =
                "none";

        }


        if (mensajeCerrado) {

            mensajeCerrado.textContent =
                "Nuestro horario de atención es de 20:00 a 00:00.";

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
                "En este momento no estamos tomando pedidos. Volvé a visitarnos durante nuestro horario de atención.";

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


        // Cerrar carrito si estaba abierto

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
// EVITAR ACCIONES CUANDO ESTÁ APAGADA
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
// COMPROBAR AL ENTRAR
// =====================================================

comprobarEstadoPagina();


// =====================================================
// COMPROBAR CADA 10 SEGUNDOS
// =====================================================

setInterval(
    comprobarEstadoPagina,
    10000
);
