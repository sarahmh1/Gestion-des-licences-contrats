package com.example.projet2024.service;

import com.example.projet2024.DTO.UserDTO;
import com.example.projet2024.DTO.UserUpdateRequest;
import com.example.projet2024.DTO.PasswordChangeRequest;
import com.example.projet2024.Enum.Role_Enum;
import com.example.projet2024.Security.Jwt.JwtUtils;
import com.example.projet2024.Security.RoleAuthorization;
import com.example.projet2024.Security.Services.UserDetailsImpl;
import com.example.projet2024.entite.User;
import com.example.projet2024.mapper.UserMapper;
import com.example.projet2024.repository.UserRepository;
import com.example.projet2024.util.PasswordPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.UUID;

@Primary
@Service
public class UserService implements IUserService {

    private static final int RESET_CODE_EXPIRY_MINUTES = 15;
    private static final SecureRandom RESET_CODE_RANDOM = new SecureRandom();

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    JwtUtils jwtUtils;
    @Autowired
    private UserMapper userMapper;
    
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<User> getAllUsers() {
        try {
            System.out.println("========== USER SERVICE: getAllUsers() START ==========");
            List<User> users = userRepository.findAllActive();
            System.out.println("✅ Requête SQL exécutée");
            System.out.println("✅ Nombre d'utilisateurs trouvés: " + users.size());
            
            for (int i = 0; i < users.size(); i++) {
                User u = users.get(i);
                System.out.println("  User " + (i+1) + ": " + u.getEmail() + " | Role: " + (u.getRole() != null ? u.getRole().toString() : "NULL"));
            }
            
            System.out.println("========== USER SERVICE: getAllUsers() END ==========");
            return users;
        } catch (Exception e) {
            System.out.println("❌ ERREUR dans getAllUsers(): " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public void saveUser(User user) {
        System.out.println("💾 [UserService] saveUser() called for email: " + user.getEmail());
        
        // Vérifier si le mot de passe est déjà crypté
        // Si c'est appelé depuis le register endpoint, le mot de passe est déjà crypté
        // Si c'est appelé depuis elsewhere, on doit crypter
        if (user.getPassword() != null && !user.getPassword().startsWith("$2")) {
            // Ne semble pas être crypté (BCrypt commence par $2)
            String encodedPassword = passwordEncoder.encode(user.getPassword());
            user.setPassword(encodedPassword);
            System.out.println("✅ [UserService] Password was NOT crypted, crypting now with BCrypt");
        } else if (user.getPassword() != null && user.getPassword().startsWith("$2")) {
            System.out.println("✅ [UserService] Password already crypted with BCrypt");
        }
        
        userRepository.save(user);
        System.out.println("✅ [UserService] User saved: " + user.getId());
    }

    public User createUser(User user) {
        System.out.println("🔐 [UserService] createUser() called for email: " + user.getEmail());

        if (user.getPassword() != null && !user.getPassword().isEmpty()
                && !PasswordPolicy.isValid(user.getPassword())) {
            throw new IllegalArgumentException(PasswordPolicy.MESSAGE);
        }
        
        // Crypter le mot de passe avec BCrypt
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            String encodedPassword = passwordEncoder.encode(user.getPassword());
            user.setPassword(encodedPassword);
            System.out.println("✅ [UserService] Password crypted successfully with BCrypt");
        } else {
            System.out.println("⚠️  [UserService] WARNING: Password is null or empty for user: " + user.getEmail());
        }
        
        User savedUser = userRepository.save(user);
        System.out.println("✅ [UserService] User saved to database: " + savedUser.getId() + " - " + savedUser.getEmail());
        return savedUser;
    }

    public User updateUserProfileById(Long id, UserUpdateRequest updateRequest) {
        return userRepository.findById(id)
                .map(user -> {
                    // Update basic profile fields
                    user.setFirstname(updateRequest.getFirstname());
                    user.setLastname(updateRequest.getLastname());
                    user.setPhoneNumber(updateRequest.getPhoneNumber());
                    user.setSex(updateRequest.getSex());
                    user.setDateOfBirth(updateRequest.getDateOfBirth());
                    user.setVerified(true);

                    // Handle password update if provided
                    if (updateRequest.getNewPassword() != null && !updateRequest.getNewPassword().isEmpty()) {
                        String encodedPassword = passwordEncoder.encode(updateRequest.getNewPassword());
                        user.setPassword(encodedPassword);
                    }

                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(Long id, User updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    // ✅ Update only profile fields, NEVER modify password
                    if (updatedUser.getFirstname() != null) {
                        user.setFirstname(updatedUser.getFirstname());
                    }
                    if (updatedUser.getLastname() != null) {
                        user.setLastname(updatedUser.getLastname());
                    }
                    if (updatedUser.getEmail() != null) {
                        user.setEmail(updatedUser.getEmail());
                    }
                    if (updatedUser.getSex() != null) {
                        user.setSex(updatedUser.getSex());
                    }
                    if (updatedUser.getPhoneNumber() != null) {
                        user.setPhoneNumber(updatedUser.getPhoneNumber());
                    }
                    if (updatedUser.getDateOfBirth() != null) {
                        user.setDateOfBirth(updatedUser.getDateOfBirth());
                    }
                    
                    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                    if (updatedUser.getRole() != null) {
                        if (RoleAuthorization.canManageUserRoles(authentication)) {
                            user.setRole(updatedUser.getRole());
                            System.out.println("✅ Role updated: " + updatedUser.getRole());
                        } else {
                            System.out.println("⚠️  Role update denied: droits insuffisants (Super Admin ou Administrateur requis)");
                        }
                    }
                    
                    // ❌ NEVER update password from updateUser() endpoint
                    // Password is managed through dedicated /change-password endpoint only
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        try {
            System.out.println("🗑️  Hard deleting user with ID: " + id);
            
            // Step 1: Remove all notifications for this user
            System.out.println("Step 1: Deleting notifications...");
            int deletedNotifications = entityManager.createNativeQuery(
                "DELETE FROM notification WHERE user_id = ?1"
            ).setParameter(1, id).executeUpdate();
            System.out.println("✅ Deleted " + deletedNotifications + " notifications");
            
            // Step 2: Remove all FK references from intervention_preventive_assigned_users using native query
            System.out.println("Step 2: Cleaning intervention assignments...");
            int deletedAssignments = entityManager.createNativeQuery(
                "DELETE FROM intervention_preventive_assigned_users WHERE user_id = ?1"
            ).setParameter(1, id).executeUpdate();
            System.out.println("✅ Deleted " + deletedAssignments + " intervention assignments");
            
            // Flush to ensure FK cleanup is committed
            entityManager.flush();
            
            // Step 3: Hard delete user from database
            System.out.println("Step 3: Deleting user from database...");
            User userToDelete = userRepository.findById(id).orElse(null);
            if (userToDelete != null) {
                userRepository.delete(userToDelete);
                System.out.println("✅ User hard deleted successfully");
            } else {
                System.out.println("⚠️  User not found");
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error in deleteUser: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error deleting user: " + e.getMessage(), e);
        }
    }

    public User getUserById(Long id) {
        // ✅ Get only active users (not deleted)
        return userRepository.findByIdActive(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User assignUserRole(Long id, Role_Enum newRole) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!RoleAuthorization.canManageUserRoles(authentication)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Seuls Super Admin et Administrateur peuvent modifier les rôles.");
        }
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            throw new IllegalArgumentException("Utilisateur non trouvé.");
        }

        User user = optionalUser.get();
        user.setRole(newRole);
        return userRepository.save(user);
    }

    public boolean verifyUser(String token) {
        Optional<User> optionalUser = userRepository.findByVerificationToken(token);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setVerified(true);
            user.setVerificationToken(null); // Clear the verification token after verification
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Override
    public List<UserDTO> getAllUsersDTO() {
        // ✅ Get only active users (not deleted)
        List<User> usersList = userRepository.findAllActive();
        return userMapper.UserListToUserDTOList(usersList);
    }

    @Override
    public User findByEmail(String email) {
        // ✅ Get only active users (not deleted)
        return userRepository.findByEmailActive(email)
                .orElse(null);
    }

    @Override
    public String login(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtUtils.generateJwtToken(authentication);
    }

    @Override
    public void activateUser(Long id) {
        User user = getUserById(id);
        user.setVerified(true);
        userRepository.save(user);
    }

    @Override
    public void deactivateUser(Long id) {
        User user = getUserById(id);
        user.setVerified(false);
        userRepository.save(user);
    }

    @Override
    public User updateProfilePicture(Long id, String profilePicture) {
        User user = getUserById(id);
        user.setProfilePicture(profilePicture);
        return userRepository.save(user);
    }

    @Override
    public boolean changePassword(Long userId, PasswordChangeRequest request) {
        User user = getUserById(userId);
        if (user == null) {
            return false;
        }
        if (!PasswordPolicy.isValid(request.getNewPassword())) {
            throw new IllegalArgumentException(PasswordPolicy.MESSAGE);
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return true;
    }

    /**
     * Connexion / inscription via Google : crée un compte ROLE_COMMERCIAL vérifié si l’email n’existe pas encore.
     */
    @Transactional
    public String loginOrRegisterGoogle(String email, String givenName, String familyName) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email manquant");
        }
        String emailAddr = email.trim();
        User user = findByEmail(emailAddr);
        if (user == null) {
            User u = new User();
            u.setEmail(emailAddr);
            u.setFirstname((givenName != null && !givenName.isBlank()) ? givenName.trim() : "—");
            u.setLastname((familyName != null && !familyName.isBlank()) ? familyName.trim() : "—");
            u.setPassword(UUID.randomUUID().toString());
            u.setSex("MALE");
            u.setPhoneNumber("00000000");
            u.setDateOfBirth("2000-01-01");
            u.setRole(Role_Enum.ROLE_COMMERCIAL);
            u.setVerified(true);
            u.setVerificationToken(null);
            saveUser(u);
            user = findByEmail(emailAddr);
            if (user == null) {
                throw new IllegalStateException("Création utilisateur Google impossible");
            }
        } else {
            user.setVerified(true);
            if (givenName != null && !givenName.isBlank()) {
                user.setFirstname(givenName.trim());
            }
            if (familyName != null && !familyName.isBlank()) {
                user.setLastname(familyName.trim());
            }
            userRepository.save(user);
        }
        UserDetailsImpl principal = UserDetailsImpl.build(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtUtils.generateJwtToken(authentication);
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        String normalized = email.trim();
        User user = findByEmail(normalized);
        if (user == null) {
            return;
        }
        String code = String.format("%06d", RESET_CODE_RANDOM.nextInt(1_000_000));
        user.setResetPasswordCode(code);
        user.setResetPasswordExpiresAt(LocalDateTime.now().plusMinutes(RESET_CODE_EXPIRY_MINUTES));
        userRepository.save(user);
        emailService.sendPasswordResetCodeEmail(user.getEmail(), code);
    }

    @Override
    @Transactional
    public boolean resetPasswordWithCode(String email, String code, String newPassword) {
        if (email == null || email.isBlank() || code == null || code.isBlank()
                || newPassword == null || !PasswordPolicy.isValid(newPassword)) {
            return false;
        }
        User user = findByEmail(email.trim());
        if (user == null || user.getResetPasswordCode() == null || user.getResetPasswordExpiresAt() == null) {
            return false;
        }
        if (LocalDateTime.now().isAfter(user.getResetPasswordExpiresAt())) {
            return false;
        }
        if (!user.getResetPasswordCode().equals(code.trim())) {
            return false;
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordCode(null);
        user.setResetPasswordExpiresAt(null);
        userRepository.save(user);
        return true;
    }

    @Override
    @Transactional
    public void resendVerificationEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("L'adresse e-mail est requise.");
        }
        User user = findByEmail(email.trim());
        if (user == null) {
            return;
        }
        if (user.isVerified()) {
            throw new IllegalStateException("Ce compte est déjà vérifié. Connectez-vous avec votre mot de passe.");
        }
        String token = user.getVerificationToken();
        if (token == null || token.isBlank()) {
            token = UUID.randomUUID().toString();
            user.setVerificationToken(token);
            userRepository.save(user);
        }
        emailService.sendVerificationEmail(user.getEmail(), token);
    }

}
