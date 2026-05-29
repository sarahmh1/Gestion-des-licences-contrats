import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantChatComponent } from './assistant-chat.component';
import { AssistantFabComponent } from './assistant-fab.component';

/**
 * AdminLayoutComponent vit dans AppModule : il doit importer ces composants depuis un module
 * dédié. Le lazy AdminLayoutModule réimporte ce module pour les routes (page Assistant).
 */
@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [AssistantChatComponent, AssistantFabComponent],
  exports: [AssistantChatComponent, AssistantFabComponent]
})
export class AssistantUiModule {}
