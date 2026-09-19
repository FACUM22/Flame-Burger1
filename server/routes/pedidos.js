const express = require("express");

const router = express.Router();

const pool = require("../database");
// =====================================================
// COMPROBAR SI LA PÁGINA ESTÁ ACTIVA
// =====================================================

async function paginaEstaActiva() {

    const resultado = await pool.query(`
        SELECT pagina_activa
        FROM configuracion
        WHERE id = 1
        LIMIT 1
    `);


    if (resultado.rows.length === 0) {

        // Si no existe la configuración,
        // por seguridad dejamos la página activa.

        return true;

    }


    return resultado.rows[0].pagina_activa === true;

}

// =====================================================
// HORARIO DEL RESTAURANTE
// =====================================================
// Flame Burger:
// Lunes, martes y jueves a domingo: 20:00 a 00:00
// Miércoles: cerrado
//
// Zona horaria: Montevideo
// =====================================================

function restauranteEstaAbierto() {
    const ahora = new Date();

    const partes = new Intl.DateTimeFormat("es-UY", {
        timeZone: "America/Montevideo",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).formatToParts(ahora);

    const dia = partes.find(p => p.type === "weekday")?.value;
    const hora = Number(partes.find(p => p.type === "hour")?.value);

    // Miércoles cerrado
    if (dia === "mié") {
        return false;
    }

    // Abierto de 20:00 a 23:59
    if (hora >= 20 && hora <= 23) {
        return true;
    }

    // 00:00 cerrado
    return false;
}


// =====================================================
// ESTADOS PERMITIDOS
// =====================================================

const ESTADOS_PERMITIDOS = [
    "en_proceso_pago",
    "nuevo",
    "preparando",
    "listo",
    "entregado",
    "cancelado"
];


// =====================================================
// CREAR PEDIDO
// =====================================================

router.post("/", async (req, res) => {

    const client = await pool.connect();

    try {

        // =====================================================
        // HORARIO
        // =====================================================

        if (!restauranteEstaAbierto()) {

            return res.status(400).json({
                ok: false,
                error: "Flame Burger está cerrado en este momento."
            });
        }


        // =====================================================
        // DATOS RECIBIDOS
        // =====================================================

        const {
            cliente,
            entrega,
            pago,
            necesitaCambio,
            cambio,
            productos,
            costo_envio,
            distancia_delivery
        } = req.body;


        // =====================================================
        // VALIDAR CLIENTE
        // =====================================================

        if (!cliente) {

            return res.status(400).json({
                ok: false,
                error: "Faltan los datos del cliente."
            });
        }

        const nombreCliente = String(cliente.nombre || "").trim();
        const telefonoCliente = String(cliente.telefono || "").trim();
        const direccionCliente = String(cliente.direccion || "").trim();

        if (!nombreCliente) {

            return res.status(400).json({
                ok: false,
                error: "El nombre es obligatorio."
            });
        }

        if (!telefonoCliente) {

            return res.status(400).json({
                ok: false,
                error: "El teléfono es obligatorio."
            });
        }


        // =====================================================
        // VALIDAR ENTREGA
        // =====================================================

        if (!["delivery", "retiro"].includes(entrega)) {

            return res.status(400).json({
                ok: false,
                error: "Tipo de entrega inválido."
            });
        }

        if (entrega === "delivery" && !direccionCliente) {

            return res.status(400).json({
                ok: false,
                error: "La dirección es obligatoria para delivery."
            });
        }


        // =====================================================
        // VALIDAR FORMA DE PAGO
        // =====================================================

        const formasPagoPermitidas = [
            "efectivo",
            "pos",
            "mercado_pago"
        ];

        if (!formasPagoPermitidas.includes(pago)) {

            return res.status(400).json({
                ok: false,
                error: "Forma de pago inválida."
            });
        }


        // =====================================================
        // PRODUCTOS
        // =====================================================

        if (!Array.isArray(productos) || productos.length === 0) {

            return res.status(400).json({
                ok: false,
                error: "El pedido no contiene productos."
            });
        }


        // =====================================================
        // CLIENTE
        // =====================================================

        await client.query("BEGIN");

        let clienteId;

        const clienteExistente = await client.query(
            `
            SELECT id
            FROM clientes
            WHERE telefono = $1
            LIMIT 1
            `,
            [telefonoCliente]
        );

        if (clienteExistente.rows.length > 0) {

            clienteId = clienteExistente.rows[0].id;

            await client.query(
                `
                UPDATE clientes
                SET
                    nombre = $1,
                    direccion = $2
                WHERE id = $3
                `,
                [
                    nombreCliente,
                    direccionCliente || null,
                    clienteId
                ]
            );

        } else {

            const nuevoCliente = await client.query(
                `
                INSERT INTO clientes
                (
                    nombre,
                    telefono,
                    direccion
                )
                VALUES
                (
                    $1,
                    $2,
                    $3
                )
                RETURNING id
                `,
                [
                    nombreCliente,
                    telefonoCliente,
                    direccionCliente || null
                ]
            );

            clienteId = nuevoCliente.rows[0].id;
        }


        // =====================================================
        // DELIVERY
        // =====================================================

        let costoEnvioFinal = 0;
        let distanciaDeliveryFinal = null;

        if (entrega === "delivery") {

            const distancia = Number(distancia_delivery);

            if (!Number.isFinite(distancia) || distancia < 0) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: "No se pudo determinar correctamente la distancia del delivery."
                });
            }

            distanciaDeliveryFinal = Number(
                distancia.toFixed(2)
            );


            // Más de 6 km
            if (distanciaDeliveryFinal > 6) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: "La dirección está a más de 6 km. Flame Burger no realiza delivery hasta esa zona."
                });
            }


            // Hasta 3 km GRATIS
            if (distanciaDeliveryFinal <= 3) {

                costoEnvioFinal = 0;

            } else {

                // Más de 3 km y hasta 6 km
                costoEnvioFinal = 100;
            }

        } else {

            // Retiro en local
            costoEnvioFinal = 0;
            distanciaDeliveryFinal = null;
        }


        // =====================================================
        // CALCULAR TOTAL DE PRODUCTOS
        // =====================================================

        let total = 0;

        const productosFinales = [];


        for (const item of productos) {

            const productoId = Number(item.id);
            const cantidad = Number(item.cantidad);

            if (
                !Number.isInteger(productoId) ||
                productoId <= 0
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: "Producto inválido."
                });
            }

            if (
                !Number.isInteger(cantidad) ||
                cantidad <= 0
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: "Cantidad de producto inválida."
                });
            }


            // =====================================================
            // BUSCAR PRODUCTO
            // =====================================================

            const productoResult = await client.query(
                `
                SELECT
                    id,
                    nombre,
                    precio,
                    disponible
                FROM productos
                WHERE id = $1
                `,
                [productoId]
            );

            if (productoResult.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: `El producto ${productoId} no existe.`
                });
            }

            const producto = productoResult.rows[0];


            // =====================================================
            // DISPONIBILIDAD
            // =====================================================

            if (!producto.disponible) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: `El producto "${producto.nombre}" no está disponible.`
                });
            }


            // =====================================================
            // PRECIO
            // =====================================================

            const precio = Number(producto.precio);

            if (!Number.isFinite(precio)) {

                await client.query("ROLLBACK");

                return res.status(500).json({
                    ok: false,
                    error: `El precio del producto "${producto.nombre}" no es válido.`
                });
            }


            const subtotal = Number(
                (precio * cantidad).toFixed(2)
            );

            total += subtotal;


            productosFinales.push({
                id: producto.id,
                nombre: producto.nombre,
                precio,
                cantidad,
                subtotal
            });
        }


        // =====================================================
        // SUMAR DELIVERY AL TOTAL
        // =====================================================

        total = Number(
            (total + costoEnvioFinal).toFixed(2)
        );


        // =====================================================
        // EFECTIVO
        // =====================================================

        const necesitaCambioFinal =
            pago === "efectivo"
                ? Boolean(necesitaCambio)
                : false;

        let cambioDeFinal = null;

        if (pago === "efectivo" && necesitaCambioFinal) {

            const cambioNumero = Number(cambio);

            if (
                !Number.isFinite(cambioNumero) ||
                cambioNumero <= 0
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: "Ingresá correctamente el monto con el que se va a pagar."
                });
            }

            if (cambioNumero < total) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: `El monto ingresado ($${cambioNumero}) es menor al total del pedido ($${total}).`
                });
            }

            cambioDeFinal = Number(
                cambioNumero.toFixed(2)
            );
        }


        // =====================================================
        // ESTADO INICIAL
        // =====================================================

        const estadoInicial =
            pago === "mercado_pago"
                ? "en_proceso_pago"
                : "nuevo";


        // =====================================================
        // CREAR PEDIDO
        // =====================================================

        const pedidoResult = await client.query(
            `
            INSERT INTO pedidos
            (
                cliente_id,
                tipo_entrega,
                forma_pago,
                estado,
                total,
                necesita_cambio,
                cambio_de,
                costo_envio,
                distancia_delivery
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING
                id,
                total,
                estado,
                forma_pago,
                tipo_entrega,
                necesita_cambio,
                cambio_de,
                costo_envio,
                distancia_delivery,
                creado_en
            `,
            [
                clienteId,
                entrega,
                pago,
                estadoInicial,
                total,
                necesitaCambioFinal,
                cambioDeFinal,
                costoEnvioFinal,
                distanciaDeliveryFinal
            ]
        );


        const pedido = pedidoResult.rows[0];


        // =====================================================
        // DETALLE DEL PEDIDO
        // =====================================================

        for (const producto of productosFinales) {

            await client.query(
                `
                INSERT INTO detalle_pedidos
                (
                    pedido_id,
                    producto_id,
                    cantidad,
                    precio_unitario,
                    subtotal
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )
                `,
                [
                    pedido.id,
                    producto.id,
                    producto.cantidad,
                    producto.precio,
                    producto.subtotal
                ]
            );
        }


        // =====================================================
        // CONFIRMAR TRANSACCIÓN
        // =====================================================

        await client.query("COMMIT");


        // =====================================================
        // DATOS COMPLETOS PARA EL ADMIN
        // =====================================================

        const pedidoCompletoResult = await pool.query(
            `
            SELECT
                p.id,
                p.cliente_id,
                c.nombre AS cliente_nombre,
                c.telefono,
                c.direccion,
                p.tipo_entrega,
                p.forma_pago,
                p.estado,
                p.total,
                p.costo_envio,
                p.distancia_delivery,
                p.observaciones,
                p.necesita_cambio,
                p.cambio_de,
                p.creado_en
            FROM pedidos p
            LEFT JOIN clientes c
                ON c.id = p.cliente_id
            WHERE p.id = $1
            `,
            [pedido.id]
        );


        const pedidoCompleto = pedidoCompletoResult.rows[0];


        // =====================================================
        // PRODUCTOS DEL PEDIDO
        // =====================================================

        const detalleResult = await pool.query(
            `
            SELECT
                dp.id,
                dp.producto_id,
                p.nombre,
                dp.cantidad,
                dp.precio_unitario,
                dp.subtotal
            FROM detalle_pedidos dp
            LEFT JOIN productos p
                ON p.id = dp.producto_id
            WHERE dp.pedido_id = $1
            ORDER BY dp.id ASC
            `,
            [pedido.id]
        );


        pedidoCompleto.productos = detalleResult.rows;


        // =====================================================
        // SOCKET.IO
        // =====================================================

        if (req.app.get("io")) {

            req.app.get("io").emit(
                "nuevo_pedido",
                pedidoCompleto
            );
        }


        // =====================================================
        // RESPUESTA
        // =====================================================

        return res.status(201).json({
            ok: true,
            pedido: pedidoCompleto
        });

    } catch (error) {

        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Error haciendo ROLLBACK:",
                rollbackError
            );
        }

        console.error(
            "ERROR CREANDO PEDIDO:",
            error
        );

        return res.status(500).json({
            ok: false,
            error: "Error interno al crear el pedido."
        });

    } finally {

        client.release();
    }
});


// =====================================================
// OBTENER TODOS LOS PEDIDOS
// =====================================================

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                p.id,
                p.cliente_id,
                c.nombre AS cliente_nombre,
                c.telefono,
                c.direccion,
                p.tipo_entrega,
                p.forma_pago,
                p.estado,
                p.total,
                p.costo_envio,
                p.distancia_delivery,
                p.observaciones,
                p.necesita_cambio,
                p.cambio_de,
                p.creado_en
            FROM pedidos p
            LEFT JOIN clientes c
                ON c.id = p.cliente_id
            ORDER BY p.creado_en DESC
            `
        );


        // =====================================================
        // AGREGAR PRODUCTOS
        // =====================================================

        for (const pedido of result.rows) {

            const detalleResult = await pool.query(
                `
                SELECT
                    dp.id,
                    dp.producto_id,
                    p.nombre,
                    dp.cantidad,
                    dp.precio_unitario,
                    dp.subtotal
                FROM detalle_pedidos dp
                LEFT JOIN productos p
                    ON p.id = dp.producto_id
                WHERE dp.pedido_id = $1
                ORDER BY dp.id ASC
                `,
                [pedido.id]
            );

            pedido.productos = detalleResult.rows;
        }


        return res.json({
            ok: true,
            pedidos: result.rows
        });

    } catch (error) {

        console.error(
            "ERROR OBTENIENDO PEDIDOS:",
            error
        );

        return res.status(500).json({
            ok: false,
            error: "Error al obtener los pedidos."
        });
    }
});


// =====================================================
// OBTENER UN PEDIDO
// =====================================================

router.get("/:id", async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {

            return res.status(400).json({
                ok: false,
                error: "ID de pedido inválido."
            });
        }


        const result = await pool.query(
            `
            SELECT
                p.id,
                p.cliente_id,
                c.nombre AS cliente_nombre,
                c.telefono,
                c.direccion,
                p.tipo_entrega,
                p.forma_pago,
                p.estado,
                p.total,
                p.costo_envio,
                p.distancia_delivery,
                p.observaciones,
                p.necesita_cambio,
                p.cambio_de,
                p.creado_en
            FROM pedidos p
            LEFT JOIN clientes c
                ON c.id = p.cliente_id
            WHERE p.id = $1
            `,
            [id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                ok: false,
                error: "Pedido no encontrado."
            });
        }


        const pedido = result.rows[0];


        // =====================================================
        // PRODUCTOS
        // =====================================================

        const detalleResult = await pool.query(
            `
            SELECT
                dp.id,
                dp.producto_id,
                p.nombre,
                dp.cantidad,
                dp.precio_unitario,
                dp.subtotal
            FROM detalle_pedidos dp
            LEFT JOIN productos p
                ON p.id = dp.producto_id
            WHERE dp.pedido_id = $1
            ORDER BY dp.id ASC
            `,
            [id]
        );


        pedido.productos = detalleResult.rows;


        return res.json({
            ok: true,
            pedido
        });

    } catch (error) {

        console.error(
            "ERROR OBTENIENDO PEDIDO:",
            error
        );

        return res.status(500).json({
            ok: false,
            error: "Error al obtener el pedido."
        });
    }
});


// =====================================================
// CAMBIAR ESTADO DEL PEDIDO
// =====================================================

router.patch("/:id/estado", async (req, res) => {

    try {

        const id = Number(req.params.id);
        const { estado } = req.body;


        if (!Number.isInteger(id) || id <= 0) {

            return res.status(400).json({
                ok: false,
                error: "ID de pedido inválido."
            });
        }


        if (!ESTADOS_PERMITIDOS.includes(estado)) {

            return res.status(400).json({
                ok: false,
                error: "Estado inválido."
            });
        }


        const result = await pool.query(
            `
            UPDATE pedidos
            SET estado = $1
            WHERE id = $2
            RETURNING
                id,
                estado
            `,
            [
                estado,
                id
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                ok: false,
                error: "Pedido no encontrado."
            });
        }


        // =====================================================
        // SOCKET
        // =====================================================

        if (req.app.get("io")) {

            req.app.get("io").emit(
                "estado_pedido_actualizado",
                result.rows[0]
            );
        }


        return res.json({
            ok: true,
            pedido: result.rows[0]
        });

    } catch (error) {

        console.error(
            "ERROR CAMBIANDO ESTADO:",
            error
        );

        return res.status(500).json({
            ok: false,
            error: "Error al cambiar el estado del pedido."
        });
    }
});


// =====================================================
// CANCELAR PEDIDO
// =====================================================

router.patch("/:id/cancelar", async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {

            return res.status(400).json({
                ok: false,
                error: "ID de pedido inválido."
            });
        }


        const result = await pool.query(
            `
            UPDATE pedidos
            SET estado = 'cancelado'
            WHERE id = $1
            RETURNING
                id,
                estado
            `,
            [id]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                ok: false,
                error: "Pedido no encontrado."
            });
        }


        if (req.app.get("io")) {

            req.app.get("io").emit(
                "estado_pedido_actualizado",
                result.rows[0]
            );
        }


        return res.json({
            ok: true,
            pedido: result.rows[0]
        });

    } catch (error) {

        console.error(
            "ERROR CANCELANDO PEDIDO:",
            error
        );

        return res.status(500).json({
            ok: false,
            error: "Error al cancelar el pedido."
        });
    }
});


// =====================================================
// IMPRIMIR / OBTENER PEDIDO PARA IMPRESIÓN
// =====================================================

router.get("/:id/imprimir", async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {

            return res.status(400).json({
                ok: false,
                error: "ID de pedido inválido."
            });
        }


        const pedidoResult = await pool.query(
            `
            SELECT
                p.id,
                p.cliente_id,
                c.nombre AS cliente_nombre,
                c.telefono,
                c.direccion,
                p.tipo_entrega,
                p.forma_pago,
                p.estado,
                p.total,
                p.costo_envio,
                p.distancia_delivery,
                p.observaciones,
                p.necesita_cambio,
                p.cambio_de,
                p.creado_en
            FROM pedidos p
            LEFT JOIN clientes c
                ON c.id = p.cliente_id
            WHERE p.id = $1
            `,
            [id]
        );


        if (pedidoResult.rows.length === 0) {

            return res.status(404).json({
                ok: false,
                error: "Pedido no encontrado."
            });
        }


        const pedido = pedidoResult.rows[0];


        // =====================================================
        // PRODUCTOS
        // =====================================================

        const detalleResult = await pool.query(
            `
            SELECT
                dp.id,
                dp.producto_id,
                p.nombre,
                dp.cantidad,
                dp.precio_unitario,
                dp.subtotal
            FROM detalle_pedidos dp
            LEFT JOIN productos p
                ON p.id = dp.producto_id
            WHERE dp.pedido_id = $1
            ORDER BY dp.id ASC
            `,
            [id]
        );


        pedido.productos = detalleResult.rows;


        // =====================================================
        // SOCKET
        // =====================================================

        if (req.app.get("io")) {

            req.app.get("io").emit(
                "imprimir_pedido",
                pedido
            );
        }


        return res.json({
            ok: true,
            pedido
        });

    } catch (error) {

        console.error(
            "ERROR OBTENIENDO PEDIDO PARA IMPRIMIR:",
            error
        );

        return res.status(500).json({
            ok: false,
            error: "Error al obtener el pedido para imprimir."
        });
    }
});


// =====================================================
// EXPORTAR
// =====================================================

module.exports = router;
