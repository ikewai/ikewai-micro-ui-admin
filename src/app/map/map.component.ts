import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { User } from '../_models/user';
import { Metadata } from '../_models/metadata';
import { latLng, tileLayer } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { AppConfig } from '../_services/config.service';
import { QueryHandlerService, QueryController } from '../_services/query-handler.service';
import { FilterHandle, FilterManagerService } from '../_services/filter-manager.service';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { FormControl } from '@angular/forms';

import { QueryBuilderConfig } from 'angular2-query-builder';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, AfterViewInit {
  sampleQueryCtrl = new FormControl('');
  microbeQueryCtrl = new FormControl('');
  cfuQueryCtrl = new FormControl('');

  currentSampleQuery: string = '';
  currentMicrobeQuery: string = ''; // state of current microbe query
  currentCFUQuery: string = ''; // state of current CFU query
  currentQPCRQuery: string = ''; // state of the current QPCR query

  currentSampleReadableQuery: string = '';
  currentMicrobeReadableQuery: string = '';
  currentCFUReadableQuery: string = '';
  
  /*** 
   * Loading Variables 
   * 
   * Since data flows down like a waterfall, these loading states
   * reflect whether the user can toggle to the microbes view,
   * cultured bacteria view, and the qPCR bacteria view respectively.
   * 
   * To illustrate my point of view, an example is when the user
   * moves the map view. When the map is moved, findData() is triggered 
   * to find Micro_GPS data. Site_Date data relies on the specific Micro_GPS
   * results that comes back from the database. Likewise, the microbe query
   * depends on Site_Date_Geochem data, and qPCR relies on microbes.
   * 
   * Therefore, the user must wait until parent data is queried in the 
   * waterfall prior to making any state changes within a specific view.
   * 
   * Better approach: A better approach may be to flatten the data in a way
   * where all child data inherently contains it's parent data. In this way,
   * I could query GPS data directly from a child's table. 
   * 
   ***/

  loading: boolean = false;
  globalLoading: boolean = false;
  microbesLoading: boolean = false;
  cfuLoading: boolean = false;
  qpcrLoading: boolean = false;

  currentMicrobeLayer: any = null;
  currentSampleLayer: any = null;
  allAhupuaaData: any = null;
  ahupuaaToggled: boolean = false;
  selectedAhupuaa: any = null;

  focusedFilterRow: any = null;

  cfuFlattenedQueryArr: Array<any> = [];
  microbesFlattenedQueryArr: Array<any> = [];
  samplesFlattenedQueryArr: Array<any> = [];

  filterToDisplayFilterChainCFU: boolean = false;
  filterToDisplayFilterChainMicrobes: boolean = false;
  filterToDisplayFilterChainSamples: boolean = false;

  flagShown: boolean = false;
  gpsStream: any = null;
  siteDateStream: any = null;
  microbeStream: any = null; // state of current microbe query
  cfuStream: any = null; // state of current cfu query
  qpcrStream: any = null; // state of current qpcr query

  /*** 
   * Front-end (map.component.html) States
   * 
   * These variables control what state to show
   * The four possible states are samples,
   * microbes, cfu, and qPCR.
   * 
   ***/

  samplesFilterToggled: boolean = true;
  microbesFilterToggled: boolean = false;
  cfuFilterToggled: boolean = false;
  qpcrFilterToggled: boolean = false;

  showFilterBar: boolean = false;

  /*** 
   * Default filter query states
   * 
   * These variables control what the default
   * state of what the filters look like on
   * initial load. The user will ultimately 
   * control the query states. 
   * 
   * A possible functionality could be to 
   * allow the users to save previous query states.
   * 
   ***/
  
  sampleQuery = {
    condition: 'and',
    rules: [
      { field: 'id', operator: '=', value: 'Sumida.Middle_Spring_43362', type: 'string' },
      // {
      //   condition: 'or',
      //   rules: [
      //     { field: 'season', operator: '=', value: 'WINTER', type: 'string' },
      //     { field: 'season', operator: '=', value: 'SPRING', type: 'string' },
      //     { condition: 'and', rules: [{ field: 'ph', operator: '>', value: '1', type: 'number' }] },
      //   ],
      // },
    ],
  };

  microbeQuery = {
    condition: 'and',
    rules: [{ field: 'sequencing_facility', operator: '=', value: 'UCI', type: 'string' }, {
      condition: 'or',
      rules: [{field: 'lifestyle', operator: '=', value: 'Particle Bound', type: 'string'}, {
        condition: 'or',
        rules: [{field: 'library', operator: '=', value: 1, type: 'number'}, {field: 'library', operator: '=', value: 2, type: 'number'}]
      }]
    }, {field: 'volume_l', operator: '=', value: 0.25, type: 'number'}],
  };

  cfuQuery = {
    condition: 'and',
    rules: [{field: 'cfu_100ml', operator: '>', value: 0, type: 'number'}]
  }

  qpcrQuery = {
    condition: 'and',
    rules: [{field: 'fema_100ml', operator: '>', value: 0, type: 'number'}]
  }

  sampleConfig: QueryBuilderConfig = {
    fields: {
      id: { name: 'Id', type: 'string' },
      location: { name: 'Location', type: 'string' },
      date: { name: 'Date', type: 'date' },
      season: {
        name: 'Season',
        type: 'category',
        options: [
          { name: 'Summer', value: 'SUMMER' },
          { name: 'Fall', value: 'FALL' },
          { name: 'Winter', value: 'WINTER' },
          { name: 'Spring', value: 'SPRING' },
        ],
      },
      watershed: { name: 'Watershed', type: 'string'},
      year: { name: 'Year', type: 'number' },
      time: { name: 'Time', type: 'time' },
      temp_c: { name: 'TEMP_C', type: 'number' },
      do_percent: { name: 'DO_percent', type: 'number' },
      do_mg_l: { name: 'DO_mg_L', type: 'number' },
      spc_us: { name: 'SPC_us', type: 'number' },
      sal_ppt: { name: 'SAL_ppt', type: 'number' },
      ph: { name: 'pH', type: 'number' },
      water_level_cm: { name: 'WATER_LEVEL_cm', type: 'number' },
      turbidity: { name: 'Turbidity', type: 'number' },
      tdn_umol_l: { name: 'TDN_umol.L', type: 'number' },
      tdp_umol_l: { name: 'TDP_umol.L', type: 'number' },
      po4_umol_l: { name: 'PO4_umol.L', type: 'number' },
      si_umol_l: { name: 'Si_umol.L', type: 'number' },
      nox_umol_l: { name: 'NOX_umol.L', type: 'number' },
      nh4_umol_l: { name: 'NH4_umol.L', type: 'number' },
      toc_umol_l: { name: 'TOC_umol.L', type: 'number' },
      cor_tdn_umol_l: { name: 'COR_TDN_umol.L', type: 'number' },
      cor_tdp_umol_l: {name: 'COR_TDP_umol.L', type: 'number'},
      cor_po4_umol_l: {name: 'COR_PO4_umol.L', type: 'number'},
      cor_nox_umol_l: {name: 'COR_NOX_umol.L', type: 'number'},
      cor_nh4_umol_l: {name: 'COR_NH4_umol.L', type: 'number'},
    },
  };

  microbeConfig: QueryBuilderConfig = {
    fields: {
      sequencing_facility: {
        name: 'Sequencing Facility',
        type: 'category',
        options: [
          { name: 'UCI', value: 'UCI' },
          { name: 'HIMB', value: 'HIMB' },
          { name: '0', value: '0' },
        ],
      },
      library: { name: 'Library', type: 'number' },
      date: { name: 'Date', type: 'date' },
      collection_time: { name: 'Collection Time', type: 'time' },
      site: { name: 'Site', type: 'string' },
      id: { name: 'Name', type: 'string' },
      volume_l: { name: 'Volume', type: 'number' },
      lifestyle: {
        name: 'Lifestyle',
        type: 'category',
        options: [
          { name: 'Free Living', value: 'Free_Living' },
          { name: 'Particle Bound', value: 'Particle_Bound' },
          { name: 'Mud', value: 'Mud' },
        ],
      },
      sample_type: {
        name: 'Sample Type',
        type: 'category',
        options: [
          { name: 'Water', value: 'Water' },
          { name: 'Mud', value: 'Mud' },
        ],
      },
      filter_size_um: {
        name: 'Filter Size',
        type: 'category',
        options: [
          { name: '0.2 - Free living organisms', value: '0.2' },
          { name: '0.45 - EPA cutoff for pathogens', value: '0.45' },
          { name: '0.8 - Particle bound organisms', value: '0.8' },
          { name: 'Mud', value: 'Mud' },
        ],
      },
      sample_no: { name: 'Sample No', type: 'string' },
      sample_replicate: { name: 'Sample Replicate', type: 'string' },
    },
  };

  cfuConfig: QueryBuilderConfig = {
    fields: {
      id: { name: 'Id', type: 'string' },
      location: { name: 'Location', type: 'string' },
      agar_type: {
        name: 'agar_type',
        type: 'category',
        options: [
          { name: 'CHROM - Staphylococcus', value: 'CHROM' },
          { name: 'mEI - enterococus', value: 'mEI' },
          { name: 'MI - Eschericia coli>', value: 'MI' },
          { name: 'MI_UV - total coliform', value: 'MI_UV' },
          { name: 'LB - Heterotrophs', value: 'LB' },
        ],
      },
      cfu_100ml: { name: 'cfu_100ml', type: 'number' },
    }
  };

  qpcrConfig: QueryBuilderConfig = {
    fields: {
      sample_no: { name: 'Sample Number', type: 'string' },
      sample_replicate: { name: 'Sample Replicate', type: 'string' },
      target_name: {
        name: 'target name',
        type: 'category',
        options: [
          { name: 'femA', value: 'femA' },
        ],
      },
      fema_100ml: { name: 'femA_100ml', type: 'number' },
      fema_g: { name: 'femA_g', type: 'number' },
      log_fema_100ml: { name: 'log_femA_100ml', type: 'number' },
      log_fema_g: { name: 'log_femA_G', type: 'number' },
    }
  };

  dataGroups: {
    sites: L.FeatureGroup;
    wells: L.FeatureGroup;
    waterQualitySites: L.FeatureGroup;
    MicroGPS: L.FeatureGroup;
    microbes: L.FeatureGroup;
    cfu: L.FeatureGroup;
    qpcr: L.FeatureGroup;
  };

  clearMapLayers() {
    this.dataGroups.MicroGPS.clearLayers();
    this.dataGroups.microbes.clearLayers();
    this.dataGroups.cfu.clearLayers();
    this.dataGroups.qpcr.clearLayers();
  }

  toggleAhupuaa() {
    this.ahupuaaToggled = !this.ahupuaaToggled;
  }

  toggleAhupuaaClosed() {
    this.ahupuaaToggled = false;
  }

  flattenQuery(queryArray: Array<any>, level: number, condition: string, filterTable: string, num: number, resultArr: Array<any>) {
    if (level === 0) resultArr = [];
    for (let i = 0; i < queryArray.length; i++) {
      const querySubject: any = {...queryArray[i]};
      if (querySubject.condition) {
        this.flattenQuery(querySubject.rules, level + 1, querySubject.condition, filterTable, num + 2, resultArr);
      } else {
        querySubject.level = level;
        querySubject.subjectCondition = condition.toUpperCase();
        querySubject.table = filterTable;
        if (resultArr.length) {
          querySubject.index = Math.max(num + i, resultArr[resultArr.length - 1].index + 1);
        } else {
          querySubject.index = num + i;
        }
        resultArr.push(querySubject);
      }
    }
    return resultArr;
  }

  removeSampleFilter(filterTable: any, indexToRemove: number) {

    if (this.filterToDisplayFilterChainSamples) {
      
      if (!this.samplesFilterToggled) {
        this.microbesFilterToggled = false;
        this.samplesFilterToggled = true;
      }

      const button: any = document.getElementsByClassName('q-button q-remove-button')[indexToRemove];
      this.removeSampleElement(indexToRemove);
      button.click();
    } else {
      this.removeSampleElement(indexToRemove);
    }
  }

  removeMicrobeFilter(filterTable: any, indexToRemove: number) {

    if (this.filterToDisplayFilterChainMicrobes) {
      const button: any = document.getElementsByClassName('q-button q-remove-button')[indexToRemove];
      this.removeMicrobeElement(indexToRemove);
      button.click();
    } else {
      this.removeMicrobeElement(indexToRemove);
    }
  }

  removeCFUFilter(filterTable: any, indexToRemove: number) {

    if (this.filterToDisplayFilterChainMicrobes) {
      const button: any = document.getElementsByClassName('q-button q-remove-button')[indexToRemove];
      this.removeMicrobeElement(indexToRemove);
      button.click();
    } else {
      this.removeCFUElement(indexToRemove);
    }
  }

  removeSampleElement(indexToRemove: number) {
    const copy = [...this.samplesFlattenedQueryArr];
    this.samplesFlattenedQueryArr = copy.filter(element => element.index !== indexToRemove);
    for (let i = 0; i < copy.length; i++) {
      if (copy[i].index > indexToRemove) {
        copy[i].index--;
      }
    }
  }

  removeMicrobeElement(indexToRemove: number) {
    const copy = [...this.microbesFlattenedQueryArr];
    this.microbesFlattenedQueryArr = copy.filter(element => element.index !== indexToRemove);
    for (let i = 0; i < copy.length; i++) {
      if (copy[i].index > indexToRemove) {
        copy[i].index--;
      }
    }
  }
  
  removeCFUElement(indexToRemove: number) {
    const copy = [...this.cfuFlattenedQueryArr];
    this.cfuFlattenedQueryArr = copy.filter(element => element.index !== indexToRemove);
    for (let i = 0; i < copy.length; i++) {
      if (copy[i].index > indexToRemove) {
        copy[i].index--;
      }
    }
  }

  highlightRowSamples(e: any, indexToHighlight: number) {
    if (e.stopPropagation) e.stopPropagation();
    if (!this.filterToDisplayFilterChainSamples) return;
    if (!this.samplesFilterToggled) {
      this.microbesFilterToggled = false;
      this.samplesFilterToggled = true;
    }
    
    const lol:any = document.getElementsByClassName('q-row')[indexToHighlight]
    if (lol) {
      this.focusedFilterRow ? this.focusedFilterRow.style.background = 'none' : null;
      this.focusedFilterRow = lol;
      lol.style.background = 'pink';
    }

  }
  
  highlightRowMicrobes(e: any, indexToHighlight: number) {
    if (e.stopPropagation) e.stopPropagation();
    if (!this.filterToDisplayFilterChainMicrobes) return;
    
    const lol:any = document.getElementsByClassName('q-row')[indexToHighlight]
    if (lol) {
      this.focusedFilterRow ? this.focusedFilterRow.style.background = 'none' : null;
      this.focusedFilterRow = lol;
      lol.style.background = 'pink';
    }

  }

  highlightRowCFU(e: any, indexToHighlight: number) {
    if (e.stopPropagation) e.stopPropagation();
    if (!this.filterToDisplayFilterChainCFU) return;
    
    const lol:any = document.getElementsByClassName('q-row')[indexToHighlight]
    if (lol) {
      this.focusedFilterRow ? this.focusedFilterRow.style.background = 'none' : null;
      this.focusedFilterRow = lol;
      lol.style.background = 'pink';
    }

  }

  checkIfChangesWereMade(changes: any, currentState: any) {
    if (!currentState.length) {
      return;
    } else {
      const changesArr: Array<any> = this.flattenQuery(changes.rules, 0, changes.condition, 'microbes', 0, []);
      for (let i = 0; i < changesArr.length; i++) {
        if (changesArr[i].field !== currentState[i].field ||
            changesArr[i].index !== currentState[i].index ||
            changesArr[i].operator !== currentState[i].operator ||
            changesArr[i].subjectCondition !== currentState[i].subjectCondition ||
            changesArr[i].value !== currentState[i].value
          ) {
          changesArr[i].table === 'microbes' ? (this.filterToDisplayFilterChainMicrobes = false) : (this.filterToDisplayFilterChainSamples = false);
          if (this.focusedFilterRow) this.focusedFilterRow.style.background = 'none';
          return this.showAlertFlag();
        }
      }
    }
  }

  showAlertFlag() {
    if (!this.flagShown) {
      document.getElementById('alert').className = 'd-flex justify-content-between alert alert-warning alert-dismissible fade position-sticky show';
    }
  }

  microbeQueryFilterRecursive(query: any, result: Array<any>) {
    let nestedQuery: Array<any> = ['', ''];
    let condition: string = query.condition === 'and' ? " {'$and': [" : " {'$or': [";
    let readableCondition: string = query.condition === 'and' ? ' and ' : ' or ';
    result[0] += condition;
    result[1] += '(';
    for (let i: number = 0; i < query.rules.length; i++) {
      if (query.rules[i].field) {
        let { field, operator, value } = query.rules[i];
        
        let type: string;
        if (field !== 'library' && field !== 'volume_l') {
          type = 'string';
        } else {
          type = 'number';
        }
        
        const statement = this.evaluateOperation(operator, value, type);
        const readable = this.parseReadable(operator, value, type);
        nestedQuery[0] += `{'value.${field}'${statement}}`;
        nestedQuery[1] += `${field} ${readable}`;
        i !== query.rules.length - 1 ? (nestedQuery[0] += ', ') : null;
        i !== query.rules.length - 1 ? (nestedQuery[1] += readableCondition) : null;
      }
      if (query.rules[i].condition) {
        this.microbeQueryFilterRecursive(query.rules[i], nestedQuery);
      }
    }
    result[0] += nestedQuery[0];
    result[0] += ']}';
    result[1] += nestedQuery[1];
    result[1] += ')';
  }

  cfuQueryFilterRecursive(query: any, result: Array<any>) {
    let nestedQuery: Array<any> = ['', ''];
    let condition: string = query.condition === 'and' ? " {'$and': [" : " {'$or': [";
    let readableCondition: string = query.condition === 'and' ? ' and ' : ' or ';
    result[0] += condition;
    result[1] += '(';
    for (let i: number = 0; i < query.rules.length; i++) {
      if (query.rules[i].field) {
        let { field, operator, value } = query.rules[i];
        
        let type: string;
        if (field !== 'cfu_100ml') {
          type = 'string';
        } else {
          type = 'number';
        }
        
        const statement = this.evaluateOperation(operator, value, type);
        const readable = this.parseReadable(operator, value, type);
        nestedQuery[0] += `{'value.${field}'${statement}}`;
        nestedQuery[1] += `${field} ${readable}`;
        i !== query.rules.length - 1 ? (nestedQuery[0] += ', ') : null;
        i !== query.rules.length - 1 ? (nestedQuery[1] += readableCondition) : null;
      }
      if (query.rules[i].condition) {
        this.cfuQueryFilterRecursive(query.rules[i], nestedQuery);
      }
    }
    result[0] += nestedQuery[0];
    result[0] += ']}';
    result[1] += nestedQuery[1];
    result[1] += ')';
  }
  
  toggleFilterBar() {
    if (this.samplesFilterToggled) {
      this.currentSampleQuery !== "" ? this.showFilterBar = true : this.showFilterBar = false;
    }
    if (this.microbesFilterToggled) {
      this.currentSampleQuery !== "" || this.currentMicrobeQuery !== "" ? this.showFilterBar = true : this.showFilterBar = false;
    }
    if (this.cfuFilterToggled) {
      this.currentSampleQuery !== "" || this.currentCFUQuery !== "" ? this.showFilterBar = true : this.showFilterBar = false;
    }
    if (this.qpcrFilterToggled) {
      this.currentSampleQuery !== "" || this.currentMicrobeQuery !== "" || this.currentQPCRQuery !== "" ? this.showFilterBar = true : this.showFilterBar = false;
    }
  }
  
  toggleMicrobes() {
    if (this.microbesLoading) {
      return alert("Still loading microbes. Please try again in a few seconds.");
    }
    this.clearMapLayers();
    
    this.drawMicrobes();
    this.samplesFilterToggled = false;
    this.cfuFilterToggled = false;
    this.qpcrFilterToggled = false;
    this.microbesFilterToggled = true;
    this.toggleFilterBar();
  }

  toggleCFU() {
    if (this.cfuLoading) {
      return alert("Still loading cultured bacteria. Please try again in a few seconds.");
    }
    this.clearMapLayers();
    
    this.drawCFU();
    this.microbesFilterToggled = false;
    this.samplesFilterToggled = false;
    this.qpcrFilterToggled = false;
    this.cfuFilterToggled = true;

    this.toggleFilterBar(); // controls the state of the filters showing
    // ^ dependent on parent state as well
  }

  toggleQPCR() {
    if (this.qpcrLoading) {
      return alert("Still loading qPCR bacteria. Please try again in a few seconds.");
    }
    this.clearMapLayers();
    
    this.drawQPCR();
    this.microbesFilterToggled = false;
    this.samplesFilterToggled = false;
    this.cfuFilterToggled = false;
    this.qpcrFilterToggled = true;

    this.toggleFilterBar(); // controls the state of the filters showing
    // ^ dependent on parent state as well
  }

  toggleSamples() {
    this.clearMapLayers();
    
    this.microGPSData = this.microGPSData.filter(
      (item: any) => item.value.siteDateGeochem && item.value.siteDateGeochem.length
      );
      
      this.drawMapPoints();
      this.microbesFilterToggled = false;
      this.cfuFilterToggled = false;
      this.qpcrFilterToggled = false;
      this.samplesFilterToggled = true;
      this.toggleFilterBar();
    }
    
    sampleQueryFilter() {
      if (this.qpcrLoading) {
      return alert("Still loading qPCR. Please try again in a few seconds.");
    }
    if (!this.sampleQuery.rules.length) {
      this.currentSampleQuery = '';
      this.currentSampleReadableQuery = '';
    } else {
      this.filterToDisplayFilterChainSamples = true;
      this.samplesFlattenedQueryArr = this.flattenQuery(this.sampleQuery.rules, 0, this.sampleQuery.condition, 'samples', 0, this.samplesFlattenedQueryArr);
      this.metadata2 = [];
      
      /* logical 'or' operator */
      let result: Array<any> = ['', ''];
      let condition: string = this.sampleQuery.condition === 'and' ? " {'$and': [" : " {'$or':  [";
      let readableCondition: string =
      this.sampleQuery.condition === 'and'
      ? 'Where all samples meet each criteria: '
      : 'Where all samples meet one of these criteria: ';
      let readableCondition2: string = this.sampleQuery.condition === 'and' ? ' and ' : ' or ';
      result[0] += condition;
      result[1] += readableCondition;
      for (let i: number = 0; i < this.sampleQuery.rules.length; i++) {
        if (this.sampleQuery.rules[i].field) {
          let { field, operator, value } = this.sampleQuery.rules[i];
          
          let type: string;
          if (field !== 'season' && field !== 'date' && field !== 'time' && field !== 'id' && field !== 'location') {
            type = 'number';
          } else {
            type = 'string';
          }
          
          const statement = this.evaluateOperation(operator, value, type);
          const readable = this.parseReadable(operator, value, type);
          result[0] += `{'value.${field}'${statement}}`;
          i <= this.sampleQuery.rules.length - 1 && i !== 0 ? (result[1] += readableCondition2) : null;
          result[1] += `${field} ${readable}`;
          i === 0 ?  (result[1] += readableCondition2) : null;
        }
        const queryObject: any = this.sampleQuery.rules[i];
        if (queryObject.condition) {
          this.sampleQueryFilterRecursive(this.sampleQuery.rules[i], result);
        }
        i !== this.sampleQuery.rules.length - 1 ? (result[0] += ', ') : null;
      }  
      result[0] += ']}';
      this.currentSampleQuery = ', ' + result[0];
      this.currentSampleReadableQuery = result[1];
      
      /* END previous attempt to create a front end filter */
    }
    this.findData();
    this.toggleFilterBar();
  }
  
  microbeQueryFilter() {
    if (this.qpcrLoading) {
      return alert("Still loading qPCR. Please try again in a few seconds.");
    }
    if (!this.microbeQuery.rules.length) {
      this.currentMicrobeQuery = '';
      this.currentMicrobeReadableQuery = '';
    } else {
      this.filterToDisplayFilterChainMicrobes = true;
      this.microbesFlattenedQueryArr = this.flattenQuery(this.microbeQuery.rules, 0, this.microbeQuery.condition, 'microbes', 0, this.microbesFlattenedQueryArr);
      this.microbeMetadata = [];

      /* logical 'or' operator */
      let result: Array<any> = ['', ''];
      let condition: string = this.microbeQuery.condition === 'and' ? " {'$and': [" : " {'$or':  [";
      let readableCondition: string =
        this.microbeQuery.condition === 'and'
          ? 'Where all microbes meet each criteria: '
          : 'Where all microbes meet one of these criteria: ';
      let readableCondition2: string = this.microbeQuery.condition === 'and' ? ' and ' : ' or ';
      result[0] += condition;
      result[1] += readableCondition;
      for (let i: number = 0; i < this.microbeQuery.rules.length; i++) {
        if (this.microbeQuery.rules[i].field) {
          let { field, operator, value } = this.microbeQuery.rules[i];
          let val: any = value;

          let type: string;
          if (field !== 'library' && field !== 'volume_l') {
            type = 'string';
          } else {
            type = 'number';
          }

          const statement = this.evaluateOperation(operator, val, type);
          const readable = this.parseReadable(operator, val, type);
          result[0] += `{'value.${field}'${statement}}`;
          i <= this.microbeQuery.rules.length - 1 && i !== 0 ? (result[1] += readableCondition2) : null;
          result[1] += `${field} ${readable}`;
          i === 0 ?  (result[1] += readableCondition2) : null;
        }
        const queryObject: any = this.microbeQuery.rules[i];
        if (queryObject.condition) {
          this.microbeQueryFilterRecursive(this.microbeQuery.rules[i], result);
        }
          i !== this.microbeQuery.rules.length - 1 ? (result[0] += ', ') : null;
      }  
      result[0] += ']}';
      this.currentMicrobeQuery = ', ' + result[0];
      this.currentMicrobeReadableQuery = result[1];

      /* END previous attempt to create a front end filter */
    }
    this.toggleFilterBar();
    this.findData();
  }

  cfuQueryFilter() {
    if (this.qpcrLoading) {
      return alert("Still loading cultured bacteria. Please try again in a few seconds.");
    }
    if (!this.cfuQuery.rules.length) {
      this.currentCFUQuery = '';
      this.currentCFUReadableQuery = '';
    } else {
      this.filterToDisplayFilterChainCFU = true;
      this.cfuFlattenedQueryArr = this.flattenQuery(this.cfuQuery.rules, 0, this.cfuQuery.condition, 'cfu', 0, this.cfuFlattenedQueryArr);
      this.cfuMetadata = [];

      /* logical 'or' operator */
      let result: Array<any> = ['', ''];
      let condition: string = this.cfuQuery.condition === 'and' ? " {'$and': [" : " {'$or':  [";
      let readableCondition: string =
        this.cfuQuery.condition === 'and'
          ? 'Where all cultured bacteria meet each criteria: '
          : 'Where all cultured bacteria meet one of these criteria: ';
      let readableCondition2: string = this.cfuQuery.condition === 'and' ? ' and ' : ' or ';
      result[0] += condition;
      result[1] += readableCondition;
      for (let i: number = 0; i < this.cfuQuery.rules.length; i++) {
        if (this.cfuQuery.rules[i].field) {
          let { field, operator, value } = this.cfuQuery.rules[i];
          let val: any = value;

          let type: string;
          if (field !== 'cfu_100ml') {
            type = 'string';
          } else {
            type = 'number';
          }

          const statement = this.evaluateOperation(operator, val, type);
          const readable = this.parseReadable(operator, val, type);
          result[0] += `{'value.${field}'${statement}}`;
          i <= this.cfuQuery.rules.length - 1 && i !== 0 ? (result[1] += readableCondition2) : null;
          result[1] += `${field} ${readable}`;
          i === 0 ?  (result[1] += readableCondition2) : null;
        }
        const queryObject: any = this.cfuQuery.rules[i];
        if (queryObject.condition) {
          this.cfuQueryFilterRecursive(this.cfuQuery.rules[i], result);
        }
          i !== this.cfuQuery.rules.length - 1 ? (result[0] += ', ') : null;
      }  
      result[0] += ']}';
      this.currentCFUQuery = ', ' + result[0];
      this.currentCFUReadableQuery = result[1];
      /* END previous attempt to create a front end filter */
    }
    this.toggleFilterBar();
    this.findData();
  }
  
  sampleQueryFilterRecursive(query: any, result: Array<any>) {
    let nestedQuery: Array<any> = ['', ''];
    let condition: string = query.condition === 'and' ? " {'$and': [" : " {'$or': [";
    let readableCondition: string = query.condition === 'and' ? ' and ' : ' or ';
    result[0] += condition;
    result[1] += '(';
    for (let i: number = 0; i < query.rules.length; i++) {
      if (query.rules[i].field) {
        let { field, operator, value } = query.rules[i];

        let type: string;
        if (field !== 'season' && field !== 'date' && field !== 'time' && field !== 'id' && field !== 'location') {
          type = 'number';
        } else {
          type = 'string';
        }

        const statement = this.evaluateOperation(operator, value, type);
        const readable = this.parseReadable(operator, value, type);
        nestedQuery[0] += `{'value.${field}'${statement}}`;
        nestedQuery[1] += `${field} ${readable}`;
        i !== query.rules.length - 1 ? (nestedQuery[0] += ', ') : null;
        i !== query.rules.length - 1 ? (nestedQuery[1] += readableCondition) : null;
      }
      if (query.rules[i].condition) {
        this.sampleQueryFilterRecursive(query.rules[i], nestedQuery);
      }
    }
    result[0] += nestedQuery[0];
    result[0] += ']}';
    result[1] += nestedQuery[1];
    result[1] += ')';
  }

  evaluateOperation(operator: string, value: string, type: string) {
    if (type !== 'number') { /* matches a string in database */
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
          console.error('No such operator exists!');
          break;
      }
    } else { /* equals a number in the database (no quotes around the value) */
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
          console.error('No such operator exists!');
          break;
      }
    }
  }

  resetSampleQuery() {
    this.currentSampleQuery = '';
    this.currentSampleReadableQuery = '';
    this.samplesFlattenedQueryArr = [];
    if (this.focusedFilterRow) this.focusedFilterRow.style.background = 'none';
    this.findData();
    this.toggleFilterBar();
  }

  resetMicrobeQuery() {
    this.currentMicrobeQuery = '';
    this.currentMicrobeReadableQuery = '';
    this.microbesFlattenedQueryArr = [];
    if (this.focusedFilterRow) this.focusedFilterRow.style.background = 'none';
    this.findData();
    this.toggleFilterBar();
  }

  resetCFUQuery() {
    console.log('is this being fired somehow?')
    this.currentCFUQuery = '';
    this.currentCFUReadableQuery = '';
    this.cfuFlattenedQueryArr = [];
    if (this.focusedFilterRow) this.focusedFilterRow.style.background = 'none';
    this.findData();
    this.toggleFilterBar();
  }

  parseReadable(operator: string, value: string, type: string) {
    switch (operator) {
      case '=':
        return `is equal to ${value}`;
      case '>':
        return `is greater than ${value}`;
      case '<':
        return `is less than ${value}`;
      case '>=':
        return `is greater than or equal to ${value}`;
      case '<=':
        return `is less than or equal to ${value}`;
      case '!=':
        return `does not equal ${value}`;
      default:
        console.error('No such operator exists!');
        break;
    }
  }

  dtOptions: DataTables.Settings = {};

  dtTrigger: Subject<any> = new Subject<any>();
  static readonly DEFAULT_RESULTS = 10;

  @ViewChildren('entries') entries: QueryList<ElementRef>;

  highlightEntries: ElementRef[] = [];

  microGPSData: Array<Object>;

  siteDateGeoMap: Object = {}; // Map created from current metadata2/samples state

  microbeMetadata: Metadata[]; // current microbes state
  cfuMetadata: any; // current cfu data state
  qpcrMetadata: any; // current state of qpcr data

  metadata: any; // need to specify type
  metadata2: any; // current samples state

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

  options: L.MapOptions = {
    layers: [
      // tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
      tileLayer('http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}', {
        maxZoom: 18,
        attribution: '...',
      }),
    ],
    zoom: 10,
    center: latLng(21.48, -157.9104),
    attributionControl: false,
    scrollWheelZoom: false,
  };

  optionsZoomed: L.MapOptions = {
    layers: [
      tileLayer('http://www.google.com/maps/vt?lyrs=y@189&gl=en&x={x}&y={y}&z={z}', {
        maxZoom: 18,
        attribution: '...',
      }),
    ],
    zoom: 12,
    center: latLng(21.48, -157.9104),
    attributionControl: false,
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    zoomDelta: 0,
    dragging: false,
  };

  drawnItems: L.FeatureGroup = new L.FeatureGroup();

  drawOptions = {
    position: 'topleft',
    draw: {
      polyline: false,
      circle: false,
      marker: false,
      circlemarker: false,
    },
    edit: {
      featureGroup: this.drawnItems,
    },
  };

  controlOptions = {
    attributionControl: false,
  };

  onMapReady(map: L.Map) {
    this.metadata = [];
    this.map = map;

    let legendControl: L.Control = new L.Control({ position: 'bottomleft' });
    legendControl.onAdd = (map) => {
      let legend = L.DomUtil.create('div', 'legend');
      legend.innerHTML =
        '<div class="grid">' +
        '<div class="bl">Legend</div>' +
        '<div class="ht">Cluster Size</div>' +
        '<div class="s1">2-9</div>' +
        '<div class="s2">10-100</div>' +
        '<div class="s3">100+</div>' +
        '<div class="t1">Wells</div>' +
        '<div class="c1"><div class="color-circle color-1"></div></div>' +
        '<div class="c2"><div class="color-circle color-2"></div></div>' +
        '<div class="c3"><div class="color-circle color-3"></div></div>' +
        '</div>';
      return legend;
    };

    let iconCreateFunction = (group: string): ((cluster: any) => L.DivIcon) => {
      return (cluster: any) => {
        let childCount = cluster.getChildCount();
        let markerClass = 'marker-cluster ';
        let clusterSize = 'marker-cluster-';
        if (childCount < 10) {
          clusterSize += 'small';
        } else if (childCount < 100) {
          clusterSize += 'medium';
        } else {
          clusterSize += 'large';
        }
        markerClass += clusterSize + '-' + group;

        return new L.DivIcon({
          html: '<div><span>' + childCount + '</span></div>',
          className: markerClass,
          iconSize: new L.Point(40, 40),
        });
      };
    };

    this.dataGroups = {
      sites: L.markerClusterGroup({ iconCreateFunction: iconCreateFunction('sites'), disableClusteringAtZoom: 4 }),
      MicroGPS: L.markerClusterGroup({
        iconCreateFunction: iconCreateFunction('MicroGPS'),
        disableClusteringAtZoom: 4,
      }),
      microbes: L.markerClusterGroup({
        iconCreateFunction: iconCreateFunction('Microbes'),
        disableClusteringAtZoom: 4,
      }),
      cfu: L.markerClusterGroup({
        iconCreateFunction: iconCreateFunction('CFU'),
        disableClusteringAtZoom: 4,
      }),
      qpcr: L.markerClusterGroup({
        iconCreateFunction: iconCreateFunction('qPCR'),
        disableClusteringAtZoom: 4,
      }),
      wells: L.markerClusterGroup({ iconCreateFunction: iconCreateFunction('wells'), disableClusteringAtZoom: 12 }),
      waterQualitySites: L.markerClusterGroup({ iconCreateFunction: iconCreateFunction('waterQualitySites') }),
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
  }

  onMapZoomedReady(mapZoomed: L.Map) {
    // small map for modal screen
    this.mapZoomed = mapZoomed;
    if (this.mapZoomedLatLng) {
      // if Lat Lon is cached, then the map hasn't been drawn for the clicked on location
      this.drawMapZoomedPoint();
    }
  }

  constructor(
    private renderer: Renderer2,
    private queryHandler: QueryHandlerService,
    private filters: FilterManagerService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    //currentUser: localStorage.getItem('currentUser');
  }

  downloadClick(metadatum_href) {
    let downloadString = metadatum_href.replace('media', 'download/public');
    // console.log(downloadString)
    window.open(downloadString, '_blank');
  }

  createPostit(file_url): Observable<any> {
    let url =
      AppConfig.settings.aad.tenant + '/postits/v2/?url=' + encodeURI(file_url) + '&method=GET&lifetime=600&maxUses=1';
    let head = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    let bodyString = JSON.stringify({});
    let params: HttpParams = new HttpParams().append('method', 'POST');
    let options = {
      headers: head,
      observe: <any>'response',
      //params: params
    };
    // console.log(url);

    return this.http.post<any>(url, {}, options).pipe(map((response: any) => response));
  }

  tableSearch(term: string) {
    if (!term) {
      this.filterData = this.metadata2;
    } else {
      this.filterData = this.metadata2.filter((x) => {
        for (var obj in x.value) {
          if (x.value[obj] != null) {
            if (typeof x.value[obj] == 'string') {
              if (x.value[obj].trim().toLowerCase().includes(term.trim().toLowerCase())) {
                return true;
              }
            }
          }
        }
      });
      this.dtTrigger.next();
    }
  }

  ngAfterViewInit() {
    let ahupuaaData: any = this.queryHandler.ahupuaaSearch();
    ahupuaaData.getQueryObserver().subscribe((ahupuaaData: any) => {
      this.allAhupuaaData = ahupuaaData.data;
    });
    this.findData();
  }

  ngOnInit() {
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 2,
    };
    //should change this to get observable from filter manager
    //this.queryHandler.initFilterListener(this.filters.filterMonitor);
    this.defaultFilterHandle = this.filters.registerFilter();

    this.cfuQueryCtrl.valueChanges.subscribe(selectedValue => this.checkIfChangesWereMade(selectedValue, this.cfuFlattenedQueryArr))
    this.microbeQueryCtrl.valueChanges.subscribe(selectedValue => this.checkIfChangesWereMade(selectedValue, this.microbesFlattenedQueryArr))
    this.sampleQueryCtrl.valueChanges.subscribe(selectedValue => this.checkIfChangesWereMade(selectedValue, this.samplesFlattenedQueryArr))

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

  public onMove(e: any) {
    this.findData();
  }

  public findData() {
    /* cancel any previous queries */
    // this.gpsStream && this.gpsStream.cancel();
    // this.siteDateStream && this.siteDateStream.cancel();
    // this.microbeStream && this.microbeStream.cancel();
    /* cancel any previous queries END (see microbes line 705) */

    /* clear map layers */
    this.clearMapLayers();

    this.globalLoading = true;
    this.microbesLoading = true;
    this.cfuLoading = true;
    this.qpcrLoading = true;

    this.metadata = [];
    this.metadata2 = [];
    this.filterData = [];
    this.microGPSData = [];
    this.siteDateGeoMap = {};
    this.loading = true;

    let bounds = this.map.getBounds(); //  e.layer.getBounds();
    let box = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [bounds.getSouthWest().lng, bounds.getNorthEast().lat],
            [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
            [bounds.getNorthEast().lng, bounds.getSouthWest().lat],
            [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
            [bounds.getSouthWest().lng, bounds.getNorthEast().lat],
          ],
        ],
      },
    };
    let customCircleMarker = L.CircleMarker.extend({
      options: {
        datum: {},
      },
    });

    let customMarker = L.Marker.extend({
      options: {
        datum: {},
      },
    });

    Object.keys(this.dataGroups).forEach((key) => {
      let dataGroup = this.dataGroups[key];
      dataGroup.clearLayers();
    });

    let dataStream: any = this.queryHandler.spatialSearch([box]);

    if (dataStream.data) {
      this.microGPSData = [...dataStream.data];

      this.querySiteDateGeo();
    } else {
      this.gpsStream = dataStream;
      dataStream.getQueryObserver().subscribe((microGPSData: any) => {
        this.microGPSData = microGPSData.data;
        if (this.microGPSData == null) {
          return;
        }

        this.querySiteDateGeo();
      });
    }
  }

  public querySiteDateGeo() {
    /* create a hashmap to detect gps location to nest sitedategeo without using a nested for loop (chaz) */
    const locationHashmap: any = {};
    const watershedHashmap: any = {};
    this.microGPSData.map((microGPS: any) => {
      if (!locationHashmap[microGPS.value.location]) {
        locationHashmap[microGPS.value.location] = microGPS.value;
        locationHashmap[microGPS.value.location].microGPS_ID = microGPS.uuid;
        locationHashmap[microGPS.value.location].siteDateGeochem = [];
      } else {
        console.error('duplicate location found in microGPS - ' + microGPS.value.location);
      }
    });

    /* Issue: duplicate waikolu found in microGPS */

    /* END create a hashmap to detect gps location to nest sitedategeo without using a nested for loop (chaz) */

    let siteDateStream: any = this.queryHandler.siteDateSearch(
      this.microGPSData.map((item: any) => item.value.location),
      this.currentSampleQuery
    );

    if (siteDateStream.data) {
      /* fix for preventing duplicate API calls */

      this.metadata2 = [...siteDateStream.data];

      this.metadata2.map((siteDateGeochem) => {
        if (locationHashmap[siteDateGeochem.value.location]) {
          locationHashmap[siteDateGeochem.value.location].siteDateGeochem.push({ ...siteDateGeochem.value });
        }
      });

      /* clean map to represent the filtered data */
      this.microGPSData = this.microGPSData.filter(
        (item: any) => item.value.siteDateGeochem && item.value.siteDateGeochem.length
      );

      if (this.samplesFilterToggled) { /* only draw points if it's necessary */
        this.drawMapPoints();
      }

      this.queryMicrobes();
      this.queryCFU();
    } else {
      this.siteDateStream = siteDateStream;
      siteDateStream.getQueryObserver().subscribe((siteDateData: any) => {
        const asyncStatus: any = siteDateData.status;
        siteDateData = siteDateData.data;

        if (siteDateData == null) {
          return;
        }

        siteDateData.map((siteDateGeochem: any) => {
          if (locationHashmap[siteDateGeochem.value.location]) {
            siteDateGeochem.value = { ...siteDateGeochem.value, ...locationHashmap[siteDateGeochem.value.location] };
            locationHashmap[siteDateGeochem.value.location].siteDateGeochem.push({ ...siteDateGeochem.value });
          } else {
            console.log(
              'No matching location for ' + siteDateGeochem.value.location + ' inside siteDateGeochem document'
            );
          }
          this.metadata2.push({ ...siteDateGeochem });
        });

        if (asyncStatus.finished) {

          this.microGPSData = this.microGPSData.filter(
            (item: any) => item.value.siteDateGeochem && item.value.siteDateGeochem.length
          );

          if (this.samplesFilterToggled) {
            /* clean map to represent the filtered data */
            this.drawMapPoints();
          }

          this.queryMicrobes();
          this.queryCFU();
        }
      });
    }
  }

  public queryMicrobes() {
    /* create a hashmap to detect id to nest microbes without using a nested for loop (chaz) */
    this.metadata2.map((siteDateGeo: any) => {
      if (!this.siteDateGeoMap[siteDateGeo.value.id]) {
        this.siteDateGeoMap[siteDateGeo.value.id] = siteDateGeo.value;
        this.siteDateGeoMap[siteDateGeo.value.id].microbes = [];
        this.siteDateGeoMap[siteDateGeo.value.id].cfu = []; // create cfu array for upcoming cfu query
      } else {
        console.error('duplicate ID found in siteDateGeochem - ' + siteDateGeo.value.id);
      }
    });

    this.microbeMetadata = [];

    let microbeStream: any = this.queryHandler.microbeSearch(this.metadata2.map((item: any) => item.value.id), this.currentMicrobeQuery);

    if (microbeStream.data) {
      /* look for a better to fix this within query handler */

      this.microbeMetadata = [...microbeStream.data];

      if (this.microbesFilterToggled) {    
        this.drawMicrobes();
      }
      
      this.microbesLoading = false;
      this.queryQPCR();

    } else {
      this.microbeStream = microbeStream;
      microbeStream.getQueryObserver().subscribe((microbeData: any) => {
        const asyncStatus: any = microbeData.status;
        microbeData = microbeData.data;

        if (microbeData == null) {
          return;
        }

        microbeData.map((microbes: any) => {
          if (this.siteDateGeoMap[microbes.value.id]) {
            microbes.value = { ...microbes.value, ...this.siteDateGeoMap[microbes.value.id] };
            this.siteDateGeoMap[microbes.value.id].microbes.push({ ...microbes.value });
          } else {
            console.log('No matching Site_Date_Geochem for ' + microbes.value.id + ' inside Microbes document');
          }

          this.microbeMetadata.push({ ...microbes });
        });


        if (asyncStatus.finished) { 
          /* I tried to cancel data that is being fetched when a new
           * findData() instance is called, however, when I cancel, this causes incomplete 
           * data to be cached. Because of race conditions with UI loading and the query component,
           * I have opted to use a simple UI blocker in the meantime
           */

          // this.globalLoading = false;
          this.microbesLoading = false;

          if (this.microbesFilterToggled) {
        
            this.drawMicrobes();
          }
          this.queryQPCR();
        }
      });
    }
  }

  public drawMicrobes() {
    /* END make another query using query handler (Chaz) */

    let indices = Object.keys(this.microbeMetadata);
    let i: number;
    for (i = 0; i < indices.length; i++) {
      let index = Number(indices[i]);
      let datum: any = this.microbeMetadata[index]; // need to specify type
      //  if((datum.name=="Water_Quality_Site" && datum.value.resultCount > 0)) || datum._links.associationIds.length > 0){
      this.metadata.push(datum);
      let group = NameGroupMap[datum.name];
      //console.log(datum.value.loc);
      let geod = datum.value.loc;
      //console.log(geod)
      let prop = {};
      prop['uuid'] = datum.uuid;
      geod.properties = prop;
      let geojson = L.geoJSON(geod, {
        style: this.getStyleByGroup(group),
        pointToLayer: (feature, latlng) => {
          let icon = this.getIconByGroup(group);
          return L.circleMarker(latlng, { radius: 5, opacity: 1, fillOpacity: 0.9, color: 'pink' });
          //return L.marker(latlng, {icon: icon});
        },
        onEachFeature: (feature, layer) => {
          //  let header = L.DomUtil.create("h6")
          let wrapper = L.DomUtil.create('div');
          let details = L.DomUtil.create('div');
          let download = L.DomUtil.create('div');
          let goto = L.DomUtil.create('span', 'entry-link');

          //details.innerText = JSON.stringify(datum.value);
          //header.innerText=datum.name.replace(/_/g, ' ');
          if (datum.name == 'Water_Quality_Site' && datum.value.resultCount > 0) {
            details.innerHTML =
              '<br/>Name: ' +
              datum.value.name +
              '<br/>ID: ' +
              datum.value.MonitoringLocationIdentifier +
              '<br/>Provider: ' +
              datum.value.ProviderName +
              '<br/>' +
              datum.value.description +
              '<br/>Latitude: ' +
              datum.value.latitude +
              '<br/>Longitude: ' +
              datum.value.longitude +
              "<br/><a target='_blank' href='" +
              datum.value.siteUrl +
              "'>More Details</a>";

            download.innerHTML =
              "<br/><a class='btn btn-success' href='https://www.waterqualitydata.us/Result/search?siteid=" +
              datum.value.MonitoringLocationIdentifier +
              "&mimeType=csv&zip=yes&sorted=no' target='_blank' > Download " +
              datum.value.resultCount +
              ' Measurements</a></br>';
          }
          if (datum.name == 'TEST_Microbes') {
            details.innerHTML =
              '<br/>Location: ' +
              datum.value.location +
              '<br/>Watershed: ' +
              datum.value.watershed +
              '<br/>Site_Enviro: ' +
              datum.value.site_enviro;
            //"<br/>Driller: "+datum.value.driller+"<br/>Year Drilled: "
            //+datum.value.yr_drilled+"<br/>Surveyor: "+datum.value.surveyor+
            //"<br/>Casing Diameter: "+datum.value.casing_dia+"<br/>Depth: "
            //+datum.value.well_depth+"<br/>Latitude: "+datum.value.latitude
            //+"<br/>Longitude: "+datum.value.longitude+
            //'<br/><button class="btn btn-sm btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#location-modal" onclick="document.getElementById('+"'"+datum.uuid+"'"+').click()">View</button>';

            let j: number;
            for (j = 0; j < datum._links.associationIds.length; j++) {
              if (datum._links.associationIds[j].href.indexOf('ikewai-annotated') !== -1) {
                //  download.innerHTML ='<a href="javascript:void(0);" class="btn btn-success" (click)="downloadClick(\''+datum._links.associationIds[j].href+'\')">Download '+datum._links.associationIds[j].href.split('/').slice(-1)[0]+'</a>'
              }
            }
          }
          let popup: L.Popup = new L.Popup({ autoPan: false });
          //  wrapper.append(header)
          wrapper.append(details);
          //  wrapper.append(download);
          //  wrapper.append(goto);

          //  let linkDiv = wrapper.getElementsByClassName("entry-link");

          let gotoWrapper = () => {
            console.log('click');
          };
          //linkDiv[0].addEventListener("click", gotoWrapper);
          popup.setContent(wrapper);
          layer.bindPopup(popup);

          layer.on('mouseover', function () {
            layer.openPopup();
          });
          layer.on('click', this.markerClick.bind(this));

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
          if (this.dataGroups[group] != undefined) {
            this.currentMicrobeLayer = layer;
            this.dataGroups[group].addLayer(layer);
          }
        },
      });
      this.filterData = this.metadata2;
      this.dtTrigger.next();
    }
    this.loading = false;
    this.globalLoading = false;
  }

  public queryCFU() {
    
    this.cfuMetadata = [];
    let cfuStream: any = this.queryHandler.cfuSearch(this.metadata2.map((item: any) => item.value.id), this.currentCFUQuery);

    if (cfuStream.data) {
      this.cfuMetadata = [...cfuStream.data];

      if (this.cfuFilterToggled) {    
        this.drawCFU(); /* draw cfu points  - should be able to reuse function */
      }
      
      this.cfuLoading = false;
    } else {
      this.cfuStream = cfuStream;
      cfuStream.getQueryObserver().subscribe((cfuData: any) => {
        const asyncStatus: any = cfuData.status;
        cfuData = cfuData.data;

        if (cfuData == null) {
          return;
        }

        cfuData.map((cfu: any) => {
          if (this.siteDateGeoMap[cfu.value.id]) {
            cfu.value = { ...cfu.value, ...this.siteDateGeoMap[cfu.value.id] };
            this.siteDateGeoMap[cfu.value.id].cfu.push({ ...cfu.value });
          } else {
            //console.log('No matching Site_Date_Geochem for ' + cfu.value.id + ' inside CFU document');
          }

          this.cfuMetadata.push({ ...cfu });
        });


        if (asyncStatus.finished) { 
          this.cfuLoading = false;

          if (this.cfuFilterToggled) {
        
            this.drawCFU();
          }
        }
      });
    }
  }

  public queryQPCR() {
    this.qpcrMetadata = [];

    const microbesMap = {};

    this.microbeMetadata.map((microbe: any) => {
      if (!(microbe.value.sample_replicate in microbesMap)) {
        microbesMap[microbe.value.sample_replicate] = microbe.value;
        microbesMap[microbe.value.sample_replicate].qpcr = [];
      } else {
        // duplicate found - currently disabled to not flood console:
        // console.error('duplicate ID found in microbe - ' + microbe.value.id);
      }
    });

    let qpcrStream: any = this.queryHandler.qpcrSearch(this.microbeMetadata.map((item: any) => item.value.sample_replicate), this.currentQPCRQuery);
    if (qpcrStream.length) {
      const newMap = []
      qpcrStream.map((item:any) => item.data.map((qpcrItem: any) => newMap.push(qpcrItem)))
      this.qpcrMetadata = newMap;

      if (this.qpcrFilterToggled) {    
        this.drawQPCR(); /* draw qcpr points  - should be able to reuse function */
      }

    } else {
      this.qpcrStream = qpcrStream;
      qpcrStream.getQueryObserver().subscribe((qcprData: any) => {
        const asyncStatus: any = qcprData.status;
        qcprData = qcprData.data;

        if (qcprData == null) {
          return;
        }

        qcprData.map((qcpr: any) => {
          if (microbesMap[qcpr.value.sample_replicate]) {
            qcpr.value = { ...qcpr.value, ...microbesMap[qcpr.value.sample_replicate] };
            // microbesMap[qcpr.value.sample_replicate].qcpr.push({ ...qcpr.value }); // undefined issue
          } else {
            //console.log('No matching microbe for ' + qcpr.value.sample_replicate + ' inside qcpr document');
          }
          this.qpcrMetadata.push({ ...qcpr });
        });

        if (asyncStatus.finished) {
           
          console.log(this.qpcrMetadata, 'wait am i getting anything?')

          if (this.qpcrFilterToggled) {
        
            this.drawQPCR();
          }
        }
      });
    }
    this.qpcrLoading = false;
  }

  public drawCFU() {
    let indices = Object.keys(this.cfuMetadata);
    let i: number;
    for (i = 0; i < indices.length; i++) {
      let index = Number(indices[i]);
      let datum: any = this.cfuMetadata[index];
      this.metadata.push(datum);
      let group = NameGroupMap[datum.name];
      //console.log(datum.value.loc);
      let geod = datum.value.loc;
      //console.log(geod)
      let prop = {};
      prop['uuid'] = datum.uuid;
      geod.properties = prop;
      let geojson = L.geoJSON(geod, {
        style: this.getStyleByGroup(group),
        pointToLayer: (feature, latlng) => {
          let icon = this.getIconByGroup(group);
          return L.circleMarker(latlng, { radius: 5, opacity: 1, fillOpacity: 0.9, color: 'purple' });
          //return L.marker(latlng, {icon: icon});
        },
        onEachFeature: (feature, layer) => {
          //  let header = L.DomUtil.create("h6")
          let wrapper = L.DomUtil.create('div');
          let details = L.DomUtil.create('div');
          let download = L.DomUtil.create('div');
          let goto = L.DomUtil.create('span', 'entry-link');

          if (datum.name == 'TEST_CFU') {
            details.innerHTML =
              '<br/>Location: ' +
              datum.value.location +
              '<br/>Watershed: ' +
              datum.value.watershed +
              '<br/>Site_Enviro: ' +
              datum.value.site_enviro;
          }

          let popup: L.Popup = new L.Popup({ autoPan: false });
          wrapper.append(details);

          popup.setContent(wrapper);
          layer.bindPopup(popup);

          layer.on('mouseover', function () {
            layer.openPopup();
          });
          layer.on('click', this.markerClick.bind(this));

          if (this.dataGroups[group] != undefined) {
            this.currentMicrobeLayer = layer;
            this.dataGroups[group].addLayer(layer);
          }
        },
      });
      this.filterData = this.metadata2;
      this.dtTrigger.next();
    }
    this.loading = false;
    this.globalLoading = false;
  }

  public drawQPCR() {
    let indices = Object.keys(this.qpcrMetadata);
    let i: number;
    for (i = 0; i < indices.length; i++) {
      let index = Number(indices[i]);
      let datum: any = this.qpcrMetadata[index];
      this.metadata.push(datum);
      let group = NameGroupMap[datum.name];
      let geod = datum.value.loc;
      let prop = {};
      prop['uuid'] = datum.uuid;
      geod.properties = prop;
      let geojson = L.geoJSON(geod, {
        style: this.getStyleByGroup(group),
        pointToLayer: (feature, latlng) => {
          let icon = this.getIconByGroup(group);
          return L.circleMarker(latlng, { radius: 5, opacity: 1, fillOpacity: 0.9, color: 'purple' });
          //return L.marker(latlng, {icon: icon});
        },
        onEachFeature: (feature, layer) => {
          //  let header = L.DomUtil.create("h6")
          let wrapper = L.DomUtil.create('div');
          let details = L.DomUtil.create('div');
          let download = L.DomUtil.create('div');
          let goto = L.DomUtil.create('span', 'entry-link');

          if (datum.name == 'TEST_Fem_A') {
            details.innerHTML =
              '<br/>Location: ' +
              datum.value.location +
              '<br/>Watershed: ' +
              datum.value.watershed +
              '<br/>Site_Enviro: ' +
              datum.value.site_enviro;
          }

          let popup: L.Popup = new L.Popup({ autoPan: false });
          wrapper.append(details);

          popup.setContent(wrapper);
          layer.bindPopup(popup);

          layer.on('mouseover', function () {
            layer.openPopup();
          });
          layer.on('click', this.markerClick.bind(this));

          if (this.dataGroups[group] != undefined) {
            this.currentMicrobeLayer = layer;
            this.dataGroups[group].addLayer(layer);
          }
        },
      });
      this.filterData = this.metadata2;
      this.dtTrigger.next();
    }
    this.loading = false;
    this.globalLoading = false;
  }

  public drawMapPoints() {
    /* END make another query using query handler (Chaz) */

    let indices = Object.keys(this.microGPSData);
    let i: number;
    for (i = 0; i < indices.length; i++) {
      let index = Number(indices[i]);
      let datum: any = this.microGPSData[index]; // need to specify type
      //  if((datum.name=="Water_Quality_Site" && datum.value.resultCount > 0)) || datum._links.associationIds.length > 0){
      this.metadata.push(datum);
      let group = NameGroupMap[datum.name];
      //console.log(datum.value.loc);
      let geod = datum.value.loc;
      //console.log(geod)
      let prop = {};
      prop['uuid'] = datum.uuid;
      geod.properties = prop;
      let geojson = L.geoJSON(geod, {
        style: this.getStyleByGroup(group),
        pointToLayer: (feature, latlng) => {
          let icon = this.getIconByGroup(group);
          return L.circleMarker(latlng, { radius: 5, opacity: 1, fillOpacity: 0.9, color: 'gray' });
          //return L.marker(latlng, {icon: icon});
        },
        onEachFeature: (feature, layer) => {
          //  let header = L.DomUtil.create("h6")
          let wrapper = L.DomUtil.create('div');
          let details = L.DomUtil.create('div');
          let download = L.DomUtil.create('div');
          let goto = L.DomUtil.create('span', 'entry-link');

          //details.innerText = JSON.stringify(datum.value);
          //header.innerText=datum.name.replace(/_/g, ' ');
          if (datum.name == 'Water_Quality_Site' && datum.value.resultCount > 0) {
            details.innerHTML =
              '<br/>Name: ' +
              datum.value.name +
              '<br/>ID: ' +
              datum.value.MonitoringLocationIdentifier +
              '<br/>Provider: ' +
              datum.value.ProviderName +
              '<br/>' +
              datum.value.description +
              '<br/>Latitude: ' +
              datum.value.latitude +
              '<br/>Longitude: ' +
              datum.value.longitude +
              "<br/><a target='_blank' href='" +
              datum.value.siteUrl +
              "'>More Details</a>";

            download.innerHTML =
              "<br/><a class='btn btn-success' href='https://www.waterqualitydata.us/Result/search?siteid=" +
              datum.value.MonitoringLocationIdentifier +
              "&mimeType=csv&zip=yes&sorted=no' target='_blank' > Download " +
              datum.value.resultCount +
              ' Measurements</a></br>';
          }
          if (datum.name == 'TEST_Micro_GPS') {
            details.innerHTML =
              '<br/>Location: ' +
              datum.value.location +
              '<br/>Watershed: ' +
              datum.value.watershed +
              '<br/>Site_Enviro: ' +
              datum.value.site_enviro;
            //"<br/>Driller: "+datum.value.driller+"<br/>Year Drilled: "
            //+datum.value.yr_drilled+"<br/>Surveyor: "+datum.value.surveyor+
            //"<br/>Casing Diameter: "+datum.value.casing_dia+"<br/>Depth: "
            //+datum.value.well_depth+"<br/>Latitude: "+datum.value.latitude
            //+"<br/>Longitude: "+datum.value.longitude+
            //'<br/><button class="btn btn-sm btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#location-modal" onclick="document.getElementById('+"'"+datum.uuid+"'"+').click()">View</button>';

            let j: number;
            for (j = 0; j < datum._links.associationIds.length; j++) {
              if (datum._links.associationIds[j].href.indexOf('ikewai-annotated') !== -1) {
                //  download.innerHTML ='<a href="javascript:void(0);" class="btn btn-success" (click)="downloadClick(\''+datum._links.associationIds[j].href+'\')">Download '+datum._links.associationIds[j].href.split('/').slice(-1)[0]+'</a>'
              }
            }
          }
          let popup: L.Popup = new L.Popup({ autoPan: false });
          //  wrapper.append(header)
          wrapper.append(details);
          //  wrapper.append(download);
          //  wrapper.append(goto);

          //  let linkDiv = wrapper.getElementsByClassName("entry-link");

          //linkDiv[0].addEventListener("click", gotoWrapper);
          popup.setContent(wrapper);
          layer.bindPopup(popup);

          layer.on('mouseover', function () {
            layer.openPopup();
          });
          layer.on('click', this.markerClick.bind(this));

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
          if (this.dataGroups[group] != undefined) {
            this.currentSampleLayer = layer;
            this.dataGroups[group].addLayer(layer);
          }
        },
      });
      this.filterData = this.metadata2; // contains state of water samples in UI
      this.dtTrigger.next();
    }
    this.loading = false;
    this.globalLoading = false;
  }

  public onDrawCreated(e: any) {
    // tslint:disable-next-line:no-console

    console.log('is this getting hit at all?\n\n\n\n');
    this.metadata = [];
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

      if (this.microGPSData == null) {
        return;
      }
      // console.log(data);

      /* create a hashmap to detect gps location to nest sitedategeo without using a nested for loop (chaz) */
      const locationHashmap: Object = {};
      this.microGPSData.map((microGPS: any) => {
        if (!locationHashmap[microGPS.value.location]) {
          locationHashmap[microGPS.value.location] = { ...microGPS.value, microGPS_ID: { ...microGPS } };
        } else {
          console.error('duplicate location found in microGPS - ' + microGPS.value.location);
        }
      });

      /* Issue: duplicate waikolu found in microGPS */
      /* END create a hashmap to detect gps location to nest sitedategeo without using a nested for loop (chaz) */

      /* make another query using query handler (Chaz) */
      let siteDateStream: QueryController = this.queryHandler.siteDateSearch(
        this.microGPSData.map((item: any) => item.value.location),
        this.currentSampleQuery
      );
      siteDateStream.getQueryObserver().subscribe((siteDateData: any) => {
        siteDateData = siteDateData.data;
        if (siteDateData == null) {
          return;
        }
        siteDateData.map((siteDateGeochem: any) => {
          if (locationHashmap[siteDateGeochem.value.location]) {
            siteDateGeochem.value = { ...siteDateGeochem.value, ...locationHashmap[siteDateGeochem.value.location] };
          } else {
            console.log(
              'No matching location for ' + siteDateGeochem.value.location + ' inside siteDateGeochem document'
            );
          }
          this.metadata2.push({ ...siteDateGeochem });
        });
      });

      /* END make another query using query handler (Chaz) */
      let indices = Object.keys(this.microGPSData);
      let i: number;
      for (i = 0; i < indices.length; i++) {
        let index = Number(indices[i]);
        let datum: any = this.microGPSData[index]; // need to specify type
        //  if((datum.name=="Water_Quality_Site" && datum.value.resultCount > 0)) || datum._links.associationIds.length > 0){
        this.metadata.push(datum);
        let group = NameGroupMap[datum.name];
        //console.log(datum.value.loc);
        let geojson = L.geoJSON(datum.value.loc, {
          style: this.getStyleByGroup(group),
          pointToLayer: (feature, latlng) => {
            let icon = this.getIconByGroup(group);
            return L.marker(latlng, { icon: icon });
          },
          onEachFeature: (feature, layer) => {
            let header = L.DomUtil.create('h6');
            let wrapper = L.DomUtil.create('div');
            let details = L.DomUtil.create('div');
            let download = L.DomUtil.create('div');
            let goto = L.DomUtil.create('span', 'entry-link');

            //details.innerText = JSON.stringify(datum.value);
            header.innerText = datum.name.replace(/_/g, ' ');
            if (datum.name == 'Water_Quality_Site' && datum.value.resultCount > 0) {
              details.innerHTML =
                '<br/>Name: ' +
                datum.value.name +
                '<br/>ID: ' +
                datum.value.MonitoringLocationIdentifier +
                '<br/>Provider: ' +
                datum.value.ProviderName +
                '<br/>' +
                datum.value.description +
                '<br/>Latitude: ' +
                datum.value.latitude +
                '<br/>Longitude: ' +
                datum.value.longitude +
                "<br/><a target='_blank' href='" +
                datum.value.siteUrl +
                "'>More Details</a>";

              download.innerHTML =
                "<br/><a class='btn btn-success' href='https://www.waterqualitydata.us/Result/search?siteid=" +
                datum.value.MonitoringLocationIdentifier +
                "&mimeType=csv&zip=yes&sorted=no' target='_blank' > Download " +
                datum.value.resultCount +
                ' Measurements</a></br>';
            }
            if (datum.name == 'TEST_Micro_GPS') {
              details.innerHTML =
                '<br/>Location: ' +
                datum.value.location +
                '<br/>Watershed: ' +
                datum.value.Watershed +
                '<br/>Latitude: ' +
                datum.value.latitude +
                '<br/>Longitude: ' +
                datum.value.longitude +
                '<br/><button class="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target="#location-modal" (click)="openModalSite(' +
                datum +
                ')">View</button>';

              let j: number;
              for (j = 0; j < datum._links.associationIds.length; j++) {
                if (datum._links.associationIds[j].href.indexOf('ikewai-annotated') !== -1) {
                  //  download.innerHTML ='<a href="javascript:void(0);" class="btn btn-success" (click)="downloadClick(\''+datum._links.associationIds[j].href+'\')">Download '+datum._links.associationIds[j].href.split('/').slice(-1)[0]+'</a>'
                }
              }
            }

            let popup: L.Popup = new L.Popup();
            wrapper.append(details);
            wrapper.append(download);
            wrapper.append(goto);

            let linkDiv = wrapper.getElementsByClassName('entry-link');

            let gotoWrapper = () => {
            };
            linkDiv[0].addEventListener('click', gotoWrapper);
            popup.setContent(wrapper);
            layer.bindPopup(popup);
            if (this.dataGroups[group] != undefined) {
              this.dataGroups[group].addLayer(layer);
            }
          },
        });
        this.filterData = this.metadata2;
      }
    });
  }

  getStyleByGroup(group: string): L.PathOptions {
    let style: L.PathOptions;
    switch (group) {
      case 'waterQualitySites': {
        style = {
          color: '#238B45',
          weight: 3,
          opacity: 0.3,
        };
        break;
      }
      case 'sites': {
        style = {
          color: '#CB181D',
          weight: 3,
          opacity: 0.3,
        };
        break;
      }
      case 'wells': {
        style = {
          color: '#2171B5',
          weight: 3,
          opacity: 0.3,
        };
        break;
      }
      case 'MicroGPS': {
        style = {
          color: '#2171B5',
          weight: 3,
          opacity: 0.3,
        };
        break;
      }
    }
    return style;
  }

  private getIconByGroup(group: string): L.Icon {
    let icon: L.Icon;
    switch (group) {
      case 'waterQualitySites': {
        icon = new L.Icon({
          iconUrl: 'assets/markers/marker-icon-green.png',
          iconRetinaUrl: 'assets/markers/marker-icon-2x-green.png',
          shadowUrl: 'assets/marker-shadow.png',
        });
        break;
      }
      case 'sites': {
        icon = new L.Icon({
          iconUrl: 'assets/markers/marker-icon-red.png',
          iconRetinaUrl: 'assets/markers/marker-icon-2x-red.png',
          shadowUrl: 'assets/marker-shadow.png',
        });
        break;
      }
      case 'wells': {
        icon = new L.Icon({
          iconUrl: 'assets/marker-icon.png',
          iconRetinaUrl: 'assets/marker-icon-2x.png',
          //shadowUrl: "assets/marker-shadow.png",
          iconSize: [15, 25],
        });
        break;
      }
      case 'MicroGPS': {
        icon = new L.Icon({
          iconUrl: 'assets/marker-icon.png',
          iconRetinaUrl: 'assets/marker-icon-2x.png',
          //shadowUrl: "assets/marker-shadow.png",
          iconSize: [15, 25],
        });
        break;
      }
    }
    return icon;
  }

  markerClick(e) {
  }

  openModalSite(site) {
    this.toggleAhupuaaClosed();
    this.selectedMetadata = site;
    this.selectedAhupuaa = this.allAhupuaaData.find((element:any) => {      
      if (element.value.watershed === site.value.watershed) {
        return element;
      }
      element.watershed === site.value.watersehd})
    this.openMapZoomed(site); // small map on modal screen
  }

  openLinkedPopup(site) {
    //var tempLL = L.latLng([site.value.latitude,site.value.longitude]);
    var tempLL = L.latLng([site.value.latitude, site.value.longitude]);
    let details = L.DomUtil.create('div');
    if (site.name == 'TEST_Site_Date_Geochem') {
      details.innerHTML =
        '<br/>Name: ' +
        site.value.location +
        '<br/>Watershed: ' +
        site.value.watershed +
        '<br/>Site_Enviro: ' +
        site.value.site_enviro;
    }
    if (site.name == 'TEST_Microbes') {
      details.innerHTML =
        '<br/>Name: ' +
        site.value.location +
        '<br/>Watershed: ' +
        site.value.watershed +
        '<br/>Site_Enviro: ' +
        site.value.site_enviro;
    }
    if (site.name == 'TEST_CFU') {
      details.innerHTML =
        '<br/>Name: ' +
        site.value.location +
        '<br/>Watershed: ' +
        site.value.watershed +
        '<br/>Site_Enviro: ' +
        site.value.site_enviro;
    }
    if (site.name == 'TEST_Fem_A') {
      details.innerHTML =
        '<br/>Name: ' +
        site.value.location +
        '<br/>Watershed: ' +
        site.value.watershed +
        '<br/>Site_Enviro: ' +
        site.value.site_enviro;
    }
    L.popup().setLatLng(tempLL).setContent(details).openOn(this.map);
  }

  openMapZoomed(site) {
    // cache current Lat Lon. when map is ready it will call drawMapZoomedPoint (onMapZoomedReady())
    this.mapZoomedLatLng = L.latLng([site.value.latitude, site.value.longitude]);
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

    let icon = this.getIconByGroup('wells');
    // this.mapZoomedCircle = L.circleMarker(latlng, {radius:5,opacity: 1,fillOpacity: 0.9,color:'gray'})
    // this.mapZoomedCircle = L.circle(this.mapZoomedLatLng, {fillOpacity: 1, radius: 100}).addTo(this.mapZoomed);
    this.mapZoomedCircle = L.marker(this.mapZoomedLatLng, { icon }).addTo(this.mapZoomed);

    // remove Lat Lon cache
    this.mapZoomedLatLng = null;
  }

  hideModal(): void {
    // this interferes with the small map.
    // this.selectedMetadata = null;
    //$("#location-modal").modal('hide');
  }

}

enum NameGroupMap {
  Water_Quality_Site = 'waterQualitySites',
  Site = 'sites',
  Well = 'wells',
  TEST_Micro_GPS = 'MicroGPS',
  TEST_Microbes = 'microbes',
  TEST_CFU = 'cfu',
  TEST_Fem_A = 'qpcr'
}

enum GroupLabelMap {
  waterQualitySites = 'Water Quality Sites',
  sites = 'Sites',
  wells = 'Wells',
  TEST_Micro_GPS = 'MicroGPS',
  TEST_Microbes = 'microbes',
  TEST_CFU = 'cfu',
  TEST_Fem_A = 'qpcr'
}
