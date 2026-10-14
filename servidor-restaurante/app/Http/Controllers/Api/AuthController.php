<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    private const PRIVACY_NOTICE_VERSION = '1.0';

    public function register(Request $request): JsonResponse
    {
        // Normalizar los datos antes de validarlos.
        $request->merge([
            'name' => is_string($request->input('name'))
                ? trim($request->input('name'))
                : $request->input('name'),

            'email' => is_string($request->input('email'))
                ? strtolower(trim($request->input('email')))
                : $request->input('email'),
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'password' => ['required', 'string', 'min:8', 'max:128', 'confirmed'],
            'privacy_consent' => ['required', 'accepted'],
            'privacy_notice_version' => [
                'required',
                'string',
                Rule::in([self::PRIVACY_NOTICE_VERSION]),
            ],
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'email.required' => 'El correo es obligatorio.',
            'email.email' => 'El correo no es válido.',
            'email.unique' => 'Este correo ya está registrado.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas deben coincidir.',
            'privacy_consent.required' => 'Debes indicar tu consentimiento.',
            'privacy_consent.accepted' => 'Debes aceptar el aviso de privacidad.',
            'privacy_notice_version.required' => 'Falta la versión del aviso.',
            'privacy_notice_version.in' => 'Consulta y acepta la versión vigente del aviso.',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'privacy_consent_at' => now(),
            'privacy_notice_version' => self::PRIVACY_NOTICE_VERSION,
        ]);

        return response()->json([
            'message' => 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'email' => is_string($request->input('email'))
                ? strtolower(trim($request->input('email')))
                : $request->input('email'),
        ]);

        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:128'],
        ], [
            'email.required' => 'El correo es obligatorio.',
            'email.email' => 'El correo no es válido.',
            'password.required' => 'La contraseña es obligatoria.',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Correo o contraseña incorrectos.',
            ], 401);
        }

        $token = $user->createToken(
            'app-restaurante',
            ['*'],
            now()->addDays(7)
        )->plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesión correcto.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}