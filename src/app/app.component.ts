import {Component, ViewChild} from '@angular/core';

import { COMMON_NAMES } from './common-names';
import { COMMON_TAGS } from './common-tags'
import {MentionDirective} from '../mention';

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

  @ViewChild('mentionWithAddCharButton') mentionWithAddCharButton: MentionDirective;

  onMentionHide() {
    console.log('hide');
  }

  onMentionVisible() {
    console.log('visible');
  }

  insertAtCaret(id, text) {
    const element = document.getElementById(id);
    element.focus();
    setTimeout(() => {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);

      selection.collapseToEnd();
    }, 10);
  }

  onOpenTagsDropdown($event) {
    $event.preventDefault();

    this.mentionWithAddCharButton.keyHandler(new KeyboardEvent('keydown', {key: '#'}));
    this.insertAtCaret('ce-add-char-functionality', '#');
  }

}
