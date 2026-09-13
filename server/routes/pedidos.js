const express = require("express");

const router = express.Router();

const pool = require("../database");

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
// POST /api/pedidos
// =====================================================

router.post("/", async (req, res) => {

    const client = await pool.connect();

    try {

        const {
            cliente,
            entrega,
            pago,
            necesitaCambio,
            cambio,
            productos
        } = req.body;


        // =================================================
        // VALIDAR CLIENTE
        // =================================================

        if (!cliente) {

            return res.status(400).json({
                error: "Faltan los datos del cliente."
            });

        }

        if (!cliente.nombre) {

            return res.status(400).json({
                error: "El nombre es obligatorio."
            });

        }

        if (!cliente.telefono) {

            return res.status(400).json({
                error: "El teléfono es obligatorio."
            });

        }


        // =================================================
        // VALIDAR PRODUCTOS
        // =================================================

        if (
            !productos ||
            !Array.isArray(productos) ||
            productos.length === 0
        ) {

            return res.status(400).json({
                error: "El pedido no tiene productos."
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
                error: "Forma de entrega inválida."
            });

        }

        const tipoEntrega =
            entrega;


        // =================================================
        // VALIDAR FORMA DE PAGO
        // =================================================

        const formasPagoPermitidas = [
            "efectivo",
            "pos",
            "mercado_pago"
        ];

        if (
            !formasPagoPermitidas.includes(pago)
        ) {

            return res.status(400).json({
                error: "Forma de pago inválida."
            });

        }

        const formaPago =
            pago;


        // =================================================
        // VALIDAR CAMBIO
        // =================================================

        let necesitaCambioFinal = false;
        let cambioFinal = null;


        // El cambio solamente aplica para efectivo
        if (formaPago === "efectivo") {

            necesitaCambioFinal =
                necesitaCambio === true;


            if (necesitaCambioFinal) {

                cambioFinal =
                    Number(cambio);


                if (
                    !Number.isFinite(cambioFinal) ||
                    cambioFinal <= 0
                ) {

                    return res.status(400).json({
                        error:
                            "Debes indicar con cuánto vas a pagar."
                    });

                }

            }

        }


        // =================================================
        // ESTADO INICIAL
        // =================================================

        const estadoInicial =
            formaPago === "mercado_pago"
                ? "en_proceso_pago"
                : "nuevo";


        // =================================================
        // INICIAR TRANSACCIÓN
        // =================================================

        await client.query("BEGIN");


        // =================================================
        // BUSCAR CLIENTE
        // =================================================

        const clienteExistente =
            await client.query(
                `
                SELECT id
                FROM clientes
                WHERE telefono = $1
                LIMIT 1
                `,
                [
                    cliente.telefono
                ]
            );


        let clienteId;


        // =================================================
        // CLIENTE EXISTENTE
        // =================================================

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
                    cliente.nombre,
                    cliente.direccion || "",
                    clienteId
                ]
            );

        }


        // =================================================
        // NUEVO CLIENTE
        // =================================================

        else {

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
                        cliente.nombre,
                        cliente.telefono,
                        cliente.direccion || ""
                    ]
                );


            clienteId =
                nuevoCliente.rows[0].id;

        }


        // =================================================
        // PRODUCTOS Y TOTAL
        // =================================================

        let total = 0;

        const productosFinales = [];


        for (
            const producto of productos
        ) {

            const productoId =
                Number(
                    producto.producto_id
                );

            const cantidad =
                Number(
                    producto.cantidad
                );


            if (
                !productoId ||
                !Number.isInteger(cantidad) ||
                cantidad <= 0
            ) {

                throw new Error(
                    "Hay un producto inválido en el pedido."
                );

            }


            // =================================================
            // BUSCAR PRODUCTO
            // =================================================

            const resultado =
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
                resultado.rows.length === 0
            ) {

                throw new Error(
                    `El producto con ID ${productoId} no existe.`
                );

            }


            const productoBD =
                resultado.rows[0];


            // =================================================
            // COMPROBAR DISPONIBILIDAD
            // =================================================

            if (
                productoBD.disponible !== true
            ) {

                throw new Error(
                    `El producto "${productoBD.nombre}" no está disponible.`
                );

            }


            // =================================================
            // PRECIO REAL DE LA BASE DE DATOS
            // =================================================

            const precio =
                Number(
                    productoBD.precio
                );


            const subtotal =
                precio * cantidad;


            total += subtotal;


            productosFinales.push({

                id:
                    productoBD.id,

                nombre:
                    productoBD.nombre,

                cantidad:
                    cantidad,

                precio:
                    precio,

                subtotal:
                    subtotal

            });

        }


        // =================================================
        // REDONDEAR TOTAL
        // =================================================

        total =
            Number(
                total.toFixed(2)
            );


        // =================================================
        // VALIDAR MONTO DE CAMBIO CONTRA TOTAL
        // =================================================

        if (
            formaPago === "efectivo" &&
            necesitaCambioFinal
        ) {

            if (
                cambioFinal < total
            ) {

                throw new Error(
                    `El monto con el que vas a pagar debe ser igual o mayor al total de $${total.toFixed(2)}.`
                );

            }

        }


        // =================================================
        // CREAR PEDIDO
        // =================================================

        const nuevoPedido =
            await client.query(
                `
                INSERT INTO pedidos
                (
                    cliente_id,
                    tipo_entrega,
                    forma_pago,
                    estado,
                    total,
                    observaciones,
                    necesita_cambio,
                    cambio_de
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
                    $8
                )
                RETURNING
                    id,
                    total,
                    estado,
                    forma_pago,
                    tipo_entrega,
                    necesita_cambio,
                    cambio_de,
                    creado_en
                `,
                [
                    clienteId,
                    tipoEntrega,
                    formaPago,
                    estadoInicial,
                    total,
                    cliente.comentarios || "",
                    necesitaCambioFinal,
                    cambioFinal
                ]
            );


        const pedido =
            nuevoPedido.rows[0];


        // =================================================
        // GUARDAR DETALLE DEL PEDIDO
        // =================================================

        for (
            const producto of productosFinales
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


        // =================================================
        // CONFIRMAR TRANSACCIÓN
        // =================================================

        await client.query("COMMIT");


        // =================================================
        // RESPUESTA
        // =================================================

        res.status(201).json({

            ok: true,

            mensaje:
                "Pedido creado correctamente.",

            id:
                pedido.id,

            total:
                Number(
                    Number(
                        pedido.total
                    ).toFixed(2)
                ),

            estado:
                pedido.estado,

            forma_pago:
                pedido.forma_pago,

            tipo_entrega:
                pedido.tipo_entrega,

            necesita_cambio:
                pedido.necesita_cambio,

            cambio_de:
                pedido.cambio_de !== null
                    ? Number(
                        pedido.cambio_de
                    )
                    : null,

            creado_en:
                pedido.creado_en

        });


    } catch (error) {

        try {

            await client.query(
                "ROLLBACK"
            );

        } catch (rollbackError) {

            console.error(
                "ERROR ROLLBACK:",
                rollbackError
            );

        }


        console.error(
            "❌ ERROR CREANDO PEDIDO:",
            error
        );


        res.status(500).json({

            ok: false,

            error:
                error.message ||
                "Error interno del servidor."

        });


    } finally {

        client.release();

    }

});


// =====================================================
// OBTENER TODOS LOS PEDIDOS
// GET /api/pedidos
// =====================================================

router.get("/", async (req, res) => {

    try {

        const resultado =
            await pool.query(
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
                    p.observaciones,
                    p.necesita_cambio,
                    p.cambio_de,
                    p.creado_en

                FROM pedidos p

                LEFT JOIN clientes c
                    ON c.id = p.cliente_id

                ORDER BY
                    p.creado_en DESC
                `
            );


        res.json(
            resultado.rows
        );


    } catch (error) {

        console.error(
            "❌ ERROR OBTENIENDO PEDIDOS:",
            error
        );


        res.status(500).json({

            error:
                "No se pudieron obtener los pedidos."

        });

    }

});


// =====================================================
// OBTENER PEDIDO POR ID
// GET /api/pedidos/:id
// =====================================================

router.get("/:id", async (req, res) => {

    try {

        const pedidoId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(pedidoId) ||
            pedidoId <= 0
        ) {

            return res.status(400).json({

                error:
                    "ID de pedido inválido."

            });

        }


        // =================================================
        // DATOS DEL PEDIDO
        // =================================================

        const pedido =
            await pool.query(
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
                    p.observaciones,
                    p.necesita_cambio,
                    p.cambio_de,
                    p.creado_en

                FROM pedidos p

                LEFT JOIN clientes c
                    ON c.id = p.cliente_id

                WHERE p.id = $1
                `,
                [
                    pedidoId
                ]
            );


        if (
            pedido.rows.length === 0
        ) {

            return res.status(404).json({

                error:
                    "Pedido no encontrado."

            });

        }


        // =================================================
        // PRODUCTOS DEL PEDIDO
        // =================================================

        const detalles =
            await pool.query(
                `
                SELECT
                    d.id,
                    d.producto_id,
                    pr.nombre,
                    pr.imagen,
                    d.cantidad,
                    d.precio_unitario,
                    d.subtotal

                FROM detalle_pedidos d

                LEFT JOIN productos pr
                    ON pr.id = d.producto_id

                WHERE d.pedido_id = $1

                ORDER BY d.id
                `,
                [
                    pedidoId
                ]
            );


        // =================================================
        // RESPUESTA
        // =================================================

        res.json({

            pedido:
                pedido.rows[0],

            productos:
                detalles.rows

        });


    } catch (error) {

        console.error(
            "❌ ERROR OBTENIENDO PEDIDO:",
            error
        );


        res.status(500).json({

            error:
                "No se pudo obtener el pedido."

        });

    }

});


// =====================================================
// CAMBIAR ESTADO
// PATCH /api/pedidos/:id/estado
// =====================================================

router.patch(
    "/:id/estado",
    async (req, res) => {

        try {

            const pedidoId =
                Number(
                    req.params.id
                );


            const {
                estado
            } = req.body;


            // =================================================
            // VALIDAR ID
            // =================================================

            if (
                !Number.isInteger(pedidoId) ||
                pedidoId <= 0
            ) {

                return res.status(400).json({

                    error:
                        "ID de pedido inválido."

                });

            }


            // =================================================
            // VALIDAR ESTADO
            // =================================================

            if (!estado) {

                return res.status(400).json({

                    error:
                        "Falta el estado."

                });

            }


            if (
                !ESTADOS_PERMITIDOS.includes(
                    estado
                )
            ) {

                return res.status(400).json({

                    error:
                        "Estado de pedido inválido.",

                    estados_permitidos:
                        ESTADOS_PERMITIDOS

                });

            }


            // =================================================
            // OBTENER ESTADO ACTUAL
            // =================================================

            const pedidoActual =
                await pool.query(
                    `
                    SELECT
                        id,
                        estado,
                        forma_pago

                    FROM pedidos

                    WHERE id = $1

                    LIMIT 1
                    `,
                    [
                        pedidoId
                    ]
                );


            if (
                pedidoActual.rows.length === 0
            ) {

                return res.status(404).json({

                    error:
                        "Pedido no encontrado."

                });

            }


            const estadoActual =
                pedidoActual.rows[0].estado;


            // =================================================
            // PROTEGER MERCADO PAGO
            // =================================================

            if (
                estadoActual ===
                "en_proceso_pago"
            ) {

                return res.status(403).json({

                    error:
                        "Este pedido está esperando la confirmación de Mercado Pago. No puede activarse manualmente."

                });

            }


            // =================================================
            // EVITAR ESTADO ANTIGUO
            // =================================================

            if (
                estado === "confirmado"
            ) {

                return res.status(400).json({

                    error:
                        "El estado confirmado ya no se utiliza."

                });

            }


            // =================================================
            // TRANSICIONES PERMITIDAS
            // =================================================

            const transicionesPermitidas = {

                nuevo: [
                    "preparando",
                    "cancelado"
                ],

                preparando: [
                    "listo",
                    "cancelado"
                ],

                listo: [
                    "entregado",
                    "cancelado"
                ],

                entregado: [
                    "cancelado"
                ],

                cancelado: [
                    "nuevo"
                ]

            };


            const permitidas =
                transicionesPermitidas[
                    estadoActual
                ] || [];


            if (
                !permitidas.includes(
                    estado
                )
            ) {

                return res.status(400).json({

                    error:
                        `No se puede cambiar el pedido de "${estadoActual}" a "${estado}".`

                });

            }


            // =================================================
            // ACTUALIZAR ESTADO
            // =================================================

            const resultado =
                await pool.query(
                    `
                    UPDATE pedidos

                    SET
                        estado = $1

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


            // =================================================
            // RESPUESTA
            // =================================================

            res.json({

                ok: true,

                mensaje:
                    "Estado actualizado correctamente.",

                pedido:
                    resultado.rows[0]

            });


        } catch (error) {

            console.error(
                "❌ ERROR CAMBIANDO ESTADO:",
                error
            );


            res.status(500).json({

                error:
                    "No se pudo actualizar el estado."

            });

        }

    }
);


// =====================================================
// EXPORTAR ROUTER
// =====================================================

module.exports = router;
