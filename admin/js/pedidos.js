async function imprimirPedido(pedidoId) {

    try {

        const datos = await obtenerDatosPedido(pedidoId);

        const ventana = window.open(
            "",
            "_blank",
            "width=450,height=800"
        );

        if (!ventana) {

            alert(
                "⚠️ El navegador bloqueó la ventana. Permití las ventanas emergentes."
            );

            return;
        }

        ventana.document.write(`

<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<title>
Pedido #${datos.pedido.id}
</title>

<style>

@page {
    size: 80mm auto;
    margin: 0;
}

* {
    box-sizing: border-box;
}

html,
body {

    margin: 0;
    padding: 0;

    width: 80mm;

    background: white;

}

body {

    color: black;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    font-size: 12px;

}

.ticket {

    width: 80mm;

    padding: 3mm;

}

.centro {

    text-align: center;

}

.logo {

    font-size: 22px;

    font-weight: bold;

}

.pedido {

    font-size: 20px;

    font-weight: bold;

    margin: 8px 0;

}

.linea {

    border-top:
        1px dashed black;

    margin: 8px 0;

}

.info {

    line-height: 1.6;

}

.producto {

    display: flex;

    justify-content:
        space-between;

    gap: 8px;

    margin: 8px 0;

}

.total {

    display: flex;

    justify-content:
        space-between;

    font-size: 20px;

    font-weight: bold;

}

.observaciones {

    margin-top: 8px;

}

@media print {

    @page {

        size: 80mm auto;

        margin: 0;

    }

    .ticket {

        width: 80mm;

        padding: 3mm;

    }

}

</style>

</head>

<body>

${crearTicketHTML(
    datos.pedido,
    datos.productos
)}

<script>

window.onload = function() {

    setTimeout(function() {

        window.focus();

        window.print();

    }, 300);

};

<\/script>

</body>

</html>

        `);

        ventana.document.close();

    } catch (error) {

        console.error(
            "ERROR IMPRIMIENDO:",
            error
        );

        alert(
            "❌ " + error.message
        );

    }

}
