import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { LegendItem, ChartType } from '../lbd/lbd-chart/lbd-chart.component';
import * as Chartist from 'chartist';
import { DashboardService, DashboardStats, MonthlyExpiration, ExpirationDetails } from 'app/Services/dashboard.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  // Propriétés des charts
  public emailChartType: ChartType;
  public emailChartData: any;
  public emailChartLegendItems: LegendItem[];

  public hoursChartType: ChartType;
  public hoursChartData: any;
  public hoursChartOptions: any;
  public hoursChartResponsive: any[];
  public hoursChartLegendItems: LegendItem[];

  public activityChartType: ChartType;
  public activityChartData: any;
  public activityChartOptions: any;
  public activityChartResponsive: any[];
  public activityChartLegendItems: LegendItem[];

  // Données
  public stats: DashboardStats;
  public monthlyExpiration: MonthlyExpiration;
  public expirationDetails: ExpirationDetails = {};
  public totalLicenses: number = 0;
  public isLoading: boolean = true;
  public apiConnected: boolean = true;

  // Tooltip properties
  public tooltipVisible: boolean = false;
  public tooltipLeft: string = '0px';
  public tooltipTop: string = '0px';
  public tooltipMonth: string = '';
  public tooltipCount: number = 0;
  public tooltipLicenses: string[] = [];

  // Données de débogage
  public debugData: any = {
    expirationDetails: {},
    monthlyExpiration: {},
    lastError: null
  };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit() {
    console.log('Initialisation du composant Home');
    this.checkApiConnection();
    this.initializeCharts();
  }

  checkApiConnection() {
    console.log('Vérification de la connexion API...');
    this.dashboardService.getStats().subscribe({
      next: () => {
        this.apiConnected = true;
        console.log('API connectée avec succès');
        this.loadDashboardData();
      },
      error: (error) => {
        this.apiConnected = false;
        this.debugData.lastError = error;
        console.error('API non connectée, utilisation des données fixes', error);
        this.loadFixedData();
      }
    });
  }

  initializeCharts() {
    // Initialisation basique des charts
    this.emailChartType = ChartType.Pie;
    this.hoursChartType = ChartType.Line;
    this.activityChartType = ChartType.Bar;

    // Options par défaut avec échelle entière
    this.hoursChartOptions = {
      low: 0,
      high: 5, // Valeur maximale ajustée pour l'échelle entière
      showArea: true,
      height: '245px',
      axisX: { showGrid: false },
      axisY: {
        // Configuration pour forcer des valeurs entières
        onlyInteger: true,
        labelInterpolationFnc: function(value) {
          return Math.round(value); // Arrondir à l'entier le plus proche
        }
      },
      lineSmooth: Chartist.Interpolation.simple({ divisor: 3 }),
      showLine: true,
      showPoint: true,
    };
  }

  loadDashboardData() {
    console.log('Chargement des données du dashboard...');
    this.isLoading = true;
    
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        console.log('Statistiques reçues:', stats);
        this.stats = stats;
        this.totalLicenses = Object.values(stats).reduce((sum, count) => sum + count, 0);
        this.updatePieChart();
        this.updateBarChart();
        this.loadExpirationData();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
        this.debugData.lastError = error;
        this.isLoading = false;
      }
    });
  }

  loadFixedData() {
    console.log('Chargement des données fixes');
    // Données FIXES pour quand l'API n'est pas disponible
    this.stats = {
      'Varonis': 28,
      'Fortinet': 25,
      'Palo': 15,
      'Eset': 12,
      'VMware': 10,
      'Cisco': 8,
      'Splunk': 6,
      'OneIdentity': 5
    };
    
    this.totalLicenses = Object.values(this.stats).reduce((sum, count) => sum + count, 0);
    this.updatePieChart();
    this.updateBarChart();
    this.updateLineChartWithEmptyData();
    this.isLoading = false;
  }

  loadExpirationData() {
    console.log('Chargement des données d\'expiration...');
    this.dashboardService.getExpiringDetailsByMonth().subscribe({
      next: (details) => {
        console.log('Détails d\'expiration reçus:', details);
        this.expirationDetails = details;
        this.debugData.expirationDetails = details;
        
        this.dashboardService.getExpiringByMonth().subscribe({
          next: (expiringData) => {
            console.log('Données d\'expiration par mois reçues:', expiringData);
            this.monthlyExpiration = expiringData;
            this.debugData.monthlyExpiration = expiringData;
            this.updateLineChartWithExpirationData();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Erreur données expiration:', error);
            this.debugData.lastError = error;
            this.updateLineChartWithEmptyData();
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Erreur détails expiration:', error);
        this.debugData.lastError = error;
        this.updateLineChartWithEmptyData();
        this.isLoading = false;
      }
    });
  }

  updateLineChartWithExpirationData() {
    console.log('Mise à jour du graphique avec données d\'expiration:', this.monthlyExpiration);
    
    // Si pas de données d'expiration, afficher un état vide
    if (!this.monthlyExpiration || Object.keys(this.monthlyExpiration).length === 0) {
      console.log('Aucune donnée d\'expiration disponible');
      this.updateLineChartWithEmptyData();
      return;
    }

    // Trier les mois et prendre les 12 prochains
    const sortedMonths = Object.keys(this.monthlyExpiration)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 12);

    console.log('Mois triés:', sortedMonths);

    // Si pas de mois avec expiration, afficher un état vide
    if (sortedMonths.length === 0) {
      console.log('Aucun mois avec expiration');
      this.updateLineChartWithEmptyData();
      return;
    }

    const values = sortedMonths.map(month => this.monthlyExpiration[month]);
    console.log('Valeurs des expirations:', values);
    
    // Vérifier s'il y a des expirations réelles
    const hasRealExpirations = values.some(count => count > 0);
    
    if (!hasRealExpirations) {
      console.log('Aucune expiration réelle trouvée');
      this.updateLineChartWithEmptyData();
      return;
    }
    
    const maxValue = Math.max(...values, 1);
    const roundedMax = Math.ceil(maxValue * 1.2); // Ajouter 20% de marge

    this.hoursChartData = {
      labels: sortedMonths.map(month => this.formatMonthLabel(month)),
      series: [values]
    };

    this.hoursChartOptions.high = roundedMax;
    console.log('Graphique mis à jour avec:', this.hoursChartData);
  }

  updateLineChartWithEmptyData() {
    console.log('Mise à jour avec données vides');
    // Données vides pour quand il n'y a pas de données d'expiration
    const now = new Date();
    const months = [];
    const values = [];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push(monthKey);
      values.push(0);
    }

    this.hoursChartData = {
      labels: months.map(month => this.formatMonthLabel(month)),
      series: [values]
    };

    this.hoursChartOptions.high = 10;
  }

  getLicenseNames(monthLabel: string, count: number): string[] {
    console.log('getLicenseNames appelé avec:', monthLabel, count);
    
    if (count <= 0) return ['Aucune licence'];
    
    // Si pas de détails d'expiration disponibles
    if (!this.expirationDetails || Object.keys(this.expirationDetails).length === 0) {
      console.log('Aucun détail d\'expiration disponible');
      return [`${count} licence(s) - données non disponibles`];
    }
    
    const [monthName, year] = monthLabel.split(' ');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
                       'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthIndex = monthNames.findIndex(m => m === monthName) + 1;
    
    if (monthIndex === 0) {
      console.log('Mois non trouvé:', monthName);
      return [`${count} licence(s)`];
    }
    
    const monthKey = `${year}-${monthIndex.toString().padStart(2, '0')}`;
    console.log('Recherche détails pour:', monthKey);
    
    const monthDetails = this.expirationDetails[monthKey];
    
    if (!monthDetails) {
      console.log('Aucun détail pour le mois:', monthKey);
      return [`${count} licence(s) - détails non disponibles`];
    }
    
    console.log('Détails trouvés:', monthDetails);
    
    // Utiliser les vraies données de l'API
    const licenses = [];
    let totalShown = 0;
    
    for (const [product, productCount] of Object.entries(monthDetails)) {
      // Modifier "palo" en "paloalto" dans les tooltips
      const displayName = product === 'Palo' ? 'Paloalto' : product;
      licenses.push(`${displayName}: ${productCount} licence(s)`);
      totalShown += productCount;
      
      if (licenses.length >= 6) {
        const remainingCount = count - totalShown;
        if (remainingCount > 0) {
          licenses.push(`... et ${remainingCount} autre(s) licence(s)`);
        }
        break;
      }
    }
    
    return licenses;
  }

  updatePieChart() {
    if (!this.stats) return;

    const topProducts = Object.entries(this.stats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Créer une copie modifiée des données pour l'affichage
    const displayData = topProducts.map(([product, count]) => ({
      name: product === 'Palo' ? 'Paloalto' : product,
      count: count
    }));

    this.emailChartData = {
      labels: displayData.map(item => item.name),
      series: displayData.map(item => item.count)
    };

    this.emailChartLegendItems = displayData.map((item, index) => ({
      title: `${item.name}: ${item.count} licences`,
      imageClass: `fa fa-circle text-${this.getColorClass(index)}`
    }));
  }

  updateBarChart() {
    if (!this.stats) return;

    const topProducts = Object.entries(this.stats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);

    // Créer une copie modifiée des données pour l'affichage
    const displayData = topProducts.map(([product, count]) => ({
      name: product === 'Palo' ? 'Paloalto' : product,
      count: count
    }));

    this.activityChartData = {
      labels: displayData.map(item => item.name),
      series: [displayData.map(item => item.count)]
    };

    this.activityChartLegendItems = [
      { title: 'Nombre de licences', imageClass: 'fa fa-circle text-info' }
    ];
  }

  formatMonthLabel(monthString: string): string {
    const [year, month] = monthString.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
                       'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  getColorClass(index: number): string {
    const colors = ['info', 'success', 'warning', 'danger', 'primary', 'secondary'];
    return colors[index % colors.length];
  }

  getProductCount(product: string): number {
    return this.stats ? this.stats[product] || 0 : 0;
  }

  getTopProductName(): string {
    if (!this.stats || Object.keys(this.stats).length === 0) return '-';
    const entries = Object.entries(this.stats);
    const topProduct = entries.sort(([,a], [,b]) => b - a)[0][0];
    return topProduct === 'Palo' ? 'Paloalto' : topProduct;
  }

  getLeastAddedProduct(): {name: string, count: number} {
    if (!this.stats || Object.keys(this.stats).length === 0) {
      return { name: '-', count: 0 };
    }
    
    const entries = Object.entries(this.stats);
    const leastAdded = entries.reduce((min, [name, count]) => {
      return count < min.count ? { name, count } : min;
    }, { name: entries[0][0], count: entries[0][1] });

    return leastAdded;
  }

  getLeastAddedProductName(): string {
    const product = this.getLeastAddedProduct().name;
    return product === 'Palo' ? 'Paloalto' : product;
  }

  getLeastAddedProductCount(): number {
    return this.getLeastAddedProduct().count;
  }

  getTopProducts(limit: number = 10): {name: string, count: number}[] {
    if (!this.stats) return [];
    return Object.entries(this.stats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ 
        name: name === 'Palo' ? 'Paloalto' : name, 
        count 
      }));
  }

  // NOUVELLES MÉTHODES POUR LE TOP CLIENT
  getTopClientName(): string {
    if (!this.stats || Object.keys(this.stats).length === 0) return '-';
    
    // Dans votre cas, les "clients" semblent être en réalité les produits
    // Si vous voulez vraiment les clients, vous aurez besoin de données différentes
    const topProduct = Object.entries(this.stats)
        .sort(([,a], [,b]) => b - a)[0][0];
    
    return topProduct === 'Palo' ? 'Paloalto' : topProduct;
  }

  getTopClientProductCount(): number {
    if (!this.stats || Object.keys(this.stats).length === 0) return 0;
    
    const topProduct = Object.entries(this.stats)
        .sort(([,a], [,b]) => b - a)[0][0];
    
    return this.stats[topProduct] || 0;
  }

  hasExpirationData(): boolean {
    return this.monthlyExpiration && 
           Object.keys(this.monthlyExpiration).length > 0 &&
           Object.values(this.monthlyExpiration).some(count => count > 0);
  }

  calculateSmartThreshold(): number {
    if (!this.hoursChartData || !this.hoursChartData.series[0]) return 10;
    
    const counts = this.hoursChartData.series[0].slice(0, 6);
    if (counts.length === 0) return 10;
    
    const average = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const squaredDiffs = counts.map(count => Math.pow(count - average, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / counts.length;
    const standardDeviation = Math.sqrt(variance);
    
    const dynamicThreshold = Math.ceil(average + standardDeviation);
    
    return Math.min(Math.max(dynamicThreshold, 5), 20);
  }

  getCriticalThreshold(): number {
    return this.calculateSmartThreshold();
  }

  getCriticalExpirations(): {month: string, count: number, isUrgent: boolean}[] {
    if (!this.hoursChartData || !this.hoursChartData.series[0]) return [];
    
    const criticalThreshold = this.calculateSmartThreshold();
    const urgentThreshold = criticalThreshold * 1.5;
    
    const months = this.hoursChartData.labels.slice(0, 6);
    const counts = this.hoursChartData.series[0].slice(0, 6);
    
    return months.map((month, index) => ({ 
        month, 
        count: counts[index],
        isUrgent: counts[index] > urgentThreshold
    }))
    .filter(item => item.count > criticalThreshold)
    .sort((a, b) => b.count - a.count);
  }

  onChartHover(event: MouseEvent) {
    if (!this.hoursChartData?.labels || !this.chartContainer) return;

    const container = this.chartContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;

    const monthIndex = this.calculateMonthIndex(x, width);
    if (monthIndex >= 0 && monthIndex < this.hoursChartData.labels.length) {
      this.showTooltip(monthIndex, event.clientX, event.clientY);
    } else {
      this.hideTooltip();
    }
  }

  onChartLeave() {
    this.hideTooltip();
  }

  calculateMonthIndex(x: number, totalWidth: number): number {
    if (!this.hoursChartData?.labels) return -1;
    
    const totalMonths = this.hoursChartData.labels.length;
    const segmentWidth = totalWidth / totalMonths;
    const index = Math.floor(x / segmentWidth);
    
    return Math.min(index, totalMonths - 1);
  }

  showTooltip(monthIndex: number, clientX: number, clientY: number) {
    const monthLabel = this.hoursChartData.labels[monthIndex];
    const count = this.hoursChartData.series[0][monthIndex];
    
    this.tooltipMonth = monthLabel;
    this.tooltipCount = count;
    this.tooltipLicenses = this.getLicenseNames(monthLabel, count);
    
    this.updateTooltipPosition(clientX, clientY);
    this.tooltipVisible = true;
  }

  updateTooltipPosition(clientX: number, clientY: number) {
    this.tooltipLeft = (clientX + 20) + 'px';
    this.tooltipTop = (clientY - 80) + 'px';
  }

  hideTooltip() {
    this.tooltipVisible = false;
  }

  // Méthode pour forcer le rafraîchissement des données
  refreshData() {
    console.log('Rafraîchissement manuel des données');
    this.isLoading = true;
    this.loadDashboardData();
  }

  // Méthode de débogage pour afficher les données
  debugExpirationData() {
    console.log('=== DONNÉES DE DÉBOGAGE EXPIRATION ===');
    console.log('MonthlyExpiration:', this.monthlyExpiration);
    console.log('ExpirationDetails:', this.expirationDetails);
    console.log('Has expiration data:', this.hasExpirationData());
    console.log('=======================================');
  }
}
