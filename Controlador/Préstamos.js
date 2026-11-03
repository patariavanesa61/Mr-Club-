document.addEventListener("DOMContentLoaded", () => {
    console.log("Módulo de Préstamos cargado correctamente.");

    const formPrestamo = document.querySelector("form");
    if (formPrestamo) {
        formPrestamo.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Préstamo registrado exitosamente.");
            formPrestamo.reset();
        });
    }
});