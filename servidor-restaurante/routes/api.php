<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\PayPalController;

Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:10,1');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/orders', [OrderController::class, 'index']);

    Route::post('/orders', [OrderController::class, 'store']);

    Route::post('/orders/{order}/paypal', [
        PayPalController::class,
        'create',
    ])->middleware('throttle:10,1');

    Route::post('/orders/{order}/paypal/capture', [
        PayPalController::class,
        'capture',
    ])->middleware('throttle:10,1');
});

Route::get('/categories', [CatalogController::class, 'categories']);

Route::get('/products', [CatalogController::class, 'products']);

Route::prefix('admin')
    ->middleware(['auth:sanctum', EnsureUserIsAdmin::class])
    ->group(function () {
        Route::get('/products', [AdminProductController::class, 'index']);

        Route::post('/products', [AdminProductController::class, 'store']);

        Route::put('/products/{product}', [
            AdminProductController::class,
            'update',
        ]);

        Route::get('/orders', [AdminOrderController::class, 'index']);

        Route::put('/orders/{order}/status', [
            AdminOrderController::class,
            'updateStatus',
        ]);
    });