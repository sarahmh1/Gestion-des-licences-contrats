import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'app/Services/user.service';
import { PermissionService } from 'app/Services/permission.service';
import { RoleEnum, User } from 'app/Model/User';
import { AppValidators } from 'app/shared/validators/app-validators';

/** Codes rôles alignés sur Role_Enum (backend). */
const ROLE_CODES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_ADMIN_COMMERCIAL',
  'ROLE_ADMIN_TECHNIQUE',
  'ROLE_COMMERCIAL',
  'ROLE_TECHNIQUE',
  'ROLE_ADMINISTRATEUR',
] as const;

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  pagedUsers: any[] = [];
  userForm: FormGroup;
  isEditMode = false;
  editingUserId: number | null = null;
  /** Rôle en base au moment d’ouvrir le modal (évite d’écraser si le select est vide). */
  private editingUserRoleOriginal: string | null = null;
  showModal = false;
  searchTerm: string = '';
  selectedUser: any | null = null;
  readonly roleOptions = ROLE_CODES;

  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  pageNumbers: number[] = [];

  constructor(private userService: UserService, public permissionService: PermissionService, private fb: FormBuilder) {
    this.userForm = this.fb.group({
      firstname: ['', AppValidators.requiredName],
      lastname: ['', AppValidators.requiredName],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', AppValidators.requiredSecurePassword],
      dateOfBirth: ['', Validators.required],
      phoneNumber: ['', AppValidators.requiredPhone],
      sex: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getUsers();
  }

  /** Normalise le rôle API (string, objet enum, ordinal legacy) vers un code ROLE_*. */
  normalizeRoleCode(role: unknown): string {
    if (role == null || role === '') {
      return '';
    }
    if (typeof role === 'string') {
      const trimmed = role.includes(',') ? role.split(',')[0].trim() : role.trim();
      if (ROLE_CODES.includes(trimmed as (typeof ROLE_CODES)[number])) {
        return trimmed;
      }
      return trimmed;
    }
    if (typeof role === 'object' && role !== null && 'name' in role) {
      return this.normalizeRoleCode((role as { name: string }).name);
    }
    if (typeof role === 'number') {
      const byOrdinal = [
        'ROLE_ADMINISTRATEUR',
        'ROLE_SUPER_ADMIN',
        'ROLE_ADMIN_COMMERCIAL',
        'ROLE_ADMIN_TECHNIQUE',
        'ROLE_COMMERCIAL',
        'ROLE_TECHNIQUE',
      ];
      return byOrdinal[role] ?? '';
    }
    return String(role);
  }

  canManageRoles(): boolean {
    const r = this.permissionService.getCurrentRole();
    return r === 'ROLE_SUPER_ADMIN' || r === 'ROLE_ADMINISTRATEUR';
  }

  getUsers() {
    this.userService.getAllUsers().subscribe(
      data => {
        this.users = data;
        this.filteredUsers = [...this.users];
        this.updatePagination();
      },
      error => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        if (error.status === 403) {
          console.error('⛔ Accès refusé: Vous n\'avez pas les permissions pour voir la liste des utilisateurs.');
        } else if (error.status === 401) {
          console.error('⛔ Non authentifié: Veuillez vous reconnecter.');
        }
        this.users = [];
        this.filteredUsers = [];
        this.updatePagination();
      }
    );
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredUsers = [...this.users];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.firstname?.toLowerCase().includes(searchLower) ||
        user.lastname?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        this.normalizeRoleCode(user.role).toLowerCase().includes(searchLower) ||
        user.phoneNumber?.toLowerCase().includes(searchLower) ||
        user.sex?.toLowerCase().includes(searchLower)
      );
    }
    this.currentPage = 0;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.pageNumbers = Array(this.totalPages).fill(0).map((x, i) => i);
    this.updatePagedUsers();
  }

  updatePagedUsers() {
    const startIndex = this.currentPage * this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedUsers();
    }
  }

  selectUser(user: any): void {
    this.selectedUser = user;
  }

  closeDetail(): void {
    this.selectedUser = null;
  }

  getRoleLabel(role: string): string {
    const code = this.normalizeRoleCode(role);
    if (!code) return '-';
    const labels: Record<string, string> = {
      ROLE_SUPER_ADMIN: 'Super Admin',
      ROLE_ADMIN_COMMERCIAL: 'Admin Commercial',
      ROLE_ADMIN_TECHNIQUE: 'Admin Technique',
      ROLE_COMMERCIAL: 'Commercial',
      ROLE_TECHNIQUE: 'Technique',
      ROLE_ADMINISTRATEUR: 'Administrateur',
    };
    return labels[code] || code;
  }

  openAddModal() {
    this.isEditMode = false;
    this.editingUserId = null;
    this.editingUserRoleOriginal = null;
    this.userForm.reset();
    this.userForm.get('password')?.setValidators(AppValidators.requiredSecurePassword);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(user: any) {
    this.isEditMode = true;
    this.editingUserId = user.id!;
    this.editingUserRoleOriginal = this.normalizeRoleCode(user.role) || null;
    this.userForm.patchValue({
      ...user,
      role: this.editingUserRoleOriginal,
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  submitForm() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.value;
    const roleCode = this.normalizeRoleCode(raw.role);

    if (this.isEditMode && this.editingUserId != null) {
      const userData: Partial<User> = {
        firstname: raw.firstname,
        lastname: raw.lastname,
        email: raw.email,
        dateOfBirth: raw.dateOfBirth,
        phoneNumber: raw.phoneNumber,
        sex: raw.sex,
      };
      if (roleCode && ROLE_CODES.includes(roleCode as (typeof ROLE_CODES)[number])) {
        userData.role = roleCode as RoleEnum;
      }

      this.userService.updateUser(this.editingUserId, userData).subscribe({
        next: () => {
          const roleChanged =
            roleCode &&
            this.editingUserRoleOriginal &&
            roleCode !== this.editingUserRoleOriginal;

          if (roleChanged && this.canManageRoles()) {
            this.userService.assignUserRole(this.editingUserId!, roleCode).subscribe({
              next: () => this.finishSave(),
              error: (err) => this.handleSaveError(err, true),
            });
          } else if (roleChanged && !this.canManageRoles()) {
            alert(
              'Profil enregistré, mais le rôle n’a pas été modifié : connectez-vous avec un compte Super Admin ou Administrateur, puis réessayez.'
            );
            this.finishSave();
          } else {
            this.finishSave();
          }
        },
        error: (err) => this.handleSaveError(err, false),
      });
    } else {
      if (!roleCode) {
        alert('Veuillez sélectionner un rôle.');
        return;
      }
      const createData = { ...raw, role: roleCode };
      this.userService.createUser(createData).subscribe({
        next: () => this.finishSave(),
        error: (err) => this.handleSaveError(err, false),
      });
    }
  }

  private finishSave(): void {
    this.getUsers();
    this.showModal = false;
    alert('Utilisateur enregistré avec succès.');
  }

  private handleSaveError(error: any, roleOnly: boolean): void {
    console.error('Erreur enregistrement utilisateur:', error);
    const msg =
      error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      'Erreur inconnue';
    if (error?.status === 403) {
      alert(
        roleOnly
          ? `Modification du rôle refusée (403). Votre compte doit être Super Admin ou Administrateur. Détail : ${msg}`
          : `Accès refusé (403). ${msg}`
      );
    } else {
      alert(`Erreur lors de l’enregistrement : ${msg}`);
    }
  }

  closeModal() {
    this.showModal = false;
  }

  deleteUser(id: number) {
    const userToDelete = this.users.find(u => u.id === id);
    const userName = userToDelete ? `${userToDelete.firstname} ${userToDelete.lastname}` : 'cet utilisateur';

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ?`)) {
      this.userService.deleteUser(id).subscribe(
        () => {
          alert(`✅ Utilisateur "${userName}" a été supprimé avec succès`);
          if (this.selectedUser?.id === id) {
            this.selectedUser = null;
          }
          this.getUsers();
        },
        (error) => {
          alert(`❌ Erreur lors de la suppression: ${error.error?.message || 'Veuillez réessayer'}`);
        }
      );
    }
  }

  activateUser(id: number) {
    this.userService.activateUser(id).subscribe(() => {
      this.refreshUsersAndSelection(id);
    });
  }

  deactivateUser(id: number) {
    this.userService.deactivateUser(id).subscribe(() => {
      this.refreshUsersAndSelection(id);
    });
  }

  private refreshUsersAndSelection(id: number): void {
    this.userService.getAllUsers().subscribe(
      data => {
        this.users = data;
        this.filteredUsers = [...this.users];
        this.updatePagination();
        if (this.selectedUser?.id === id) {
          this.selectedUser = this.users.find(u => u.id === id) || null;
        }
      },
      () => this.getUsers()
    );
  }

  togglePasswordVisibility() {
    const passwordField = document.getElementById('passwordField') as HTMLInputElement;
    const passwordIcon = document.getElementById('passwordIcon');

    if (passwordField && passwordIcon) {
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        passwordIcon.classList.remove('glyphicon-eye-open');
        passwordIcon.classList.add('glyphicon-eye-close');
        passwordIcon.parentElement?.classList.add('password-visible');
      } else {
        passwordField.type = 'password';
        passwordIcon.classList.remove('glyphicon-eye-close');
        passwordIcon.classList.add('glyphicon-eye-open');
        passwordIcon.parentElement?.classList.remove('password-visible');
      }
    }
  }
}
