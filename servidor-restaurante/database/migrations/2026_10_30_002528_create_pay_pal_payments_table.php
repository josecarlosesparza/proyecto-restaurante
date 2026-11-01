<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pay_pal_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->restrictOnDelete();

            $table->string('paypal_order_id', 100)
                ->nullable()
                ->unique();

            $table->string('paypal_capture_id', 100)
                ->nullable()
                ->unique();

            $table->uuid('create_request_id')->unique();
            $table->uuid('capture_request_id')->unique();

            $table->decimal('amount', 12, 2);
            $table->char('currency', 3)->default('MXN');

            $table->string('status', 30)->default('created');

            $table->text('approval_url')->nullable();

            $table->timestamps();

            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pay_pal_payments');
    }
};