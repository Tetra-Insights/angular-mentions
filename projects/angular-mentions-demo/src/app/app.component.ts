import {Component, ViewChild} from '@angular/core';

import {COMMON_NAMES} from './common-names';
import {COMMON_TAGS} from './common-tags'
import {insertAtCaret, MentionDirective} from '@tetrainsights/angular-mentions';

/**
 * Demo app showing usage of the mentions directive.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  items: string[] = COMMON_NAMES;
  tagsItems: string[] = COMMON_TAGS;

  @ViewChild('mentionWithAddCharButton',{static:true}) mentionWithAddCharButton: MentionDirective;

  onMentionHide() {
    console.log('hide');
  }

  onMentionVisible() {
    console.log('visible');
  }

  onOpenTagsDropdown($event) {
    this.mentionWithAddCharButton.triggerAutocomplete($event);
  }

}
