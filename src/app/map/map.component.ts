import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';
import {Observable, of, BehaviorSubject } from 'rxjs';
import { map, retry, catchError } from 'rxjs/operators';
import { User } from '../_models/user'
import {Metadata } from '../_models/metadata'
import {latLng, LatLng, tileLayer,circle,polygon,icon} from 'leaflet';
import * as L from 'leaflet';
import { AppConfig } from '../_services/config.service';
//import { AuthenticationService } from '../_services/authentication.service';
//import { SpatialService } from '../_services/spatial.service'
import { QueryHandlerService } from '../_services/query-handler.service';
import { FilterHandle, FilterManagerService, Filter, FilterMode } from '../_services/filter-manager.service';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  static readonly DEAFAULT_RESULTS = 10;

  //metadata = true;
  selectedMetadata: Metadata;
  currentUser: User;

  defaultFilterSource: Observable<Metadata[]>;
  defaultFilterHandle: FilterHandle;


  constructor(private http: HttpClient, private queryHandler: QueryHandlerService, private filters: FilterManagerService) {
    //currentUser: localStorage.getItem('currentUser');

    
  }
  

  ngOnInit() {
    this.queryHandler.initFilterListener(this.filters.filterMonitor);
    this.defaultFilterHandle = this.filters.registerFilter();
    //console.log(this.defaultFilterHandle);
    this.defaultFilterSource = this.queryHandler.getFilterObserver(this.defaultFilterHandle);
    // this.defaultFilterSource.subscribe((data: Metadata[]) => {
    //   console.log(data);
    //   //this.testData = data;
    // });
  }

  public onDrawCreated(e: any) {

		// tslint:disable-next-line:no-console

    console.log('Draw Created Event!');
    console.log(e)
    console.log(String(e.layer.toGeoJSON()))
    this.queryHandler.spatialSearch(e.layer.toGeoJSON().geometry);
    this.queryHandler.requestData(this.defaultFilterHandle, 0, MapComponent.DEAFAULT_RESULTS).then((data) => console.log(data));
    setTimeout(() => {
      this.queryHandler.next(this.defaultFilterHandle).then((data) => console.log(data));
      setTimeout(() => {
        this.queryHandler.previous(this.defaultFilterHandle).then((data) => console.log(data));
        this.queryHandler.previous(this.defaultFilterHandle).then((data) => console.log(data));
        setTimeout(() => {
          this.queryHandler.next(this.defaultFilterHandle).then((data) => console.log(data));
          this.queryHandler.next(this.defaultFilterHandle).then((data) => console.log(data));
        }, 2000);
      }, 2000);
    }, 2000);
    
	}

  options = {
    layers: [
      tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
    ],
    zoom: 5,
    center: latLng(21.289373, -157.917480)
  };

  drawOptions = {
    position: 'topright',
    draw: {
       marker: {
          icon: L.icon({
              iconSize: [ 25, 41 ],
              iconAnchor: [ 13, 41 ],
              iconUrl: 'assets/marker-icon.png',
              shadowUrl: 'assets/marker-shadow.png'
          })
       },
       polyline: false,
       circle: {
           shapeOptions: {
               color: '#aaaaaa'
           }
       }
    }
 };

//  spatialSearch(geometry: any){

//     var query = "{'$and':[{'name':'Landuse'},{'value.name':'dataset12042018'},{'value.loc': {$geoWithin: {'$geometry':"+JSON.stringify(geometry.geometry).replace(/"/g,'\'')+"}}}]}";
//     console.log(query)
//     let url = AppConfig.settings.aad.tenant+"/meta/v2/data?q="+encodeURI(query)+"&limit=100000&offset=0";
//        //.set("Authorization", "Bearer " + currentUser.access_token)
//     let head = new HttpHeaders()
//     .set("Content-Type", "application/x-www-form-urlencoded");
//     let options = {
//       headers: head
//     };
// console.log("stuff1")
//     this.http.get<any>(url, options).subscribe(responseData => console.log(responseData.result));
//     /*.pipe(
//      map((data) => {
//        console.log("more")
//        return data.result as Metadata[];
//      }),
//      catchError((e) => {
//        console.log()
//        return Observable.throw(new Error(e.message));
//      })
//    );*/
//    console.log("stuff2")
//    //return response;
//   }

}
