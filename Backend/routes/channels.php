<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Only Store Workers and the Owner are allowed to listen to the pick-list
// channel — and only for their OWN business (tenant). The {tenantId} in the
// channel name must match the listening user's own tenant_id, otherwise one
// business could see another business's live orders.
Broadcast::channel('orders.pick-list.{tenantId}', function ($user, $tenantId) {
    return in_array($user->role->value, ['store_worker', 'owner'], true)
        && (int) $user->tenant_id === (int) $tenantId;
});
