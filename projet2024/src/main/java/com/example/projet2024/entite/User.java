package com.example.projet2024.entite;


import com.example.projet2024.Enum.Role_Enum;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
public class User implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String firstname;
    private String lastname;
    private String email;
    private String password;
    private String sex;
    private String phoneNumber;
    private String dateOfBirth;
    
    @Enumerated(EnumType.STRING)
    private Role_Enum role;
    
    private String verificationToken;
    private boolean verified;
    private String profilePicture;
    private boolean isDeleted = false;  // Soft delete flag

    /** Code à 6 chiffres pour réinitialisation du mot de passe */
    private String resetPasswordCode;
    private LocalDateTime resetPasswordExpiresAt;

}
