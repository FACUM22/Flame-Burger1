const express = require("express");

const router = express.Router();

const pool = require("../database");

// =====================================================
// HORARIO / ESTADO MANUAL DE LA PÁGINA
// =====================================================

async function paginaEstaActiva() {

    const resultado = await pool.query(`
        SELECT pagina_activa
        FROM configuracion
        WHERE id = 1
        LIMIT 1
    `);

    if (resultado.rows.length === 0) {
        return true;
    }

    return resultado.rows[0].pagina_activa;
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

        // =================================================
        // VERIFICAR SI LA PÁGINA ESTÁ ACTIVA
        // =================================================

        const paginaActiva = await paginaEstaActiva();

        if (!paginaActiva) {

            return res.status(403).json({
                ok: false,
                error: "La página no está recibiendo pedidos en este momento."
            });
        }


        const {
            cliente,
            entrega,
            pago,
            productos,
            necesitaCambio,
            cambio,
            costo_envio,
            distancia_delivery
        } = req.body;


        // =================================================
        // VALIDAR CLIENTE
        // =================================================

        if (!cliente || typeof cliente !== "object") {

            return res.status(400).json({
                ok: false,
                error: "Datos del cliente inválidos."
            });
        }


        const nombre = String(cliente.nombre || "").trim();
        const telefono = String(cliente.telefono || "").trim();
        const direccion = String(cliente.direccion || "").trim();
        const comentarios = String(cliente.comentarios || "").trim();


        if (!nombre) {

            return res.status(400).json({
                ok: false,
                error: "El nombre es obligatorio."
            });
        }


        if (!telefono) {

            return res.status(400).json({
                ok: false,
                error: "El teléfono es obligatorio."
            });
        }


        // =================================================
        // VALIDAR ENTREGA
        // =================================================

        if (
            entrega !== "delivery" &&
            entrega !== "retiro"
        ) {

            return res.status(400).json({
                ok: false,
                error: "Tipo de entrega inválido."
            });
        }


        // =================================================
        // VALIDAR PAGO
        // =================================================

        if (
            pago !== "efectivo" &&
            pago !== "mercado_pago" &&
            pago !== "pos"
        ) {

            return res.status(400).json({
                ok: false,
                error: "Método de pago inválido."
            });
        }


        // =================================================
        // VALIDAR PRODUCTOS
        // =================================================

        if (
            !Array.isArray(productos) ||
            productos.length === 0
        ) {

            return res.status(400).json({
                ok: false,
                error: "El pedido no contiene productos."
            });
        }


        await client.query("BEGIN");


        // =================================================
        // CLIENTE
        // =================================================

        let clienteId;

        const clienteExistente = await client.query(`
            SELECT id
            FROM clientes
            WHERE telefono = $1
            LIMIT 1
        `, [telefono]);


        if (clienteExistente.rows.length > 0) {

            clienteId = clienteExistente.rows[0].id;

            await client.query(`
                UPDATE clientes
                SET
                    nombre = $1,
                    direccion = $2
                WHERE id = $3
            `, [
                nombre,
                direccion,
                clienteId
            ]);

        } else {

            const nuevoCliente = await client.query(`
                INSERT INTO clientes (
                    nombre,
                    telefono,
                    direccion
                )
                VALUES ($1, $2, $3)
                RETURNING id
            `, [
                nombre,
                telefono,
                direccion
            ]);

            clienteId = nuevoCliente.rows[0].id;
        }


        // =================================================
        // COSTO DE ENVÍO
        // =================================================

        let costoEnvioFinal = 0;

        let distanciaFinal = null;


        if (entrega === "delivery") {

            distanciaFinal =
                distancia_delivery !== null &&
                distancia_delivery !== undefined
                    ? Number(distancia_delivery)
                    : null;


            if (
                distanciaFinal === null ||
                !Number.isFinite(distanciaFinal)
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: "No se pudo determinar la distancia del delivery."
                });
            }


            // Hasta 3 km: GRATIS

            if (distanciaFinal <= 3) {

                costoEnvioFinal = 0;

            }

            // Más de 3 km hasta 6 km: $100

            else if (distanciaFinal <= 6) {

                costoEnvioFinal = 100;

            }

            // Más de 6 km: no hay delivery

            else {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: "La dirección está a más de 6 km. No realizamos delivery en esa zona."
                });
            }

        } else {

            costoEnvioFinal = 0;
            distanciaFinal = null;
        }


        // =================================================
        // PRODUCTOS
        // =================================================

        let subtotal = 0;

        const productosProcesados = [];


        for (const item of productos) {

            // IMPORTANTE:
            // El frontend manda producto_id

            const productoId =
                Number(item.producto_id);

            const cantidad =
                Number(item.cantidad);


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


            const productoResult = await client.query(`
                SELECT
                    id,
                    nombre,
                    precio,
                    disponible
                FROM productos
                WHERE id = $1
                LIMIT 1
            `, [productoId]);


            if (productoResult.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: "El producto no existe."
                });
            }


            const producto = productoResult.rows[0];


            if (!producto.disponible) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    ok: false,
                    error: `El producto "${producto.nombre}" no está disponible.`
                });
            }


            const precio =
                Number(producto.precio);

            const subtotalProducto =
                precio * cantidad;


            subtotal += subtotalProducto;


            productosProcesados.push({
                producto_id: producto.id,
                nombre: producto.nombre,
                cantidad,
                precio,
                subtotal: subtotalProducto
            });
        }


        // =================================================
        // TOTAL
        // =================================================

        const total =
            subtotal + costoEnvioFinal;


        // =================================================
        // EFECTIVO / CAMBIO
        // =================================================

        let necesitaCambioFinal = false;
        let cambioFinal = null;


        if (pago === "efectivo") {

            necesitaCambioFinal =
                necesitaCambio === true ||
                necesitaCambio === "true";


            if (necesitaCambioFinal) {

                cambioFinal = Number(cambio);


                if (
                    !Number.isFinite(cambioFinal) ||
                    cambioFinal <= 0
                ) {

                    await client.query("ROLLBACK");

                    return res.status(400).json({
                        ok: false,
                        error: "Debe indicar correctamente el monto para el cambio."
                    });
                }


                if (cambioFinal < total) {

                    await client.query("ROLLBACK");

                    return res.status(400).json({
                        ok: false,
                        error: "El monto para el cambio debe ser mayor o igual al total."
                    });
                }

            }

        }


        // =================================================
        // ESTADO INICIAL
        // =================================================

        let estadoInicial = "nuevo";


        if (pago === "mercado_pago") {

            estadoInicial = "en_proceso_pago";
        }


        // =================================================
        // CREAR PEDIDO
        // =================================================

        const pedidoResult = await client.query(`
            INSERT INTO pedidos (
                cliente_id,
                entrega,
                pago,
                estado,
                total,
                necesita_cambio,
                cambio,
                costo_envio,
                distancia_delivery
            )
            VALUES (
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
            RETURNING id, creado_en
        `, [
            clienteId,
            entrega,
            pago,
            estadoInicial,
            total,
            necesitaCambioFinal,
            cambioFinal,
            costoEnvioFinal,
            distanciaFinal
        ]);


        const pedidoId =
            pedidoResult.rows[0].id;


        // =================================================
        // DETALLE DEL PEDIDO
        // =================================================

        for (const producto of productosProcesados) {

            await client.query(`
                INSERT INTO detalle_pedidos (
                    pedido_id,
                    producto_id,
                    cantidad,
                    precio_unitario,
                    subtotal
                )
                VALUES ($1, $2, $3, $4, $5)
            `, [
                pedidoId,
                producto.producto_id,
                producto.cantidad,
                producto.precio,
                producto.subtotal
            ]);
        }


        await client.query("COMMIT");


        // =================================================
        // RESPUESTA
        // =================================================

        res.status(201).json({
            ok: true,

            pedido: {
                id: pedidoId,

                cliente: {
                    nombre,
                    telefono,
                    direccion
                },

                entrega,
                pago,
                estado: estadoInicial,

                subtotal,
                costo_envio: costoEnvioFinal,
                distancia_delivery: distanciaFinal,

                total,

                necesitaCambio: necesitaCambioFinal,
                cambio: cambioFinal,

                creado_en: pedidoResult.rows[0].creado_en,

                productos: productosProcesados
            }
        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error("ERROR CREANDO PEDIDO:", error);

        res.status(500).json({
            ok: false,
            error: "Error interno creando el pedido."
        });

    } finally {

        client.release();
    }
});


// =====================================================
// CAMBIAR ESTADO DEL PEDIDO
// =====================================================

router.patch("/:id/estado", async (req, res) => {

    try {

        const id = Number(req.params.id);

        const { estado } = req.body;


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res.status(400).json({
                ok: false,
                error: "ID de pedido inválido."
            });
        }


        if (!ESTADOS_PERMITIDOS.includes(estado)) {

            return res.status(400).json({
                ok: false,
                error: "Estado de pedido inválido."
            });
        }


        const pedidoActual = await pool.query(`
            SELECT estado
            FROM pedidos
            WHERE id = $1
            LIMIT 1
        `, [id]);


        if (pedidoActual.rows.length === 0) {

            return res.status(404).json({
                ok: false,
                error: "Pedido no encontrado."
            });
        }


        const estadoActual =
            pedidoActual.rows[0].estado;


        // No permitir cambiar manualmente
        // un pedido que está esperando Mercado Pago

        if (
            estadoActual === "en_proceso_pago" &&
            estado !== "en_proceso_pago"
        ) {

            return res.status(400).json({
                ok: false,
                error: "Este pedido todavía está en proceso de pago."
            });
        }


        const resultado = await pool.query(`
            UPDATE pedidos
            SET estado = $1
            WHERE id = $2
            RETURNING id, estado
        `, [
            estado,
            id
        ]);


        res.json({
            ok: true,
            pedido: resultado.rows[0]
        });


    } catch (error) {

        console.error("ERROR CAMBIANDO ESTADO:", error);

        res.status(500).json({
            ok: false,
            error: "Error cambiando el estado del pedido."
        });
    }
});


// =====================================================
// OBTENER TODOS LOS PEDIDOS
// =====================================================

router.get("/", async (req, res) => {

    try {

        const pedidosResult = await pool.query(`
            SELECT
                p.id,
                p.cliente_id,
                p.entrega,
                p.pago,
                p.estado,
                p.total,
                p.necesita_cambio,
                p.cambio,
                p.costo_envio,
                p.distancia_delivery,
                p.creado_en,

                c.nombre AS cliente_nombre,
                c.telefono AS cliente_telefono,
                c.direccion AS cliente_direccion

            FROM pedidos p

            LEFT JOIN clientes c
                ON c.id = p.cliente_id

            ORDER BY p.id DESC
        `);


        const pedidos = [];


        for (const pedido of pedidosResult.rows) {

            const detalle = await pool.query(`
                SELECT
                    dp.producto_id,
                    dp.cantidad,
                    dp.precio_unitario,
                    dp.subtotal,
                    pr.nombre

                FROM detalle_pedidos dp

                LEFT JOIN productos pr
                    ON pr.id = dp.producto_id

                WHERE dp.pedido_id = $1

                ORDER BY dp.id ASC
            `, [pedido.id]);


            pedidos.push({

                id: pedido.id,

                cliente: {
                    nombre: pedido.cliente_nombre,
                    telefono: pedido.cliente_telefono,
                    direccion: pedido.cliente_direccion
                },

                entrega: pedido.entrega,
                pago: pedido.pago,
                estado: pedido.estado,

                total: Number(pedido.total),

                necesitaCambio: pedido.necesita_cambio,

                cambio:
                    pedido.cambio !== null
                        ? Number(pedido.cambio)
                        : null,

                costo_envio:
                    Number(pedido.costo_envio || 0),

                distancia_delivery:
                    pedido.distancia_delivery !== null
                        ? Number(pedido.distancia_delivery)
                        : null,

                creado_en: pedido.creado_en,

                productos:
                    detalle.rows.map(producto => ({

                        producto_id:
                            producto.producto_id,

                        nombre:
                            producto.nombre,

                        cantidad:
                            Number(producto.cantidad),

                        precio:
                            Number(producto.precio_unitario),

                        subtotal:
                            Number(producto.subtotal)
                    }))
            });
        }


        res.json({
            ok: true,
            pedidos
        });


    } catch (error) {

        console.error("ERROR OBTENIENDO PEDIDOS:", error);

        res.status(500).json({
            ok: false,
            error: "Error obteniendo los pedidos."
        });
    }
});


// =====================================================
// OBTENER UN PEDIDO POR ID
// =====================================================
// ESTA RUTA SOLUCIONA:
// GET /api/pedidos/69
// GET /api/pedidos/72
// GET /api/pedidos/91
// etc.
// =====================================================

router.get("/:id", async (req, res) => {

    try {

        const id = Number(req.params.id);


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res.status(400).json({
                ok: false,
                error: "ID de pedido inválido."
            });
        }


        // =================================================
        // PEDIDO + CLIENTE
        // =================================================

        const pedidoResult = await pool.query(`
            SELECT
                p.id,
                p.cliente_id,
                p.entrega,
                p.pago,
                p.estado,
                p.total,
                p.necesita_cambio,
                p.cambio,
                p.costo_envio,
                p.distancia_delivery,
                p.creado_en,

                c.nombre AS cliente_nombre,
                c.telefono AS cliente_telefono,
                c.direccion AS cliente_direccion

            FROM pedidos p

            LEFT JOIN clientes c
                ON c.id = p.cliente_id

            WHERE p.id = $1

            LIMIT 1
        `, [id]);


        if (pedidoResult.rows.length === 0) {

            return res.status(404).json({
                ok: false,
                error: "Pedido no encontrado."
            });
        }


        const pedido = pedidoResult.rows[0];


        // =================================================
        // PRODUCTOS DEL PEDIDO
        // =================================================

        const detalleResult = await pool.query(`
            SELECT
                dp.producto_id,
                dp.cantidad,
                dp.precio_unitario,
                dp.subtotal,
                pr.nombre

            FROM detalle_pedidos dp

            LEFT JOIN productos pr
                ON pr.id = dp.producto_id

            WHERE dp.pedido_id = $1

            ORDER BY dp.id ASC
        `, [id]);


        // =================================================
        // RESPUESTA
        // =================================================

        res.json({

            ok: true,

            pedido: {

                id: pedido.id,

                cliente: {

                    nombre:
                        pedido.cliente_nombre,

                    telefono:
                        pedido.cliente_telefono,

                    direccion:
                        pedido.cliente_direccion
                },

                entrega:
                    pedido.entrega,

                pago:
                    pedido.pago,

                estado:
                    pedido.estado,

                total:
                    Number(pedido.total),

                necesitaCambio:
                    pedido.necesita_cambio,

                cambio:
                    pedido.cambio !== null
                        ? Number(pedido.cambio)
                        : null,

                costo_envio:
                    Number(pedido.costo_envio || 0),

                distancia_delivery:
                    pedido.distancia_delivery !== null
                        ? Number(pedido.distancia_delivery)
                        : null,

                creado_en:
                    pedido.creado_en,

                productos:
                    detalleResult.rows.map(producto => ({

                        producto_id:
                            producto.producto_id,

                        nombre:
                            producto.nombre,

                        cantidad:
                            Number(producto.cantidad),

                        precio:
                            Number(producto.precio_unitario),

                        subtotal:
                            Number(producto.subtotal)
                    }))
            }
        });


    } catch (error) {

        console.error(
            "ERROR OBTENIENDO DETALLE DEL PEDIDO:",
            error
        );

        res.status(500).json({
            ok: false,
            error: "Error obteniendo el detalle del pedido."
        });
    }
});


module.exports = router;
