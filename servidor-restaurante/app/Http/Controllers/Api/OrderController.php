<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with('items')
            ->latest('id')
            ->paginate(10);

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'delivery_address' => [
                'required',
                'string',
                'min:10',
                'max:500',
            ],
            'delivery_references' => [
                'nullable',
                'string',
                'max:500',
            ],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                'exists:products,id',
            ],
            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:99',
            ],
        ], [
            'delivery_address.required' => 'Escribe la dirección de entrega.',
            'delivery_address.min' => 'La dirección debe tener al menos 10 caracteres.',
            'items.required' => 'Agrega productos al pedido.',
            'items.min' => 'El pedido debe contener al menos un producto.',
            'items.*.product_id.distinct' => 'Un producto no puede repetirse en el pedido.',
            'items.*.product_id.exists' => 'Uno de los productos ya no existe.',
            'items.*.quantity.min' => 'La cantidad mínima es una unidad.',
            'items.*.quantity.max' => 'La cantidad máxima por producto es 99.',
        ]);

        $order = DB::transaction(function () use ($request, $data) {
            $productIds = collect($data['items'])
                ->pluck('product_id');

            // Bloquear los productos durante el cálculo y guardado.
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $details = [];
            $totalCents = 0;

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);

                if (!$product || !$product->is_available) {
                    throw ValidationException::withMessages([
                        'items' => [
                            'Uno de los productos ya no está disponible. Actualiza el catálogo.',
                        ],
                    ]);
                }

                $unitCents = $this->toCents($product->price);

                if ($unitCents <= 0) {
                    throw ValidationException::withMessages([
                        'items' => [
                            'Uno de los productos tiene un precio inválido.',
                        ],
                    ]);
                }

                $subtotalCents = $unitCents * $item['quantity'];
                $totalCents += $subtotalCents;

                // Límite permitido por las columnas decimal(12, 2).
                if ($totalCents > 999999999999) {
                    throw ValidationException::withMessages([
                        'items' => [
                            'El importe del pedido supera el máximo permitido.',
                        ],
                    ]);
                }

                $details[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $this->toDecimal($unitCents),
                    'subtotal' => $this->toDecimal($subtotalCents),
                ];
            }

            $order = Order::create([
                'user_id' => $request->user()->id,
                'delivery_address' => $data['delivery_address'],
                'delivery_references' => $data['delivery_references'] ?? null,
                'total' => $this->toDecimal($totalCents),
                'status' => 'received',
                'payment_status' => 'pending',
            ]);

            $order->items()->createMany($details);

            return $order->load('items');
        });

        return response()->json([
            'message' => 'Pedido registrado correctamente.',
            'order' => $order,
        ], 201);
    }

    private function toCents(string $amount): int
    {
        [$whole, $fraction] = array_pad(
            explode('.', $amount, 2),
            2,
            '00'
        );

        return ((int) $whole * 100)
            + (int) str_pad($fraction, 2, '0');
    }

    private function toDecimal(int $cents): string
    {
        return intdiv($cents, 100)
            . '.'
            . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}