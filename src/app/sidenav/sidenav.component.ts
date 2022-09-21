import {Component} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

/** @title Responsive sidenav */
@Component({
  selector: 'app-sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.css'],
})

export class SidenavComponent {
    options: FormGroup;
    
    constructor(fb: FormBuilder) {
        this.options = fb.group({
        bottom: 0,
        fixed: true,
        top: 0
        });
    }
    
}
    