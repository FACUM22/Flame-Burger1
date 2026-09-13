// =====================================================
// MENÚ MÓVIL (botón ☰)
// =====================================================
// Hace que el botón de 3 rayitas abra/cierre el menú
// lateral en pantallas chicas (celular).

document.addEventListener("DOMContentLoaded", () => {

    const botonMenu =
        document.querySelector(".mobile-menu");

    const sidebar =
        document.querySelector(".sidebar");

    if (!botonMenu || !sidebar) {
        return;
    }

    // Creamos el fondo oscuro para poder cerrar tocando afuera
    const overlay =
        document.createElement("div");

    overlay.className = "sidebar-overlay";

    document.body.appendChild(overlay);


    function abrirMenu() {

        sidebar.classList.add("sidebar-abierto");
        overlay.classList.add("activo");

    }

    function cerrarMenu() {

        sidebar.classList.remove("sidebar-abierto");
        overlay.classList.remove("activo");

    }


    botonMenu.addEventListener("click", () => {

        if (sidebar.classList.contains("sidebar-abierto")) {

            cerrarMenu();

        } else {

            abrirMenu();

        }

    });


    overlay.addEventListener("click", cerrarMenu);


    // Cerrar el menú al tocar un link del sidebar
    sidebar.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", cerrarMenu);

    });

});
