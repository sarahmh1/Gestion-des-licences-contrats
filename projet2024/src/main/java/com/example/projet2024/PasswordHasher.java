package com.example.projet2024;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHasher {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "12345678";
        String hashedPassword = encoder.encode(password);
        System.out.println(hashedPassword);
    }
}
