package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.Offer;
import com.zesto.service.OfferService;

import java.util.ArrayList;
import java.util.List;

public class OfferHandler extends BaseHandler {

    private final OfferService service;

    public OfferHandler(OfferService service) {
        this.service = service;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed"));
            return;
        }
        List<Object> out = new ArrayList<>();
        for (Offer offer : service.getAll()) {
            out.add(JsonMapper.offer(offer));
        }
        sendJson(exchange, 200, out);
    }
}