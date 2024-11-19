        function cargarCategorias() {
            $.ajax({
                url: 'http://localhost:5187/api/Menu/categorias',
                method: 'GET',
                success: function(categorias) {
                    $('#categoria').empty();
                    $('#categoria').append('<option value="">Seleccione una categoría</option>');
                    categorias.forEach(function(categoria) {
                        $('#categoria').append(`
                            <option value="${categoria.categoriaId}">${categoria.nombre}</option>
                        `);
                    });
                },
                error: function(error) {
                    alert('Error al cargar las categorías');
                    console.error(error);
                }
            });
        }

        $("#form-producto").submit(function(e) {
            e.preventDefault();
            
            const nuevoProducto = {
                nombre: $("#nombre").val(),
                descripcion: $("#descripcion").val(),
                precio: parseFloat($("#precio").val()),
                cantidad: parseFloat($("#cantidad").val()),
                categoriaId: $("#categoria").val(),
                activo: $("#activo").val() === "true",
                deletedOn: null
            };

            $.ajax({
                url: 'http://localhost:5187/api/Menu/productos',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(nuevoProducto),
                success: function() {
                    alert('Producto agregado exitosamente');
                    obtenerProductos();
                    $("#form-producto")[0].reset();
                },
                error: function(error) {
                    alert('Error al agregar el producto');
                    console.error(error);
                }
            });
        });

        function obtenerProductos() {
            $.ajax({
                url: 'http://localhost:5187/api/Menu/productos', 
                method: 'GET',
                success: function(productos) {
                    $('#productos-lista').empty();
                    productos.forEach(function(producto) {
                        $('#productos-lista').append(`
                            <div class="border p-4 rounded-md shadow-md flex justify-between items-center">
                                <div>
                                    <h3 class="font-bold">${producto.nombre}</h3>
                                    <p class="text-gray-500">${producto.descripcion}</p>
                                </div>
                                <div>
                                    <button class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onclick="eliminarProducto(${producto.productoId})">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        `);
                    });
                },
                error: function(error) {
                    alert('Error al cargar los productos');
                    console.error(error);
                }
            });
        }

        function eliminarProducto(id) {
            if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                $.ajax({
                    url: `http://localhost:5187/api/Menu/productos/${id}`,
                    method: 'DELETE',
                    success: function() {
                        alert('Producto eliminado');
                        obtenerProductos();
                    },
                    error: function(error) {
                        alert('Error al eliminar el producto');
                        console.error(error);
                    }
                });
            }
        }

        $(document).ready(function() {
            cargarCategorias();  
            obtenerProductos(); 
        });