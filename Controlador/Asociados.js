document.addEventListener("DOMContentLoaded", () => {
    const formAsociado = document.getElementById("formAsociado");

    if (formAsociado) {
        formAsociado.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const documento = formAsociado.querySelector("input[type='text']").value;
            const nombre = formAsociado.querySelectorAll("input[type='text']")[1].value;
            
            alert(`¡Asociado ${nombre} registrado con éxito!`);
            formAsociado.reset();
        });
    }
});