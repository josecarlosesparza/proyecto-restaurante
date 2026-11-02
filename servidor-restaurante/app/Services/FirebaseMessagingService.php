<?php

namespace App\Services;

use Google\Auth\ApplicationDefaultCredentials;
use GuzzleHttp\Client;
use Google\Auth\HttpHandler\HttpHandlerFactory;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class FirebaseMessagingService
{
    public function enviar(
        string $tokenDispositivo,
        string $titulo,
        string $mensaje
    ): string {
        $proyecto = config('firebase.project_id');

        if (!is_string($proyecto) || $proyecto === '') {
            throw new RuntimeException(
                'Falta configurar FIREBASE_PROJECT_ID.'
            );
        }

        $cliente = new Client([
            'connect_timeout' => 10,
            'timeout' => 20,
        ]);

        $httpHandler = HttpHandlerFactory::build($cliente);

        $credenciales = ApplicationDefaultCredentials::getCredentials(
            ['https://www.googleapis.com/auth/cloud-platform']
        );

        $autenticacion = $credenciales->fetchAuthToken($httpHandler);

        $tokenAcceso = $autenticacion['access_token'] ?? null;

        if (!is_string($tokenAcceso) || $tokenAcceso === '') {
            throw new RuntimeException(
                'No se pudo obtener el acceso a Firebase.'
            );
        }

        $respuesta = Http::withToken($tokenAcceso)
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'x-goog-user-project' => $proyecto,
            ])
            ->connectTimeout(10)
            ->timeout(20)
            ->post(
                'https://fcm.googleapis.com/v1/projects/'
                    . rawurlencode($proyecto)
                    . '/messages:send',
                [
                    'message' => [
                        'token' => $tokenDispositivo,
                        'notification' => [
                            'title' => $titulo,
                            'body' => $mensaje,
                        ],
                        'android' => [
                            'priority' => 'HIGH',
                            'notification' => [
                                'channel_id' => 'pedidos',
                            ],
                        ],
                    ],
                ]
            );

        if (!$respuesta->successful()) {
            $estado = $respuesta->json('error.status');

            throw new RuntimeException(
                'Firebase rechazó el envío. HTTP '
                    . $respuesta->status()
                    . '. Estado: '
                    . (is_string($estado) ? $estado : 'desconocido')
            );
        }

        $identificador = $respuesta->json('name');

        if (!is_string($identificador) || $identificador === '') {
            throw new RuntimeException(
                'Firebase no devolvió un identificador de mensaje.'
            );
        }

        return $identificador;
    }
}