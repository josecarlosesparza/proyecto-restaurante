<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PayPalPayment;
use App\Services\PayPalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Throwable;
use Illuminate\Support\Facades\DB;

class PayPalController extends Controller
{
    public function create(
        Request $request,
        Order $order,
        PayPalService $paypal
    ): JsonResponse {
        // No permitir pagos sobre pedidos de otro usuario.
        abort_unless(
            $order->user_id === $request->user()->id,
            404
        );

        // Evitar iniciar operaciones simultáneas para el mismo pedido.
        $result = Cache::lock(
            'paypal-order-' . $order->id,
            120
        )->get(function () use ($order, $paypal) {
            $order->refresh();

            if ($order->payment_status === 'paid') {
                return response()->json([
                    'message' => 'Este pedido ya está pagado.',
                ], 409);
            }

            if ($order->status === 'cancelled') {
                return response()->json([
                    'message' => 'No se puede pagar un pedido cancelado.',
                ], 409);
            }

            if ((float) $order->total <= 0) {
                return response()->json([
                    'message' => 'El importe del pedido no es válido.',
                ], 422);
            }

            $currency = config('paypal.currency');

            // Reutilizar el intento pendiente en lugar de crear otro.
            $payment = $order->payments()
                ->whereIn('status', ['created', 'approval_pending'])
                ->latest('id')
                ->first();

            if (!$payment) {
                $payment = $order->payments()->create([
                    'create_request_id' => (string) Str::uuid(),
                    'capture_request_id' => (string) Str::uuid(),
                    'amount' => $order->total,
                    'currency' => $currency,
                    'status' => 'created',
                ]);
            }

            if (
                $payment->amount !== $order->total ||
                $payment->currency !== $currency
            ) {
                return response()->json([
                    'message' => 'El importe del intento de pago no coincide con el pedido.',
                ], 409);
            }

            if ($payment->paypal_order_id && $payment->approval_url) {
                return $this->approvalResponse($payment);
            }

            $baseUrl = rtrim(config('app.url'), '/');

            try {
                $data = $paypal->createOrder(
                    $order,
                    $payment->create_request_id,
                    $baseUrl . '/paypal/return',
                    $baseUrl . '/paypal/cancel'
                );

                $paypalOrderId = $data['id'] ?? null;

                $approvalUrl = collect($data['links'] ?? [])
                    ->first(
                        fn ($link) => in_array(
                            $link['rel'] ?? '',
                            ['payer-action', 'approve'],
                            true
                        )
                    )['href'] ?? null;

                if (
                    !is_string($paypalOrderId) ||
                    !$this->isSandboxApprovalUrl($approvalUrl)
                ) {
                    return response()->json([
                        'message' => 'PayPal no devolvió un enlace de aprobación válido.',
                    ], 502);
                }

                $payment->update([
                    'paypal_order_id' => $paypalOrderId,
                    'approval_url' => $approvalUrl,
                    'status' => 'approval_pending',
                ]);

                return $this->approvalResponse($payment);
            } catch (Throwable $exception) {
                report($exception);

                return response()->json([
                    'message' => 'No se pudo iniciar el pago con PayPal. Revisa la configuración Sandbox y vuelve a intentarlo.',
                ], 502);
            }
        });

        return $result ?? response()->json([
            'message' => 'Ya se está procesando una operación para este pedido. Espera y vuelve a intentarlo.',
        ], 409);
    }
    
    public function capture(
        Request $request,
        Order $order,
        PayPalService $paypal
    ): JsonResponse {
        abort_unless(
            $order->user_id === $request->user()->id,
            404
        );

        $result = Cache::lock(
            'paypal-order-' . $order->id,
            120
        )->get(function () use ($order, $paypal) {
            $order->refresh();

            if ($order->payment_status === 'paid') {
                return response()->json([
                    'message' => 'Este pedido ya está pagado.',
                    'order' => $order->load('items'),
                ]);
            }

            if ($order->status === 'cancelled') {
                return response()->json([
                    'message' => 'No se puede pagar un pedido cancelado.',
                ], 409);
            }

            $payment = $order->payments()
                ->where('status', 'approval_pending')
                ->whereNotNull('paypal_order_id')
                ->latest('id')
                ->first();

            if (!$payment) {
                return response()->json([
                    'message' => 'Primero inicia el pago de este pedido.',
                ], 409);
            }

            if (
                $payment->amount !== $order->total ||
                $payment->currency !== config('paypal.currency')
            ) {
                return response()->json([
                    'message' => 'El importe o la moneda del pago no coincide con el pedido.',
                ], 409);
            }

            try {
                // Consultar primero permite recuperar una captura anterior
                // si PayPal la procesó pero se interrumpió la conexión.
                $data = $paypal->getOrder($payment->paypal_order_id);

                if (($data['id'] ?? '') !== $payment->paypal_order_id) {
                    return response()->json([
                        'message' => 'La respuesta de PayPal no corresponde a este pago.',
                    ], 502);
                }

                if (($data['status'] ?? '') === 'APPROVED') {
                    $data = $paypal->captureOrder(
                        $payment->paypal_order_id,
                        $payment->capture_request_id
                    );
                } elseif (($data['status'] ?? '') !== 'COMPLETED') {
                    return response()->json([
                        'message' => 'El pago todavía no está aprobado. Completa el proceso en PayPal.',
                    ], 409);
                }

                $units = $data['purchase_units'] ?? [];
                $captures = $units[0]['payments']['captures'] ?? [];
                $capture = $captures[0] ?? [];

                // Esta integración crea una unidad de compra
                // y realiza una sola captura por el importe completo.
                $matches =
                    ($data['id'] ?? '') === $payment->paypal_order_id
                    && count($units) === 1
                    && count($captures) === 1
                    && (string) ($units[0]['custom_id'] ?? '')
                        === (string) $order->id
                    && ($capture['amount']['currency_code'] ?? '')
                        === $payment->currency
                    && ($capture['amount']['value'] ?? '')
                        === $payment->amount
                    && !empty($capture['id']);

                if (!$matches) {
                    return response()->json([
                        'message' => 'No se pudo verificar el importe o la referencia del pago. No se ha marcado como pagado.',
                    ], 502);
                }

                if (
                    ($data['status'] ?? '') !== 'COMPLETED' ||
                    ($capture['status'] ?? '') !== 'COMPLETED'
                ) {
                    return response()->json([
                        'message' => 'PayPal todavía no confirma una captura completada. Consulta nuevamente más tarde.',
                    ], 409);
                }

                $updatedOrder = DB::transaction(
                    function () use ($order, $payment, $capture) {
                        $lockedOrder = Order::query()
                            ->whereKey($order->id)
                            ->lockForUpdate()
                            ->firstOrFail();

                        $lockedPayment = PayPalPayment::query()
                            ->whereKey($payment->id)
                            ->lockForUpdate()
                            ->firstOrFail();

                        if ($lockedOrder->total !== $lockedPayment->amount) {
                            throw new \RuntimeException(
                                'El importe del pedido cambió durante el pago.'
                            );
                        }

                        $lockedPayment->update([
                            'paypal_capture_id' => $capture['id'],
                            'status' => 'completed',
                        ]);

                        $lockedOrder->update([
                            'payment_status' => 'paid',
                        ]);

                        return $lockedOrder->load('items');
                    }
                );

                return response()->json([
                    'message' => 'Pago de prueba confirmado correctamente.',
                    'order' => $updatedOrder,
                ]);
            } catch (Throwable $exception) {
                report($exception);

                return response()->json([
                    'message' => 'No se pudo verificar el pago con PayPal. No vuelvas a pagar: intenta comprobar este mismo pago nuevamente.',
                ], 502);
            }
        });

        return $result ?? response()->json([
            'message' => 'Ya se está procesando una operación para este pedido. Espera y vuelve a intentarlo.',
        ], 409);
    }

    private function approvalResponse(
        PayPalPayment $payment
    ): JsonResponse {
        return response()->json([
            'message' => 'Pago de prueba preparado para aprobación.',
            'payment_id' => $payment->id,
            'paypal_order_id' => $payment->paypal_order_id,
            'approval_url' => $payment->approval_url,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
        ]);
    }

    private function isSandboxApprovalUrl(mixed $url): bool
    {
        if (!is_string($url)) {
            return false;
        }

        $parts = parse_url($url);

        if ($parts === false) {
            return false;
        }

        return ($parts['scheme'] ?? '') === 'https'
            && in_array(
                strtolower($parts['host'] ?? ''),
                ['www.sandbox.paypal.com', 'sandbox.paypal.com'],
                true
            );
    }
}