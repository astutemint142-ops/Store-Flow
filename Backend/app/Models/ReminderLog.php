<?php

namespace App\Models;

use App\Enums\ReminderChannel;
use App\Enums\ReminderLogStatus;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReminderLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'due_reminder_id',
        'channel',
        'status',
        'failure_reason',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'channel' => ReminderChannel::class,
            'status' => ReminderLogStatus::class,
            'sent_at' => 'datetime',
        ];
    }

    public function dueReminder(): BelongsTo
    {
        return $this->belongsTo(DueReminder::class);
    }
}
