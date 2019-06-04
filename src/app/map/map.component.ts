import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';
import {Observable, of, BehaviorSubject } from 'rxjs';
import { map, retry, catchError } from 'rxjs/operators';
import { User } from '../_models/user'
import {Metadata } from '../_models/metadata'
import {latLng, tileLayer, Marker, icon} from 'leaflet';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { AppConfig } from '../_services/config.service';
//import { AuthenticationService } from '../_services/authentication.service';
//import { SpatialService } from '../_services/spatial.service'
import { QueryHandlerService, IndexMetadataMap } from '../_services/query-handler.service';
import { FilterHandle, FilterManagerService, Filter, FilterMode } from '../_services/filter-manager.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {

  static readonly DEFAULT_RESULTS = 10;

  //metadata = true;
  selectedMetadata: Metadata;
  currentUser: User;

  defaultFilterSource: Observable<Metadata[]>;
  defaultFilterHandle: FilterHandle;

  map: L.Map;

  dataGroups: {
    sites: L.FeatureGroup,
    wells: L.FeatureGroup,
    waterQualitySites: L.FeatureGroup
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
       polyline: false,
       circle: false,
       marker: false,
       circlemarker: false
    }
 };

  onMapReady(map: L.Map) {
    this.map = map;

    let iconCreateFunction = (group: string): (cluster: any) => L.DivIcon => {
     
      return (cluster: any) => {
        let childCount = cluster.getChildCount();
        let markerClass = "marker-cluster ";
        let clusterSize = "marker-cluster-"
        if(childCount < 10) {
          clusterSize += "small";
        } 
        else if(childCount < 100) {
          clusterSize += "medium";
        } 
        else {
          clusterSize += "large";
        }
        markerClass += clusterSize + "-" + group;

        return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', 
        className: markerClass, iconSize: new L.Point(40, 40)});
      }
    };

    this.dataGroups = {
      sites: L.markerClusterGroup({iconCreateFunction: iconCreateFunction("sites")}),
      wells: L.markerClusterGroup({iconCreateFunction: iconCreateFunction("wells")}),
      waterQualitySites: L.markerClusterGroup({iconCreateFunction: iconCreateFunction("waterQualitySites")})
    };

    let controlGroups: any = {};

    Object.keys(this.dataGroups).forEach((key) => {
      let dataGroup = this.dataGroups[key];
      dataGroup.addTo(this.map);
      console.log(key);
      controlGroups[GroupLabelMap[key]] = dataGroup;
    });

    console.log(controlGroups);

    L.control.layers(null, controlGroups).addTo(this.map);
    
    //testing
    // this.defaultFilterSource.subscribe((data: Metadata[]) => {
    //   if(data == null) {
    //     return;
    //   }
    //   let i;
    //   for(i = 0; i < data.length; i++) {
    //     let datum = data[i];
    //     //console.log(datum.value.loc);
    //     let geojson = L.geoJSON(datum.value.loc);
    //     let group = NameGroupMap[datum.name];
    //     console.log(datum.name);
    //     // console.log(this.dataGroups[group]);
    //     this.dataGroups[group].addLayer(geojson);
    //   }
    // });
  }


  constructor(private http: HttpClient, private queryHandler: QueryHandlerService, private filters: FilterManagerService) {
    //currentUser: localStorage.getItem('currentUser');

    
  }
  
  ngAfterViewInit() {
    //this.map = this.mapElement.nativeElement
    
  }

  ngOnInit() {
    //should change this to get observable from filter manager
    //this.queryHandler.initFilterListener(this.filters.filterMonitor);
    this.defaultFilterHandle = this.filters.registerFilter();
    //console.log(this.defaultFilterHandle);
    this.defaultFilterSource = this.queryHandler.getFilterObserver(this.defaultFilterHandle);
    // this.defaultFilterSource.subscribe((data: Metadata[]) => {
    //   console.log(data);
    //   //this.testData = data;
    // });
    //set marker images to generated image location to work around 404 bug
    Marker.prototype.options.icon.options.iconUrl = "assets/marker-icon.png";
    Marker.prototype.options.icon.options.shadowUrl = "assets/marker-shadow.png";
  }

  public onDrawCreated(e: any) {

		// tslint:disable-next-line:no-console

    console.log('Draw Created Event!');
    console.log(e);
    this.queryHandler.spatialSearch(e.layer.toGeoJSON().geometry);
    this.queryHandler.requestData(this.defaultFilterHandle, 0, MapComponent.DEFAULT_RESULTS).then((data) => console.log(data));
    // setTimeout(() => {
    //   this.queryHandler.next(this.defaultFilterHandle).then((data) => console.log(data));
    //   setTimeout(() => {
    //     this.queryHandler.previous(this.defaultFilterHandle).then((data) => console.log(data));
    //     this.queryHandler.previous(this.defaultFilterHandle).then((data) => console.log(data));
    //     setTimeout(() => {
    //       this.queryHandler.next(this.defaultFilterHandle).then((data) => console.log(data));
    //       this.queryHandler.next(this.defaultFilterHandle).then((data) => console.log(data));
    //     }, 2000);
    //   }, 2000);
    // }, 2000);
    
    this.queryHandler.getDataStreamObserver(this.defaultFilterHandle).subscribe((data: IndexMetadataMap) => {
      if(data == null) {
        return;
      }
      //console.log(data);  
      let indices = Object.keys(data);
      console.log(indices);
      let i;
      for(i = 0; i < indices.length; i++) {
        let index = indices[i];
        let datum = data[index];
        //console.log(datum.value.loc);
        let geojson = L.geoJSON(datum.value.loc, {
          onEachFeature: (feature, layer) => {
            layer.bindPopup(datum.toString + "<br>" + "<a href ng-click='gotoEntry(" + index + ")'>test</a>");
          }
        })
        
        //
        let group = NameGroupMap[datum.name];
        //console.log(datum.name);
        // console.log(this.dataGroups[group]);
        this.dataGroups[group].addLayer(geojson);
      }
    });
    
	}

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

enum NameGroupMap {
  Water_Quality_Site = "waterQualitySites",
  Site = "sites",
  Well = "wells"
}

enum GroupLabelMap {
  waterQualitySites = "Water Quality Sites",
  sites = "Sites",
  wells = "Wells"
}