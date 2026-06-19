import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission.service';

/**
 * Tests unitaires — permissions par rôle (RBAC).
 */
describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermissionService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  function setRole(role: string): void {
    localStorage.setItem('user', JSON.stringify({ role }));
    service.refreshUserRole();
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('ROLE_COMMERCIAL — lecture seule', () => {
    beforeEach(() => setRole('ROLE_COMMERCIAL'));

    it('peut consulter les licences', () => {
      expect(service.canView('licenses')).toBe(true);
    });

    it('ne peut pas ajouter de licence', () => {
      expect(service.canAdd('licenses')).toBe(false);
      expect(service.canAddProduct('eset')).toBe(false);
    });

    it('ne peut pas modifier ni supprimer', () => {
      expect(service.canEdit('licenses')).toBe(false);
      expect(service.canDelete('licenses')).toBe(false);
      expect(service.canEditProduct('eset')).toBe(false);
    });

    it('ne peut pas accéder à l\'assistant', () => {
      expect(service.canUseAssistant()).toBe(false);
    });
  });

  describe('ROLE_SUPER_ADMIN — accès complet', () => {
    beforeEach(() => setRole('ROLE_SUPER_ADMIN'));

    it('peut gérer licences, contrats et utilisateurs', () => {
      expect(service.canView('licenses')).toBe(true);
      expect(service.canAdd('licenses')).toBe(true);
      expect(service.canEdit('contracts')).toBe(true);
      expect(service.canDelete('users')).toBe(true);
    });

    it('peut modifier un produit Eset', () => {
      expect(service.canEditProduct('eset')).toBe(true);
      expect(service.canDeleteProduct('fortinet')).toBe(true);
    });

    it('peut utiliser l\'assistant', () => {
      expect(service.canUseAssistant()).toBe(true);
    });
  });

  describe('ROLE_TECHNIQUE — interventions', () => {
    beforeEach(() => setRole('ROLE_TECHNIQUE'));

    it('peut voir contrats et interventions', () => {
      expect(service.canView('contracts')).toBe(true);
      expect(service.canView('preventive_interventions')).toBe(true);
      expect(service.canView('curative_interventions')).toBe(true);
    });

    it('peut modifier interventions préventives et ajouter curatives', () => {
      expect(service.canEdit('preventive_interventions')).toBe(true);
      expect(service.canAdd('curative_interventions')).toBe(true);
    });

    it('ne peut pas ajouter de contrat', () => {
      expect(service.canAdd('contracts')).toBe(false);
    });
  });

  describe('sans utilisateur connecté', () => {
    it('refuse toutes les permissions', () => {
      expect(service.hasPermission('view_licenses')).toBe(false);
      expect(service.getAllPermissions()).toEqual([]);
    });
  });
});
