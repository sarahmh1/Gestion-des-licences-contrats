package com.example.projet2024.controller;

import com.example.projet2024.entite.Produit;
import com.example.projet2024.service.ProduitServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/produits")
@CrossOrigin(origins = "http://localhost:4200")
public class ProduitController {

    @Autowired
    private ProduitServiceImpl produitService;

    /**
     * Récupère tous les produits actifs (accessible à tous)
     */
    @GetMapping("/actifs")
    public ResponseEntity<List<Produit>> getAllProduitsActifs() {
        try {
            List<Produit> produits = produitService.getAllProduitsActifs();
            return ResponseEntity.ok(produits);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère tous les produits (actifs et inactifs) - Admins seulement
     */
    @GetMapping("/tous")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<List<Produit>> getAllProduits() {
        try {
            List<Produit> produits = produitService.getAllProduits();
            return ResponseEntity.ok(produits);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère un produit par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Produit> getProduitById(@PathVariable Long id) {
        try {
            Optional<Produit> produit = produitService.getProduitById(id);
            if (produit.isPresent()) {
                return ResponseEntity.ok(produit.get());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Ajoute un nouveau produit - Admins seulement
     */
    @PostMapping("/ajouter")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> addProduit(@RequestBody Produit produit) {
        try {
            // Vérifier si le code existe déjà
            if (produit.getCode() != null) {
                Optional<Produit> existing = produitService.getProduitByCode(produit.getCode());
                if (existing.isPresent()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("message", "Un produit avec ce code existe déjà"));
                }
            }

            Produit newProduit = produitService.addProduit(produit);
            return ResponseEntity.status(HttpStatus.CREATED).body(newProduit);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de l'ajout du produit"));
        }
    }

    /**
     * Met à jour un produit - Admins seulement
     */
    @PutMapping("/modifier/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> updateProduit(@PathVariable Long id, @RequestBody Produit produitUpdate) {
        try {
            Optional<Produit> existing = produitService.getProduitById(id);
            if (!existing.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Produit non trouvé"));
            }

            Produit produit = existing.get();

            if (produitUpdate.getLabel() != null) {
                produit.setLabel(produitUpdate.getLabel());
            }
            if (produitUpdate.getDescription() != null) {
                produit.setDescription(produitUpdate.getDescription());
            }
            if (produitUpdate.getActif() != null) {
                produit.setActif(produitUpdate.getActif());
            }

            Produit updated = produitService.updateProduit(produit);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la mise à jour"));
        }
    }

    /**
     * Désactive un produit - Admins seulement
     */
    @PutMapping("/desactiver/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> desactiverProduit(@PathVariable Long id) {
        try {
            Optional<Produit> existing = produitService.getProduitById(id);
            if (!existing.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Produit non trouvé"));
            }

            produitService.desactiverProduit(id);
            return ResponseEntity.ok(Map.of("message", "Produit désactivé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la désactivation"));
        }
    }

    /**
     * Initialise les produits par défaut - Admins seulement
     */
    @PostMapping("/initialiser")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMINISTRATEUR', 'ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> initializeProduits() {
        try {
            produitService.initializeDefaultProduits();
            return ResponseEntity.ok(Map.of("message", "Produits par défaut initialisés"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de l'initialisation"));
        }
    }
}
