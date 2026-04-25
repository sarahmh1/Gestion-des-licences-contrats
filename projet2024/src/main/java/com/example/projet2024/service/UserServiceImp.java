package com.example.projet2024.service;

import com.example.projet2024.DTO.PasswordChangeRequest;
import com.example.projet2024.DTO.UserDTO;
import com.example.projet2024.DTO.UserUpdateRequest;
import com.example.projet2024.Enum.Role_Enum;
import com.example.projet2024.Security.Jwt.JwtUtils;
import com.example.projet2024.entite.User;
import com.example.projet2024.mapper.UserMapper;
import com.example.projet2024.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserServiceImp implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserMapper userMapper;
    
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<User> getAllUsers() {
        // ✅ Get only active users (not deleted)
        return userRepository.findAllActive();
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setVerified(false);
        return userRepository.save(user);
    }

    @Override
        public User updateUser(Long id, User updatedUser) {
        return userRepository.findById(id).map(user -> {
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
            
            // ✅ Allow role update ONLY if current user is SUPER_ADMIN
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isSuperAdmin = authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_SUPER_ADMIN"));
            
            if (isSuperAdmin && updatedUser.getRole() != null) {
                user.setRole(updatedUser.getRole());
                System.out.println("✅ Role updated by SUPER_ADMIN: " + updatedUser.getRole());
            } else if (updatedUser.getRole() != null) {
                System.out.println("⚠️  Role update denied: user is not SUPER_ADMIN");
            }

            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional
    public User updateProfilePicture(Long id, String profilePicture) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setProfilePicture(profilePicture);
        return userRepository.save(user);
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

    @Override
    public User assignUserRole(Long id, Role_Enum newRole) {
        return userRepository.findById(id).map(user -> {
            user.setRole(newRole);
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public boolean verifyUser(String token) {
        Optional<User> optionalUser = userRepository.findByVerificationToken(token);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setVerified(true);
            user.setVerificationToken(null);
            userRepository.save(user);
            return true;
        }
        return false;
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
    public User findByEmail(String email) {
        // ✅ Get only active users (not deleted)
        return userRepository.findByEmailActive(email).orElse(null);
    }
    @Override
    public List<UserDTO> getAllUsersDTO() {
        // ✅ Get only active users (not deleted)
        return userMapper.UserListToUserDTOList(userRepository.findAllActive());
    }

    @Override
    public boolean changePassword(Long userId, PasswordChangeRequest request) {
        User user = getUserById(userId);
        
        // Vérifier l'ancien mot de passe
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return false;
        }
        
        // Encoder et enregistrer le nouveau mot de passe
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return true;
    }
}
