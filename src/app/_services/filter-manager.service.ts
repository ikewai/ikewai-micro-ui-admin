import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterManagerService {
  
  private filterManager: {[handle in FilterHandle]: Filter} = {};
  private dataPorts: {[handle in FilterHandle]: Filter} = {};

  private freeHandles: {
    freed: FilterHandle[],
    next: FilterHandle
  };

  constructor() {
    this.freeHandles = {
      freed: [],
      next: 0
    }
  }

  private getHandle(): FilterHandle {
    if(this.freeHandles.freed.length > 0) {
      return this.freeHandles.freed.pop();
    }
    else {
      let next = this.freeHandles.next;
      this.freeHandles.next++;
      return next;
    }
  }

  private freeHandle(handle: FilterHandle): void {
    this.freeHandles.freed.push(handle);
  }

  registerFilter(conditions?: Condition[], sorter?: (a, b) => number): FilterHandle {
    let handle = this.getHandle();
    this.filterManager[handle] = new Filter(conditions, sorter);
    return handle;
  }

  removeFilter(filter: FilterHandle): void {
    delete this.filterManager[filter];
    this.freeHandle(filter);
  }

  addFilterCondition(filter: FilterHandle, condition: Condition): void {
    this.filterManager[filter].addCondition(condition);
  }

  removeFilterCondition(filter: FilterHandle, condition: (data) => boolean): void {
    this.filterManager[filter].removeCondition(condition);
  }

  //only one sort can be registered per tracked filter
  setFilterSorter(filter: FilterHandle, sortFunction: (a, b) => number): void {
    this.filterManager[filter].setSorter(sortFunction);
  }

  getFilter() {

  }

  getDataPort() {

  }

  getHandles() {

  }
}

export type FilterHandle = number;
export type Condition = (data) => boolean;

export class Filter {
  private conditions: ((data) => boolean)[];
  private sorter: (a, b) => number;

  constructor(conditions?: Condition[], sorter?: (a, b) => number) {
    this.conditions = conditions == undefined ? null: conditions;
    this.sorter = sorter == undefined ? null: sorter;
  }

  addCondition(condition: Condition): void {
    this.conditions.push(condition);
  }

  removeCondition(condition: Condition): void {
    let index = this.conditions.indexOf(condition);
    if(index >= 0) {
      this.conditions.splice(index, 1);
    }
  }

  setSorter(sortFunction: (a, b) => number): void {
    this.sorter = sortFunction;
  }
}

//data port holds stateful information on position of last returned data, chunk size, etc and observer for subscribing to data stream of requested data on the filter
export class DataPort {
    
}

