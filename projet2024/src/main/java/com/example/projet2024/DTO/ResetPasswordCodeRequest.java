package com.example.projet2024.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordCodeRequest {
    private String email;
    private String code;
    private String newPassword;
}
