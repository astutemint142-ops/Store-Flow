<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\ReminderStatus;
use App\Http\Controllers\Controller;
use App\Models\DueReminder;
use App\Models\Item;
use App\Models\Order;
use App\Models\ReminderLog;

class DashboardController extends Controller
{
    /**
     * Summary stats for the Owner dashboard: today's revenue, today's order
     * volume, items running low on stock, and customers who still owe money.
     */
    public function summary()
    {
        $todaysSalesTotal = Order::where('order_status', OrderStatus::Completed)
            ->whereDate('updated_at', today())
            ->sum('total_amount');

        $todaysOrdersQuery = Order::whereDate('created_at', today());
        $todaysOrdersCount = (clone $todaysOrdersQuery)->count();
        $todaysOrders = (clone $todaysOrdersQuery)
            ->with(['items.item', 'customer', 'creator'])
            ->latest()
            ->limit(3)
            ->get();

        $lowStockItems = Item::with('category')
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->orderBy('stock_quantity')
            ->get();

        $pendingDuesQuery = DueReminder::where('reminder_status', '!=', ReminderStatus::Cleared);
        $pendingDuesCount = (clone $pendingDuesQuery)->count();
        $pendingDues = (clone $pendingDuesQuery)
            ->with(['customer', 'order'])
            ->orderBy('next_reminder_date')
            ->limit(2)
            ->get();

        $recentReminders = ReminderLog::with('dueReminder.customer')
            ->latest('sent_at')
            ->limit(20)
            ->get();

        return response()->json([
            'todays_sales_total' => $todaysSalesTotal,
            'todays_orders_count' => $todaysOrdersCount,
            'todays_orders' => $todaysOrders,
            'low_stock_items' => $lowStockItems,
            'pending_dues' => $pendingDues,
            'pending_dues_count' => $pendingDuesCount,
            'recent_reminders' => $recentReminders,
        ]);
    }
}
