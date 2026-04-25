import { environment } from 'environments/environment';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth/AuthService';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    type: string;
    color: string;
    done: boolean;
    client: string;
    interventionId: number;
}

interface TimelineDay {
    date: Date;
    dateStr: string;
    dayNum: number;
    isToday: boolean;
    isWeekend: boolean;
}

@Component({
    selector: 'app-calendar',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
    currentMonth: number = 0;
    currentYear: number = 0;
    monthNames: string[] = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    days: TimelineDay[] = [];
    events: CalendarEvent[] = [];
    currentUserId: number = 0;
    selectedEvent: CalendarEvent | null = null;
    showPopup: boolean = false;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.loadUserAndEvents();
    }

    loadUserAndEvents(): void {
        const token = this.authService.getToken();
        if (!token) return;
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.get<any>(`${environment.apiUrl}/Users/me`, { headers }).subscribe(
            (user) => {
                this.currentUserId = user.id;
                this.loadEvents();
            }
        );
    }

    loadEvents(): void {
        if (!this.currentUserId) return;
        const token = this.authService.getToken();
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http.get<CalendarEvent[]>(
            `${environment.apiUrl}/InterventionPreventive/calendar/${this.currentUserId}`,
            { headers }
        ).subscribe(
            (events) => {
                this.events = events;
                this.buildTimeline();
            },
            () => { this.buildTimeline(); }
        );
    }

    buildTimeline(): void {
        this.days = [];
        const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(this.currentYear, this.currentMonth, d);
            const dow = date.getDay();
            this.days.push({
                date,
                dateStr: this.toDateStr(date),
                dayNum: d,
                isToday: date.getTime() === today.getTime(),
                isWeekend: dow === 0 || dow === 6
            });
        }
    }

    toDateStr(d: Date): string {
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    getBarStyle(event: CalendarEvent): any {
        if (!event.start && !event.end) return { display: 'none' };

        const monthStart = this.days[0]?.dateStr;
        const monthEnd = this.days[this.days.length - 1]?.dateStr;
        const totalDays = this.days.length;

        const evStart = event.start || event.end;
        const evEnd = event.end || event.start;

        // If event is entirely outside this month, hide it
        if (evEnd < monthStart || evStart > monthEnd) {
            return { display: 'none' };
        }

        // Clamp to month bounds
        const clampedStart = evStart < monthStart ? monthStart : evStart;
        const clampedEnd = evEnd > monthEnd ? monthEnd : evEnd;

        const startDay = parseInt(clampedStart.split('-')[2], 10);
        const endDay = parseInt(clampedEnd.split('-')[2], 10);

        const left = ((startDay - 1) / totalDays) * 100;
        const width = ((endDay - startDay + 1) / totalDays) * 100;

        return {
            left: left + '%',
            width: width + '%',
            background: event.color
        };
    }

    getVisibleEvents(): CalendarEvent[] {
        const monthStart = this.days[0]?.dateStr;
        const monthEnd = this.days[this.days.length - 1]?.dateStr;
        if (!monthStart) return [];

        return this.events.filter(ev => {
            const start = ev.start || ev.end;
            const end = ev.end || ev.start;
            if (!start) return false;
            return !(end < monthStart || start > monthEnd);
        });
    }

    prevMonth(): void {
        this.currentMonth--;
        if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
        this.buildTimeline();
    }

    nextMonth(): void {
        this.currentMonth++;
        if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
        this.buildTimeline();
    }

    goToToday(): void {
        const t = new Date();
        this.currentMonth = t.getMonth();
        this.currentYear = t.getFullYear();
        this.buildTimeline();
    }

    openPopup(ev: CalendarEvent): void {
        this.selectedEvent = ev;
        this.showPopup = true;
    }

    closePopup(): void {
        this.showPopup = false;
        this.selectedEvent = null;
    }

    getMonthLabel(): string {
        return this.monthNames[this.currentMonth] + ' ' + this.currentYear;
    }

    getTypeLabel(type: string): string {
        return type === 'recommandee' ? 'Période Recommandée' : "Période d'Intervention";
    }

    getStatusLabel(done: boolean): string {
        return done ? 'Terminée' : 'En attente';
    }
}

