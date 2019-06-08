import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, merge } from 'rxjs';
import { SpatialService } from './spatial.service';
import { QueryCacheService, PollStatus, IndexMetadataMap } from './query-cache.service';
import { Metadata } from '../_models/metadata';
import { HttpErrorResponse } from '@angular/common/http';
import { FilterHandle, Filter, FilterManagerService, MonitorEvent, MonitorCase } from './filter-manager.service';
import { takeUntil } from 'rxjs/operators';

export { IndexMetadataMap } from './query-cache.service';

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
    masterDataSubController: Subject<void>
  };

  //should only fire after data has been cached
  statusPort: BehaviorSubject<RequestStatus>;



  constructor(private spatial: SpatialService, private cache: QueryCacheService, private filters: FilterManagerService) {
    this.queryState = {
      query: null,
      queryGen: null,
      masterDataSubController: new Subject()
    };
    this.statusPort = new BehaviorSubject<RequestStatus>(null);
    this.dataPorts = {};
    this.initFilterListener(filters.filterMonitor);
  }

  initFilterListener(filterMonitor: Observable<MonitorEvent>) {
    filterMonitor.subscribe((event: MonitorEvent) => {
      //console.log(event);
      switch(event.case) {
        case MonitorCase.CREATED: {
          this.dataPorts[event.handle] = new DataPort();
          //console.log(this.dataPorts[0]);
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
    //console.log(filterHandle);
    //console.log(this.dataPorts);
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
        console.log(e);
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
    //if cancelled emit extra value for canceller to consume;
    if(canceled) {
      yield true;
    }
    return complete;
  }

  private cancelQuery() {
    if(this.queryState.queryGen != null) {
      //inject signal to cancel into query generator, shouldn't matter if already complete
      this.queryState.queryGen.next(true);
    }
    this.queryState.masterDataSubController.next();
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
      //query failed cancel query
      if(response.data == null) {
        this.cancelQuery()
      }
      else {
        //insert data into cache
        this.cache.addData(query, response.data, response.status.finished);
        this.statusPort.next(response.status);
      }
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
  
  //switch to return range from promise
  next(filterHandle: FilterHandle): Promise<[number, number]> {
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

      return this.generateChunkRetreivalPromise(filterHandle, last, range);
    });

    return this.generateResultAndSetState(filterHandle, port, dataListener);
  }

  previous(filterHandle: FilterHandle): Promise<[number, number]> {
    let port = this.dataPorts[filterHandle];
    if(port == undefined) {
      throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
    }
    if(port.lastRequest == null) {
      throw new Error("next called before stream initialized: requestData must be called before stateful next or previous to initialize stream state");
    }
    //don't try to get current request until last request is properly handled and returned to ensure ordering
    let dataListener = port.lastRequest.then((last: [number, number]) => {
      //if already at 0 lower bound just ignore and return null for current
      if(last[0] == 0) {
        return {
          last: last,
          current: null
        };
      }
      //if chunk size doesn't fit properly and lower bound less than 0, realign to 0 (failsafe, should never actually happen since requestData should align)
      let lower = Math.max(last[0] - port.chunkSize, 0);
      let upper = lower + port.chunkSize;
      let range: [number, number] = [lower, upper];

      return this.generateChunkRetreivalPromise(filterHandle, last, range);
    });

    return this.generateResultAndSetState(filterHandle, port, dataListener);
  }

  requestData(filterHandle: FilterHandle, entry: number, chunkSize?: number): Promise<[number, number]> {
    let port = this.dataPorts[filterHandle];
    if(port == undefined) {
      throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
    }
    
    let previous: Promise<any> = port.lastRequest == null ? Promise.resolve() : port.lastRequest;

    if(chunkSize == undefined) {
      chunkSize = port.chunkSize
    }
    console.log(chunkSize);

    let first = Math.floor(entry / chunkSize) * chunkSize;

    //don't try to get current request until last request is properly handled and returned to ensure ordering
    let dataListener = previous.then((last: [number, number]) => {
      let range: [number, number] = [first, first + chunkSize];
      port.chunkSize = chunkSize;

      return this.generateChunkRetreivalPromise(filterHandle, last, range);
    });

    return this.generateResultAndSetState(filterHandle, port, dataListener);
  }

  generateChunkRetreivalPromise(filterHandle: FilterHandle, last: [number, number], current: [number, number]): Promise<ChunkController> {
    let chunkData: ChunkController = {
      last: last,
      current: null
    };

    return new Promise<ChunkController>((resolve) => {
      let subManager = new Subject();
      this.statusPort
      //make submanager global, store chunkdata outside and resolve in complete method so can be canceled
      .pipe(takeUntil(merge(subManager, this.queryState.masterDataSubController)))
      .subscribe((status: RequestStatus) => {
        //cancellation should be accomplished by query cancellation pushing to masterDataSubController
        // //error in query, return null, data will never be loaded unless retry
        // if(status.status != 200) {
        //   subManager.next();
        // }
        let ready: PollStatus = this.cache.pollData(filterHandle, this.queryState.query, current);
        //if query ready resolve
        if(ready == PollStatus.READY) {
          subManager.next();
          chunkData.current = current;     
        }
        //out of range, resolve with null
        else if(ready == PollStatus.INVALID) {
          subManager.next();
        }
        //not ready, wait for next set of data to arrive
      },
      null,
      () => {
        console.log("complete");
        resolve(chunkData);
      });
    });
  }

  generateResultAndSetState(filterHandle: FilterHandle, port: DataPort, dataListener: Promise<ChunkController>): Promise<[number, number]> {
    port.lastRequest = dataListener.then((chunkData: ChunkController) => {
      //if next data is null then keep same state otherwise assign to the new state
      return chunkData.current == null ? chunkData.last : chunkData.current;
    });
    return dataListener.then((chunkData: ChunkController) => {
      //if null just return null to user, otherwise push data retreived from chunk range and return range
      if(chunkData.current != null) {
        let data = this.cache.retreiveData(filterHandle, this.queryState.query, chunkData.current);
        port.source.next(Object.values(data));
      }
      return chunkData.current;
    });
  }

  //returns all data as received through observable
  //need to push all previous data when initially subscribed, shouldn't push to all subscriptions, so tracked for each call separately rather than from respective data port (don't want to push data cumulatively)
  getDataStreamObserver(filterHandle: FilterHandle): Observable<IndexMetadataMap> {
    //subscribe to status port and request data already available, then ranges after every tiem received
    let source = new Subject<IndexMetadataMap>();
    let subManager = new Subject();
    let last = 0;
    this.statusPort
    .pipe(takeUntil(merge(subManager, this.queryState.masterDataSubController)))
    .subscribe((status: RequestStatus) => {
      if(status != null && status.loadedResults > 0) {
        console.log(last, status.loadedResults)
        //how to handle query errors?
        let data = this.cache.retreiveData(filterHandle, this.queryState.query, [last, null]);
        last += Object.keys(data).length;
        
        source.next(data);
      }
    },
    null,
    () => {
      source.complete();
    });
    return source.asObservable();
  }

  //getDataCountObserver(filterHandle: FilterHandle)

}





interface QueryResponse {
  status: RequestStatus,
  data: Metadata[]
}

//data port holds stateful information on position of last returned data, chunk size, etc and observer for subscribing to data stream of requested data on the filter
class DataPort {
  source: BehaviorSubject<Metadata[]>;
  count: BehaviorSubject<number>;
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