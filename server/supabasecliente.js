const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
 
// =====================================================
// CLIENTE DE SUPABASE (uso exclusivo del backend)
// =====================================================
// Usa la SERVICE ROLE KEY (no la anon key) porque el
// backend necesita permiso para subir/eliminar archivos
// en el bucket sin depender de políticas RLS de usuario.
// Esta key NUNCA debe exponerse en el frontend/admin.
 
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
 
const BUCKET = process.env.SUPABASE_BUCKET || "productos";
 
// =====================================================
// SUBIR IMAGEN AL BUCKET
// =====================================================
// Recibe el buffer que entrega multer (memoryStorage) y
// devuelve la URL pública para guardar en la base de datos.
 
async function subirImagen(file) {
 
    if (!file) {
        return "";
    }
 
    const extension = file.originalname
        .substring(file.originalname.lastIndexOf("."))
        .toLowerCase();
 
    const nombreArchivo =
        Date.now() + "-" + Math.round(Math.random() * 1000000000) + extension;
 
    const { error } = await supabase
        .storage
        .from(BUCKET)
        .upload(nombreArchivo, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });
 
    if (error) {
        throw new Error("Error al subir la imagen a Supabase: " + error.message);
    }
 
    const { data } = supabase
        .storage
        .from(BUCKET)
        .getPublicUrl(nombreArchivo);
 
    return data.publicUrl;
 
}
 
// =====================================================
// ELIMINAR IMAGEN DEL BUCKET
// =====================================================
// Recibe la URL pública guardada en la base de datos,
// extrae el nombre de archivo y lo borra del bucket.
 
async function eliminarImagen(urlImagen) {
 
    if (!urlImagen) {
        return;
    }
 
    // Solo procesamos imágenes que viven en nuestro bucket de Supabase
    if (!urlImagen.includes("/storage/v1/object/public/" + BUCKET + "/")) {
        return;
    }
 
    const nombreArchivo = urlImagen.split("/").pop();
 
    const { error } = await supabase
        .storage
        .from(BUCKET)
        .remove([nombreArchivo]);
 
    if (error) {
        console.error("No se pudo eliminar imagen de Supabase:", error.message);
    }
 
}
 
module.exports = {
    subirImagen,
    eliminarImagen
};
 
