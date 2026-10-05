package com.zesto.service;

import com.zesto.model.Order;
import com.zesto.model.OrderStatus;

public class OrderProgressTask implements Runnable {

    private final Order order;
    private final long stepDelayMillis;

    public OrderProgressTask(Order order, long stepDelayMillis) {
        this.order = order;
        this.stepDelayMillis = stepDelayMillis;
    }

    @Override
    public void run() {
        try {
            while (order.getStatus() != OrderStatus.DELIVERED
                    && order.getStatus() != OrderStatus.CANCELLED) {
                Thread.sleep(stepDelayMillis);
                order.advanceStatus();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}