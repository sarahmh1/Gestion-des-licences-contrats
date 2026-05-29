package com.example.projet2024.DTO.eset;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Champs proposés pour préremplir le formulaire d'ajout ESET après analyse d'un document.
 * Les valeurs invalides côté serveur sont omises (null).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EsetImportAnalyzeResponse {

    private String client;
    private String identifiant;
    private String cle_de_Licence;
    /** Code produit (ex. eset_protect_entry), aligné sur la table produits */
    private String nom_produit;
    private Integer nombre;
    private String nmb_tlf;
    private String nom_contact;
    private String mail;
    private String mailAdmin;
    /** yyyy-MM-dd */
    private String dateEx;
    /** Valeurs acceptées côté front : 1_an, 2_ans, 3_ans */
    private String dureeDeLicence;
    private String typeAchat;
    private String commandePasserPar;
    private String remarque;
    private Boolean sousContrat;
    private List<String> ccMail;

    /** Indique que l'IA n'a pas été appelée (Ollama désactivé ou texte vide). */
    private boolean extractionSkipped;
    private String infoMessage;

    public String getClient() {
        return client;
    }

    public void setClient(String client) {
        this.client = client;
    }

    public String getIdentifiant() {
        return identifiant;
    }

    public void setIdentifiant(String identifiant) {
        this.identifiant = identifiant;
    }

    public String getCle_de_Licence() {
        return cle_de_Licence;
    }

    public void setCle_de_Licence(String cle_de_Licence) {
        this.cle_de_Licence = cle_de_Licence;
    }

    public String getNom_produit() {
        return nom_produit;
    }

    public void setNom_produit(String nom_produit) {
        this.nom_produit = nom_produit;
    }

    public Integer getNombre() {
        return nombre;
    }

    public void setNombre(Integer nombre) {
        this.nombre = nombre;
    }

    public String getNmb_tlf() {
        return nmb_tlf;
    }

    public void setNmb_tlf(String nmb_tlf) {
        this.nmb_tlf = nmb_tlf;
    }

    public String getNom_contact() {
        return nom_contact;
    }

    public void setNom_contact(String nom_contact) {
        this.nom_contact = nom_contact;
    }

    public String getMail() {
        return mail;
    }

    public void setMail(String mail) {
        this.mail = mail;
    }

    public String getMailAdmin() {
        return mailAdmin;
    }

    public void setMailAdmin(String mailAdmin) {
        this.mailAdmin = mailAdmin;
    }

    public String getDateEx() {
        return dateEx;
    }

    public void setDateEx(String dateEx) {
        this.dateEx = dateEx;
    }

    public String getDureeDeLicence() {
        return dureeDeLicence;
    }

    public void setDureeDeLicence(String dureeDeLicence) {
        this.dureeDeLicence = dureeDeLicence;
    }

    public String getTypeAchat() {
        return typeAchat;
    }

    public void setTypeAchat(String typeAchat) {
        this.typeAchat = typeAchat;
    }

    public String getCommandePasserPar() {
        return commandePasserPar;
    }

    public void setCommandePasserPar(String commandePasserPar) {
        this.commandePasserPar = commandePasserPar;
    }

    public String getRemarque() {
        return remarque;
    }

    public void setRemarque(String remarque) {
        this.remarque = remarque;
    }

    public Boolean getSousContrat() {
        return sousContrat;
    }

    public void setSousContrat(Boolean sousContrat) {
        this.sousContrat = sousContrat;
    }

    public List<String> getCcMail() {
        return ccMail;
    }

    public void setCcMail(List<String> ccMail) {
        this.ccMail = ccMail;
    }

    public boolean isExtractionSkipped() {
        return extractionSkipped;
    }

    public void setExtractionSkipped(boolean extractionSkipped) {
        this.extractionSkipped = extractionSkipped;
    }

    public String getInfoMessage() {
        return infoMessage;
    }

    public void setInfoMessage(String infoMessage) {
        this.infoMessage = infoMessage;
    }
}
