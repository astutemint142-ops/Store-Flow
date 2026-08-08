<?php

namespace App\Enums;

enum ReminderLogStatus: string
{
    case Sent = 'sent';
    case Failed = 'failed';
}
