<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GooglePlacesService
{
    private function client(): PendingRequest
    {
        $apiKey = config('google_places.api_key');

        if (!$apiKey) {
            throw new RuntimeException(
                'Falta configurar la clave de Google Places.'
            );
        }

        return Http::baseUrl(config('google_places.base_url'))
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'X-Goog-Api-Key' => $apiKey,
            ])
            ->connectTimeout(10)
            ->timeout(15);
    }

    public function autocomplete(
        string $input,
        string $sessionToken
    ): array {
        $response = $this->client()
            ->withHeaders([
                'X-Goog-FieldMask' =>
                    'suggestions.placePrediction.placeId,'
                    . 'suggestions.placePrediction.text.text',
            ])
            ->post('/places:autocomplete', [
                'input' => $input,
                'sessionToken' => $sessionToken,
                'languageCode' => config('google_places.language_code'),
                'regionCode' => config('google_places.region_code'),
                'includedRegionCodes' => ['mx'],
                'includeQueryPredictions' => false,

                // Favorecer resultados cercanos a Aguascalientes.
                // No representa una validación de cobertura de entrega.
                'locationBias' => [
                    'circle' => [
                        'center' => [
                            'latitude' => 21.8853,
                            'longitude' => -102.2916,
                        ],
                        'radius' => 20000.0,
                    ],
                ],
            ]);

        $data = $this->readResponse($response);

        return collect($data['suggestions'] ?? [])
            ->map(function ($suggestion) {
                $prediction = $suggestion['placePrediction'] ?? [];

                return [
                    'place_id' => $prediction['placeId'] ?? null,
                    'description' => $prediction['text']['text'] ?? null,
                ];
            })
            ->filter(
                fn ($suggestion) =>
                    is_string($suggestion['place_id'])
                    && is_string($suggestion['description'])
            )
            ->values()
            ->all();
    }

    public function details(
        string $placeId,
        string $sessionToken
    ): array {
        $response = $this->client()
            ->withHeaders([
                'X-Goog-FieldMask' => 'id,formattedAddress,location',
            ])
            ->get('/places/' . rawurlencode($placeId), [
                'sessionToken' => $sessionToken,
                'languageCode' => config('google_places.language_code'),
                'regionCode' => config('google_places.region_code'),
            ]);

        $data = $this->readResponse($response);

        if (
            empty($data['id']) ||
            empty($data['formattedAddress'])
        ) {
            throw new RuntimeException(
                'Google no devolvió una dirección válida.'
            );
        }

        return [
            'place_id' => $data['id'],
            'address' => $data['formattedAddress'],
            'latitude' => $data['location']['latitude'] ?? null,
            'longitude' => $data['location']['longitude'] ?? null,
        ];
    }

    private function readResponse(Response $response): array
    {
        if (!$response->successful()) {
            throw new RuntimeException(
                'Google Places rechazó la solicitud. Código HTTP: '
                . $response->status()
                . '. Estado: '
                . $response->json('error.status', 'UNKNOWN')
                . '.'
            );
        }

        $data = $response->json();

        if (!is_array($data)) {
            throw new RuntimeException(
                'Google Places devolvió una respuesta inesperada.'
            );
        }

        return $data;
    }
}