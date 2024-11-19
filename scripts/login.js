$(document).ready(function () {
    $('#form-login').on('submit', function (event) {
        event.preventDefault();
        
        const email = $('#email-login').val().trim();
        const password = $('#password-login').val().trim();
        
        if (email && password) {
            $.ajax({
                url: `http://localhost:5187/api/Menu/usuariosEmailPass?email=${email}&password=${password}`,
                type: 'GET',
                success: function (response) {
                    if (response.length > 0) {
                        const usuarioId = response[0].usuarioId;
                        localStorage.setItem('usuarioId', usuarioId);
                        console.log(usuarioId);

                        alert('Inicio de sesión exitoso');
                        window.location.href = 'menu.html';
                    } else {
                        alert('Correo o contraseña incorrectos');
                    }
                },
                error: function (error) {
                    console.error('Error:', error);
                    alert('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
                }
            });
        } else {
            alert('Por favor, completa todos los campos');
        }
    });
});
