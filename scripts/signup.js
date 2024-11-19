$(document).ready(function () {
    $('#form-create-account').on('submit', function (event) {
        event.preventDefault();
        
        const nombre = $('#nombre').val().trim();
        const telefono = $('#telefono').val().trim();
        const email = $('#email').val().trim();
        const password = $('#password').val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telefonoRegex = /^[0-9]+$/;

        if (nombre && email && password && telefono) {
            if (!emailRegex.test(email)) {
                alert('Por favor, ingresa un correo electrónico válido.');
                return;
            }

            if (!telefonoRegex.test(telefono)) {
                alert('El teléfono debe contener solo números.');
                return;
            }

            $.ajax({
                url: 'http://localhost:5187/api/Menu/usuarios',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    nombre: nombre,
                    telefono: telefono,
                    email: email,
                    password: password,
                    admin: false
                }),
                success: function (response) {
                    alert('Cuenta creada exitosamente');
                    window.location.href = 'index.html';
                },
                error: function (error) {
                    console.error('Error:', error);
                    alert('Ocurrió un error al crear la cuenta. Inténtalo de nuevo.');
                }
            });
        } else {
            alert('Por favor, completa todos los campos');
        }
    });
});
