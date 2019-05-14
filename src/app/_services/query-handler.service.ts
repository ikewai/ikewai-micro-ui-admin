import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SpatialService } from './spatial.service';
import { QueryCacheService } from './query-cache.service';
import { Metadata } from '../_models/metadata';
import { RequestStatus } from '../_models/requestStatus';
import { HttpErrorResponse } from '@angular/common/http';

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
      
      //inject true to cancel the current query if new query comes
      canceled = yield this.spatial.spatialSearch(query, limit, offset).then((data) => {
        let status: RequestStatus = {
          status: 200,
          loadedResults: offset + data.length,
          finished: data.length == limit
        }
        return {
          status: status,
          data: data
        };
      }, (e: HttpErrorResponse) => {
        let status: RequestStatus = {
          status: e.status,
          loadedResults: offset,
          finished: false
        }
        return {
          status: status,
          data: null
        }
      });

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

  //might want to handle multiple filters at a time
  //separate this out into a class, have a collection based on a set of tracked filters, add dataPort back in to subscribe to outputs

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
    if(this.tempData[this.queryState.query])
    this.statusPort.subscribe((status) => {
      status.
    });
    this.queryState.lastReturned =  this.queryState.lastReturned.then(() => {
      //
    });
    return this.queryState.lastReturned;
  }

  previous() {

  }

  //create method that has observable subscription

  requestData(firstEntry: number, range: number) {
    this.queryState.chunkSize = 
  }

  private handleQuery(query: string): void {
    //add cache check
    //set startPoint to the starting point for the request
    //have indicator in cache if data is complete
    let startPoint = 0;

    let complete = false;
    if(complete) {
      return;
    }
    let qGen = QueryHandlerService.query(query, startPoint);
    
    let queryHandle = qGen.next();

    let nextPromise = (generator) => {
      return generator.next();
    }

    let dataHandler = (data) => {

    }

    let getCondition = (data) => {

    }

    let handler = (data: QueryResponse, generator: IterableIterator<any>) => {
      this.statusPort.next(data.status);
      //add data to cache
      let next = generator.next();
      if(next.done == true) {
        throw new Error("An unexpected error has occured while handling the query: handler called after generator completed");
      }
      if(typeof)
    }

    this.recursivePromise(nextPromise);
  }

  recursivePromise(promise: Promise<any>, handler: (data) => , data: any) {
    if()
    return promise.then((data) => {
      handler();
      if(condition()) {
        this.recursivePromise(promise, handler, condition)
      }
    });
  }

  setPageSize(size: number) {
    this.pageSize = size;

  }

}

interface QueryResponse {
  status: RequestStatus,
  data: Metadata[]
}