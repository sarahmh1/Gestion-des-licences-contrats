import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private currentUserRole: string | null = null;

  // Permissions définies par rôle
  private rolePermissions: { [key: string]: string[] } = {
    // Commercial: Vue UNIQUEMENT tous les produits et clients (pas de modification)
    'ROLE_COMMERCIAL': [
      'view_licenses',
      'view_clients'
    ],

    // Technique: consulter licences et contrats (sans ajouter/modifier/supprimer), modifier interventions préventives, ajouter et modifier interventions curatives
    'ROLE_TECHNIQUE': [
      'view_licenses',
      'view_contracts',
      'view_preventive_interventions',
      'edit_preventive_interventions',
      'view_curative_interventions',
      'add_curative_interventions',
      'edit_curative_interventions',
      'delete_notification',
      'delete_message'
    ],

    // Admin Commercial: consulter tous sauf utilisateur, pas de modification
    'ROLE_ADMIN_COMMERCIAL': [
      'view_licenses',
      'view_contracts',
      'view_clients',
      'view_products',
      'view_preventive_interventions',
      'view_curative_interventions',
      'view_assistant',
      'delete_notification',
      'delete_message'
    ],

    // Admin Technique: consulter licences, ajouter et modifier contrats/clients/interventions (sans supprimer)
    'ROLE_ADMIN_TECHNIQUE': [
      'view_licenses',
      'view_contracts',
      'edit_contracts',
      'add_contracts',
      'view_clients',
      'edit_clients',
      'add_clients',
      'view_preventive_interventions',
      'edit_preventive_interventions',
      'add_preventive_interventions',
      'view_curative_interventions',
      'edit_curative_interventions',
      'add_curative_interventions',
      'delete_notification',
      'delete_message',
      'view_assistant'
    ],

    // Super Admin: tout faire - accès complet à TOUT
    'ROLE_SUPER_ADMIN': [
      'view_licenses',
      'add_licenses',
      'edit_licenses',
      'delete_licenses',
      'view_contracts',
      'add_contracts',
      'edit_contracts',
      'delete_contracts',
      'view_clients',
      'add_clients',
      'edit_clients',
      'delete_clients',
      'view_users',
      'add_users',
      'edit_users',
      'delete_users',
      'view_products',
      'add_products',
      'edit_products',
      'delete_products',
      // Permissions par produit pour Super Admin
      'edit_eset_licenses',
      'delete_eset_licenses',
      'edit_fortinet_licenses',
      'delete_fortinet_licenses',
      'edit_palo_licenses',
      'delete_palo_licenses',
      'edit_veeam_licenses',
      'delete_veeam_licenses',
      'edit_cisco_licenses',
      'delete_cisco_licenses',
      'edit_crowdstrike_licenses',
      'delete_crowdstrike_licenses',
      'edit_f5_licenses',
      'delete_f5_licenses',
      'edit_fortra_licenses',
      'delete_fortra_licenses',
      'edit_imperva_licenses',
      'delete_imperva_licenses',
      'edit_infoblox_licenses',
      'delete_infoblox_licenses',
      'edit_netskope_licenses',
      'delete_netskope_licenses',
      'edit_oneidentity_licenses',
      'delete_oneidentity_licenses',
      'edit_proofpoint_licenses',
      'delete_proofpoint_licenses',
      'edit_rapid7_licenses',
      'delete_rapid7_licenses',
      'edit_secpoint_licenses',
      'delete_secpoint_licenses',
      'edit_sentineione_licenses',
      'delete_sentineione_licenses',
      'edit_splunk_licenses',
      'delete_splunk_licenses',
      'edit_varonis_licenses',
      'delete_varonis_licenses',
      'edit_alwarebytes_licenses',
      'delete_alwarebytes_licenses',
      'edit_bitdefender_licenses',
      'delete_bitdefender_licenses',
      'edit_vmware_licenses',
      'delete_vmware_licenses',
      'edit_wallix_licenses',
      'delete_wallix_licenses',
      'edit_microsofto365_licenses',
      'delete_microsofto365_licenses',
      'view_preventive_interventions',
      'add_preventive_interventions',
      'edit_preventive_interventions',
      'delete_preventive_interventions',
      'view_curative_interventions',
      'add_curative_interventions',
      'edit_curative_interventions',
      'delete_curative_interventions',
      'view_assistant'
    ],

    // Admin (ancien rôle, garanti pour compatibilité) - idem Super Admin: accès complet à TOUT
    'ROLE_ADMINISTRATEUR': [
      'view_licenses',
      'add_licenses',
      'edit_licenses',
      'delete_licenses',
      'view_contracts',
      'add_contracts',
      'edit_contracts',
      'delete_contracts',
      'view_clients',
      'add_clients',
      'edit_clients',
      'delete_clients',
      'view_users',
      'add_users',
      'edit_users',
      'delete_users',
      'view_products',
      'add_products',
      'edit_products',
      'delete_products',
      // Permissions par produit pour Admin
      'edit_eset_licenses',
      'delete_eset_licenses',
      'edit_fortinet_licenses',
      'delete_fortinet_licenses',
      'edit_palo_licenses',
      'delete_palo_licenses',
      'edit_veeam_licenses',
      'delete_veeam_licenses',
      'edit_cisco_licenses',
      'delete_cisco_licenses',
      'edit_crowdstrike_licenses',
      'delete_crowdstrike_licenses',
      'edit_f5_licenses',
      'delete_f5_licenses',
      'edit_fortra_licenses',
      'delete_fortra_licenses',
      'edit_imperva_licenses',
      'delete_imperva_licenses',
      'edit_infoblox_licenses',
      'delete_infoblox_licenses',
      'edit_netskope_licenses',
      'delete_netskope_licenses',
      'edit_oneidentity_licenses',
      'delete_oneidentity_licenses',
      'edit_proofpoint_licenses',
      'delete_proofpoint_licenses',
      'edit_rapid7_licenses',
      'delete_rapid7_licenses',
      'edit_secpoint_licenses',
      'delete_secpoint_licenses',
      'edit_sentineione_licenses',
      'delete_sentineione_licenses',
      'edit_splunk_licenses',
      'delete_splunk_licenses',
      'edit_varonis_licenses',
      'delete_varonis_licenses',
      'edit_alwarebytes_licenses',
      'delete_alwarebytes_licenses',
      'edit_bitdefender_licenses',
      'delete_bitdefender_licenses',
      'edit_vmware_licenses',
      'delete_vmware_licenses',
      'edit_wallix_licenses',
      'delete_wallix_licenses',
      'edit_microsofto365_licenses',
      'delete_microsofto365_licenses',
      'view_preventive_interventions',
      'add_preventive_interventions',
      'edit_preventive_interventions',
      'delete_preventive_interventions',
      'view_curative_interventions',
      'add_curative_interventions',
      'edit_curative_interventions',
      'delete_curative_interventions',
      'view_assistant'
    ]
  };

  constructor() {
    this.loadUserRole();
  }

  /**
   * Charge le rôle de l'utilisateur depuis localStorage
   */
  private loadUserRole(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserRole = user.role || user.userRole;
      } catch (e) {
        console.error('Erreur parsing user:', e);
      }
    }
  }

  /**
   * Récupère le rôle actuel de l'utilisateur
   */
  getCurrentRole(): string | null {
    return this.currentUserRole;
  }

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  hasPermission(permission: string): boolean {
    if (!this.currentUserRole) {
      return false;
    }

    const permissions = this.rolePermissions[this.currentUserRole] || [];
    return permissions.includes(permission);
  }

  /**
   * Vérifie si l'utilisateur a toutes les permissions spécifiées
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Vérifie si l'utilisateur a au moins une des permissions spécifiées
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Obtient toutes les permissions de l'utilisateur actuel
   */
  getAllPermissions(): string[] {
    if (!this.currentUserRole) {
      return [];
    }

    return this.rolePermissions[this.currentUserRole] || [];
  }

  /**
   * Vérifie si l'utilisateur peut voir une page/ressource
   */
  canView(resource: string): boolean {
    return this.hasPermission(`view_${resource}`);
  }

  /** Assistant IA (Ollama) : SUPER_ADMIN, ADMIN_TECHNIQUE, ADMIN_COMMERCIAL uniquement */
  canUseAssistant(): boolean {
    return this.hasPermission('view_assistant');
  }

  /**
   * Vérifie si l'utilisateur peut ajouter une ressource
   */
  canAdd(resource: string): boolean {
    return this.hasPermission(`add_${resource}`);
  }

  /**
   * Vérifie si l'utilisateur peut modifier une ressource
   */
  canEdit(resource: string): boolean {
    return this.hasPermission(`edit_${resource}`);
  }

  /**
   * Vérifie si l'utilisateur peut supprimer une ressource
   */
  canDelete(resource: string): boolean {
    return this.hasPermission(`delete_${resource}`);
  }

  /**
   * Méthodes product-spécifiques pour vérifier add/edit/delete sur un produit donné
   */
  canAddProduct(productName: string): boolean {
    if (this.currentUserRole === 'ROLE_COMMERCIAL') {
      return false; // Le rôle commercial ne peut ajouter aucun produit
    }
    return this.hasPermission(`add_${productName.toLowerCase()}_licenses`) || this.hasPermission('add_licenses');
  }

  canEditProduct(productName: string): boolean {
    if (this.currentUserRole === 'ROLE_COMMERCIAL') {
      return false; // Le rôle commercial ne peut modifier aucun produit
    }
    return this.hasPermission(`edit_${productName.toLowerCase()}_licenses`) || this.hasPermission('edit_licenses');
  }

  canDeleteProduct(productName: string): boolean {
    if (this.currentUserRole === 'ROLE_COMMERCIAL') {
      return false; // Le rôle commercial ne peut supprimer aucun produit
    }
    return this.hasPermission(`delete_${productName.toLowerCase()}_licenses`) || this.hasPermission('delete_licenses');
  }

  /**
   * Rafraîchit le rôle de l'utilisateur (utile après changement de rôle)
   */
  refreshUserRole(): void {
    this.loadUserRole();
  }
}
