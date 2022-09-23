import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import { User } from '../_models/user';
import { AuthenticationService } from '../_services/authentication.service';

import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent {
    users: User[] = [];

    constructor(private route: ActivatedRoute,
      private router: Router) { }

    removeAlert() {
      document.getElementById('alert').className = "d-flex justify-content-between alert alert-warning alert-dismissible fade position-absolute hide";
    }

    ngOnInit() {

    }

    tempLogout() {
      alert('bypass auth for development')
      localStorage.removeItem('user');
      return this.router.navigate(['/']);
    }
}
