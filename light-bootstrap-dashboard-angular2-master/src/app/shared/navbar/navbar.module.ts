import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from './navbar.component';



@NgModule({
    imports: [RouterModule, CommonModule, FormsModule],
    declarations: [NavbarComponent],
    exports: [NavbarComponent]
})

export class NavbarModule { }
