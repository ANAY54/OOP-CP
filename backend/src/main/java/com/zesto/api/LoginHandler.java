package com.zesto.api;

import com.sun.net.httpserver.HttpExchange;
import com.zesto.model.Customer;
import com.zesto.service.CustomerService;
import com.zesto.util.JsonParser;

import java.util.Map;

public class LoginHandler extends BaseHandler {

    private final CustomerService customerService;

    public LoginHandler(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Override
    protected void process(HttpExchange exchange) throws Exception {
        if (!"POST".equals(exchange.getRequestMethod())) {
            sendJson(exchange, 405, error("Method not allowed"));
            return;
        }
        Map<String, Object> body = JsonParser.parseObject(readBody(exchange));
        String name = requireString(body, "name");
        String email = requireString(body, "email");

        Customer customer = customerService.loginOrRegister(name, email);
        sendJson(exchange, 200, JsonMapper.customer(customer));
    }
}