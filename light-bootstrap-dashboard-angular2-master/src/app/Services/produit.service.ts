import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Produit {
  id?: number;
  code: string;
  label: string;
  description?: string;
  actif?: boolean;
  dateCreation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private baseUrl = `${environment.apiUrl}/api/produits`;
  
  // Cache pour les produits activés
  private produitsCache = new BehaviorSubject<Produit[]>([]);
  public produits$ = this.produitsCache.asObservable();

  constructor(private http: HttpClient) {
    this.loadProduitsActifs();
  }

  /**
   * Charge les produits actifs au démarrage
   */
  private loadProduitsActifs(): void {
    this.getAllProduitsActifs().subscribe(
      (produits) => {
        this.produitsCache.next(produits);
      },
      (error) => {
        console.error('Erreur lors du chargement des produits', error);
      }
    );
  }

  /**
   * Récupère tous les produits actifs
   */
  getAllProduitsActifs(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.baseUrl}/actifs`).pipe(
      tap(produits => this.produitsCache.next(produits))
    );
  }

  /**
   * Récupère tous les produits (actifs et inactifs) - Admins seulement
   */
  getAllProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.baseUrl}/tous`);
  }

  /**
   * Récupère un produit par son ID
   */
  getProduitById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.baseUrl}/${id}`);
  }

  /**
   * Ajoute un nouveau produit - Admins seulement
   */
  addProduit(produit: Produit): Observable<Produit> {
    return this.http.post<Produit>(`${this.baseUrl}/ajouter`, produit).pipe(
      tap(() => this.loadProduitsActifs())
    );
  }

  /**
   * Met à jour un produit - Admins seulement
   */
  updateProduit(id: number, produit: Produit): Observable<Produit> {
    return this.http.put<Produit>(`${this.baseUrl}/modifier/${id}`, produit).pipe(
      tap(() => this.loadProduitsActifs())
    );
  }

  /**
   * Désactive un produit - Admins seulement
   */
  desactiverProduit(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/desactiver/${id}`, {}).pipe(
      tap(() => this.loadProduitsActifs())
    );
  }

  /**
   * Initialise les produits par défaut - Admins seulement
   */
  initializerProduits(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/initialiser`, {}).pipe(
      tap(() => this.loadProduitsActifs())
    );
  }

  /**
   * Recharge le cache des produits
   */
  rechargerProduits(): void {
    this.loadProduitsActifs();
  }
}

