import { Component, OnInit } from '@angular/core';
import { PermissionService } from '../Services/permission.service';

declare const $: any;
declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
  children?: RouteInfo[];
}
export const ROUTES: RouteInfo[] = [
  { path: '/dashboard', title: 'Tableau de bord', icon: 'pe-7s-graph', class: '' },
  { path: '/user', title: 'Utilisateur', icon: 'pe-7s-user', class: '' },
  { path: '/table', title: 'Produits', icon: 'pe-7s-note2', class: '' },
  { path: '/typography', title: 'Produits Expirés', icon: 'pe-7s-news-paper', class: '' },
  { 
    path: '/contrats', 
    title: 'Suivi des contrats', 
    icon: 'pe-7s-note', 
    class: '',
    children: [
      { path: '/interventions-curatives', title: 'Interventions Curatives', icon: 'pe-7s-tools', class: '' },
      { path: '/interventions-preventives', title: 'Interventions Préventives', icon: 'pe-7s-shield', class: '' }
    ]
  },
  { path: '/historique-contrats', title: 'Historique Contrats', icon: 'pe-7s-clock', class: '' },
  { path: '/client-stats', title: 'Clients', icon: 'pe-7s-users', class: '' },
  //{ path: '/messaging', title: 'Messagerie', icon: 'pe-7s-chat', class: '' },
  { path: '/assistant', title: 'Assistant', icon: 'pe-7s-comment', class: '' },
  { path: '/profile', title: 'Profil', icon: 'pe-7s-news-paper', class: '' },
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  menuItems: any[];

  constructor(public permissionService: PermissionService) { }

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => menuItem);
  }

  toggleSubmenu(menuItem: any) {
    menuItem.isOpen = !menuItem.isOpen;
  }

  isMobileMenu() {
    if ($(window).width() > 991) {
      return false;
    }
    return true;
  };
}
