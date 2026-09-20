const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pool = require("../database");


// =====================================================
// CARPETA DE IMÁGENES
// =====================================================

const uploadDir = path.join(
    __dirname,
    "../uploads"
);

if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(
        uploadDir,
        {
            recursive: true
        }
    );

}


// =====================================================
// CONFIGURACIÓN DE MULTER
// =====================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(
            null,
            uploadDir
        );

    },

    filename: (req, file, cb) => {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        const nombreArchivo =
            Date.now() +
            "-" +
            Math.round(
                Math.random() * 1000000000
            ) +
            extension;


        cb(
            null,
            nombreArchivo
        );

    }

});


// =====================================================
// TIPOS DE IMAGEN PERMITIDOS
// =====================================================

const fileFilter = (
    req,
    file,
    cb
) => {

    const tiposPermitidos = [

        "image/jpeg",

        "image/png",

        "image/webp"

    ];


    if (
        tiposPermitidos.includes(
            file.mimetype
        )
    ) {

        cb(
            null,
            true
        );

    } else {

        cb(
            new Error(
                "Solo se permiten imágenes JPG, PNG o WEBP"
            )
        );

    }

};


// =====================================================
// MULTER
// =====================================================

const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize:
            5 * 1024 * 1024

    }

});


// =====================================================
// GET
// OBTENER TODOS LOS PRODUCTOS
// =====================================================

router.get(
    "/",
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        productos.id,
                        productos.categoria_id,
                        productos.nombre,
                        productos.descripcion,
                        productos.precio,
                        productos.imagen,
                        productos.disponible,
                        productos.creado_en,

                        categorias.nombre
                            AS categoria

                    FROM productos

                    LEFT JOIN categorias
                        ON productos.categoria_id =
                           categorias.id

                    ORDER BY
                        productos.id DESC
                `);


            res.json(
                resultado.rows
            );


        } catch (error) {

            console.error(
                "ERROR OBTENIENDO PRODUCTOS:",
                error
            );


            res.status(500).json({

                error:
                    "Error al obtener los productos"

            });

        }

    }
);


// =====================================================
// GET
// OBTENER UN PRODUCTO
// =====================================================

router.get(
    "/:id",
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const resultado =
                await pool.query(
                    `
                    SELECT
                        productos.id,
                        productos.categoria_id,
                        productos.nombre,
                        productos.descripcion,
                        productos.precio,
                        productos.imagen,
                        productos.disponible,
                        productos.creado_en,

                        categorias.nombre
                            AS categoria

                    FROM productos

                    LEFT JOIN categorias
                        ON productos.categoria_id =
                           categorias.id

                    WHERE productos.id = $1
                    `,
                    [id]
                );


            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    error:
                        "Producto no encontrado"

                });

            }


            res.json(
                resultado.rows[0]
            );


        } catch (error) {

            console.error(
                "ERROR OBTENIENDO PRODUCTO:",
                error
            );


            res.status(500).json({

                error:
                    "Error al obtener el producto"

            });

        }

    }
);


// =====================================================
// POST
// CREAR PRODUCTO
// =====================================================

router.post(
    "/",
    upload.single("imagen"),
    async (req, res) => {

        try {

            console.log("");
            console.log(
                "======================================"
            );
            console.log(
                "      NUEVO PRODUCTO RECIBIDO"
            );
            console.log(
                "======================================"
            );

            console.log(
                "BODY:",
                req.body
            );

            console.log(
                "FILE:",
                req.file
            );


            const {

                categoria_id,

                nombre,

                descripcion,

                precio

            } = req.body;


            // =========================================
            // VALIDAR NOMBRE
            // =========================================

            if (
                !nombre ||
                nombre.trim() === ""
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(400).json({

                    error:
                        "El nombre del producto es obligatorio"

                });

            }


            // =========================================
            // VALIDAR PRECIO
            // =========================================

            if (
                !precio ||
                isNaN(precio) ||
                Number(precio) <= 0
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(400).json({

                    error:
                        "El precio debe ser válido"

                });

            }


            // =========================================
            // VALIDAR CATEGORÍA
            // =========================================

            if (
                !categoria_id ||
                isNaN(categoria_id)
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(400).json({

                    error:
                        "Debés seleccionar una categoría"

                });

            }


            // =========================================
            // COMPROBAR CATEGORÍA
            // =========================================

            const categoria =
                await pool.query(
                    `
                    SELECT id
                    FROM categorias
                    WHERE id = $1
                    AND activa = true
                    `,
                    [categoria_id]
                );


            if (
                categoria.rows.length === 0
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(400).json({

                    error:
                        "La categoría no existe o está desactivada"

                });

            }


            // =========================================
            // IMAGEN
            // =========================================

            let imagen = "";


            if (req.file) {

                imagen =
                    `/uploads/${req.file.filename}`;

            }


            // =========================================
            // INSERTAR PRODUCTO
            // =========================================

            const resultado =
                await pool.query(
                    `
                    INSERT INTO productos
                    (
                        categoria_id,
                        nombre,
                        descripcion,
                        precio,
                        imagen,
                        disponible
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        true
                    )

                    RETURNING *
                    `,
                    [

                        Number(
                            categoria_id
                        ),

                        nombre.trim(),

                        descripcion
                            ? descripcion.trim()
                            : "",

                        Number(
                            precio
                        ),

                        imagen

                    ]
                );


            console.log(
                "PRODUCTO CREADO:",
                resultado.rows[0]
            );


            res.status(201).json({

                mensaje:
                    "Producto creado correctamente",

                producto:
                    resultado.rows[0]

            });


        } catch (error) {

            console.error(
                "ERROR CREANDO PRODUCTO:",
                error
            );


            eliminarArchivo(
                req.file
            );


            res.status(500).json({

                error:
                    error.message ||
                    "Error al crear el producto"

            });

        }

    }
);


// =====================================================
// PUT
// EDITAR PRODUCTO
// =====================================================

router.put(
    "/:id",
    upload.single("imagen"),
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const {

                categoria_id,

                nombre,

                descripcion,

                precio

            } = req.body;


            // =========================================
            // VALIDAR NOMBRE
            // =========================================

            if (
                !nombre ||
                nombre.trim() === ""
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(400).json({

                    error:
                        "El nombre es obligatorio"

                });

            }


            // =========================================
            // VALIDAR PRECIO
            // =========================================

            if (
                !precio ||
                isNaN(precio) ||
                Number(precio) <= 0
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(400).json({

                    error:
                        "El precio debe ser válido"

                });

            }


            // =========================================
            // VALIDAR CATEGORÍA
            // =========================================

            if (
                !categoria_id ||
                isNaN(categoria_id)
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(400).json({

                    error:
                        "Debés seleccionar una categoría"

                });

            }


            // =========================================
            // BUSCAR PRODUCTO
            // =========================================

            const productoActual =
                await pool.query(
                    `
                    SELECT *
                    FROM productos
                    WHERE id = $1
                    `,
                    [id]
                );


            if (
                productoActual.rows.length === 0
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(404).json({

                    error:
                        "Producto no encontrado"

                });

            }


            const productoAnterior =
                productoActual.rows[0];


            // =========================================
            // COMPROBAR CATEGORÍA
            // =========================================

            const categoria =
                await pool.query(
                    `
                    SELECT id
                    FROM categorias
                    WHERE id = $1
                    AND activa = true
                    `,
                    [categoria_id]
                );


            if (
                categoria.rows.length === 0
            ) {

                eliminarArchivo(
                    req.file
                );


                return res.status(400).json({

                    error:
                        "La categoría no existe o está desactivada"

                });

            }


            // =========================================
            // MANTENER IMAGEN ACTUAL
            // =========================================

            let imagen =
                productoAnterior.imagen || "";


            // =========================================
            // NUEVA IMAGEN
            // =========================================

            if (
                req.file
            ) {

                imagen =
                    `/uploads/${req.file.filename}`;


                // -----------------------------
                // BORRAR IMAGEN ANTERIOR
                // -----------------------------

                eliminarImagenGuardada(
                    productoAnterior.imagen
                );

            }


            // =========================================
            // ACTUALIZAR
            // =========================================

            const resultado =
                await pool.query(
                    `
                    UPDATE productos

                    SET

                        categoria_id = $1,

                        nombre = $2,

                        descripcion = $3,

                        precio = $4,

                        imagen = $5

                    WHERE id = $6

                    RETURNING *
                    `,
                    [

                        Number(
                            categoria_id
                        ),

                        nombre.trim(),

                        descripcion
                            ? descripcion.trim()
                            : "",

                        Number(
                            precio
                        ),

                        imagen,

                        id

                    ]
                );


            res.json({

                mensaje:
                    "Producto actualizado correctamente",

                producto:
                    resultado.rows[0]

            });


        } catch (error) {

            console.error(
                "ERROR EDITANDO PRODUCTO:",
                error
            );


            eliminarArchivo(
                req.file
            );


            res.status(500).json({

                error:
                    error.message ||
                    "Error al actualizar el producto"

            });

        }

    }
);


// =====================================================
// PATCH
// ACTIVAR / AGOTAR PRODUCTO
// =====================================================

router.patch(
    "/:id/disponibilidad",
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const { disponible } =
                req.body;


            if (
                typeof disponible !==
                "boolean"
            ) {

                return res.status(400).json({

                    error:
                        "El campo disponible debe ser true o false"

                });

            }


            const resultado =
                await pool.query(
                    `
                    UPDATE productos

                    SET disponible = $1

                    WHERE id = $2

                    RETURNING *
                    `,
                    [

                        disponible,

                        id

                    ]
                );


            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    error:
                        "Producto no encontrado"

                });

            }


            res.json({

                mensaje:
                    "Disponibilidad actualizada correctamente",

                producto:
                    resultado.rows[0]

            });


        } catch (error) {

            console.error(
                "ERROR CAMBIANDO DISPONIBILIDAD:",
                error
            );


            res.status(500).json({

                error:
                    "Error al cambiar la disponibilidad"

            });

        }

    }
);


// =====================================================
// DELETE
// ELIMINAR PRODUCTO
// =====================================================

router.delete(
    "/:id",
    async (req, res) => {

        try {

            const { id } =
                req.params;


            // =========================================
            // BUSCAR PRODUCTO
            // =========================================

            const producto =
                await pool.query(
                    `
                    SELECT
                        id,
                        nombre,
                        imagen
                    FROM productos
                    WHERE id = $1
                    `,
                    [id]
                );


            if (
                producto.rows.length === 0
            ) {

                return res.status(404).json({

                    error:
                        "Producto no encontrado"

                });

            }


            const productoActual =
                producto.rows[0];


            // =========================================
            // COMPROBAR SI TIENE VENTAS
            // =========================================

            const ventas =
                await pool.query(
                    `
                    SELECT COUNT(*)::integer
                        AS cantidad

                    FROM detalle_pedidos

                    WHERE producto_id = $1
                    `,
                    [id]
                );


            const cantidadVentas =
                ventas.rows[0].cantidad;


            // =========================================
            // ELIMINAR PRODUCTO
            // =========================================

            await pool.query(
                `
                DELETE FROM productos

                WHERE id = $1
                `,
                [id]
            );


            // =========================================
            // ELIMINAR IMAGEN
            // =========================================

            eliminarImagenGuardada(
                productoActual.imagen
            );


            res.json({

                mensaje:
                    cantidadVentas > 0
                        ? "Producto eliminado. El historial de pedidos conserva sus registros."
                        : "Producto eliminado correctamente"

            });


        } catch (error) {

            console.error(
                "ERROR ELIMINANDO PRODUCTO:",
                error
            );


            // -----------------------------------------
            // PROBLEMA POR FOREIGN KEY
            // -----------------------------------------

            if (
                error.code === "23503"
            ) {

                return res.status(400).json({

                    error:
                        "No se puede eliminar este producto porque está asociado a pedidos existentes. Podés marcarlo como Agotado en lugar de eliminarlo."

                });

            }


            res.status(500).json({

                error:
                    "Error al eliminar el producto"

            });

        }

    }
);


// =====================================================
// FUNCIÓN: ELIMINAR ARCHIVO SUBIDO
// =====================================================

function eliminarArchivo(
    archivo
) {

    if (
        !archivo ||
        !archivo.path
    ) {

        return;

    }


    try {

        if (
            fs.existsSync(
                archivo.path
            )
        ) {

            fs.unlinkSync(
                archivo.path
            );

        }

    } catch (error) {

        console.error(
            "No se pudo eliminar archivo:",
            error
        );

    }

}


// =====================================================
// FUNCIÓN: ELIMINAR IMAGEN DE PRODUCTO
// =====================================================

function eliminarImagenGuardada(
    imagen
) {

    if (
        !imagen
    ) {

        return;

    }


    // Solo procesamos imágenes locales
    if (
        !imagen.startsWith(
            "/uploads/"
        )
    ) {

        return;

    }


    const ruta =
        path.join(
            __dirname,
            "..",
            imagen.replace(
                /^\//,
                ""
            )
        );


    try {

        if (
            fs.existsSync(
                ruta
            )
        ) {

            fs.unlinkSync(
                ruta
            );

            console.log(
                "Imagen eliminada:",
                ruta
            );

        }

    } catch (error) {

        console.error(
            "No se pudo eliminar imagen:",
            error
        );

    }

}


// =====================================================
// MANEJO DE ERRORES DE MULTER
// =====================================================

router.use(
    (error, req, res, next) => {

        console.error(
            "ERROR DE MULTER:",
            error
        );


        if (
            error instanceof
            multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    error:
                        "La imagen no puede superar los 5 MB"

                });

            }


            return res.status(400).json({

                error:
                    error.message

            });

        }


        if (
            error.message &&
            error.message.includes(
                "Solo se permiten imágenes"
            )
        ) {

            return res.status(400).json({

                error:
                    error.message

            });

        }


        next(error);

    }
);


module.exports = router;