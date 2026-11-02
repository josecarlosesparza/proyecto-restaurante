<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'token' => ['required', 'string', 'max:4096', 'regex:/^\S+$/'],
            'platform' => ['required', 'in:android'],
        ]);

        $ahora = now();

        DeviceToken::upsert(
            [
                [
                    'user_id' => $request->user()->id,
                    'token' => $datos['token'],
                    'token_hash' => hash('sha256', $datos['token']),
                    'platform' => $datos['platform'],
                    'last_used_at' => $ahora,
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ],
            ],
            ['token_hash'],
            [
                'user_id',
                'token',
                'platform',
                'last_used_at',
                'updated_at',
            ]
        );

        return response()->json([
            'message' => 'Dispositivo registrado para recibir notificaciones.',
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'token' => ['required', 'string', 'max:4096', 'regex:/^\S+$/'],
        ]);

        DeviceToken::query()
            ->where('user_id', $request->user()->id)
            ->where('token_hash', hash('sha256', $datos['token']))
            ->delete();

        return response()->json([
            'message' => 'Dispositivo desvinculado de las notificaciones.',
        ]);
    }
}