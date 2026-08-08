<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Owner = 'owner';
    case CounterStaff = 'counter_staff';
    case StoreWorker = 'store_worker';
}
