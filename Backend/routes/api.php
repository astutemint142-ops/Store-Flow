<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DueReminderController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\TenantController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register/start', [RegistrationController::class, 'start']);
Route::post('/register/verify', [RegistrationController::class, 'verify']);
Route::post('/register/resend', [RegistrationController::class, 'resend']);
Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Every logged-in user (any role) can manage their own account.
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']);

    // Any logged-in staff member can browse the catalog (needed to take orders).
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/items/low-stock', [ItemController::class, 'lowStock']);
    Route::get('/items/{item}', [ItemController::class, 'show']);

    // Only the Owner can add/edit/delete categories and items.
    Route::middleware('role:owner')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
        Route::post('/items', [ItemController::class, 'store']);
        Route::post('/items/import', [ItemController::class, 'import']);
        Route::put('/items/{item}', [ItemController::class, 'update']);
        Route::delete('/items/{item}', [ItemController::class, 'destroy']);

        Route::get('/purchases', [PurchaseController::class, 'index']);
        Route::post('/purchases', [PurchaseController::class, 'store']);

        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/reports/summary', [ReportController::class, 'summary']);
        Route::get('/reports/staff-activity', [ReportController::class, 'staffActivity']);

        // Owner manages Counter Staff / Store Worker accounts for their own business.
        Route::get('/staff', [StaffController::class, 'index']);
        Route::post('/staff', [StaffController::class, 'store']);
        Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);
    });

    // Any logged-in staff member can view the orders list (owner oversight,
    // counter staff checking on "ready" orders, worker's pick list).
    Route::get('/orders', [OrderController::class, 'index']);

    // Owner and Counter Staff can both take customer orders and process payments.
    Route::middleware('role:owner,counter_staff')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
        Route::patch('/orders/{order}/pay', [OrderController::class, 'processPayment']);
        Route::patch('/orders/{order}/items', [OrderController::class, 'updateItems']);
        Route::get('/due-reminders', [DueReminderController::class, 'index']);
        Route::patch('/due-reminders/{dueReminder}/clear', [DueReminderController::class, 'clear']);
    });

    // Store Workers (and the Owner, for oversight) collect items off the shelf.
    Route::middleware('role:store_worker,owner')->group(function () {
        Route::patch('/orders/{order}/items/{orderItem}', [OrderController::class, 'markItemCollected']);
        Route::patch('/orders/{order}/confirm-ready', [OrderController::class, 'confirmReady']);
    });

    // Super Admin — platform-level, manages the list of businesses only.
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/admin/tenants', [TenantController::class, 'index']);
        Route::patch('/admin/tenants/{tenant}/suspend', [TenantController::class, 'suspend']);
        Route::patch('/admin/tenants/{tenant}/reactivate', [TenantController::class, 'reactivate']);
        Route::delete('/admin/tenants/{tenant}', [TenantController::class, 'destroy']);
    });
});
