import { Injectable } from '@angular/core';
import { RequestStatus, QueryResponse } from './query-handler.service';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Metadata } from "../_models/metadata";
import { Filter } from "./filter-manager.service"

@Injectable({
  providedIn: 'root'
})
export class DataManagerService {

    constructor() { }

    registerDataStream(stream: Observable<QueryResponse>): DataController {
        return new DataController(stream);
    }


}

export class DataController {

    private data: Metadata[];

    //provide filter and order (e.g. 1 or -1), instead of having separate filters for different orders
    //have data retreival methods here, have filter as an input, add index manager to deal with indices

    constructor(stream: Observable<QueryResponse>) {
        stream.subscribe((res: QueryResponse) => {
            this.data.concat(res.data);
        });
    }

    getDataLength(filter: Filter) {
        //filtering not implemented, just return data length
        return this.data.length;
    }
    
    getStatus
}

class IndexManager {

}




//   //switch to return range from promise
//   next(filterHandle: FilterHandle): Promise<[number, number]> {
//     let port = this.dataPorts[filterHandle];
//     if(port == undefined) {
//       throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
//     }
//     if(port.lastRequest == null) {
//       throw new Error("next called before stream initialized: requestData must be called before stateful next or previous to initialize stream state");
//     }
//     //don't try to get current request until last request is properly handled and returned to ensure ordering
//     let dataListener = port.lastRequest.then((last: [number, number]) => {
//       let range: [number, number] = [last[1], last[1] + port.chunkSize];

//       return this.generateChunkRetreivalPromise(filterHandle, last, range);
//     });

//     return this.generateResultAndSetState(filterHandle, port, dataListener);
//   }

//   previous(filterHandle: FilterHandle): Promise<[number, number]> {
//     let port = this.dataPorts[filterHandle];
//     if(port == undefined) {
//       throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
//     }
//     if(port.lastRequest == null) {
//       throw new Error("next called before stream initialized: requestData must be called before stateful next or previous to initialize stream state");
//     }
//     //don't try to get current request until last request is properly handled and returned to ensure ordering
//     let dataListener = port.lastRequest.then((last: [number, number]) => {
//       //if already at 0 lower bound just ignore and return null for current
//       if(last[0] == 0) {
//         return {
//           last: last,
//           current: null
//         };
//       }
//       //if chunk size doesn't fit properly and lower bound less than 0, realign to 0 (failsafe, should never actually happen since requestData should align)
//       let lower = Math.max(last[0] - port.chunkSize, 0);
//       let upper = lower + port.chunkSize;
//       let range: [number, number] = [lower, upper];

//       return this.generateChunkRetreivalPromise(filterHandle, last, range);
//     });

//     return this.generateResultAndSetState(filterHandle, port, dataListener);
//   }

//   requestData(filterHandle: FilterHandle, entry: number, chunkSize?: number): Promise<[number, number]> {
//     let port = this.dataPorts[filterHandle];
//     if(port == undefined) {
//       throw new Error("Invalid filter handle: the filter handle does not have an associated data port");
//     }
    
//     let previous: Promise<any> = port.lastRequest == null ? Promise.resolve() : port.lastRequest;

//     if(chunkSize == undefined) {
//       chunkSize = port.chunkSize
//     }
//     console.log(chunkSize);

//     let first = Math.floor(entry / chunkSize) * chunkSize;

//     //don't try to get current request until last request is properly handled and returned to ensure ordering
//     let dataListener = previous.then((last: [number, number]) => {
//       let range: [number, number] = [first, first + chunkSize];
//       port.chunkSize = chunkSize;

//       return this.generateChunkRetreivalPromise(filterHandle, last, range);
//     });

//     return this.generateResultAndSetState(filterHandle, port, dataListener);
//   }

//   generateChunkRetreivalPromise(filterHandle: FilterHandle, last: [number, number], current: [number, number]): Promise<ChunkController> {
//     let chunkData: ChunkController = {
//       last: last,
//       current: null
//     };

//     return new Promise<ChunkController>((resolve) => {
//       let subManager = new Subject();
//       this.statusPort
//       //make submanager global, store chunkdata outside and resolve in complete method so can be canceled
//       .pipe(takeUntil(merge(subManager, this.queryState.masterDataSubController)))
//       .subscribe((status: RequestStatus) => {
//         //cancellation should be accomplished by query cancellation pushing to masterDataSubController
//         // //error in query, return null, data will never be loaded unless retry
//         // if(status.status != 200) {
//         //   subManager.next();
//         // }
//         let ready: PollStatus = this.cache.pollData(filterHandle, this.queryState.query, current);
//         //if query ready resolve
//         if(ready == PollStatus.READY) {
//           subManager.next();
//           chunkData.current = current;     
//         }
//         //out of range, resolve with null
//         else if(ready == PollStatus.INVALID) {
//           subManager.next();
//         }
//         //not ready, wait for next set of data to arrive
//       },
//       null,
//       () => {
//         console.log("complete");
//         resolve(chunkData);
//       });
//     });
//   }

//   generateResultAndSetState(filterHandle: FilterHandle, port: DataPort, dataListener: Promise<ChunkController>): Promise<[number, number]> {
//     port.lastRequest = dataListener.then((chunkData: ChunkController) => {
//       //if next data is null then keep same state otherwise assign to the new state
//       return chunkData.current == null ? chunkData.last : chunkData.current;
//     });
//     return dataListener.then((chunkData: ChunkController) => {
//       //if null just return null to user, otherwise push data retreived from chunk range and return range
//       if(chunkData.current != null) {
//         let data = this.cache.retreiveData(filterHandle, this.queryState.query, chunkData.current);
//         port.source.next(Object.values(data));
//       }
//       return chunkData.current;
//     });
//   }