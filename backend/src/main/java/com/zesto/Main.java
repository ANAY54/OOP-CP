package com.zesto;

import com.zesto.api.ZestoServer;

import java.io.IOException;

public class Main {
    public static void main(String[] args) throws IOException {
        new ZestoServer(8080).start();
    }
}