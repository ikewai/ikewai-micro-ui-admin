import { Injectable } from '@angular/core';
import { Metadata } from '../_models/metadata';
import { User } from '../_models/user';
import { Observable, of, throwError } from 'rxjs';
//import { MessageService } from './message.service';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { map, retry, catchError } from 'rxjs/operators';
import { AppConfig } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class SpatialService {

  constructor(private http: HttpClient)  {
  }


  spatialSearch(query: string, limit: number, offset: number): Promise<Metadata[]> {
    //let query = "[{'$and':[{'value.loc': {$geoWithin: {'$geometry':" + JSON.stringify(geometry).replace(/"/g,'\'') + "}}}]}, {$count: 'test'}]";

    // interface ResponseResults {
    //  result: any
    // }
    
    let url = AppConfig.settings.aad.tenant + "/meta/v2/data?q=" + encodeURI(query) + "&limit=" + limit.toString() + "&offset=" + offset.toString();
    //console.log(url);
    //.set("Authorization", "Bearer " + currentUser.access_token)
    let head = new HttpHeaders()
    .set("Content-Type", "application/x-www-form-urlencoded")
    let options = {
      headers: head,
      observe: <any>"response"
    };
    //console.log("stuff");


    let response = this.http.get<Metadata[]>(url, options)
     .pipe(
      retry(3),
      map((data: any) => {
        return data.body.result;
      }),
      catchError((e: HttpErrorResponse) => {
        let err: {
          message: string,
          status: number
        };
        err = typeof e == "string" ? {
          message: e,
          status: 500
        } : {
          message: e.message,
          status: e.status
        }
        //e is just being returned as a string for some reason???
        //if this is the case set up manually and just assume status 500
        return throwError(err);
      })
    );
    return response.toPromise();
   }
}
