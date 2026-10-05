package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.Customer;
import com.zesto.service.CustomerService;
import com.zesto.util.JsonParser;

import java.util.Map;

public class ProfileHandler extends BaseHandler {

    private final CustomerService customerService;

    public ProfileHandler(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();

        if ("GET".equals(method)) {
            Customer customer = customerService.getByEmail(queryParams(exchange).get("email"));
            sendJson(exchange, 200, JsonMapper.customer(customer));
        } else if ("POST".equals(method)) {
            Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
            Customer customer = customerService.updateAddress(
                    requireString(body, "email"), requireString(body, "address"));
            sendJson(exchange, 200, JsonMapper.customer(customer));
        } else {
            sendJson(exchange, 405, error("Method not allowed"));
        }
    }
}