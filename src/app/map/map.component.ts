import { Component, OnInit, ViewChild, AfterViewInit, ViewChildren, QueryList, ElementRef, Renderer2, SecurityContext } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';
import { Observable, of, BehaviorSubject,throwError } from 'rxjs';
import { map, retry, catchError } from 'rxjs/operators';
import { User } from '../_models/user'
import { Metadata } from '../_models/metadata'
import { latLng, tileLayer, Marker, icon } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet.markercluster';
//import 'leaflet.pm/dist/leaflet.pm.min.js';
import { AppConfig } from '../_services/config.service';
//import { AuthenticationService } from '../_services/authentication.service';
//import { SpatialService } from '../_services/spatial.service'
import { QueryHandlerService, QueryController, QueryResponse } from '../_services/query-handler.service';
import { FilterHandle, FilterManagerService, Filter, FilterMode } from '../_services/filter-manager.service';
import { mapToExpression } from '@angular/compiler/src/render3/view/util';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { FormBuilder, FormControl } from '@angular/forms';

import { QueryBuilderClassNames, QueryBuilderConfig } from 'angular2-query-builder';
import { isNgTemplate } from '@angular/compiler';

declare var jQuery: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit, AfterViewInit {

  queryCtrl = new FormControl('');
  currentQuery: string = "";

  query = {
    condition: 'and',
    rules: [
      { field: 'year', operator: '=', value: '2019', type: 'number' },
      { condition: 'or',
        rules: [
          { field: 'season', operator: '=', value: 'WINTER', type: 'string'},
          { field: 'season', operator: '=', value: 'SPRING', type: 'string'},
          { condition: 'and',
          rules: [
            { field: 'ph', operator: '>', value: '1', type: 'number'}]
        }]
      }
    ]
  };

  config: QueryBuilderConfig = {
    fields: {
      date: {name: 'Date', type: 'date'},
      season: {
        name: 'Season',
        type: 'category',
        options: [
          {name: 'Summer', value: 'SUMMER'},
          {name: 'Fall', value: 'FALL'},
          {name: 'Winter', value: 'WINTER'},
          {name: 'Spring', value: 'SPRING'}
        ]
      },
      year: {name: 'Year', type: 'number'},
      time: {name: 'Time', type: 'time'},
      temp_c: {name: 'TEMP_C', type: 'number'},
      do_percent: {name: 'DO_percent', type: 'number'},
      do_mg_l: {name: 'DO_mg_L', type: 'number'},
      spc_us: {name: 'SPC_us', type: 'number'},
      sal_ppt: {name: 'SAL_ppt', type: 'number'},
      ph: {name: 'pH', type: 'number'},
      water_level_cm: {name: 'WATER_LEVEL_cm', type: 'number'},
      turbidity: {name: 'Turbidity', type: 'number'},
      tdn_umol_L: {name: 'TDN_umol.L', type: 'number'},
      tdp_umol_L: {name: 'TDP_umol.L', type: 'number'},
      po4_umol_L: {name: 'PO4_umol.L', type: 'number'},
      si_umol_L: {name: 'Si_umol.L', type: 'number'},
      nox_umol_L: {name: 'NOX_umol.L', type: 'number'},
      nh4_umol_L: {name: 'NH4_umol.L', type: 'number'},
      toc_umol_L: {name: 'TOC_umol.L', type: 'number'}
    }
  }

  queryFilter() {
    console.log(this.query, 'need to update metadata2')
    /* previous attempt to create a front end filter */

    if (!this.query.rules.length) this.currentQuery = '';
    else this.metadata2 = []
    
    /* logical 'or' operator */
    let result:Array<any> = ['']
    let condition: string = this.query.condition === 'and' ? " {'$and': [" : " {'$or':  [";
    result[0] += condition;
    for (let i: number = 0; i < this.query.rules.length; i++) {
      if (this.query.rules[i].field) {
        let { field, operator, value } = this.query.rules[i];

        let type: string;
        if (field !== 'season' && field !== 'date' && field !== 'time') {
          type = 'number'
        } else {
          type = 'string'
        }

        const statement = this.evaluateOperation(operator, value, type);
        result[0] += `{'value.${field}'${statement}}`;
        // result[0] += `operation`;
      }
      if (this.query.rules[i].condition) {
        this.queryFilterRecursive(this.query.rules[i], result)
      }
      (i !== this.query.rules.length - 1) ? result[0] += ", " : null;
    }
    result[0] += ']}'
    this.currentQuery = ", " + result[0];

    /* END previous attempt to create a front end filter */
    this.findData();

  }


  showMetadata() {
    console.log(this.metadata, 'metadata')
    console.log(this.metadata2, 'metadata2')
    console.log(this.currentQuery, 'current query')
  }

  queryFilterRecursive(query: any, result: Array<any>) {
    
    let nestedQuery: Array<any> = ['']
    let condition: string = query.condition === 'and' ? " {'$and': [" : " {'$or': [";
    result[0] += condition;
    for (let i: number = 0; i < query.rules.length; i++) {
      if (query.rules[i].field) {
        let { field, operator, value } = query.rules[i];

        let type: string;
        if (field !== 'season' && field !== 'date' && field !== 'time') {
          type = 'number'
        } else {
          type = 'string'
        }

        const statement = this.evaluateOperation(operator, value, type);
        nestedQuery[0] += `{'value.${field}'${statement}}`;
        (i !== query.rules.length - 1) ? nestedQuery[0] += ", " : null;
        // nestedQuery[0] += `operation`;
      }
      if (query.rules[i].condition) {
        this.queryFilterRecursive(query.rules[i], nestedQuery)
      }
    }
    result[0] += nestedQuery[0];
    result[0] += ']}';
  }

  evaluateOperation(operator: string, value: string, type: string){
    if (type !== 'number') {
      switch (operator) {
        case '=':
          return `: '${value}'`;
        case '>':
          return `: {'$gt': '${value}'}`;
        case '<':
          return `: {'$lt': '${value}'}`;
        case '>=':
          return `: {'$gte': '${value}'}`;
        case '<=':
          return `: {'$lte': '${value}'}`;
        case '!=':
          return `: {'$ne': '${value}'}`;
        default:
            console.log("No such operator exists!");
            break;
      }
    } else {
      switch (operator) {
        case '=':
          return `: ${value}`;
        case '>':
          return `: {'$gt': ${value}}`;
        case '<':
          return `: {'$lt': ${value}}`;
        case '>=':
          return `: {'$gte': ${value}}`;
        case '<=':
          return `: {'$lte': ${value}}`;
        case '!=':
          return `: {'$ne': ${value}}`;
        default:
          console.log("No such operator exists!");
          break;
      }
    }
  }

  dtOptions: DataTables.Settings = {};

  dtTrigger: Subject<any> = new Subject<any>();
  static readonly DEFAULT_RESULTS = 10;

  @ViewChildren("entries") entries: QueryList<ElementRef>;

  highlightEntries: ElementRef[] = [];

  microGPSData: Array<Object>;

  metadata: Metadata[];
  metadata2: Metadata[];
  filterData: Metadata[];
  selectedMetadata: Metadata;
  currentUser: User;
  result: Array<Object>;

  defaultFilterSource: Observable<Metadata[]>;
  defaultFilterHandle: FilterHandle;

  map: L.Map;
  mapZoomed: L.Map; // small map for modal screen
  mapZoomedLatLng: any; // tracks the current LatLon for the small map for modal screen
  mapZoomedCircle: any; // tracks the drawn circle on the small map for modal screen 
  
  dataGroups: {
    sites: L.FeatureGroup,
    wells: L.FeatureGroup,
    waterQualitySites: L.FeatureGroup,
    MicroGPS: L.FeatureGroup
  }

  options: L.MapOptions = {
    layers: [
      // tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
      tileLayer('http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}', { maxZoom: 18, attribution: '...' })
    ],
    zoom:10,
    center: latLng(21.48,-157.91040),
    attributionControl: false
  };
  // center: latLng(20.5, -157.917480),

  optionsZoomed: L.MapOptions = {
    layers: [
      tileLayer('http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}', { maxZoom: 18, attribution: '...' })
    ],
    zoom:12,
    center: latLng(21.48,-157.91040),
    attributionControl: false,
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    zoomDelta: 0,
    dragging: false
  };

  drawnItems: L.FeatureGroup = new L.FeatureGroup;

  drawOptions = {
    position: 'topleft',
    draw: {
       polyline: false,
       circle: false,
       marker: false,
       circlemarker: false
    },
    edit: {
      featureGroup: this.drawnItems
    }
  };

  controlOptions = {
    attributionControl: false
  };

  onMapReady(map: L.Map) {
    this.metadata =[];
    this.map = map;

    let legendControl: L.Control = new L.Control({position: "bottomleft"});
    legendControl.onAdd = (map) => {
      let legend = L.DomUtil.create("div", "legend");
      legend.innerHTML = '<div class="grid">'
      +'<div class="bl">Legend</div>'
      +'<div class="ht">Cluster Size</div>'

      +'<div class="s1">2-9</div>'
      +'<div class="s2">10-100</div>'
      +'<div class="s3">100+</div>'
      +'<div class="t1">Wells</div>'


      +'<div class="c1"><div class="color-circle color-1"></div></div>'
      +'<div class="c2"><div class="color-circle color-2"></div></div>'
      +'<div class="c3"><div class="color-circle color-3"></div></div>'

      +'</div>'
      return legend;
    }
    //legendControl.addTo(this.map);

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
      sites: L.markerClusterGroup({iconCreateFunction: iconCreateFunction("sites"), disableClusteringAtZoom:4}),
      MicroGPS: L.markerClusterGroup({iconCreateFunction: iconCreateFunction("MicroGPS"), disableClusteringAtZoom:4}),
      wells: L.markerClusterGroup({iconCreateFunction: iconCreateFunction("wells"), disableClusteringAtZoom:12}),
      waterQualitySites: L.markerClusterGroup({iconCreateFunction: iconCreateFunction("waterQualitySites")})
    };

    let controlGroups: any = {};

    Object.keys(this.dataGroups).forEach((key) => {
      let dataGroup = this.dataGroups[key];
      dataGroup.addTo(this.map);
      // console.log(key);
      controlGroups[GroupLabelMap[key]] = dataGroup;
    });

    L.control.layers(null, controlGroups).addTo(this.map);
    this.drawnItems.addTo(this.map);

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

  onMapZoomedReady(mapZoomed: L.Map) {
    // small map for modal screen
    this.mapZoomed = mapZoomed;
    if (this.mapZoomedLatLng) {
      // if Lat Lon is cached, then the map hasn't been drawn for the clicked on location
      this.drawMapZoomedPoint();
    }
  }

  constructor(private renderer: Renderer2, private queryHandler: QueryHandlerService, private filters: FilterManagerService, private http: HttpClient, private sanitizer: DomSanitizer) {
    //currentUser: localStorage.getItem('currentUser');


  }

  downloadClick(metadatum_href){
    let downloadString = metadatum_href.replace("media","download/public")
    // console.log(downloadString)
    window.open(downloadString, "_blank");
  }
  
  createPostit(file_url): Observable<any>{
    let url = AppConfig.settings.aad.tenant + "/postits/v2/?url=" + encodeURI(file_url) + "&method=GET&lifetime=600&maxUses=1";
    let head = new HttpHeaders()
    .set("Content-Type", "application/x-www-form-urlencoded");
    let bodyString = JSON.stringify({});
    let params: HttpParams = new HttpParams()
    .append("method", "POST")
    let options = {
      headers: head,
      observe: <any>"response",
      //params: params
    };
    // console.log(url);

    return this.http.post<any>(url,{}, options).pipe(map((response: any) => response))
  }

  tableSearch(term: string) {
    if(!term) {
      this.filterData = this.metadata2;
    } else {
      this.filterData = this.metadata2.filter(x =>
        {for(var obj in x.value){
          if(x.value[obj] != null){
            if(typeof(x.value[obj]) == "string"){
              if(x.value[obj].trim().toLowerCase().includes(term.trim().toLowerCase())){
                return true;
              }
            }
          }
        }}
      );
      this.dtTrigger.next()
    }
  }

  ngAfterViewInit() {
    //this.map = this.mapElement.nativeElement
    this.findData()
  }


  ngOnInit() {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 2
    };
    //should change this to get observable from filter manager
    //this.queryHandler.initFilterListener(this.filters.filterMonitor);
    this.defaultFilterHandle = this.filters.registerFilter();

    //this.findData()
    //console.log(this.defaultFilterHandle);
    //this.defaultFilterSource = this.queryHandler.getFilterObserver(this.defaultFilterHandle);
    // this.defaultFilterSource.subscribe((data: Metadata[]) => {
    //   console.log(data);
    //   //this.testData = data;
    // });
    //set marker images to generated image location to work around 404 bug
    // Marker.prototype.options.icon.options.iconUrl = "assets/markers/marker-icon-red.png";
    // Marker.prototype.options.icon.options.shadowUrl = "assets/marker-shadow.png";
    // Marker.prototype.options.icon.options.iconRetinaUrl = "assets/marker-icon-2x.png";
  }

  public onMove(e: any){

        // console.log('Move Event!');
        this.findData()
  }

  public findData() {
    this.metadata= [];
    this.metadata2 = [];
    this.filterData= [];
    this.microGPSData = [];

    let bounds =  this.map.getBounds();//  e.layer.getBounds();
    let box = {
              "type": "Feature",
              "geometry": {
                  "type": "Polygon",
                  "coordinates": [[
                      [bounds.getSouthWest().lng, bounds.getNorthEast().lat],
                      [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
                      [bounds.getNorthEast().lng, bounds.getSouthWest().lat],
                      [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
                      [bounds.getSouthWest().lng, bounds.getNorthEast().lat]
                  ]]
              }
          }
    let customCircleMarker = L.CircleMarker.extend({
         options: {
            datum: {},
         }
      });
      let customMarker = L.Marker.extend({
           options: {
              datum: {},
           }
        });
    // console.log(JSON.stringify(box))
    //this.map.fitBounds(bounds);
    Object.keys(this.dataGroups).forEach((key) => {
      let dataGroup = this.dataGroups[key];
      dataGroup.clearLayers();
    });

    let query = "{'$and':[{'name':{'$in':['TEST_Micro_GPS']}},{'value.loc': {$geoWithin: {'$geometry':" + JSON.stringify(box.geometry).replace(/"/g,'\'') + "}}}]}";

    if (this.queryHandler.cache.dataStore[query]) {

      
      console.log('DUPLICATE MICRO GPS CALL FOUND')

      this.microGPSData = [...this.queryHandler.cache.dataStore[query].data];

      this.querySiteDateGeo();

    } else {
    
    let dataStream: QueryController = this.queryHandler.spatialSearch([box]);


    dataStream.getQueryObserver().subscribe((microGPSData: any) => {
      this.microGPSData = microGPSData.data;
      if(this.microGPSData == null) {
        return;
      }
      
      this.querySiteDateGeo();
    });

    }
    
  }

  public querySiteDateGeo() {
    /* create a hashmap to detect gps location to nest sitedategeo without using a nested for loop (chaz) */
    const locationHashmap: Object = {}
    this.microGPSData.map((microGPS: any) => {
      if (!locationHashmap[microGPS.value.location]) {
        locationHashmap[microGPS.value.location] = microGPS.value; 
        locationHashmap[microGPS.value.location].microGPS_ID = microGPS.uuid;
        locationHashmap[microGPS.value.location].siteDateGeochem = []
      } else {
        console.error('duplicate location found in microGPS - ' + microGPS.value.location)
      }
    })
    
    /* Issue: duplicate waikolu found in microGPS */

    /* END create a hashmap to detect gps location to nest sitedategeo without using a nested for loop (chaz) */
    
    /* make another query using query handler (Chaz) */
    let cachedQuery = "{'$and': [{'name':{'$in':['TEST_Site_Date_Geochem']}, 'value.location': {'$in':" + JSON.stringify(this.microGPSData.map((item: any) => item.value.location)) +"}}" + this.currentQuery + "] }"

    /* need to implement a method to check cache without interrupting private variables */
    if (this.queryHandler.cache.dataStore[cachedQuery]) { /* fix for preventing duplicate API calls */

      console.log('\n\ncached query hit!\n\n')
      this.metadata2 = [...this.queryHandler.cache.dataStore[cachedQuery].data]

      this.metadata2.map(siteDateGeochem => {
        if (locationHashmap[siteDateGeochem.value.location]) {
          locationHashmap[siteDateGeochem.value.location].siteDateGeochem.push({...siteDateGeochem.value})
        }
      })

      /* clean map to represent the filtered data */
      console.log('does cleaning happen cache???')
      this.microGPSData = this.microGPSData.filter(item => item.value.siteDateGeochem && item.value.siteDateGeochem.length)
      console.log('microGPS cache')

      this.drawMapPoints();
      
    } else {
      let siteDateStream: QueryController = this.queryHandler.siteDateSearch(this.microGPSData.map((item: any) => item.value.location), this.currentQuery);

      siteDateStream.getQueryObserver().subscribe((siteDateData: any) => {
        siteDateData = siteDateData.data;

        if (siteDateData == null) {
          return;
        }

        siteDateData.map((siteDateGeochem: any) => {
          if (locationHashmap[siteDateGeochem.value.location]) {
            siteDateGeochem.value = {...siteDateGeochem.value, ...locationHashmap[siteDateGeochem.value.location]}
            locationHashmap[siteDateGeochem.value.location].siteDateGeochem.push({...siteDateGeochem.value})
          } else {
            console.log("No matching location for " + siteDateGeochem.value.location + " inside siteDateGeochem document")
          }
          this.metadata2.push({...siteDateGeochem})

        })

        /* clean map to represent the filtered data */
        console.log('does cleaning happen??')
        this.microGPSData = this.microGPSData.filter(item => item.value.siteDateGeochem && item.value.siteDateGeochem.length)
        console.log(this.microGPSData, 'this is after it was supposedly filtered, now its supposed to get drawn')

        this.drawMapPoints();
      });

      

    }
  }

  public drawMapPoints() {
        /* END make another query using query handler (Chaz) */

        let indices = Object.keys(this.microGPSData);
        let i: number;
        for(i = 0; i < indices.length; i++) {
          let index = Number(indices[i]);
          let datum = this.microGPSData[index];
        //  if((datum.name=="Water_Quality_Site" && datum.value.resultCount > 0)) || datum._links.associationIds.length > 0){
            this.metadata.push(datum)
            let group = NameGroupMap[datum.name];
            //console.log(datum.value.loc);
            let geod = datum.value.loc;
            //console.log(geod)
            let prop = {};
            prop['uuid'] = datum.uuid
            geod.properties = prop;
            let geojson = L.geoJSON(geod, {
              style: this.getStyleByGroup(group),
              pointToLayer: (feature, latlng) => {
                let icon = this.getIconByGroup(group);
                return  L.circleMarker(latlng, {radius:5,opacity: 1,fillOpacity: 0.9,color:'gray'})
                //return L.marker(latlng, {icon: icon});
              },
              onEachFeature: (feature, layer) => {
              //  let header = L.DomUtil.create("h6")
                let wrapper = L.DomUtil.create("div")
                let details = L.DomUtil.create("div");
                let download = L.DomUtil.create("div")
                let goto = L.DomUtil.create("span", "entry-link");
    
                //details.innerText = JSON.stringify(datum.value);
                //header.innerText=datum.name.replace(/_/g, ' ');
                if(datum.name == "Water_Quality_Site" && datum.value.resultCount > 0){
                  details.innerHTML = "<br/>Name: "+datum.value.name+"<br/>ID: "+datum.value.MonitoringLocationIdentifier+"<br/>Provider: "+datum.value.ProviderName+"<br/>"+datum.value.description+"<br/>Latitude: "+datum.value.latitude+"<br/>Longitude: "+datum.value.longitude+"<br/><a target='_blank' href='"+datum.value.siteUrl+"'>More Details</a>";
    
                  download.innerHTML = "<br/><a class='btn btn-success' href='https://www.waterqualitydata.us/Result/search?siteid="+datum.value.MonitoringLocationIdentifier+"&mimeType=csv&zip=yes&sorted=no' target='_blank' > Download "+datum.value.resultCount+" Measurements</a></br>"
                }
                if(datum.name == "TEST_Micro_GPS"){
                  details.innerHTML = "<br/>Location: "+datum.value.location+"<br/>Watershed: "
                                      +datum.value.watershed+"<br/>Site_Enviro: "+datum.value.site_enviro+
                                      '<br/><i>Click point to view more</i>'
                                      //"<br/>Driller: "+datum.value.driller+"<br/>Year Drilled: "
                                      //+datum.value.yr_drilled+"<br/>Surveyor: "+datum.value.surveyor+
                                      //"<br/>Casing Diameter: "+datum.value.casing_dia+"<br/>Depth: "
                                      //+datum.value.well_depth+"<br/>Latitude: "+datum.value.latitude
                                      //+"<br/>Longitude: "+datum.value.longitude+
                                      //'<br/><button class="btn btn-sm btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#location-modal" onclick="document.getElementById('+"'"+datum.uuid+"'"+').click()">View</button>';
    
                  let j:number;
                  for(j = 0; j < datum._links.associationIds.length; j++) {
                    if(datum._links.associationIds[j].href.indexOf('ikewai-annotated')!== -1){
                    //  download.innerHTML ='<a href="javascript:void(0);" class="btn btn-success" (click)="downloadClick(\''+datum._links.associationIds[j].href+'\')">Download '+datum._links.associationIds[j].href.split('/').slice(-1)[0]+'</a>'
                    }
                  }
                }
                let popup: L.Popup = new L.Popup({autoPan: false});
              //  wrapper.append(header)
                wrapper.append(details);
              //  wrapper.append(download);
              //  wrapper.append(goto);
    
              //  let linkDiv = wrapper.getElementsByClassName("entry-link");
    
                let gotoWrapper = () => {
                  console.log("click");
                  //this.gotoEntry(index);
                }
                //linkDiv[0].addEventListener("click", gotoWrapper);
                popup.setContent(wrapper);
                layer.bindPopup(popup);
    
                layer.on("mouseover", function () {
                    layer.openPopup();
                  });
                layer.on('click',this.markerClick.bind(this));
    
                // function(){ {
                //   openModalDialog(datum);
                //   console.log(this.selectedMetadata);
                //   (function ($) {
                //       $('#location-dialog').modal('show');
                //       //$('#location-dialog').modal('show');
                //     })(jQuery);
                  //document.getElementById('location-modal').style.display = 'block';
                  //$("#location-modal").modal('show');
                //}})
                if(this.dataGroups[group] != undefined) {
                  this.dataGroups[group].addLayer(layer);
                }
              }
    
            });
            this.filterData = this.metadata2;
            this.dtTrigger.next();
        }
  }
  
  public onDrawCreated(e: any) {

    // tslint:disable-next-line:no-console

    console.log("is this getting hit at all?\n\n\n\n")
    this.metadata= [];
    this.metadata2 = [];
    console.log('Draw Created Event!');
    this.drawnItems.clearLayers();
    this.drawnItems.addLayer(e.layer);
    let bounds = e.layer.getBounds();
    this.map.fitBounds(bounds);
    Object.keys(this.dataGroups).forEach((key) => {
      let dataGroup = this.dataGroups[key];
      dataGroup.clearLayers();
    });

    let dataStream: QueryController = this.queryHandler.spatialSearch([e.layer.toGeoJSON()]);
    //this.queryHandler.requestData(this.defaultFilterHandle, 0, MapComponent.DEFAULT_RESULTS).then((data) => console.log(data));
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

    //this.queryHandler.getDataStreamObserver(this.defaultFilterHandle).subscribe((data: IndexMetadataMap) => {

    dataStream.getQueryObserver().subscribe((microGPSData: any) => {
      this.microGPSData = microGPSData.data;
      //data;

      if(this.microGPSData == null) {
        return;
      }	  
      // console.log(data);

      /* create a hashmap to detect gps location to nest sitedategeo without using a nested for loop (chaz) */
      const locationHashmap: Object = {}
      this.microGPSData.map((microGPS: any) => {
        if (!locationHashmap[microGPS.value.location]) {
          locationHashmap[microGPS.value.location] = {...microGPS.value, microGPS_ID: {...microGPS}};
        } else {
          console.error('duplicate location found in microGPS - ' + microGPS.value.location)
        }
      })

      /* Issue: duplicate waikolu found in microGPS */
      /* END create a hashmap to detect gps location to nest sitedategeo without using a nested for loop (chaz) */

      /* make another query using query handler (Chaz) */
      let siteDateStream: QueryController = this.queryHandler.siteDateSearch(this.microGPSData.map((item: any) => item.value.location), this.currentQuery);
      siteDateStream.getQueryObserver().subscribe((siteDateData: any) => {

        siteDateData = siteDateData.data;
        if(siteDateData == null) {
          return;
        }
        siteDateData.map((siteDateGeochem: any) => {
          if (locationHashmap[siteDateGeochem.value.location]) {
            siteDateGeochem.value = {...siteDateGeochem.value, ...locationHashmap[siteDateGeochem.value.location]}
          } else {
            console.log("No matching location for " + siteDateGeochem.value.location + " inside siteDateGeochem document")
          }
          this.metadata2.push({...siteDateGeochem})
        })
      });

      console.log(locationHashmap, 'locationHashmap')
      /* END make another query using query handler (Chaz) */
      let indices = Object.keys(this.microGPSData);
      let i: number;
      for(i = 0; i < indices.length; i++) {
        let index = Number(indices[i]);
        let datum = this.microGPSData[index];
      //  if((datum.name=="Water_Quality_Site" && datum.value.resultCount > 0)) || datum._links.associationIds.length > 0){
          this.metadata.push(datum)
          let group = NameGroupMap[datum.name];
          //console.log(datum.value.loc);
          let geojson = L.geoJSON(datum.value.loc, {
            style: this.getStyleByGroup(group),
            pointToLayer: (feature, latlng) => {
              let icon = this.getIconByGroup(group);
              return L.marker(latlng, {icon: icon});
            },
            onEachFeature: (feature, layer) => {
              let header = L.DomUtil.create("h6")
              let wrapper = L.DomUtil.create("div")
              let details = L.DomUtil.create("div");
              let download = L.DomUtil.create("div")
              let goto = L.DomUtil.create("span", "entry-link");

              //details.innerText = JSON.stringify(datum.value);
              header.innerText=datum.name.replace(/_/g, ' ');
              if(datum.name == "Water_Quality_Site" && datum.value.resultCount > 0){
                details.innerHTML = "<br/>Name: "+datum.value.name+"<br/>ID: "+datum.value.MonitoringLocationIdentifier+"<br/>Provider: "+datum.value.ProviderName+"<br/>"+datum.value.description+"<br/>Latitude: "+datum.value.latitude+"<br/>Longitude: "+datum.value.longitude+"<br/><a target='_blank' href='"+datum.value.siteUrl+"'>More Details</a>";

                download.innerHTML = "<br/><a class='btn btn-success' href='https://www.waterqualitydata.us/Result/search?siteid="+datum.value.MonitoringLocationIdentifier+"&mimeType=csv&zip=yes&sorted=no' target='_blank' > Download "+datum.value.resultCount+" Measurements</a></br>"
              }
              if(datum.name == "TEST_Micro_GPS"){
                console.log(datum, '??')
                details.innerHTML = "<br/>Location: "+datum.value.location+"<br/>Watershed: "
                                    +datum.value.Watershed+"<br/>Latitude: "+datum.value.latitude
                                    +"<br/>Longitude: "+datum.value.longitude+
                                    '<br/><button class="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#location-modal" (click)="openModalSite('+datum+')">View</button>';

                let j:number;
                for(j = 0; j < datum._links.associationIds.length; j++) {
                  if(datum._links.associationIds[j].href.indexOf('ikewai-annotated') !== -1){
                  //  download.innerHTML ='<a href="javascript:void(0);" class="btn btn-success" (click)="downloadClick(\''+datum._links.associationIds[j].href+'\')">Download '+datum._links.associationIds[j].href.split('/').slice(-1)[0]+'</a>'
                  }
                }
              }
              //goto.innerText = "Go to Entry";

              let popup: L.Popup = new L.Popup();
            //  wrapper.append(header)
              wrapper.append(details);
              wrapper.append(download);
              wrapper.append(goto);

              let linkDiv = wrapper.getElementsByClassName("entry-link");

              let gotoWrapper = () => {
                // console.log("click");
                //this.gotoEntry(index);
              }
              linkDiv[0].addEventListener("click", gotoWrapper);
              popup.setContent(wrapper);
              layer.bindPopup(popup);
              if(this.dataGroups[group] != undefined) {
                this.dataGroups[group].addLayer(layer);
                console.log(group)
              }
            }

          });
          this.filterData = this.metadata2;
          //

          //console.log(datum.name);
          // console.log(this.dataGroups[group]);
          //console.log(geojson);

//        }
      }
    });

    // setTimeout(() => {
    //   dataStream.cancel();
    // }, 2000);


  }

  getStyleByGroup(group: string): L.PathOptions {
    let style: L.PathOptions;
    switch(group) {
      case "waterQualitySites": {
        style = {
          "color": "#238B45",
          "weight": 3,
          "opacity": 0.3
        };
        break;
      }
      case "sites": {
        style = {
          "color": "#CB181D",
          "weight": 3,
          "opacity": 0.3
        };
        break;
      }
      case "wells": {
        style = {
          "color": "#2171B5",
          "weight": 3,
          "opacity": 0.3
        };
        break;
      }
      case "MicroGPS": {
        style = {
          "color": "#2171B5",
          "weight": 3,
          "opacity": 0.3
        };
        break;
      }
    }
    return style;
  }

  private getIconByGroup(group: string): L.Icon {
    let icon: L.Icon;
    switch(group) {
      case "waterQualitySites": {
        icon = new L.Icon({
          iconUrl: 'assets/markers/marker-icon-green.png',
          iconRetinaUrl: 'assets/markers/marker-icon-2x-green.png',
          shadowUrl: "assets/marker-shadow.png"
        });
        break;
      }
      case "sites": {
        icon = new L.Icon({
          iconUrl: 'assets/markers/marker-icon-red.png',
          iconRetinaUrl: 'assets/markers/marker-icon-2x-red.png',
          shadowUrl: "assets/marker-shadow.png"
        });
        break;
      }
      case "wells": {
        icon = new L.Icon({
          iconUrl: 'assets/marker-icon.png',
          iconRetinaUrl: 'assets/marker-icon-2x.png',
          //shadowUrl: "assets/marker-shadow.png",
          iconSize:[15,25]
        });
        break;
      }
      case "MicroGPS": {
        icon = new L.Icon({
          iconUrl: 'assets/marker-icon.png',
          iconRetinaUrl: 'assets/marker-icon-2x.png',
          //shadowUrl: "assets/marker-shadow.png",
          iconSize:[15,25]
        });
        break;
      }
    }
    return icon;
  }


    markerClick(e)  {
      console.log("Marker CLICKed")
      console.log(e, 'event')
      let datum = e.sourceTarget.feature.geometry.properties;
      
      document.getElementById('filterField').focus();
      if (!document.getElementById(datum.uuid)) {
      
        // if (document.getElementById('filterField').value) {
        //  document.getElementById('filterField').value = "";
        // }
      
      } else {
        document.getElementById('location-modal').style.display='block';
      }

      if (document.getElementById(datum.uuid)) {
        document.getElementById(datum.uuid).focus();
	    document.getElementById(datum.uuid).click();
      }
    }
	
    openModalSite(site)  {
      // console.log(site, 'site data')
      this.selectedMetadata = site;
      this.openMapZoomed(site); // small map on modal screen
    }
	
	openLinkedPopup(site) {
      //var tempLL = L.latLng([site.value.latitude,site.value.longitude]);
      var tempLL = L.latLng([site.value.latitude,site.value.longitude]);
	    let details = L.DomUtil.create("div");
      if (site.name == "TEST_Site_Date_Geochem") {
        details.innerHTML = "<br/>Name: "+site.value.location+"<br/>Watershed: "
                            +site.value.watershed+"<br/>Site_Enviro: "+site.value.site_enviro+
                            '<br/><i>Click point to view more</i>';
      }
      L.popup()
        .setLatLng(tempLL)
        .setContent(details)
        .openOn(this.map);
	}
    

    openMapZoomed(site) {
      // cache current Lat Lon. when map is ready it will call drawMapZoomedPoint (onMapZoomedReady())
      this.mapZoomedLatLng = L.latLng([site.value.latitude,site.value.longitude]);
      if (this.mapZoomed) {
        // because small map is on the modal screen, map may not be ready yet. only draw circle if map is ready
        this.drawMapZoomedPoint();
      }
    }
    
    drawMapZoomedPoint() {
      // move to the clicked location and draw a circle
      this.mapZoomed.setView(this.mapZoomedLatLng, 12);
      if (this.mapZoomedCircle) {
        // remove previous circle
        this.mapZoomed.removeLayer(this.mapZoomedCircle);
        this.mapZoomedCircle = null;
      }

      let icon = this.getIconByGroup("wells");
      // this.mapZoomedCircle = L.circleMarker(latlng, {radius:5,opacity: 1,fillOpacity: 0.9,color:'gray'})      
      // this.mapZoomedCircle = L.circle(this.mapZoomedLatLng, {fillOpacity: 1, radius: 100}).addTo(this.mapZoomed);
      this.mapZoomedCircle = L.marker(this.mapZoomedLatLng, {icon}).addTo(this.mapZoomed);

      // remove Lat Lon cache
      this.mapZoomedLatLng = null;
    }

    sanitizeLink(fileLink) {
      var tempDiv = document.getElementById('tempDiv');
      // if it's the same link, no need to sanitize
      if (fileLink != tempDiv.innerHTML) {
        // sanitize the given link. from http://shebang.mintern.net/foolproof-html-escaping-in-javascript/
        tempDiv.innerHTML = "";
        tempDiv.appendChild(document.createTextNode(fileLink));
        fileLink = tempDiv.innerHTML;
      }
      
      // test resource URLs:
      // return this.sanitizer.bypassSecurityTrustResourceUrl('https://view.officeapps.live.com/op/embed.aspx?src=http://www.hawaii.edu/elp/library/librarymaster-author-editor.xls');
      // return this.sanitizer.bypassSecurityTrustResourceUrl('/assets/nsf-logo.png');
      
      // to avoid the error that the text is not sanitized
      return this.sanitizer.bypassSecurityTrustResourceUrl(fileLink);
    }
    
    hideModal():void {
      // this interferes with the small map.
      // this.selectedMetadata = null;
      //$("#location-modal").modal('hide');
    }

  gotoEntry(index: number) {
    //event.stopPropagation();
    // this.queryHandler.requestData(this.defaultFilterHandle, index).then((range: [number, number]) => {
    //   //yield control to allow observable to update entry list
    //   setTimeout(() => {
    //     // console.log(index);
    //     // console.log(range);
    //     //determine position of data on page
    //     let entriesArr = this.entries.toArray();
    //     console.log(entriesArr);
    //     let pos = index - range[0];
    //     //remove highlighting from already highlighted entries
    //     let i;
    //     for(i = 0; i < this.highlightEntries.length; i++) {
    //       this.renderer.removeClass(this.highlightEntries[i].nativeElement, "highlight");
    //     }
    //     //reset list of highlighted entries
    //     this.highlightEntries = [];
    //     this.highlightEntries.push(entriesArr[pos]);
    //     //highlight the selected entry
    //     this.renderer.addClass(entriesArr[pos].nativeElement, "highlight");
    //   }, 0);

    // });
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
  Well = "wells",
  TEST_Micro_GPS="MicroGPS"
}

enum GroupLabelMap {
  waterQualitySites = "Water Quality Sites",
  sites = "Sites",
  wells = "Wells",
  TEST_Micro_GPS="MicroGPS"
}
