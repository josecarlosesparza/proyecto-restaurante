<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use App\Models\Order;
use App\Services\FirebaseMessagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

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
        Order $order,
        FirebaseMessagingService $firebase
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

        // El cambio de estado ya quedó guardado.
        $this->notificarCliente($updatedOrder, $firebase);

        return response()->json([
            'message' => 'Estado del pedido actualizado correctamente.',
            'order' => $updatedOrder,
        ]);
    }

    private function notificarCliente(
        Order $order,
        FirebaseMessagingService $firebase
    ): void {
        $mensajes = [
            'preparing' => 'Estamos preparando tu pedido.',
            'out_for_delivery' => 'Tu pedido está en camino.',
            'delivered' => 'Tu pedido fue marcado como entregado. ¡Gracias por elegirnos!',
        ];

        $mensaje = $mensajes[$order->status] ?? null;

        if ($mensaje === null) {
            return;
        }

        try {
            // Solo dispositivos asociados al dueño del pedido.
            $dispositivos = DeviceToken::query()
                ->where('user_id', $order->user_id)
                ->where('platform', 'android')
                ->get();

            foreach ($dispositivos as $dispositivo) {
                try {
                    $firebase->enviar(
                        $dispositivo->token,
                        'Tokis Burger · Pedido #' . $order->id,
                        $mensaje
                    );
                } catch (Throwable $error) {
                    Log::warning(
                        'No se pudo enviar la notificación del pedido.',
                        [
                            'order_id' => $order->id,
                            'device_token_id' => $dispositivo->id,
                            'error_type' => get_class($error),
                        ]
                    );
                }
            }
        } catch (Throwable $error) {
            Log::warning(
                'No se pudieron consultar los dispositivos del cliente.',
                [
                    'order_id' => $order->id,
                    'error_type' => get_class($error),
                ]
            );
        }
    }
}