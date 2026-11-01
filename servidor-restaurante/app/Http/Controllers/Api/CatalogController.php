<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'categories' => $categories,
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $products = Product::query()
            ->with('category:id,name')
            ->where('is_available', true)
            ->when(
                isset($data['category_id']),
                fn ($query) => $query->where(
                    'category_id',
                    $data['category_id']
                )
            )
            ->orderBy('name')
            ->get();

        return response()->json([
            'products' => $products,
        ]);
    }
}