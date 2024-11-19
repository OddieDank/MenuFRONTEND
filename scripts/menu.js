$(document).ready(function () {
    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
        window.location.href = 'login.html';
    }

    let ordenActivaId = null;
    let ordenDetalles = [];

    cargarProductos();

    function obtenerOrdenActiva(callback) {
        $.ajax({
            url: 'http://localhost:5187/api/Menu/ordenes',
            type: 'GET',
            success: function (ordenes) {
                const ordenActiva = ordenes.find(
                    (orden) => orden.usuarioId === parseInt(usuarioId) && orden.statusId === 3
                );
                ordenActivaId = ordenActiva ? ordenActiva.ordenId : null;
                callback(ordenActivaId);
            },
            error: function () {
                callback(null);
            }
        });
    }

    // Cargar productos
    function cargarProductos() {
        $.ajax({
            url: 'http://localhost:5187/api/Menu/productos',
            type: 'GET',
            success: function (productos) {
                $('#grid-productos').empty();
                productos.forEach(function (producto) {
                    $('#grid-productos').append(`
                        <div class="bg-white p-4 border rounded-lg">
                            <img src="data:image/jpeg;base64,${producto.imagen}" alt="${producto.nombre}" class="w-full h-32 object-cover mb-4">
                            <h3 class="text-lg font-bold">${producto.nombre}</h3>
                            <p class="text-gray-500">${producto.descripcion}</p>
                            <p class="text-sm text-gray-700">Categoría: ${producto.categoria ? producto.categoria.nombre : 'Sin categoría'}</p>
                            <button class="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 agregar-producto" 
                                data-producto-id="${producto.productoId}" 
                                data-producto-nombre="${producto.nombre}" 
                                data-producto-descripcion="${producto.descripcion}" 
                                data-producto-precio="${producto.precio}">
                                Agregar
                            </button>
                                    <div class="p-4 border-t">

                        </div>
                    `);
                });

                $('.agregar-producto').on('click', function () {
                    const producto = {
                        id: $(this).data('producto-id'),
                        nombre: $(this).data('producto-nombre'),
                        descripcion: $(this).data('producto-descripcion'),
                        precio: $(this).data('producto-precio'),
                    };
                    manejarAgregarProducto(producto);
                });
            },
            error: function () {
                alert('Error al cargar los productos');
            }
        });
    }

    $('#orden-contenido').on('click', '#orden-lista-btn', function () {
        obtenerOrdenActiva(function (ordenId) {
            if (!ordenId) {
                alert('No hay una orden activa.');
                return;
            }
    
            $.ajax({
                url: `http://localhost:5187/api/Menu/detalleorden/orden/${ordenId}`,
                type: 'GET',
                success: function (detallesOrden) {
                    let totalPrice = 0;
    
                    detallesOrden.forEach(function (detalle) {
                        const cantidad = detalle.cantidad;
                        const precioUnitario = detalle.producto.precio;
                        totalPrice += cantidad * precioUnitario;
                    });
    
                    $.ajax({
                        url: `http://localhost:5187/api/Menu/ordenes/${ordenId}`,
                        type: 'PUT',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            statusId: 4,
                            totalPrice: totalPrice.toFixed(2),
                            updatedOn: new Date().toISOString(),
                            tiempoEnCompletar: null,
                            locacionId: detallesOrden[0]?.orden?.locacionId,
                            paraLlevar: detallesOrden[0]?.orden?.paraLlevar
                        }),
                        success: function (response) {
                            alert('La orden ha sido actualizada a "En proceso".');
                        },
                        error: function () {
                            alert('Error al actualizar el estado de la orden.');
                        }
                    });
                },
                error: function () {
                    alert('Error al obtener los detalles de la orden.');
                }
            });
        });
    });
    
    
    function manejarAgregarProducto(producto) {
        obtenerOrdenActiva(function (ordenId) {
            if (ordenId) {
                mostrarModalDetalle(producto);
            } else {
                cargarLocaciones(() => {
                    $('#modal-orden').removeClass('hidden'); 
                    
                    $('#confirmar-nueva-orden').off('click').on('click', function (event) {
                        event.preventDefault();
                        const locacionId = $('#locacion').val();
                        const paraLlevar = $('#para-llevar').val() === "true";
                        crearNuevaOrden(locacionId, paraLlevar, function (nuevaOrdenId) {
                            if (nuevaOrdenId) {
                                ordenActivaId = nuevaOrdenId;
                                $('#modal-orden').addClass('hidden');
                                alert('Orden creada con éxito.');
                                cargarCarrito();
                            }
                        });
                    });
                });
            }
        });
    }
    

    function crearNuevaOrden(locacionId, paraLlevar, callback) {
        $.ajax({
            url: 'http://localhost:5187/api/Menu/ordenes',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                usuarioId: parseInt(usuarioId),
                statusId: 3,
                locacionId: locacionId,
                totalPrice: 0,
                paraLlevar: paraLlevar,
                createdOn: new Date().toISOString()
            }),
            success: function (response) {
                alert('Nueva orden creada');
                callback(response.ordenId);
            },
            error: function () {
                alert('Error al crear la nueva orden.');
                callback(null);
            }
        });
    }

    function mostrarModalDetalle(producto) {
        $('#producto-nombre').text(producto.nombre);
        $('#producto-descripcion').text(producto.descripcion);
        $('#producto-precio').text(`$${producto.precio.toFixed(2)}`);
        $('#cantidad').val(1);
        $('#precio-total').text(`$${producto.precio.toFixed(2)}`);

        $('#modal-detalle-orden').removeClass('hidden');

        $('#cantidad').off('input').on('input', function () {
            const cantidad = parseInt($(this).val()) || 1;
            const total = cantidad * producto.precio;
            $('#precio-total').text(`$${total.toFixed(2)}`);
        });

        $('#confirmar-detalle').off('click').on('click', function () {
            const cantidad = parseInt($('#cantidad').val()) || 1;
            agregarProductoAOrden(ordenActivaId, producto.id, cantidad);
            $('#modal-detalle-orden').addClass('hidden');
        });

        $('#cancelar-detalle').off('click').on('click', function () {
            $('#modal-detalle-orden').addClass('hidden');
        });
    }

    function cargarLocaciones(callback) {
        $.ajax({
            url: 'http://localhost:5187/api/Menu/locaciones',
            type: 'GET',
            success: function (locaciones) {
                $('#locacion').empty();
                locaciones.forEach(function (locacion) {
                    $('#locacion').append(`<option value="${locacion.locacionId}">${locacion.mesa}</option>`);
                });
                if (callback) callback();
            },
            error: function () {
                alert('Error al cargar las locaciones');
            }
        });
    }

    function agregarProductoAOrden(ordenId, productoId, cantidad) {
        $.ajax({
            url: `http://localhost:5187/api/Menu/detalleorden`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                OrdenId: ordenId,
                ProductoId: productoId,
                Cantidad: cantidad
            }),
            success: function () {
                alert('Producto agregado a la orden');
                cargarCarrito();
            },
            error: function () {
                alert('Error al agregar el producto');
            }
        });
    }

    $('#modal-orden').on('click', function (event) {
        if (event.target === this) {
            $(this).addClass('hidden');
        }
    });

    $('#carrito-btn').on('click', function () {
        $('#sidebar-carrito').removeClass('translate-x-full');
    });

    $('#cerrar-carrito').on('click', function () {
        $('#sidebar-carrito').addClass('translate-x-full');
    });
    
    $('#productos-btn').on('click', function () {
        $('#sidebar-productos').removeClass('-translate-x-full');
    });

    $('#cerrar-productos').on('click', function () {
        $('#sidebar-productos').addClass('-translate-x-full');
    });



    function cargarCarrito() {
        $.ajax({
            url: 'http://localhost:5187/api/Menu/ordenes',
            type: 'GET',
            success: function (ordenes) {
                const ordenActiva = ordenes.find(
                    (orden) => orden.usuarioId === parseInt(usuarioId) && orden.statusId === 3
                );

                if (ordenActiva) {
                    ordenActivaId = ordenActiva.ordenId;
                    obtenerDetallesOrden(ordenActivaId);
                } else {
                    ordenActivaId = null;
                    $('#orden-contenido').html('<p class="text-gray-500">No hay una orden activa.</p>');
                }
            },
            error: function () {
                alert('Error al obtener las órdenes.');
            }
        });
    }

    function obtenerDetallesOrden(ordenId) {
        console.log(ordenId);
        $.ajax({
            url: `http://localhost:5187/api/Menu/detalleorden/orden/${ordenId}`,
            type: 'GET',
            success: function (detalles) {
                ordenDetalles = detalles;
                renderizarCarrito(detalles);
            },
            error: function () {
                alert('Error al cargar los detalles de la orden.');
            }
        });
    }

    function renderizarCarrito(detalles) {
        if (detalles.length === 0) {
            $('#orden-contenido').html('<p class="text-gray-500">Tu carrito está vacío.</p>');
            return;
        }
    
        let contenidoHTML = `
            <div>
                <button class="w-full text-left flex justify-between items-center bg-green-100 p-2 rounded" id="toggle-orden">
                    <span>Orden #${ordenActivaId}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform rotate-0" id="orden-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
                <div id="detalles-orden" class="hidden mt-2 space-y-4">
        `;
    
        detalles.forEach((detalle) => {
            contenidoHTML += `
                <div class="p-4 border rounded space-y-2" data-detalle-id="${detalle.ordenDtId}">
                    <div class="flex justify-between items-center">
                        <span class="font-bold">${detalle.producto.nombre}</span> <!-- Cambiado para acceder correctamente al nombre -->
                        <button class="text-red-500 eliminar-detalle">Eliminar</button>
                    </div>
                    <p>Precio unitario: $${detalle.producto.precio.toFixed(2)}</p> <!-- Cambiado para acceder al precio -->
                    <div class="flex items-center space-x-4">
                        <button class="bg-gray-200 px-2 py-1 rounded disminuir-cantidad">-</button>
                        <span class="cantidad">${detalle.cantidad}</span>
                        <button class="bg-gray-200 px-2 py-1 rounded aumentar-cantidad">+</button>
                    </div>
                    <p>Subtotal: $<span class="subtotal">${(detalle.cantidad * detalle.producto.precio).toFixed(2)}</span></p> <!-- Actualizado para calcular el subtotal con el precio -->
                </div>
                        <div><button id="orden-lista-btn" class="w-full bg-green-500 text-white p-2 rounded hover:bg-red-600">Orden Lista</button>
        </div>
            `;
        });

        contenidoHTML += '</div></div>';
        $('#orden-contenido').html(contenidoHTML);

        $('#toggle-orden').on('click', function () {
            $('#detalles-orden').toggle();
            $('#orden-icon').toggleClass('rotate-180');
        });

        $('.disminuir-cantidad').on('click', function () {
            const $detalle = $(this).closest('[data-detalle-id]');
            actualizarCantidad($detalle, -1);
        });

        $('.aumentar-cantidad').on('click', function () {
            const $detalle = $(this).closest('[data-detalle-id]');
            actualizarCantidad($detalle, 1);
        });

        $('.eliminar-detalle').on('click', function () {
            const $detalle = $(this).closest('[data-detalle-id]');
            eliminarDetalle($detalle);
        });
    }
    function actualizarCantidad($detalle, cambio) {
        const detalleId = $detalle.data('detalle-id');
        const detalle = ordenDetalles.find((d) => d.ordenDtId === detalleId);
    
        if (!detalle) return;
    
        const nuevaCantidad = Math.max(1, detalle.cantidad + cambio);
        detalle.cantidad = nuevaCantidad;
    
        $detalle.find('.cantidad').text(nuevaCantidad);
        $detalle.find('.subtotal').text((detalle.cantidad * detalle.producto.precio).toFixed(2));
    
        $.ajax({
            url: `http://localhost:5187/api/Menu/detalleorden/${detalleId}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ 
                cantidad: nuevaCantidad,
                productoId: detalle.productoId,
                deletedOn: null
            }),
            success: function () {
                console.log('Cantidad actualizada con éxito.');
            },
            error: function () {
                alert('Error al actualizar la cantidad.');
            }
        });
    }
    
    function eliminarDetalle($detalle) {
        const detalleId = $detalle.data('detalle-id');
    
        $.ajax({
            url: `http://localhost:5187/api/Menu/detalleorden/${detalleId}`,
            type: 'DELETE',
            success: function () {
                ordenDetalles = ordenDetalles.filter((d) => d.ordenDtId !== detalleId); 
                renderizarCarrito(ordenDetalles);
            },
            error: function () {
                alert('Error al eliminar el detalle.');
            }
        });
    }

    $('#carrito-btn').on('click', cargarCarrito);
});
