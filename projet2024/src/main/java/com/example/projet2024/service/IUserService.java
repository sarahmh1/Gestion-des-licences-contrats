package com.example.projet2024.service;

import com.example.projet2024.DTO.PasswordChangeRequest;
import com.example.projet2024.DTO.UserDTO;
import com.example.projet2024.DTO.UserUpdateRequest;
import com.example.projet2024.Enum.Role_Enum;
import com.example.projet2024.entite.User;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface IUserService {

    List<User> getAllUsers();
    User getUserById(Long id);
    User createUser(User user);
    User updateUser(Long id, User updatedUser);
    User updateProfilePicture(Long id, String profilePicture);
    void deleteUser(Long id);

    User assignUserRole(Long id, Role_Enum newRole);
    boolean verifyUser(String token);
    String login(String email, String password);

    void activateUser(Long id);
    void deactivateUser(Long id);
    User findByEmail(String email);

    List<UserDTO> getAllUsersDTO();
    
    boolean changePassword(Long userId, PasswordChangeRequest request);

    void requestPasswordReset(String email);

    boolean resetPasswordWithCode(String email, String code, String newPassword);

    /** Renvoie l'e-mail de vérification si le compte existe et n'est pas encore vérifié. */
    void resendVerificationEmail(String email);
}
