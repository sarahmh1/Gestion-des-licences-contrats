package com.example.projet2024.controller;

import com.example.projet2024.entite.ESET;
import com.example.projet2024.service.*;
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
@RequestMapping("/Eset")
@CrossOrigin(origins = "http://localhost:4200")
public class EsetController {
    @Autowired
    private EsetServiceImpl esetService   ;
    @Autowired
    private EmailService emailService;


//    @PostMapping("/addESET")
//    public ESET addEset(@RequestBody ESET eset){
//
//        String sujet = "Nouvelle licence ESET ajoutée";
//        String contenu = "Bonjour,\n\nUne nouvelle licence ESET a été ajoutée.\n"
//                + "Client : " + eset.getClient() + "\n"
//                + "Produit : " + eset.getNom_produit() + "\n"
//                + "Date d'expiration : " + eset.getDateEx() + "\n\n"
//                + "Cordialement,\nEquipe Technique";
//
//        emailService.sendEsetNotification(eset.getMailAdmin(), eset.getCcMail(), sujet, contenu);
//
//        return  esetService.addESET(eset);
//
//    }
//    @GetMapping("/test-notification")
//    public ResponseEntity<String> testNotification() {
//        esetService.checkForExpiringEsets(); // Méthode qui vérifie les dates et envoie les emails
//        return ResponseEntity.ok("Notification test envoyée");
//    }

    @PostMapping("/addESET")
public ResponseEntity<?> addEset(@RequestBody ESET eset){
    try {
        System.out.println("Received ESET: " + eset);
        System.out.println("nom_produit: " + eset.getNom_produit());
        System.out.println("commandePasserPar: " + eset.getCommandePasserPar());
        System.out.println("typeAchat: " + eset.getTypeAchat());
        
        if (eset.getClient() == null || eset.getClient().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Le client est requis");
        }
        if (eset.getNom_produit() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Le produit est requis");
        }
        if (eset.getCommandePasserPar() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("La commande 'Passer Par' est requise");
        }
        if (eset.getTypeAchat() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Le type d'achat est requis");
        }
        
        ESET result = esetService.addESET(eset);
        return ResponseEntity.ok(result);
    } catch (Exception e) {
        System.err.println("Erreur lors de l'ajout de l'ESET: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur: " + e.getMessage());
    }
}



    @PutMapping("/updateEset")
    public ResponseEntity<?> updateEset(@RequestBody ESET eset) {
        if (eset.getEsetid() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("L'ID de l'ESET est requis.");
        }

        ESET existingEset = esetService.retrieveESET(eset.getEsetid());
        if (existingEset == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("ESET avec ID " + eset.getEsetid() + " non trouvé.");
        }

        try {
            ESET updated = esetService.updateESET(eset);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la mise à jour : " + e.getMessage());
        }
    }


    @GetMapping("/get/{id}")
    public ResponseEntity<ESET> getEsetById(@PathVariable("id") Long id) {
        try {
            ESET eset = esetService.retrieveESET(id);
            if (eset != null) {
                return ResponseEntity.ok(eset);
            } else {
                return ResponseEntity.notFound().build(); // 404 si non trouvé
            }
        } catch (Exception e) {
            e.printStackTrace(); // utile pour voir l'erreur dans les logs
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500
        }
    }


    /////
    @GetMapping("/allEset")
    public List<ESET> getAllesets(){
        return esetService.retrieveAllESETs();
    }
    @DeleteMapping("/Delete-ESET/{id}")
    public void deleteById(@PathVariable("id") Long esetid) {
        esetService.deleteById(esetid);
    }


    @PutMapping("/approuve/{id}")
    public void activateArticle(@PathVariable("id") Long id) {
        esetService.activate(id);
    }

   
    // ==================== GESTION DES FICHIERS ESET ====================
    
    private final Path fileStorageLocation = Paths.get("uploads/eset-files").toAbsolutePath().normalize();

    // Upload de fichier pour un ESET
    @PostMapping("/{id}/upload-file")
    public ResponseEntity<Map<String, Object>> uploadEsetFile(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Créer le dossier s'il n'existe pas
            Files.createDirectories(fileStorageLocation);
            
            // Vérifier que l'ESET existe
            ESET eset = esetService.retrieveESET(id);
            if (eset == null) {
                response.put("success", false);
                response.put("message", "ESET non trouvé");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            // Supprimer l'ancien fichier s'il existe
            if (eset.getFichier() != null && !eset.getFichier().isEmpty()) {
                try {
                    Path oldFilePath = fileStorageLocation.resolve(eset.getFichier());
                    Files.deleteIfExists(oldFilePath);
                } catch (Exception e) {
                    System.out.println("Impossible de supprimer l'ancien fichier: " + e.getMessage());
                }
            }
            
            // Générer un nom de fichier unique
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = "eset_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + fileExtension;
            
            // Sauvegarder le fichier
            Path targetLocation = fileStorageLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Mettre à jour l'ESET avec le nom du fichier
            eset.setFichier(newFilename);
            eset.setFichierOriginalName(originalFilename);
            esetService.updateESET(eset);
            
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
    
    // Télécharger un fichier ESET par ID (avec nom original)
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadEsetFileById(@PathVariable("id") Long id) {
        try {
            ESET eset = esetService.retrieveESET(id);
            if (eset == null || eset.getFichier() == null) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = fileStorageLocation.resolve(eset.getFichier()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                // Utiliser le nom original du fichier pour le téléchargement
                String downloadFilename = eset.getFichierOriginalName() != null ? 
                        eset.getFichierOriginalName() : resource.getFilename();
                
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
    
    // Télécharger un fichier ESET par nom de fichier (ancien endpoint)
    @GetMapping("/download-file/{filename:.+}")
    public ResponseEntity<Resource> downloadEsetFile(@PathVariable String filename) {
        try {
            Path filePath = fileStorageLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Supprimer un fichier ESET
    @DeleteMapping("/{id}/delete-file")
    public ResponseEntity<Map<String, Object>> deleteEsetFile(@PathVariable("id") Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            ESET eset = esetService.retrieveESET(id);
            if (eset == null) {
                response.put("success", false);
                response.put("message", "ESET non trouvé");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            if (eset.getFichier() != null && !eset.getFichier().isEmpty()) {
                Path filePath = fileStorageLocation.resolve(eset.getFichier());
                Files.deleteIfExists(filePath);
                
                eset.setFichier(null);
                esetService.updateESET(eset);
                
                response.put("success", true);
                response.put("message", "Fichier supprimé avec succès");
            } else {
                response.put("success", false);
                response.put("message", "Aucun fichier à supprimer");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Erreur lors de la suppression: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}
