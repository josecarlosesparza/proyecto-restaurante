<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $catalogo = [
                'Hamburguesas' => [
                    [
                        'name' => 'Tokis Clásica',
                        'description' => 'Carne de res, queso, lechuga, tomate y aderezo de la casa.',
                        'price' => '89.00',
                    ],
                    [
                        'name' => 'Tokis Doble',
                        'description' => 'Doble carne de res, doble queso y aderezo de la casa.',
                        'price' => '119.00',
                    ],
                ],
                'Bebidas' => [
                    [
                        'name' => 'Refresco',
                        'description' => 'Refresco de 355 ml.',
                        'price' => '25.00',
                    ],
                    [
                        'name' => 'Agua natural',
                        'description' => 'Botella de agua de 600 ml.',
                        'price' => '20.00',
                    ],
                ],
                'Papas' => [
                    [
                        'name' => 'Papas clásicas',
                        'description' => 'Porción de papas fritas con sal.',
                        'price' => '39.00',
                    ],
                ],
                'Combos' => [
                    [
                        'name' => 'Combo Tokis',
                        'description' => 'Hamburguesa clásica, papas y refresco.',
                        'price' => '139.00',
                    ],
                ],
            ];

            foreach ($catalogo as $nombreCategoria => $productos) {
                $categoria = Category::firstOrCreate([
                    'name' => $nombreCategoria,
                ]);

                foreach ($productos as $producto) {
                    Product::firstOrCreate(
                        [
                            'category_id' => $categoria->id,
                            'name' => $producto['name'],
                        ],
                        [
                            'description' => $producto['description'],
                            'price' => $producto['price'],
                            'image_url' => null,
                            'is_available' => true,
                        ]
                    );
                }
            }
        });
    }
}