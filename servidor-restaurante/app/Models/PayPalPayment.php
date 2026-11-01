<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayPalPayment extends Model
{
    protected $fillable = [
        'order_id',
        'paypal_order_id',
        'paypal_capture_id',
        'create_request_id',
        'capture_request_id',
        'amount',
        'currency',
        'status',
        'approval_url',
    ];

    protected $hidden = [
        'create_request_id',
        'capture_request_id',
        'approval_url',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}