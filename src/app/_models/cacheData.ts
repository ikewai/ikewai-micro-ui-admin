import {Metadata} from "./metadata";
import {Subject} from "rxjs";

export class CacheData {
  private data: PageMap;
  private pSize: number;
  //set up observable that fires when an item times out
  public 

  constructor(psize: number, timeout: number) {
    this.pSize = psize;
    this.cleanupHandler = cleanupHandler;
  }

  requestData(pnum: number): Page {
    return this.data[pnum] == undefined ? null : this.data[pnum];
  }

  cachePage(pnum: number, page: Page) {
    if(page.data.length != this.pSize) {
      throw new Error("Invalid page size");
    }
    else {
      //register timeout handler

      this.data[pnum] = 
    }
  }

  private timeoutHandler(pnum: number) {
    delete this.data[pnum];
    if(Object.keys(this.data).length < 1) {
      //execute registered cleanup handler if the cache data is empty
      this.cleanupHandler()
    }
  }

  repage(psize) {

  }
  
}

interface PageMap {[pnum: number]: Page};

export class Page {
  //data should not be changed after initialization
  private data: Metadata[];
  timeoutHandler: any;

  constructor(data: Metadata[]) {
    this.data = data;
    this.timeoutHandler = null;
  }

  getData(): Metadata[] {
    return this.data;
  }
}
