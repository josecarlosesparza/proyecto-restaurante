<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GooglePlacesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AddressController extends Controller
{
    public function autocomplete(
        Request $request,
        GooglePlacesService $places
    ): JsonResponse {
        $data = $request->validate([
            'input' => ['required', 'string', 'min:3', 'max:200'],
            'session_token' => ['required', 'uuid'],
        ]);

        try {
            $suggestions = $places->autocomplete(
                trim($data['input']),
                $data['session_token']
            );

            return response()->json([
                'suggestions' => $suggestions,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'No se pudieron buscar direcciones. Intenta nuevamente.',
            ], 502);
        }
    }

    public function details(
        Request $request,
        GooglePlacesService $places
    ): JsonResponse {
        $data = $request->validate([
            'place_id' => ['required', 'string', 'max:1000'],
            'session_token' => ['required', 'uuid'],
        ]);

        try {
            $address = $places->details(
                $data['place_id'],
                $data['session_token']
            );

            return response()->json([
                'address' => $address,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'No se pudo consultar la dirección seleccionada.',
            ], 502);
        }
    }
}