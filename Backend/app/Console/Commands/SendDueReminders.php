<?php

namespace App\Console\Commands;

use App\Enums\ReminderChannel;
use App\Enums\ReminderLogStatus;
use App\Enums\ReminderStatus;
use App\Models\DueReminder;
use App\Models\ReminderLog;
use App\Services\TwilioSmsService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('reminders:send-due')]
#[Description('Send an SMS to every customer whose credit due reminder is due today, then reschedule 7 days out.')]
class SendDueReminders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(TwilioSmsService $sms): int
    {
        $reminders = DueReminder::with(['customer', 'tenant'])
            ->where('reminder_status', '!=', ReminderStatus::Cleared)
            ->whereDate('next_reminder_date', '<=', now()->toDateString())
            ->whereHas('tenant', fn ($query) => $query->where('status', 'active'))
            ->get();

        if ($reminders->isEmpty()) {
            $this->info('No reminders are due today.');

            return self::SUCCESS;
        }

        foreach ($reminders as $reminder) {
            $customer = $reminder->customer;
            $businessName = $reminder->tenant->business_name ?? 'the store';

            $message = "Hi {$customer->name}, this is a friendly reminder from {$businessName} that you have a pending due of Rs. {$reminder->amount}. Please clear it at your earliest convenience. Thank you!";

            $result = $sms->send($customer->phone, $message);

            $log = new ReminderLog([
                'channel' => ReminderChannel::Sms,
                'status' => $result['success'] ? ReminderLogStatus::Sent : ReminderLogStatus::Failed,
                'failure_reason' => $result['error'],
                'sent_at' => now(),
            ]);
            $log->tenant_id = $reminder->tenant_id;
            $reminder->logs()->save($log);

            if ($result['success']) {
                $reminder->update([
                    'reminder_status' => ReminderStatus::Sent,
                    'next_reminder_date' => now()->addDays(7),
                ]);
                $this->info("Sent reminder to {$customer->name} ({$customer->phone}).");
            } else {
                $this->error("Failed to send reminder to {$customer->name}: {$result['error']}");
            }
        }

        return self::SUCCESS;
    }
}
