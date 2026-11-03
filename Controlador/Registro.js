document.addEventListener("DOMContentLoaded", () => {
    const formRegistro = document.getElementById("formRegistro");

    if (formRegistro) {
        formRegistro.addEventListener("submit", (e) => {
            e.preventDefault();

            const passwordInputs = formRegistro.querySelectorAll("input[type='password']");

            if (passwordInputs.length >= 2) {
                const pass1 = passwordInputs[0].value;
                const pass2 = passwordInputs[1].value;

                if (pass1 !== pass2) {
                    alert("Error: Las contraseñas no coinciden. Por favor verifíquelas.");
                    return;
                }
            }

            alert("¡Usuario registrado en el sistema correctamente!");
            window.location.href = "Login.html";
        });
    }

    console.log("Módulo de Registro de Usuario listo.");
});