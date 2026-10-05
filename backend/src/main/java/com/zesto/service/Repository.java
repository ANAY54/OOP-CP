package com.zesto.service;

import com.zesto.model.Identifiable;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class Repository<T extends Identifiable> {

    private final Map<Integer, T> store = new LinkedHashMap<>();

    public void save(T item) {
        store.put(item.getId(), item);
    }

    public Optional<T> findById(int id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<T> findAll() {
        return new ArrayList<>(store.values());
    }

    public int count() {
        return store.size();
    }
}