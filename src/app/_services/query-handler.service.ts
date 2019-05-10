import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SpatialService } from './spatial.service';
import { QueryCacheService } from './query-cache.service';
import { Metadata } from '../_models/metadata';
import { RequestStatus } from '../_models/requestStatus';

@Injectable({
  providedIn: 'root'
})
export class QueryHandlerService {

  //static readonly DEFAULT_PAGE = 10;
  static readonly MIN_QUERY = 100;
  static readonly MAX_QUERY = 10000;
  static readonly MAX_RESULTS = 100000;

  static readonly ENABLE_FAST_QUERY = true;

  static readonly RAMP_FUNCT = QueryHandlerService.ENABLE_FAST_QUERY ? function *(start: number) {
    let acc = start;
    let size = start;
    while(acc <= this.MAX_RESULTS) {
      yield size;
      size = Math.min(size * 2, QueryHandlerService.MAX_QUERY);
      acc += size;
    }
  } :
  function *(start) {
    let acc = start;
    while(acc <= this.MAX_RESULTS) {
      yield 10000;
      acc += 10000;
    }
  };
  //static readonly

  private queryState: {
    query: string;
    queryGen: IterableIterator<any>;
    lastReturned: Promise<[number, number]>;
    chunkSize: number;
  };

  statusPort = new Subject<RequestStatus>();

  //temporary data storage until cache implemented
  tempData: {[query: string]: Metadata[]} = {};


  constructor(private spatial: SpatialService, private cache: QueryCacheService) {
    this.queryState = null;
    //this.pageSize = QueryHandlerService.DEFAULT_PAGE;
  }

  static query = function *(query: string, startPoint: number) {
    let ramp = this.RAMP_FUNCT(startPoint);
    let rampState = ramp.next();
    let limit = rampState.value;
    let complete = rampState.done;

    let offset = startPoint;
    let canceled = false;
    
    while(!canceled && !complete) {
      
      //inject true to cancel the current query when new query comes
      canceled = yield this.spatial.spatialSearch(query, limit, offset);

      offset += limit;

      rampState = ramp.next();
      limit = rampState.value;
      complete = rampState.done;
    }
    return complete;
  }

  cancelQuery() {
    if(this.queryState.queryGen != null) {
      //inject signal to cancel into query generator, shouldn't matter if already complete
      this.queryState.queryGen.next(true);
    }
    
  }

  //add support for sorting and filters

  //for any data retrieval method, return a promise, if data not cached:
  //verify that the query has been properly submitted and throw error if not
  //use the statusPort to signal new data received and check if requested data available
  //return null if first entry out of range or
  //error if query errors out
  //assumes that any data from current query should be cached (overflow will be cut off if excessively large)
  //need to add overflow indicator to status
  spatialSearch(geometry: any, firstEntry: number, range: number): Promise<Metadata[]> {

    if()

    this.cancelQuery();
    this.queryState.query = "{'$and':[{'value.loc': {$geoWithin: {'$geometry':" + JSON.stringify(geometry).replace(/"/g,'\'') + "}}}]}";
    
    this.handleQuery();


    return null;
  }

  next() {
    this.queryState.lastReturned.then(() => {

    });
  }

  previous() {

  }

  //create method that has observable subscription

  requestData(firstEntry: number, range: number) {
    this.queryState.chunkSize = 
  }

  private handleQuery(query: string) {
    //add cache check
    //set startPoint to the starting point for the request
    //have indicator in cache if data is complete
    let startPoint = 0;

    let complete = false;
    let qGen = QueryHandlerService.query("0", 0);
    
    let queryHandle = qGen.next();

    while(!queryHandle.done) {

    }


    this.spatial.spatialSearch(query, limit, offset).toPromise().then((data) => {
      this.dataPort.next(data);
    })
    .then(() => {
      //want some way to indicate if there is a next page
      if(this.forwardLookup) {
        offset += this.pageSize;
        //cache the next page
        this.spatial.spatialSearch(query, limit, offset).toPromise().then((data) => {

        })
      }
    });
  }

  recursivePromise(promise: Promise<any>, handler, condition) {
    return promise.then(() => {
      handler();
      if(condition()) {
        this.recursivePromise(promise, handler, condition)
      }
    });
  }

  // //essentially the same as handleQuery, but just cache results, also need to store a list of lookups already being performed, so if next page requested before finish dont send query again
  // private handleForwardLookup(query: string, page: number) {
  //   let cachedData = this.cache.retreiveData(query, low, items);
  //   if(cachedData.length < items) {
  //     //request data

  //     //cache data
  //   }

  //   let limit = this.pageSize;
  //   let offset = page * this.pageSize;

  //   this.spatial.spatialSearch(query, limit, offset).toPromise().then((data) => {
  //     this.dataPort.next(data);
  //   })
  //   .then(() => {
  //     //want some way to indicate if there is a next page
  //     if(this.forwardLookup) {
  //       offset += this.pageSize;
  //       //cache the next page
  //       this.spatial.spatialSearch(query, limit, offset).toPromise().then((data) => {

  //       })
  //     }
  //   });
  // }

  setPageSize(size: number) {
    this.pageSize = size;

  }

}
