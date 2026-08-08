<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Placed = 'placed';
    case Picking = 'picking';
    case Ready = 'ready';
    case Completed = 'completed';
}
