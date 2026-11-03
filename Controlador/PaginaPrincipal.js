document.addEventListener('DOMContentLoaded', () => {
    const Logueado = localStorage.getItem('Logueado');
    if (Logueado !== 'true') {
        window.location.href = 'Login.html'
        return;
    }

    const Nombre = localStorage.getItem('Nombre');
    const Rol = localStorage.getItem('Rol');

    document.getElementById('NombreUsuario').textContent = Nombre;

    if (Rol === 'admin') {
        document.getElementById('TarjetasAdministrador').classList.remove('d-none');
        document.getElementById('TarjetasAsociados').classList.add('d-none');
    }
    else{
        document.getElementById('TarjetasAdministrador').classList.add('d-none');
        document.getElementById('TarjetasAsociados').classList.remove('d-none');
    }
});

function CerrarSesión(){
    localStorage.clear();
    window.location.href = 'Login.html';
}