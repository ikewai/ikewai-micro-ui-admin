import {Metadata} from "./metadata";
import {Subject} from "rxjs";

export class CacheData {
  //private data: PageMap;
  private pSize: number;
  private timeout: number;
  //set up observable that fires when an item times out
  dataMonitor: Subject<number>;

  constructor(psize: number, timeout: number) {
    this.pSize = psize;
    this.timeout = timeout;
    this.dataMonitor = new Subject<number>();
  }

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
  


  repage(psize) {
    
  }
  
}

interface PageMap<T, TLength extends number> {
  [pnum: number]: Page<T, TLength> | PartialPage<T>;
};

interface StrictArray<T, TLength extends number> extends Array<T> {
  0: T;
  length: TLength;
}



export class Page<T, TLength extends number> {
  private readonly data: StrictArray<T, TLength>;
  timeoutHandler: any;

  constructor(data: T[]) {
    //if(data.length != typeof TLength)
    this.data = <StrictArray<T, TLength>>data;
    this.timeoutHandler = null;
  }

  getData(): T[] {
    return this.data;
  }
}

export class PartialPage<T> {
  private readonly data: Array<T>;
  timeoutHandler: any;

  constructor(data: T[]) {
    this.data = [...data];
    this.timeoutHandler = null;
  }

  getData(): T[] {
    return this.data;
  }
}
