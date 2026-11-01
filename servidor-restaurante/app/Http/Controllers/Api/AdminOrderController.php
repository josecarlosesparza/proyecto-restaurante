<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminOrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with([
                'items',
                'user:id,name,email',
            ])
            ->latest('id')
            ->paginate(10);

        return response()->json($orders);
    }

    public function updateStatus(
        Request $request,
        Order $order
    ): JsonResponse {
        $data = $request->validate([
            'status' => [
                'required',
                'string',
                Rule::in([
                    'preparing',
                    'out_for_delivery',
                    'delivered',
                ]),
            ],
        ], [
            'status.required' => 'Selecciona el nuevo estado del pedido.',
            'status.in' => 'El estado seleccionado no es válido.',
        ]);

        $updatedOrder = DB::transaction(function () use ($order, $data) {
            $lockedOrder = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $nextStatus = [
                'received' => 'preparing',
                'preparing' => 'out_for_delivery',
                'out_for_delivery' => 'delivered',
            ];

            $allowedStatus = $nextStatus[$lockedOrder->status] ?? null;

            if ($data['status'] !== $allowedStatus) {
                throw ValidationException::withMessages([
                    'status' => [
                        'El pedido solo puede avanzar al siguiente estado permitido.',
                    ],
                ]);
            }

            $lockedOrder->status = $data['status'];
            $lockedOrder->save();

            return $lockedOrder->load([
                'items',
                'user:id,name,email',
            ]);
        });

        return response()->json([
            'message' => 'Estado del pedido actualizado correctamente.',
            'order' => $updatedOrder,
        ]);
    }
}