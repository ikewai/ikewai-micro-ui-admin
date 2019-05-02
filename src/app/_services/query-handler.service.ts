import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SpatialService } from './spatial.service';
import { QueryCacheService } from './query-cache.service';
import { Metadata } from '../_models/metadata';

@Injectable({
  providedIn: 'root'
})
export class QueryHandlerService {

  currentQuery: string = null;
  items: number = null;
  forwardLookup: boolean = null;

  constructor(private spatial: SpatialService, private cache: QueryCacheService) { }

  spatialSearch(geometry: any, enableForwardLookup: boolean): Observable<Metadata[]> {
    this.forwardLookup = enableForwardLookup;

    return null;
  }

  next() {

  }

  handleQuery() {

  }

}
