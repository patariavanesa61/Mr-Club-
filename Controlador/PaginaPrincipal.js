document.addEventListener('DOMContentLoaded', () => {
    const Logueado = localStorage.getItem('Logueado');
    if (Logueado !== 'true') {
        window.location.href = '../Vista/Login.html'
        return;
    }

    const Nombre = localStorage.getItem('Nombre');
    const Rol = localStorage.getItem('Rol');

    document.getElementById('NombreUsuario').textContent = Nombre;

    if (Rol === 'admin') {
        document.getElementById('TarjetasAdministrador').classList.remove('d-none');
        document.getElementById('TarjetasAsociados').classList.add('d-none');
    }
    else {
        document.getElementById('TarjetasAdministrador').classList.add('d-none');
        document.getElementById('TarjetasAsociados').classList.remove('d-none');
    }
});

async function CerrarSesión() {
    try {
        const respuesta = await fetch("../Modelo/CerrarSesion.php", { method: "POST", });
        if (!respuesta.ok) {
            throw new Error("Error al cerrar sesión");
        }
        localStorage.clear();
        window.location.href = 'Login.html';
    } catch (error) {
        console.error("Error al cerrar sesión", error);

    }
}
