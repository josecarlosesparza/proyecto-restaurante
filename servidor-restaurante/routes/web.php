<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/paypal/return', 'paypal.return');

Route::view('/paypal/cancel', 'paypal.cancel');