<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PayPalService
{
    private function accessToken(): string
    {
        $clientId = config('paypal.client_id');
        $clientSecret = config('paypal.client_secret');

        if (!$clientId || !$clientSecret) {
            throw new RuntimeException(
                'Falta configurar las credenciales Sandbox de PayPal.'
            );
        }

        $response = Http::baseUrl(config('paypal.base_url'))
            ->acceptJson()
            ->asForm()
            ->withBasicAuth($clientId, $clientSecret)
            ->connectTimeout(10)
            ->timeout(20)
            ->post('/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        $data = $this->readResponse($response);

        if (empty($data['access_token'])) {
            throw new RuntimeException(
                'PayPal no devolvió un token de acceso válido.'
            );
        }

        return $data['access_token'];
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(config('paypal.base_url'))
            ->acceptJson()
            ->asJson()
            ->withToken($this->accessToken())
            ->connectTimeout(10)
            ->timeout(20);
    }

    public function createOrder(
        Order $order,
        string $requestId,
        string $returnUrl,
        string $cancelUrl
    ): array {
        $response = $this->client()
            ->withHeaders([
                'PayPal-Request-Id' => $requestId,
                'Prefer' => 'return=representation',
            ])
            ->post('/v2/checkout/orders', [
                'intent' => 'CAPTURE',

                'purchase_units' => [
                    [
                        'reference_id' => (string) $order->id,
                        'custom_id' => (string) $order->id,
                        'description' => 'Pedido Tokis Burger #' . $order->id,
                        'amount' => [
                            'currency_code' => config('paypal.currency'),
                            'value' => $order->total,
                        ],
                    ],
                ],

                'payment_source' => [
                    'paypal' => [
                        'experience_context' => [
                            'brand_name' => 'Tokis Burger',
                            'shipping_preference' => 'NO_SHIPPING',
                            'user_action' => 'PAY_NOW',
                            'return_url' => $returnUrl,
                            'cancel_url' => $cancelUrl,
                        ],
                    ],
                ],
            ]);

        return $this->readResponse($response);
    }

    public function captureOrder(
        string $paypalOrderId,
        string $requestId
    ): array {
        $response = $this->client()
            ->withHeaders([
                'PayPal-Request-Id' => $requestId,
                'Prefer' => 'return=representation',
            ])
            ->withBody('{}', 'application/json')
            ->post(
                '/v2/checkout/orders/'
                . rawurlencode($paypalOrderId)
                . '/capture'
            );

        return $this->readResponse($response);
    }

    public function getOrder(string $paypalOrderId): array
    {
        $response = $this->client()
            ->get(
                '/v2/checkout/orders/'
                . rawurlencode($paypalOrderId)
            );

        return $this->readResponse($response);
    }

    private function readResponse(Response $response): array
    {
        if (!$response->successful()) {
            throw new RuntimeException(
                'PayPal no pudo completar la solicitud. Código HTTP: '
                . $response->status()
                . '.'
            );
        }

        $data = $response->json();

        if (!is_array($data)) {
            throw new RuntimeException(
                'PayPal devolvió una respuesta inesperada.'
            );
        }

        return $data;
    }
}