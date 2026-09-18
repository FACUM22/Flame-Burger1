
// =====================================================
// CONFIGURACIÓN API
// =====================================================

const API_BASE = "https://flame-burger1.onrender.com";

const API_PRODUCTOS =
    `${API_BASE}/api/productos`;

const API_CATEGORIAS =
    `${API_BASE}/api/categorias`;



// =====================================================
// HORARIO DE FLAME BURGER
// =====================================================
//
// Lunes, martes, jueves, viernes, sábado y domingo:
// 20:00 a 00:00
//
// Miércoles:
// CERRADO TODO EL DÍA
//
// Se utiliza la hora de Montevideo.
// =====================================================

function restauranteEstaAbierto() {

    const ahora = new Date();

    const partes = new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "America/Montevideo",
            weekday: "short",
            hour: "numeric",
            minute: "numeric",
            hour12: false
        }
    ).formatToParts(ahora);

    const obtenerParte = (tipo) => {

        const parte =
            partes.find(
                item => item.type === tipo
            );

        return parte
            ? parte.value
            : null;
    };

    const dia =
        obtenerParte("weekday");

    const hora =
        Number(obtenerParte("hour"));

    const minuto =
        Number(obtenerParte("minute"));



    // Miércoles cerrado

    if (dia === "Wed") {

        return false;

    }



    // Antes de las 20:00

    if (hora < 20) {

        return false;

    }



    // Desde las 00:00 hasta las 19:59 está cerrado.
    // A partir de las 20:00 está abierto.
    //
    // Como la hora 00:00 aparece como 24 en algunos
    // navegadores, la consideramos cerrada.

    if (hora >= 24) {

        return false;

    }



    return true;

}



// =====================================================
// AVISO DE CERRADO
// =====================================================

function actualizarEstadoRestaurante() {

    const aviso =
        document.getElementById(
            "avisoCerrado"
        );

    const mensaje =
        document.getElementById(
            "mensajeCerrado"
        );

    const abierto =
        restauranteEstaAbierto();



    if (!aviso) {

        return abierto;

    }



    if (!abierto) {

        aviso.style.display =
            "flex";

        aviso.style.position =
            "fixed";

        aviso.style.inset =
            "0";

        aviso.style.zIndex =
            "999999";

        aviso.style.background =
            "rgba(0, 0, 0, 0.94)";

        aviso.style.alignItems =
            "center";

        aviso.style.justifyContent =
            "center";

        aviso.style.textAlign =
            "center";

        aviso.style.padding =
            "20px";

        aviso.style.color =
            "#ffffff";

        aviso.style.boxSizing =
            "border-box";



        if (mensaje) {

            const ahora =
                new Date();

            const partes =
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        timeZone:
                            "America/Montevideo",

                        weekday:
                            "short",

                        hour:
                            "numeric",

                        minute:
                            "numeric",

                        hour12:
                            false
                    }
                ).formatToParts(ahora);

            const dia =
                partes.find(
                    item =>
                        item.type ===
                        "weekday"
                )?.value;



            if (dia === "Wed") {

                mensaje.textContent =
                    "Los miércoles permanecemos cerrados. Te esperamos nuevamente el jueves desde las 20:00.";

            } else {

                mensaje.textContent =
                    "Nuestro horario de atención es de 20:00 a 00:00. Podés volver a realizar tu pedido desde las 20:00.";

            }

        }



        // Evitar que se pueda hacer scroll

        document.body.style.overflow =
            "hidden";

    } else {

        aviso.style.display =
            "none";

        document.body.style.overflow =
            "";

    }



    return abierto;

}



// =====================================================
// VARIABLES
// =====================================================

let productos = [];

let categorias = [];

let categoriaActual = "todas";

let carrito =
    JSON.parse(
        localStorage.getItem("flameCarrito")
    ) || [];



// =====================================================
// ELEMENTOS DEL DOM
// =====================================================

const contenedorProductos =
    document.getElementById("productos");

const contenedorCategorias =
    document.getElementById("categoriasMenu");

const cantidadCarrito =
    document.getElementById("cantidadCarrito");

const itemsCarrito =
    document.getElementById("itemsCarrito");

const totalCarrito =
    document.getElementById("totalCarrito");

const carritoOverlay =
    document.getElementById("carritoOverlay");

const botonAbrirCarrito =
    document.getElementById("abrirCarrito");

const botonCerrarCarrito =
    document.getElementById("cerrarCarrito");

const botonCheckout =
    document.getElementById("irCheckout");



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
// FORMATEAR PRECIO
// =====================================================

function formatearPrecio(precio) {

    return Number(precio || 0)
        .toLocaleString("es-UY", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

}



// =====================================================
// CARGAR CATEGORÍAS
// =====================================================

async function cargarCategorias() {

    try {

        const respuesta =
            await fetch(API_CATEGORIAS);

        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron cargar las categorías."
            );

        }

        const datos =
            await respuesta.json();

        if (!Array.isArray(datos)) {

            throw new Error(
                "La API de categorías no devolvió una lista."
            );

        }

        categorias =
            datos.filter(
                categoria =>
                    categoria.activa === true
            );

        mostrarCategorias();

    } catch (error) {

        console.error(
            "❌ Error categorías:",
            error
        );

        contenedorCategorias.innerHTML = "";

        crearBotonTodos();

    }

}



// =====================================================
// CREAR BOTÓN TODOS
// =====================================================

function crearBotonTodos() {

    const boton =
        document.createElement("button");

    boton.type =
        "button";

    boton.className =
        "categoria-btn";

    if (categoriaActual === "todas") {

        boton.classList.add("active");

    }

    boton.dataset.categoria =
        "todas";

    boton.textContent =
        "Todos";

    boton.addEventListener(
        "click",
        () => {

            if (!restauranteEstaAbierto()) {

                actualizarEstadoRestaurante();

                return;

            }

            seleccionarCategoria("todas");

        }
    );

    contenedorCategorias.appendChild(
        boton
    );

}



// =====================================================
// MOSTRAR CATEGORÍAS
// =====================================================

function mostrarCategorias() {

    contenedorCategorias.innerHTML =
        "";

    crearBotonTodos();

    categorias.forEach(
        categoria => {

            const boton =
                document.createElement("button");

            boton.type =
                "button";

            boton.className =
                "categoria-btn";

            boton.dataset.categoria =
                String(categoria.id);

            boton.textContent =
                categoria.nombre;

            boton.addEventListener(
                "click",
                () => {

                    if (!restauranteEstaAbierto()) {

                        actualizarEstadoRestaurante();

                        return;

                    }

                    seleccionarCategoria(
                        categoria.id
                    );

                }
            );

            contenedorCategorias.appendChild(
                boton
            );

        }
    );

}



// =====================================================
// SELECCIONAR CATEGORÍA
// =====================================================

function seleccionarCategoria(
    categoriaId
) {

    if (!restauranteEstaAbierto()) {

        actualizarEstadoRestaurante();

        return;

    }

    categoriaActual =
        String(categoriaId);

    document
        .querySelectorAll(".categoria-btn")
        .forEach(
            boton => {

                boton.classList.remove(
                    "active"
                );

            }
        );

    const botonActivo =
        document.querySelector(
            `[data-categoria="${categoriaActual}"]`
        );

    if (botonActivo) {

        botonActivo.classList.add(
            "active"
        );

    }

    mostrarProductos();

}



// =====================================================
// CARGAR PRODUCTOS
// =====================================================

async function cargarProductos() {

    try {

        mostrarCargando();

        const respuesta =
            await fetch(API_PRODUCTOS);

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );

        }

        const datos =
            await respuesta.json();

        if (!Array.isArray(datos)) {

            throw new Error(
                "La API no devolvió una lista."
            );

        }

        productos =
            datos.filter(
                producto =>
                    producto.disponible === true
            );

        mostrarProductos();

    } catch (error) {

        console.error(
            "❌ Error productos:",
            error
        );

        mostrarErrorProductos();

    }

}



// =====================================================
// MOSTRAR CARGANDO
// =====================================================

function mostrarCargando() {

    contenedorProductos.innerHTML = `

        <div class="loading-productos">

            <div class="loading-icon">
                🔥
            </div>

            <p>
                Cargando menú...
            </p>

        </div>

    `;

}



// =====================================================
// MOSTRAR ERROR
// =====================================================

function mostrarErrorProductos() {

    contenedorProductos.innerHTML = `

        <div class="error-productos">

            <div>
                ⚠️
            </div>

            <h3>
                No se pudo cargar el menú
            </h3>

            <p>
                Verificá que el servidor esté funcionando.
            </p>

            <button
                type="button"
                id="reintentarProductos"
            >
                🔄 Reintentar
            </button>

        </div>

    `;

    const boton =
        document.getElementById(
            "reintentarProductos"
        );

    if (boton) {

        boton.addEventListener(
            "click",
            cargarProductos
        );

    }

}



// =====================================================
// MOSTRAR PRODUCTOS
// =====================================================

function mostrarProductos() {

    if (!restauranteEstaAbierto()) {

        return;

    }

    contenedorProductos.innerHTML =
        "";

    let filtrados =
        [...productos];



    // =================================================
    // FILTRAR POR CATEGORÍA
    // =================================================

    if (
        categoriaActual !== "todas"
    ) {

        filtrados =
            productos.filter(
                producto =>
                    String(
                        producto.categoria_id
                    ) ===
                    String(
                        categoriaActual
                    )
            );

    }



    // =================================================
    // SIN PRODUCTOS
    // =================================================

    if (
        filtrados.length === 0
    ) {

        contenedorProductos.innerHTML = `

            <div class="sin-productos">

                <div>
                    🍔
                </div>

                <h3>
                    No hay productos
                </h3>

                <p>
                    No hay productos disponibles
                    en esta categoría.
                </p>

            </div>

        `;

        return;

    }



    // =================================================
    // CREAR TARJETAS
    // =================================================

    filtrados.forEach(
        producto => {

            crearTarjetaProducto(
                producto
            );

        }
    );

}



// =====================================================
// CREAR TARJETA PRODUCTO
// =====================================================

function crearTarjetaProducto(
    producto
) {

    const tarjeta =
        document.createElement("article");

    tarjeta.className =
        "producto";



    // =================================================
    // IMAGEN
    // =================================================

    let imagenHTML = `

        <div class="producto-sin-imagen">
            🍔
        </div>

    `;



    if (producto.imagen) {

        let imagenURL =
            String(producto.imagen).trim();



        // =================================================
        // CORREGIR URLS ANTIGUAS DE LOCALHOST
        // =================================================

        if (
            imagenURL.includes(
                "http://localhost:3000"
            )
        ) {

            imagenURL =
                imagenURL.replace(
                    "http://localhost:3000",
                    API_BASE
                );

        } else if (
            imagenURL.includes(
                "https://localhost:3000"
            )
        ) {

            imagenURL =
                imagenURL.replace(
                    "https://localhost:3000",
                    API_BASE
                );

        }



        // =================================================
        // URL COMPLETA
        // =================================================

        if (
            imagenURL.startsWith("http://") ||
            imagenURL.startsWith("https://")
        ) {

            // Ya es una URL completa.



        // =================================================
        // RUTA /uploads/...
        // =================================================

        } else if (
            imagenURL.startsWith("/")
        ) {

            imagenURL =
                `${API_BASE}${imagenURL}`;



        // =================================================
        // RUTA uploads/...
        // =================================================

        } else {

            imagenURL =
                `${API_BASE}/${imagenURL}`;

        }



        imagenHTML = `

            <img
                src="${escaparHTML(imagenURL)}"
                alt="${escaparHTML(producto.nombre)}"
                loading="lazy"
            >

        `;

    }



    // =================================================
    // HTML TARJETA
    // =================================================

    tarjeta.innerHTML = `

        <div class="producto-imagen">

            ${imagenHTML}

        </div>



        <div class="producto-contenido">



            <span class="categoria">

                ${escaparHTML(
                    producto.categoria || ""
                )}

            </span>



            <h3>

                ${escaparHTML(
                    producto.nombre || ""
                )}

            </h3>



            <p>

                ${escaparHTML(
                    producto.descripcion || ""
                )}

            </p>



            <div class="producto-bottom">



                <strong>

                    $${formatearPrecio(
                        producto.precio
                    )}

                </strong>



                <button
                    type="button"
                    class="agregar-btn"
                    aria-label="Agregar ${escaparHTML(
                        producto.nombre || ""
                    )} al carrito"
                >

                    +

                </button>



            </div>



        </div>

    `;



    // =================================================
    // FALLBACK IMAGEN
    // =================================================

    const imagen =
        tarjeta.querySelector(
            ".producto-imagen img"
        );

    if (imagen) {

        imagen.addEventListener(
            "error",
            () => {

                imagenFallback(imagen);

            }
        );

    }



    // =================================================
    // AGREGAR AL CARRITO
    // =================================================

    const botonAgregar =
        tarjeta.querySelector(
            ".agregar-btn"
        );

    botonAgregar.addEventListener(
        "click",
        () => {

            if (!restauranteEstaAbierto()) {

                actualizarEstadoRestaurante();

                return;

            }

            agregarAlCarrito(
                producto
            );

        }
    );



    contenedorProductos.appendChild(
        tarjeta
    );

}



// =====================================================
// FALLBACK DE IMAGEN
// =====================================================

function imagenFallback(
    imagen
) {

    if (!imagen) {

        return;

    }

    const contenedor =
        imagen.parentElement;

    if (!contenedor) {

        return;

    }

    contenedor.innerHTML = `

        <div class="producto-sin-imagen">
            🍔
        </div>

    `;

}



// =====================================================
// AGREGAR AL CARRITO
// =====================================================

function agregarAlCarrito(
    producto
) {

    if (!restauranteEstaAbierto()) {

        actualizarEstadoRestaurante();

        return;

    }

    const id =
        Number(producto.id);



    const existente =
        carrito.find(
            item =>
                Number(item.producto_id) === id
        );



    if (existente) {

        existente.cantidad += 1;

    } else {

        carrito.push({

            producto_id:
                id,

            nombre:
                producto.nombre,

            precio:
                Number(producto.precio),

            imagen:
                producto.imagen || "",

            cantidad:
                1

        });

    }



    guardarCarrito();

    actualizarCarrito();

    abrirCarrito();

}



// =====================================================
// GUARDAR CARRITO
// =====================================================

function guardarCarrito() {

    localStorage.setItem(
        "flameCarrito",
        JSON.stringify(carrito)
    );

}



// =====================================================
// ACTUALIZAR CARRITO
// =====================================================

function actualizarCarrito() {

    if (!itemsCarrito) {

        return;

    }

    itemsCarrito.innerHTML =
        "";

    let total =
        0;

    let cantidadTotal =
        0;



    // =================================================
    // CARRITO VACÍO
    // =================================================

    if (
        carrito.length === 0
    ) {

        itemsCarrito.innerHTML = `

            <div class="carrito-vacio">

                <div>
                    🛒
                </div>

                <p>
                    Tu carrito está vacío.
                </p>

            </div>

        `;

    }



    // =================================================
    // PRODUCTOS DEL CARRITO
    // =================================================

    carrito.forEach(
        item => {

            const precio =
                Number(item.precio) || 0;

            const cantidad =
                Number(item.cantidad) || 0;

            const subtotal =
                precio * cantidad;



            total +=
                subtotal;

            cantidadTotal +=
                cantidad;



            const elemento =
                document.createElement("div");

            elemento.className =
                "carrito-item";



            elemento.innerHTML = `

                <div>

                    <strong>
                        ${escaparHTML(
                            item.nombre
                        )}
                    </strong>

                    <small>
                        $${formatearPrecio(
                            precio
                        )}
                    </small>

                </div>



                <div class="cantidad">



                    <button
                        type="button"
                        class="menos"
                        aria-label="Disminuir cantidad"
                    >
                        −
                    </button>



                    <span>
                        ${cantidad}
                    </span>



                    <button
                        type="button"
                        class="mas"
                        aria-label="Aumentar cantidad"
                    >
                        +
                    </button>



                </div>

            `;



            // MENOS

            const botonMenos =
                elemento.querySelector(
                    ".menos"
                );

            botonMenos.addEventListener(
                "click",
                () => {

                    cambiarCantidad(
                        item.producto_id,
                        -1
                    );

                }
            );



            // MÁS

            const botonMas =
                elemento.querySelector(
                    ".mas"
                );

            botonMas.addEventListener(
                "click",
                () => {

                    cambiarCantidad(
                        item.producto_id,
                        1
                    );

                }
            );



            itemsCarrito.appendChild(
                elemento
            );

        }
    );



    // =================================================
    // TOTAL
    // =================================================

    if (totalCarrito) {

        totalCarrito.textContent =
            "$" +
            formatearPrecio(total);

    }



    // =================================================
    // CANTIDAD DEL CARRITO
    // =================================================

    if (cantidadCarrito) {

        cantidadCarrito.textContent =
            cantidadTotal;

    }

}



// =====================================================
// CAMBIAR CANTIDAD
// =====================================================

function cambiarCantidad(
    productoId,
    cambio
) {

    if (!restauranteEstaAbierto()) {

        actualizarEstadoRestaurante();

        return;

    }

    const item =
        carrito.find(
            producto =>
                Number(
                    producto.producto_id
                ) ===
                Number(
                    productoId
                )
        );



    if (!item) {

        return;

    }



    item.cantidad +=
        cambio;



    // =================================================
    // ELIMINAR SI LLEGA A 0
    // =================================================

    if (
        item.cantidad <= 0
    ) {

        carrito =
            carrito.filter(
                producto =>
                    Number(
                        producto.producto_id
                    ) !==
                    Number(
                        productoId
                    )
            );

    }



    guardarCarrito();

    actualizarCarrito();

}



// =====================================================
// ABRIR CARRITO
// =====================================================

function abrirCarrito() {

    if (!restauranteEstaAbierto()) {

        actualizarEstadoRestaurante();

        return;

    }

    if (!carritoOverlay) {

        return;

    }

    carritoOverlay.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";

}



// =====================================================
// CERRAR CARRITO
// =====================================================

function cerrarCarrito() {

    if (!carritoOverlay) {

        return;

    }

    carritoOverlay.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

}



// =====================================================
// CERRAR CARRITO AL TOCAR AFUERA
// =====================================================

if (carritoOverlay) {

    carritoOverlay.addEventListener(
        "click",
        evento => {

            if (
                evento.target ===
                carritoOverlay
            ) {

                cerrarCarrito();

            }

        }
    );

}



// =====================================================
// BOTÓN ABRIR CARRITO
// =====================================================

if (botonAbrirCarrito) {

    botonAbrirCarrito.addEventListener(
        "click",
        () => {

            if (!restauranteEstaAbierto()) {

                actualizarEstadoRestaurante();

                return;

            }

            abrirCarrito();

        }
    );

}



// =====================================================
// BOTÓN CERRAR CARRITO
// =====================================================

if (botonCerrarCarrito) {

    botonCerrarCarrito.addEventListener(
        "click",
        cerrarCarrito
    );

}



// =====================================================
// ESCAPE PARA CERRAR
// =====================================================

document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Escape"
        ) {

            cerrarCarrito();

        }

    }
);



// =====================================================
// CONTINUAR AL CHECKOUT
// =====================================================

if (botonCheckout) {

    botonCheckout.addEventListener(
        "click",
        () => {

            if (!restauranteEstaAbierto()) {

                actualizarEstadoRestaurante();

                return;

            }

            if (
                carrito.length === 0
            ) {

                alert(
                    "El carrito está vacío."
                );

                return;

            }



            window.location.href =
                "/checkout.html";

        }
    );

}



// =====================================================
// BLOQUEAR "PEDIR AHORA" CUANDO ESTÁ CERRADO
// =====================================================

document.addEventListener(
    "click",
    evento => {

        const botonPedir =
            evento.target.closest(
                ".hero-button"
            );

        if (!botonPedir) {

            return;

        }

        if (!restauranteEstaAbierto()) {

            evento.preventDefault();

            actualizarEstadoRestaurante();

        }

    }
);



// =====================================================
// CONTROL AUTOMÁTICO DEL HORARIO
// =====================================================
//
// Se revisa cada 30 segundos.
// Esto permite que la página se cierre sola
// al llegar a las 00:00 o se abra a las 20:00.
// =====================================================

setInterval(
    () => {

        actualizarEstadoRestaurante();

    },
    30000
);



// =====================================================
// INICIAR
// =====================================================

async function iniciar() {

    actualizarEstadoRestaurante();

    actualizarCarrito();

    await cargarCategorias();

    // Solo cargamos el menú si está abierto.

    if (restauranteEstaAbierto()) {

        await cargarProductos();

    }

}



// =====================================================
// EJECUTAR
// =====================================================

iniciar();
