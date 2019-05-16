import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SpatialService } from './spatial.service';
import { QueryCacheService } from './query-cache.service';
import { Metadata } from '../_models/metadata';
import { RequestStatus } from '../_models/requestStatus';
import { HttpErrorResponse } from '@angular/common/http';
import { FilterHandle, Filter, FilterManagerService, MonitorEvent, MonitorCase } from './filter-manager.service';

@Injectable({
  providedIn: 'root'
})
export class QueryHandlerService {

  //static readonly DEFAULT_PAGE = 10;
  static readonly MIN_QUERY = 100;
  static readonly MAX_QUERY = 10000;
  static readonly MAX_RESULTS = 100000;
  
  static readonly ENABLE_FAST_QUERY = true;

  private dataPorts: {[handle in FilterHandle]: DataPort} = {};

  static readonly RAMP_FUNCT = QueryHandlerService.ENABLE_FAST_QUERY ? function *(start: number) {
    let acc = start;
    let size = QueryHandlerService.MIN_QUERY;
    while(acc <= this.MAX_RESULTS) {
      yield size;
      size = Math.min(size * 2, QueryHandlerService.MAX_QUERY);
      acc += size;
    }
  } : function *(start) {
    let acc = start;
    while(acc <= this.MAX_RESULTS) {
      yield 10000;
      acc += 10000;
    }
  };
  //static readonly

  queryState: {
    query: string,
    queryGen: IterableIterator<any>
  };

  statusPort = new Subject<RequestStatus>();

  //cache properties:
  //cache should know if the set of data it has is complete
  //cache should guarantee default query result ordering (generate and cache indexes for sorting)
  //cache should always expell from the end of data, that is, if a data entry is present all previous data is in cache (simpler to restore if partial data cached)

  //temporary data storage until cache implemented
  tempData: {[query: string]: Metadata[]} = {};

  tempDataRetreive(start: number, chunkSize: number): Promise<Metadata[]> {
    let range = [start, null];

    slice(range[0], range[1]);


  }

  tempDataAdd(query: string, data: Metadata[]) {
    //console.log(data);
    if(this.tempData[query] == undefined) {
      this.tempData[query] = data;
    }
    else {
      this.tempData[query] = this.tempData[query].concat(data);
    }
  }



  constructor(private spatial: SpatialService, private cache: QueryCacheService, private filterManager: FilterManagerService) {
    this.queryState = {
      query: null,
      queryGen: null
    };
    filterManager.filterMonitor.subscribe((event: MonitorEvent) => {
      switch(event.case) {
        case MonitorCase.CREATED: {
          this.dataPorts[event.handle] = new DataPort();
        }
        case MonitorCase.DESTROYED: {
          delete this.dataPorts[event.handle];
        }
      }
    });
  }

  query = function *(query: string, startPoint: number) {
    let ramp = QueryHandlerService.RAMP_FUNCT(startPoint);
    let rampState = ramp.next();
    let limit = rampState.value;
    let complete = rampState.done;

    let offset = startPoint;
    let canceled = false;
    
    while(!canceled && !complete) {
      //console.log(this.spatial);
      //inject true to cancel the current query if new query comes
      canceled = yield this.spatial.spatialSearch(query, limit, offset).then((data) => {
        console.log(data.length);
        console.log(limit);
        complete = data.length != limit;
        let status: RequestStatus = {
          status: 200,
          loadedResults: offset + data.length,
          finished: complete
        }
        return {
          status: status,
          data: data
        };
      }, (e: HttpErrorResponse) => {
        //errored out, set complete (shouldn't continue)
        complete = true;
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
      complete = complete || rampState.done;
    }
    return complete;
  }

  cancelQuery() {
    if(this.queryState.queryGen != null) {
      //inject signal to cancel into query generator, shouldn't matter if already complete
      this.queryState.queryGen.next(true);
    }
    
  }

  //filters handled by filtermanager, filters should be registered here and data ports are handled there
  //handle requests here, emit requests through filtermanager data ports

  //add support for sorting and filters

  //for any data retrieval method, return a promise, if data not cached:
  //verify that the query has been properly submitted and throw error if not
  //use the statusPort to signal new data received and check if requested data available
  //return null if first entry out of range or
  //error if query errors out
  //assumes that any data from current query should be cached (overflow will be cut off if excessively large)
  //need to add overflow indicator to status
  spatialSearch(geometry: any, firstEntry: number, range: number): void {
    let query = "{'$and':[{'value.loc': {$geoWithin: {'$geometry':" + JSON.stringify(geometry).replace(/"/g,'\'') + "}}}]}";
    this.handleQuery(query);
  }

  private handleQuery(query: string): void {
    //if same as the currently tracked query ignore (it should already be doing its thing)
    if(this.queryState.query == query) {
      return;
    }
    //cancel the last query if still running
    this.cancelQuery();

    this.queryState.query = query;

    //add cache check
    //set startPoint to the starting point for the request
    //have indicator in cache if data is complete

    //for now clear data store (remove when cache implemented)
    delete this.tempData[query];
    let startPoint = 0;
    let complete = false;

    if(complete) {
      return;
    }

    let qGen = this.query(query, startPoint);
    this.queryState.queryGen = qGen;
    
    let queryHandle = qGen.next().value;

    let handler = (response: QueryResponse): Promise<RequestStatus> => {
      //insert data into cache
      this.tempDataAdd(query, response.data);
      this.statusPort.next(response.status);
      //add data to cache
      //returns done when returned, value will be completed flag
      let next = qGen.next();
      console.log(next);
      if(next.value == undefined) {
        throw new Error("An unexpected error has occured while handling the query: handler called after generator completed");
      }
      console.log(next.value);
      //console.log(next.value instanceof Promise);
      //console.log(next.value instanceof "Promise");
      //generator complete or canceled
      if(next.done) {
        console.log(this.tempData);
        return new Promise((resolve) => {
          resolve(response.status);
        });
      }
      else {
        return this.recursivePromise(next.value, handler)
      }
    }

    this.recursivePromise(queryHandle, handler).then((status) => {
      console.log(status);
    });
  }

  private recursivePromise(promise: Promise<any>, handler: (data) => Promise<RequestStatus>): Promise<RequestStatus> {
    return promise.then((data) => {
      return handler(data);
    });
  }


  setChunkSize(filterHandle: FilterHandle, chunkSize: number) {
    let port = this.dataPorts[filterHandle];
    if(port == undefined) {
      throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
    }
    port.chunkSize = chunkSize;
  }
  
  next(filterHandle: FilterHandle): Promise<Metadata[]> {
    let port = this.dataPorts[filterHandle];
    if(port == undefined) {
      throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
    }
    if(port.lastReturned == null) {
      throw new Error("next called before stream initialized: requestData must be called before stateful next or previous to initialize stream state");
    }
    //don't try to get current request until last request is properly handled and returned to ensure ordering
    let dataListener = port.lastReturned.then((last: ChunkController) => {
      //check if reached upper sentinel, return null if reached end of data
      if(last.sentinels[1]) {
        return null;
      }

      let startPoint = last[1];
      let range: [number, number] = [last[1], last[1] + port.chunkSize];
      return range;
    });
    port.lastReturned = dataListener;
    return dataListener;
  }

  previous(filterHandle: FilterHandle) {

  }

  //create method that has observable subscription

  requestData(filterHandle: FilterHandle, firstEntry: number, chunkSize: number) {
    this.tempDataRetreive
  }

}

interface QueryResponse {
  status: RequestStatus,
  data: Metadata[]
}



//data port holds stateful information on position of last returned data, chunk size, etc and observer for subscribing to data stream of requested data on the filter
class DataPort<T> {
  source: Subject<T>;
  chunkSize: number;
  //store last promise, wait until after this data is returned to get next chunk
  lastReturned: Promise<ChunkController>;
}

interface ChunkController {
  range: [number, number],
  sentinels: [boolean, boolean]
}