import { Injectable } from '@angular/core';
import { CacheData, Page } from '../_models/cacheData';
//import { Metadata } from '../_models/metadata';

@Injectable({
  providedIn: 'root'
})
export class QueryCacheService {

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