<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReminderStatus;
use App\Http\Controllers\Controller;
use App\Models\DueReminder;
use App\Services\TwilioSmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DueReminderController extends Controller
{
    /**
     * Searchable/date-filterable list of pending dues, for the "View all"
     * drill-down from the dashboard's collapsed Pending Dues preview.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'q' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:pending,sent,cleared,all'],
        ]);

        $query = DueReminder::with(['customer', 'order']);

        if (($data['status'] ?? null) === 'all') {
            // no status filter — show everything, including cleared
        } elseif (! empty($data['status'])) {
            $query->where('reminder_status', $data['status']);
        } else {
            $query->where('reminder_status', '!=', ReminderStatus::Cleared);
        }

        $query->when($data['date_from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($data['date_to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($data['q'] ?? null, fn ($q, $v) => $q->whereHas('customer', function ($c) use ($v) {
                $c->where('name', 'like', "%{$v}%")->orWhere('phone', 'like', "%{$v}%");
            }))
            ->orderBy('next_reminder_date');

        return $query->get();
    }

    /**
     * Mark a due as cleared once the customer has paid it off — this also
     * stops the weekly reminder from repeating and reduces the customer's
     * running balance by this reminder's amount.
     */
    public function clear(DueReminder $dueReminder)
    {
        if ($dueReminder->reminder_status === ReminderStatus::Cleared) {
            abort(409, 'This due is already cleared.');
        }

        DB::transaction(function () use ($dueReminder) {
            $dueReminder->customer()->decrement('total_due', $dueReminder->amount);
            $dueReminder->update(['reminder_status' => ReminderStatus::Cleared]);
        });

        $dueReminder->load('customer');

        // This is the point a credit customer has actually paid, so the
        // thank-you SMS fires here rather than when the credit was first
        // extended.
        if ($dueReminder->customer) {
            $businessName = $dueReminder->tenant->business_name ?? 'us';
            app(TwilioSmsService::class)->send(
                $dueReminder->customer->phone,
                "Thank you for shopping with {$businessName}! We appreciate your business."
            );
        }

        return $dueReminder;
    }
}
