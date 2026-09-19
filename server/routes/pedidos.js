const express = require("express");

const router = express.Router();

const pool = require("../database");


// =====================================================
// COMPROBAR SI LA PÁGINA ESTÁ ACTIVA MANUALMENTE
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
        // COMPROBAR SI LA PÁGINA ESTÁ ACTIVA
        // =====================================================

        const paginaActiva =
            await paginaEstaActiva();

        if (!paginaActiva) {

            return res.status(403).json({
                ok: false,
                mensaje:
                    "Flame Burger está cerrado y no está recibiendo pedidos en este momento."
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


        const nombreCliente =
            String(
                cliente.nombre || ""
            ).trim();

        const telefonoCliente =
            String(
                cliente.telefono || ""
            ).trim();

        const direccionCliente =
            String(
                cliente.direccion || ""
            ).trim();


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

        if (
            ![
                "delivery",
                "retiro"
            ].includes(entrega)
        ) {

            return res.status(400).json({
                ok: false,
                error: "Tipo de entrega inválido."
            });
        }


        if (
            entrega === "delivery" &&
            !direccionCliente
        ) {

            return res.status(400).json({
                ok: false,
                error:
                    "La dirección es obligatoria para delivery."
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


        if (
            !formasPagoPermitidas.includes(pago)
        ) {

            return res.status(400).json({
                ok: false,
                error:
                    "Forma de pago inválida."
            });
        }


        // =====================================================
        // PRODUCTOS
        // =====================================================

        if (
            !Array.isArray(productos) ||
            productos.length === 0
        ) {

            return res.status(400).json({
                ok: false,
                error:
                    "El pedido no contiene productos."
            });
        }


        // =====================================================
        // INICIAR TRANSACCIÓN
        // =====================================================

        await client.query("BEGIN");


        // =====================================================
        // CLIENTE
        // =====================================================

        let clienteId;


        const clienteExistente =
            await client.query(
                `
                SELECT id
                FROM clientes
                WHERE telefono = $1
                LIMIT 1
                `,
                [
                    telefonoCliente
                ]
            );


        if (
            clienteExistente.rows.length > 0
        ) {

            clienteId =
                clienteExistente.rows[0].id;


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

            const nuevoCliente =
                await client.query(
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


            clienteId =
                nuevoCliente.rows[0].id;
        }


        // =====================================================
        // DELIVERY
        // =====================================================

        let costoEnvioFinal = 0;

        let distanciaDeliveryFinal = null;


        if (entrega === "delivery") {

            const distancia =
                Number(
                    distancia_delivery
                );


            if (
                !Number.isFinite(distancia) ||
                distancia < 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    error:
                        "No se pudo determinar correctamente la distancia del delivery."
                });
            }


            distanciaDeliveryFinal =
                Number(
                    distancia.toFixed(2)
                );


            // =================================================
            // MÁS DE 6 KM
            // =================================================

            if (
                distanciaDeliveryFinal > 6
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    error:
                        "La dirección está a más de 6 km. Flame Burger no realiza delivery hasta esa zona."
                });
            }


            // =================================================
            // HASTA 3 KM GRATIS
            // =================================================

            if (
                distanciaDeliveryFinal <= 3
            ) {

                costoEnvioFinal = 0;

            } else {

                // =================================================
                // MÁS DE 3 KM Y HASTA 6 KM
                // =================================================

                costoEnvioFinal = 100;
            }

        } else {

            // =================================================
            // RETIRO EN LOCAL
            // =================================================

            costoEnvioFinal = 0;

            distanciaDeliveryFinal = null;
        }


        // =====================================================
        // CALCULAR TOTAL DE PRODUCTOS
        // =====================================================

        let total = 0;

        const productosFinales = [];


        for (const item of productos) {

            const productoId =
                Number(item.producto_id);

            const cantidad =
                Number(item.cantidad);


            if (
                !Number.isInteger(productoId) ||
                productoId <= 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    error:
                        "Producto inválido."
                });
            }


            if (
                !Number.isInteger(cantidad) ||
                cantidad <= 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    error:
                        "Cantidad de producto inválida."
                });
            }


            // =================================================
            // BUSCAR PRODUCTO
            // =================================================

            const productoResult =
                await client.query(
                    `
                    SELECT
                        id,
                        nombre,
                        precio,
                        disponible
                    FROM productos
                    WHERE id = $1
                    `,
                    [
                        productoId
                    ]
                );


            if (
                productoResult.rows.length === 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    error:
                        `El producto ${productoId} no existe.`
                });
            }


            const producto =
                productoResult.rows[0];


            // =================================================
            // DISPONIBILIDAD
            // =================================================

            if (
                !producto.disponible
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    error:
                        `El producto "${producto.nombre}" no está disponible.`
                });
            }


            // =================================================
            // PRECIO
            // =================================================

            const precio =
                Number(
                    producto.precio
                );


            if (
                !Number.isFinite(precio)
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(500).json({
                    ok: false,
                    error:
                        `El precio del producto "${producto.nombre}" no es válido.`
                });
            }


            const subtotal =
                Number(
                    (
                        precio *
                        cantidad
                    ).toFixed(2)
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

        total =
            Number(
                (
                    total +
                    costoEnvioFinal
                ).toFixed(2)
            );


        // =====================================================
        // EFECTIVO
        // =====================================================

        const necesitaCambioFinal =
            pago === "efectivo"
                ? Boolean(necesitaCambio)
                : false;


        let cambioDeFinal = null;


        if (
            pago === "efectivo" &&
            necesitaCambioFinal
        ) {

            const cambioNumero =
                Number(cambio);


            if (
                !Number.isFinite(cambioNumero) ||
                cambioNumero <= 0
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    error:
                        "Ingresá correctamente el monto con el que se va a pagar."
                });
            }


            if (
                cambioNumero < total
            ) {

                await client.query(
                    "ROLLBACK"
                );

                return res.status(400).json({
                    ok: false,
                    error:
                        `El monto ingresado ($${cambioNumero}) es menor al total del pedido ($${total}).`
                });
            }


            cambioDeFinal =
                Number(
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

        const pedidoResult =
            await client.query(
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


        const pedido =
            pedidoResult.rows[0];


        // =====================================================
        // DETALLE DEL PEDIDO
        // =====================================================

        for (
            const producto
            of productosFinales
        ) {

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
        // RESPUESTA
        // =====================================================

        res.status(201).json({
            ok: true,
            pedido
        });


    } catch (error) {

        // =====================================================
        // ROLLBACK SI HUBO ERROR
        // =====================================================

        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "ERROR EN ROLLBACK:",
                rollbackError
            );
        }


        console.error(
            "ERROR CREANDO PEDIDO:",
            error
        );


        res.status(500).json({
            ok: false,
            error:
                "Error interno al crear el pedido."
        });


    } finally {

        client.release();
    }
});


// =====================================================
// CAMBIAR ESTADO DEL PEDIDO
// =====================================================

router.patch("/:id/estado", async (req, res) => {

    const { id } = req.params;

    const { estado } = req.body;


    // =====================================================
    // VALIDAR ID
    // =====================================================

    const pedidoId =
        Number(id);


    if (
        !Number.isInteger(pedidoId) ||
        pedidoId <= 0
    ) {

        return res.status(400).json({
            ok: false,
            error:
                "ID de pedido inválido."
        });
    }


    // =====================================================
    // VALIDAR ESTADO
    // =====================================================

    if (
        !ESTADOS_PERMITIDOS.includes(estado)
    ) {

        return res.status(400).json({
            ok: false,
            error:
                "Estado de pedido inválido."
        });
    }


    try {

        // =====================================================
        // BUSCAR PEDIDO
        // =====================================================

        const pedidoResult =
            await pool.query(
                `
                SELECT
                    id,
                    estado
                FROM pedidos
                WHERE id = $1
                `,
                [
                    pedidoId
                ]
            );


        if (
            pedidoResult.rows.length === 0
        ) {

            return res.status(404).json({
                ok: false,
                error:
                    "Pedido no encontrado."
            });
        }


        const pedidoActual =
            pedidoResult.rows[0];


        // =====================================================
        // BLOQUEAR CAMBIOS MANUALES DE
        // EN_PROCESO_PAGO
        // =====================================================

        if (
            pedidoActual.estado ===
            "en_proceso_pago"
        ) {

            return res.status(400).json({
                ok: false,
                error:
                    "El pedido todavía está esperando la confirmación del pago de Mercado Pago."
            });
        }


        // =====================================================
        // ACTUALIZAR ESTADO
        // =====================================================

        const resultado =
            await pool.query(
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
                    pedidoId
                ]
            );


        res.json({
            ok: true,
            pedido:
                resultado.rows[0]
        });


    } catch (error) {

        console.error(
            "ERROR CAMBIANDO ESTADO:",
            error
        );


        res.status(500).json({
            ok: false,
            error:
                "Error cambiando el estado del pedido."
        });
    }
});


// =====================================================
// OBTENER TODOS LOS PEDIDOS
// =====================================================

router.get("/", async (req, res) => {

    try {

        const resultado =
            await pool.query(
                `
                SELECT
                    p.id,
                    p.tipo_entrega,
                    p.forma_pago,
                    p.estado,
                    p.total,
                    p.necesita_cambio,
                    p.cambio_de,
                    p.costo_envio,
                    p.distancia_delivery,
                    p.creado_en,

                    c.nombre AS cliente_nombre,
                    c.telefono AS cliente_telefono,
                    c.direccion AS cliente_direccion

                FROM pedidos p

                LEFT JOIN clientes c
                    ON c.id = p.cliente_id

                ORDER BY
                    p.creado_en DESC
                `
            );


        const pedidos = [];


        for (
            const pedido
            of resultado.rows
        ) {

            const detalle =
                await pool.query(
                    `
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

                    ORDER BY dp.producto_id
                    `,
                    [
                        pedido.id
                    ]
                );


            pedidos.push({
                id:
                    pedido.id,

                cliente: {
                    nombre:
                        pedido.cliente_nombre,

                    telefono:
                        pedido.cliente_telefono,

                    direccion:
                        pedido.cliente_direccion
                },

                entrega:
                    pedido.tipo_entrega,

                pago:
                    pedido.forma_pago,

                estado:
                    pedido.estado,

                total:
                    Number(
                        pedido.total
                    ),

                necesitaCambio:
                    pedido.necesita_cambio,

                cambio:
                    pedido.cambio_de !== null
                        ? Number(
                            pedido.cambio_de
                        )
                        : null,

                costo_envio:
                    pedido.costo_envio !== null
                        ? Number(
                            pedido.costo_envio
                        )
                        : 0,

                distancia_delivery:
                    pedido.distancia_delivery !== null
                        ? Number(
                            pedido.distancia_delivery
                        )
                        : null,

                creado_en:
                    pedido.creado_en,

                productos:
                    detalle.rows.map(
                        producto => ({
                            producto_id:
                                producto.producto_id,

                            nombre:
                                producto.nombre,

                            cantidad:
                                producto.cantidad,

                            precio:
                                Number(
                                    producto.precio_unitario
                                ),

                            subtotal:
                                Number(
                                    producto.subtotal
                                )
                        })
                    )
            });
        }


        res.json({
            ok: true,
            pedidos
        });


    } catch (error) {

        console.error(
            "ERROR OBTENIENDO PEDIDOS:",
            error
        );


        res.status(500).json({
            ok: false,
            error:
                "Error obteniendo los pedidos."
        });
    }
});


// =====================================================
// EXPORTAR
// =====================================================

module.exports = router;
