<?php

return [
    // Entorno de pruebas: no procesa dinero real.
    'base_url' => 'https://api-m.sandbox.paypal.com',

    'client_id' => env('PAYPAL_CLIENT_ID'),

    'client_secret' => env('PAYPAL_CLIENT_SECRET'),

    'currency' => 'MXN',
];