import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { SpatialService } from './spatial.service';
import { QueryCacheService, PollStatus } from './query-cache.service';
import { Metadata } from '../_models/metadata';
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

  private dataPorts: {[handle in FilterHandle]: DataPort};

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

  //should only fire after data has been cached
  statusPort: BehaviorSubject<RequestStatus>;

  



  constructor(private spatial: SpatialService, private cache: QueryCacheService) {
    this.queryState = {
      query: null,
      queryGen: null
    };
    this.statusPort = new BehaviorSubject<RequestStatus>(null);
    this.dataPorts = {};
  }

  initFilterListener(filterMonitor: Subject<MonitorEvent>) {
    filterMonitor.subscribe((event: MonitorEvent) => {
      console.log(event);
      switch(event.case) {
        case MonitorCase.CREATED: {
          this.dataPorts[event.handle] = new DataPort();
          console.log(this.dataPorts[0]);
          break;
        }
        case MonitorCase.DESTROYED: {
          delete this.dataPorts[event.handle];
          break;
        }
      }
    });
  }

  getFilterObserver(filterHandle: FilterHandle): Observable<Metadata[]> {
    let port = this.dataPorts[filterHandle];
    console.log(filterHandle);
    console.log(this.dataPorts);
    if(port == undefined) {
      throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
    }
    return port.source.asObservable();
  }


  private query = function *(query: string, startPoint: number) {
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

  private cancelQuery() {
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
  spatialSearch(geometry: any): void {
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

    //for now clear data store (remove when cache fully implemented)
    this.cache.clearData(query);
    this.cache
    let startPoint = 0;
    let complete = false;

    //intialize status for current query
    this.statusPort.next({
      status: 200,
      loadedResults: startPoint,
      finished: complete
    });

    if(complete) {
      return;
    }

    let qGen = this.query(query, startPoint);
    this.queryState.queryGen = qGen;
    
    let queryHandle = qGen.next().value;

    let handler = (response: QueryResponse): Promise<RequestStatus> => {
      //insert data into cache
      this.cache.addData(query, response.data, response.status.finished);
      this.statusPort.next(response.status);
      //add data to cache
      //returns done when returned, value will be completed flag
      let next = qGen.next();
      if(next.value == undefined) {
        throw new Error("An unexpected error has occured while handling the query: handler called after generator completed");
      }
      //generator complete or canceled
      if(next.done) {
        return new Promise((resolve) => {
          resolve(response.status);
        });
      }
      else {
        return this.recursivePromise(next.value, handler)
      }
    }

    this.recursivePromise(queryHandle, handler);
    // .then((status) => {
    //   console.log(status);
    // });
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
    if(port.lastRequest == null) {
      throw new Error("next called before stream initialized: requestData must be called before stateful next or previous to initialize stream state");
    }
    //don't try to get current request until last request is properly handled and returned to ensure ordering
    let dataListener = port.lastRequest.then((last: [number, number]) => {

      let range: [number, number] = [last[1], last[1] + port.chunkSize];

      return new Promise<[number, number]>((resolve) => {
        let sub = this.statusPort.subscribe((status) => {
          //error in query, return null, data will never be loaded unless retry
          if(status.status != 200) {
            sub.unsubscribe();
            return resolve(null);
          }
          let ready: PollStatus = this.cache.pollData(filterHandle, this.queryState.query, range);
          //if query ready resolve
          if(ready == PollStatus.READY) {
            sub.unsubscribe();           
            return resolve(range);
          }
          //out of range, resolve with null
          else if(ready == PollStatus.INVALID) {
            return resolve(null);
          }
          //not ready, wait for next set of data to arrive
        });
      });
    });

    port.lastRequest = dataListener.then((range: [number, number]) => {
      //if next data is null then keep same state
      if(range == null) {
        return port.lastRequest;
      }
      //otherwise assign to the new state
      else {
        return range;
      }
    });
    return dataListener.then((range: [number, number]) => {
      //if null just return null to user, otherwise return data retreived from chunk range and push to source
      let data = null
      if(range == null) {
        data = this.cache.retreiveData(filterHandle, this.queryState.query, range);
        port.source.next(data);
      }
      return data;
    });
  }

  previous(filterHandle: FilterHandle) {

  }

  //create method that has observable subscription

  requestData(filterHandle: FilterHandle, firstEntry: number, chunkSize: number): Promise<Metadata[]> {
    let port = this.dataPorts[filterHandle];
    if(port == undefined) {
      throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
    }
    
    let previous: Promise<any> = port.lastRequest == null ? Promise.resolve() : port.lastRequest;

    //don't try to get current request until last request is properly handled and returned to ensure ordering
    let dataListener = previous.then((last: [number, number]) => {
      let range: [number, number] = [firstEntry, firstEntry + chunkSize];
      port.chunkSize = chunkSize;

      return new Promise<ChunkController>((resolve) => {
        let chunkData: ChunkController = {
          last: last,
          current: null
        };
        let sub = this.statusPort.subscribe((status) => {
          console.log(status);
          //error in query, return null, data will never be loaded unless retry
          if(status.status != 200) {
            sub.unsubscribe();
            return resolve(chunkData);
          }
          let ready: PollStatus = this.cache.pollData(filterHandle, this.queryState.query, range);
          //if query ready resolve
          if(ready == PollStatus.READY) {
            sub.unsubscribe();
            chunkData.current = range; 
            return resolve(chunkData);
          }
          //out of range, resolve with null
          else if(ready == PollStatus.INVALID) {
            return resolve(chunkData);
          }
          //not ready, wait for next set of data to arrive
        });
      });
    });

    port.lastRequest = dataListener.then((chunkData: ChunkController) => {
      //if next data is null then keep same state otherwise assign to the new state
      return chunkData.current == null ? chunkData.last : chunkData.current;
    });
    return dataListener.then((chunkData: ChunkController) => {
      //if null just return null to user, otherwise return data retreived from chunk range and push to source
      let data = null
      if(chunkData.current != null) {
        data = this.cache.retreiveData(filterHandle, this.queryState.query, chunkData.current);
        port.source.next(data);
      }
      return data;
    });
  }

}

interface QueryResponse {
  status: RequestStatus,
  data: Metadata[]
}



//data port holds stateful information on position of last returned data, chunk size, etc and observer for subscribing to data stream of requested data on the filter
class DataPort {
  source: BehaviorSubject<Metadata[]>;
  chunkSize: number;
  //store last promise, wait until after this data is returned to get next chunk
  lastRequest: Promise<[number, number]>;

  constructor() {
    this.source = new BehaviorSubject<Metadata[]>(null);
    this.lastRequest = null;
  }
}

interface ChunkController {
  last: [number, number],
  current: [number, number]
}

export interface RequestStatus {
  status: number;
  loadedResults: number;
  finished: boolean;
}