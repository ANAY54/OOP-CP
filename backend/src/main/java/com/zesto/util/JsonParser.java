package com.zesto.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class JsonParser {

    private final String text;
    private int pos = 0;

    private JsonParser(String text) {
        this.text = text;
    }

    public static Object parse(String text) {
        JsonParser parser = new JsonParser(text);
        Object value = parser.readValue();
        parser.skipWhitespace();
        if (parser.pos != text.length()) {
            throw parser.error("Unexpected extra characters");
        }
        return value;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseObject(String text) {
        Object value = parse(text);
        if (!(value instanceof Map)) {
            throw new IllegalArgumentException("Expected a JSON object");
        }
        return (Map<String, Object>) value;
    }

    private Object readValue() {
        skipWhitespace();
        char c = peek();
        switch (c) {
            case '{': return readObject();
            case '[': return readArray();
            case '"': return readString();
            case 't': expect("true"); return Boolean.TRUE;
            case 'f': expect("false"); return Boolean.FALSE;
            case 'n': expect("null"); return null;
            default:  return readNumber();
        }
    }

    private Map<String, Object> readObject() {
        Map<String, Object> map = new LinkedHashMap<>();
        pos++;
        skipWhitespace();
        if (peek() == '}') {
            pos++;
            return map;
        }
        while (true) {
            skipWhitespace();
            String key = readString();
            skipWhitespace();
            consume(':');
            map.put(key, readValue());
            skipWhitespace();
            char c = next();
            if (c == '}') break;
            if (c != ',') throw error("Expected ',' or '}'");
        }
        return map;
    }

    private List<Object> readArray() {
        List<Object> list = new ArrayList<>();
        pos++;
        skipWhitespace();
        if (peek() == ']') {
            pos++;
            return list;
        }
        while (true) {
            list.add(readValue());
            skipWhitespace();
            char c = next();
            if (c == ']') break;
            if (c != ',') throw error("Expected ',' or ']'");
        }
        return list;
    }

    private String readString() {
        consume('"');
        StringBuilder sb = new StringBuilder();
        while (true) {
            char c = next();
            if (c == '"') break;
            if (c == '\\') {
                char e = next();
                switch (e) {
                    case '"':  sb.append('"'); break;
                    case '\\': sb.append('\\'); break;
                    case '/':  sb.append('/'); break;
                    case 'n':  sb.append('\n'); break;
                    case 't':  sb.append('\t'); break;
                    case 'r':  sb.append('\r'); break;
                    case 'b':  sb.append('\b'); break;
                    case 'f':  sb.append('\f'); break;
                    case 'u':
                        if (pos + 4 > text.length()) throw error("Bad unicode escape");
                        sb.append((char) Integer.parseInt(text.substring(pos, pos + 4), 16));
                        pos += 4;
                        break;
                    default:
                        throw error("Bad escape sequence");
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private Double readNumber() {
        int start = pos;
        while (pos < text.length() && "+-0123456789.eE".indexOf(text.charAt(pos)) >= 0) {
            pos++;
        }
        if (start == pos) {
            throw error("Unexpected character '" + text.charAt(pos) + "'");
        }
        try {
            return Double.parseDouble(text.substring(start, pos));
        } catch (NumberFormatException e) {
            throw error("Invalid number");
        }
    }

    private void expect(String word) {
        if (!text.startsWith(word, pos)) {
            throw error("Expected " + word);
        }
        pos += word.length();
    }

    private void skipWhitespace() {
        while (pos < text.length() && Character.isWhitespace(text.charAt(pos))) {
            pos++;
        }
    }

    private char peek() {
        if (pos >= text.length()) throw error("Unexpected end of JSON");
        return text.charAt(pos);
    }

    private char next() {
        char c = peek();
        pos++;
        return c;
    }

    private void consume(char expected) {
        if (next() != expected) {
            pos--;
            throw error("Expected '" + expected + "'");
        }
    }

    private IllegalArgumentException error(String message) {
        return new IllegalArgumentException("Invalid JSON: " + message + " at position " + pos);
    }
}