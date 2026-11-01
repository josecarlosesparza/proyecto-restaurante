<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::query()
            ->with('category:id,name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'products' => $products,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateProduct($request);

        $product = Product::create($data);

        return response()->json([
            'message' => 'Producto creado correctamente.',
            'product' => $product->load('category:id,name'),
        ], 201);
    }

    public function update(
        Request $request,
        Product $product
    ): JsonResponse {
        $data = $this->validateProduct($request);

        $product->update($data);

        return response()->json([
            'message' => 'Producto actualizado correctamente.',
            'product' => $product->load('category:id,name'),
        ]);
    }

    private function validateProduct(Request $request): array
    {
        return $request->validate([
            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => [
                'required',
                'numeric',
                'min:0.01',
                'max:99999999.99',
                'decimal:0,2',
            ],
            'image_url' => [
                'nullable',
                'string',
                'url:https',
                'max:2048',
            ],
            'is_available' => ['required', 'boolean'],
        ], [
            'category_id.required' => 'Selecciona una categoría.',
            'category_id.exists' => 'La categoría seleccionada no existe.',
            'name.required' => 'El nombre del producto es obligatorio.',
            'price.required' => 'El precio es obligatorio.',
            'price.numeric' => 'El precio debe ser un número.',
            'price.min' => 'El precio debe ser mayor que cero.',
            'price.decimal' => 'El precio admite como máximo dos decimales.',
            'image_url.url' => 'La imagen debe tener una dirección HTTPS válida.',
            'is_available.required' => 'Indica si el producto está disponible.',
        ]);
    }
}