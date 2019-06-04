import { Injectable } from '@angular/core';
import { Metadata } from '../_models/metadata';
import { FilterHandle, MonitorEvent, MonitorCase, Filter } from './filter-manager.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QueryCacheService {

  //time before query cleared from cache in ms
  static readonly TIMEOUT = 1000 * 60 * 5;

  //cache properties:
  //cache should know if the set of data it has is complete
  //cache should guarantee default query result ordering (generate and cache indexes for sorting)
  //cache should always expell from the end of data, that is, if a data entry is present all previous data is in cache (simpler to restore if partial data cached)

  //temporary data storage until cache implemented
  tempData: {[query: string]: {complete: boolean, data: Metadata[]}} = {};
  data: QueryMap;

  clearData(query: string): void {
    delete this.tempData[query];
  }

  //range [lower, upper)
  //should return in filter order/conditions (not implemented)
  retreiveData(filterHandle: FilterHandle, query: string, range: [number, number]): Metadata[] {
    let base = this.tempData[query];
    let extent = base.data.length;
    if(range[1] == null) {
      range[1] = extent;
    }
    if(range[0] < 0 || range[1] < 0) {
      throw new Error("Invalid range: values should be greater than 0");
    }
    if(range[0] > range[1]) {
      throw new Error("Invalid range: upper bound greater than lower bound, range should be ordered [lower_bound, upper_bound]");
    }
    
    //console.log(extent);
    //null indicates request is out of range
    if(extent < range[0]) {
      return null
    }
    extent = Math.min(extent, range[1]);
    return base.data.slice(range[0], extent);
  }

  getDataByIndex(index: number[]) {

  }

  //data should be in base query order
  addData(query: string, data: Metadata[], complete: boolean): void {
    //console.log(data);
    let base = this.tempData[query];
    if(base == undefined) {
      this.tempData[query] = {
        complete: complete,
        data: data
      };
    }
    else {
      base.data = base.data.concat(data);
      base.complete = complete
    }
  }

  //indicates to caller if a request for the data range can be fulfilled
  //should check based on filter data (not implemented)
  pollData(filterHandle: FilterHandle, query: string, range: [number, number]): PollStatus {
    let base = this.tempData[query];
    //console.log(base);
    //console.log(this.tempData);
    if(base == undefined) {
      return PollStatus.NOT_READY;
    }
    let extent = base.data.length;

    //need to apply filters and check against that

    if(range[0] < 0 || range[1] < 0 || range[0] > range[1]) {
      return PollStatus.INVALID;
    }
    else if(extent > range[1] || (extent > range[0] && base.complete)) {
      return PollStatus.READY;
    }
    else if(!base.complete) {
      return PollStatus.NOT_READY;
    }
    return PollStatus.INVALID;
  }


  // //timeout cache elements after 5 minutes
  // private static readonly CACHE_TIMEOUT = 300000;

  // private cache: QueryMap;
  // private psize: number;

  // constructor() {
  //   this.cache = {};
  // }

  // requestData(query: string, pnum: number) {
  //   if(this.cache[query] == undefined)
  // }

  // cacheData(query: string, pnum: number, data: Page) {
  //   if(this.cache[query] == undefined) {
  //     this.cache[query] = new CacheData(this.psize, QueryCacheService.CACHE_TIMEOUT, () => {
  //       //if all data times out delete the entry 
  //       delete this.cache[query];
  //     });
  //   }
  //   this.cache[query].cachePage(pnum, data);
  // }

  setQueryTimeout(query: string): void {
    let data = this.data[query];
    data.timeout = setTimeout(this.timeoutHandler(query), QueryCacheService.TIMEOUT);
  }

  timeoutHandler(query: string): () => void {
    return () => {
      delete this.data[query];
    }
  }

  clearQueryTimeout(query: string): void {
    let data = this.data[query];
    clearTimeout(data.timeout);
    data.timeout = null;
  }

  resetQueryTimeout(query: string): void {
    this.clearQueryTimeout(query);
    this.setQueryTimeout(query);
  }

  
}

//get rid of pages, just make removal policy all or nothing, makes it easier with indexes
//can just use index length to tell if have a given set of values based on filter rather than determining if all indexed data is in the cache

interface QueryMap { [query: string]: CacheData };

export enum PollStatus {
  READY = 0,
  NOT_READY = 1,
  //range is improperly formated or indexes are out of range
  INVALID = 2
}

//filterhandle -> index (number[])
//data
interface CacheStorage<T> {

}

//filter is a FilterHandle, can't use aliases in index signature for some reason
interface FilterIndexMap { [filter: number]: number[] };

export interface IndexMetadataMap { [index: number]: Metadata }

class CacheData {
  data: Metadata[];
  indices: FilterIndexMap;
  complete: boolean;
  timeout: any;

  

  // requestData(pnum: number): Page {
  //   if(this.data[pnum] == undefined) {
  //     return null;
  //   }
  //   else {
  //     let page = this.data[pnum];
  //     clearTimeout(page.timeoutHandler);
  //     page.timeoutHandler = setTimeout(this.timeoutHandler.bind(null, pnum), this.timeout);
  //     return page;
  //   }
    
  // }

  // cachePage(pnum: number, page: Page) {
  //   if(page.getData().length != this.pSize) {
  //     //the only time a partial page should exist
  //     throw new Error("Invalid page size");
  //   }
  //   else {
  //     //register timeout handler
  //     page.timeoutHandler = setTimeout(this.timeoutHandler.bind(null, pnum), this.timeout);
  //     this.data[pnum] = 
  //   }
  // }

  // private timeoutHandler(pnum: number) {
  //   delete this.data[pnum];
  //   this.dataMonitor.next(Object.keys(this.data).length);
  // }
  
}

//each query has private index generator
//keep list of dirty filters
//each cached query needs a list of dirty filters
//when filter modified

//create own filters with updates and add to modification list instead of simple dirty list, apply new filter, null out
class IndexGenerator {

  constructor(filterMonitor: Observable<MonitorEvent>, QueryMap) {
    filterMonitor.subscribe()
  }

  reconcileFilters(changes: {[handle: number]: Filter}) {

  }
}


