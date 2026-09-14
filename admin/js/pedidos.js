const net = require("net");

const IP_IMPRESORA = "192.168.1.114";
const PUERTO = 9100;

const cliente = new net.Socket();

cliente.connect(PUERTO, IP_IMPRESORA, () => {
    console.log("✅ Conectado a la impresora");

    const texto =
        "\x1B\x40" +                 // Inicializar impresora
        "\x1B\x61\x01" +             // Centrar
        "FLAME BURGER\n" +
        "========================\n" +
        "PRUEBA DE IMPRESION\n" +
        "========================\n" +
        "\n\n\n" +
        "\x1D\x56\x00";              // Cortar papel

    cliente.write(texto, () => {
        console.log("🧾 Texto enviado a la impresora");
        cliente.end();
    });
});

cliente.on("error", (error) => {
    console.error("❌ Error:", error.message);
});
