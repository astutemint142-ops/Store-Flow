<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Checks every business's credit dues once a day and texts anyone whose
// reminder is due. Run `php artisan schedule:work` locally to test this
// without waiting for the actual clock — it fires every minute it's due.
Schedule::command('reminders:send-due')->daily();
