package com.example.projet2024.entite;


import com.example.projet2024.Enum.Role_Enum;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

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
    
    private Role_Enum role;
    
    private String verificationToken;
    private boolean verified;
    private String profilePicture;
    private boolean isDeleted = false;  // Soft delete flag


}
