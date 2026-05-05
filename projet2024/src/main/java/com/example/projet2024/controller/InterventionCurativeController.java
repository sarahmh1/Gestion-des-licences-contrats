package com.example.projet2024.controller;

import com.example.projet2024.entite.InterventionCurative;
import com.example.projet2024.entite.SessionIntervention;
import com.example.projet2024.repository.SessionInterventionRepository;
import com.example.projet2024.service.IInterventionCurativeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/InterventionCurative")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class InterventionCurativeController {

    @Autowired
    private IInterventionCurativeService interventionCurativeService;

    @Autowired
    private SessionInterventionRepository sessionInterventionRepository;

    // Répertoire de stockage des fichiers
    private final Path fileStorageLocation = Paths.get("uploads/intervention-curative-files").toAbsolutePath().normalize();

    @GetMapping("/all")
    public ResponseEntity<List<InterventionCurative>> getAllInterventionsCuratives() {
        List<InterventionCurative> interventions = interventionCurativeService.getAllInterventionsCuratives();
        return new ResponseEntity<>(interventions, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterventionCurative> getInterventionCurativeById(@PathVariable Long id) {
        InterventionCurative intervention = interventionCurativeService.getInterventionCurativeById(id);
        return new ResponseEntity<>(intervention, HttpStatus.OK);
    }

    @PostMapping("/add")
    public ResponseEntity<InterventionCurative> addInterventionCurative(@RequestBody InterventionCurative intervention) {
        InterventionCurative newIntervention = interventionCurativeService.addInterventionCurative(intervention);
        return new ResponseEntity<>(newIntervention, HttpStatus.CREATED);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<InterventionCurative> updateInterventionCurative(@PathVariable Long id, @RequestBody InterventionCurative intervention) {
        InterventionCurative updatedIntervention = interventionCurativeService.updateInterventionCurative(id, intervention);
        return new ResponseEntity<>(updatedIntervention, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteInterventionCurative(@PathVariable Long id) {
        interventionCurativeService.deleteInterventionCurative(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/search")
    public ResponseEntity<List<InterventionCurative>> searchInterventionsCuratives(@RequestParam String searchTerm) {
        List<InterventionCurative> interventions = interventionCurativeService.searchInterventionsCuratives(searchTerm);
        return new ResponseEntity<>(interventions, HttpStatus.OK);
    }

    @GetMapping("/contrat/{contratId}")
    public ResponseEntity<List<InterventionCurative>> getByContratId(@PathVariable Long contratId) {
        List<InterventionCurative> interventions = interventionCurativeService.getByContratId(contratId);
        return new ResponseEntity<>(interventions, HttpStatus.OK);
    }

    // ==================== GESTION DES FICHIERS ====================

    // Upload de fichier pour une Intervention Curative
    @PutMapping("/{id}/upload-file")
    public ResponseEntity<Map<String, Object>> uploadInterventionCurativeFile(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Créer le répertoire s'il n'existe pas
            if (!Files.exists(fileStorageLocation)) {
                Files.createDirectories(fileStorageLocation);
            }
            
            InterventionCurative intervention = interventionCurativeService.getInterventionCurativeById(id);
            if (intervention == null) {
                response.put("success", false);
                response.put("message", "Intervention Curative non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            // Supprimer l'ancien fichier s'il existe
            if (intervention.getFichier() != null && !intervention.getFichier().isEmpty()) {
                try {
                    Path oldFilePath = fileStorageLocation.resolve(intervention.getFichier());
                    Files.deleteIfExists(oldFilePath);
                } catch (IOException e) {
                    System.out.println("Impossible de supprimer l'ancien fichier: " + e.getMessage());
                }
            }
            
            // Générer un nom de fichier unique
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = "intervention_curative_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + fileExtension;
            
            // Sauvegarder le fichier
            Path targetLocation = fileStorageLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Mettre à jour l'Intervention avec le nom du fichier
            interventionCurativeService.updateInterventionCurativeFile(id, newFilename, originalFilename);
            
            response.put("success", true);
            response.put("message", "Fichier uploadé avec succès");
            response.put("fichier", newFilename);
            response.put("originalName", originalFilename);
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Erreur lors de l'upload: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Télécharger un fichier Intervention Curative par ID
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadInterventionCurativeFile(@PathVariable("id") Long id) {
        try {
            InterventionCurative intervention = interventionCurativeService.getInterventionCurativeById(id);
            if (intervention == null || intervention.getFichier() == null) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = fileStorageLocation.resolve(intervention.getFichier()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                // Utiliser le nom original du fichier pour le téléchargement
                String downloadFilename = intervention.getFichierOriginalName() != null ? 
                        intervention.getFichierOriginalName() : resource.getFilename();
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFilename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ──────────────────── FICHIERS PAR SESSION ────────────────────

    // Upload d'un fichier pour une session d'intervention
    @PutMapping("/session/{sessionId}/upload-file")
    public ResponseEntity<Map<String, Object>> uploadSessionFile(
            @PathVariable("sessionId") Long sessionId,
            @RequestParam("file") MultipartFile file) {

        Map<String, Object> response = new HashMap<>();
        try {
            if (!Files.exists(fileStorageLocation)) {
                Files.createDirectories(fileStorageLocation);
            }

            SessionIntervention session = sessionInterventionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                response.put("success", false);
                response.put("message", "Session non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Supprimer l'ancien fichier de la session s'il existe
            if (session.getFichier() != null && !session.getFichier().isEmpty()) {
                try {
                    Files.deleteIfExists(fileStorageLocation.resolve(session.getFichier()));
                } catch (IOException ignored) {}
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = "session_" + sessionId + "_" + UUID.randomUUID().toString().substring(0, 8) + fileExtension;

            Path targetLocation = fileStorageLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            session.setFichier(newFilename);
            session.setFichierOriginalName(originalFilename);
            sessionInterventionRepository.save(session);

            response.put("success", true);
            response.put("message", "Fichier uploadé avec succès");
            response.put("fichier", newFilename);
            response.put("originalName", originalFilename);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Erreur lors de l'upload: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Téléchargement du fichier d'une session
    @GetMapping("/session/{sessionId}/download")
    public ResponseEntity<Resource> downloadSessionFile(@PathVariable("sessionId") Long sessionId) {
        try {
            SessionIntervention session = sessionInterventionRepository.findById(sessionId).orElse(null);
            if (session == null || session.getFichier() == null) {
                return ResponseEntity.notFound().build();
            }

            Path filePath = fileStorageLocation.resolve(session.getFichier()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                String downloadFilename = session.getFichierOriginalName() != null
                        ? session.getFichierOriginalName()
                        : resource.getFilename();

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFilename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Supprimer un fichier Intervention Curative
    @DeleteMapping("/{id}/delete-file")
    public ResponseEntity<Map<String, Object>> deleteInterventionCurativeFile(@PathVariable("id") Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            InterventionCurative intervention = interventionCurativeService.getInterventionCurativeById(id);
            if (intervention == null) {
                response.put("success", false);
                response.put("message", "Intervention Curative non trouvée");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            if (intervention.getFichier() != null && !intervention.getFichier().isEmpty()) {
                Path filePath = fileStorageLocation.resolve(intervention.getFichier());
                Files.deleteIfExists(filePath);
                interventionCurativeService.updateInterventionCurativeFile(id, null, null);
            }
            
            response.put("success", true);
            response.put("message", "Fichier supprimé avec succès");
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Erreur lors de la suppression: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
