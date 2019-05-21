import { Injectable } from '@angular/core';
import { CacheData, Page } from '../_models/cacheData';
import { Metadata } from '../_models/metadata';
import { FilterHandle } from './filter-manager.service';

@Injectable({
  providedIn: 'root'
})
export class QueryCacheService {


  //cache properties:
  //cache should know if the set of data it has is complete
  //cache should guarantee default query result ordering (generate and cache indexes for sorting)
  //cache should always expell from the end of data, that is, if a data entry is present all previous data is in cache (simpler to restore if partial data cached)

  //temporary data storage until cache implemented
  tempData: {[query: string]: {complete: boolean, data: Metadata[]}} = {};

  clearData(query: string): void {
    delete this.tempData[query];
  }

  //range [lower, upper)
  //should return in filter order/conditions (not implemented)
  retreiveData(filterHandle: FilterHandle, query: string, range: [number, number]): Metadata[] {
    if(range[0] < 0 || range[1] < 0) {
      throw new Error("Invalid range: values should be greater than 0");
    }
    if(range[0] > range[1]) {
      throw new Error("Invalid range: upper bound greater than lower bound, range should be ordered [lower_bound, upper_bound]");
    }
    let base = this.tempData[query];
    let extent = base.data.length;
    console.log(extent);
    //null indicates request is out of range
    if(extent < range[0]) {
      return null
    }
    extent = Math.min(extent, range[1]);

    return base.data.slice(range[0], extent);
  }

  //data should be in base query order
  addData(query: string, data: Metadata[], complete: boolean): void {
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


  
}

interface QueryMap { [query: string]: CacheData };

export enum PollStatus {
  READY = 0,
  NOT_READY = 1,
  //range is improperly formated or indexes are out of range
  INVALID = 2
}

// export interface PollResult {
//   status: PollStatus,
//   complete: boolean
// }