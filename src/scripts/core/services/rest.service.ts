/*
 * Emoji Tools
 * Copyright (C) 2015-2017 Mitch Talmadge (https://MitchTalmadge.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Injectable} from "@angular/core";
import {Headers, Http, RequestOptions, Response} from "@angular/http";
import {Observable} from "rxjs";

@Injectable()
export class RESTService {

    private headers: Headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });

    constructor(private http: Http) {
    }

    private static checkForErrors(response: Response): any {
        if (response.status >= 200 && response.status < 300) {
            if (response.text().length > 0)
                return JSON.parse(response.text());
            return undefined;
        } else {
            let error = new Error(response.statusText);
            error['response'] = response;
            throw error;
        }
    }

    private static removeTrailingSlash(path: string): string {
        if (path && path.startsWith("/"))
            path = path.substring(1);
        return path;
    }

    public get(path: string, additionalHeaders?: Headers): Observable<any> {
        let options;
        if (additionalHeaders) {
            let newHeaders: Headers = new Headers(this.headers);
            additionalHeaders.forEach((values: string[], name: string) => {
                values.forEach((value: string) => newHeaders.append(name, value));
            });
            options = new RequestOptions({headers: newHeaders});
        }
        else options = new RequestOptions({headers: this.headers});
        return this.http.get(path, options)
            .map(RESTService.checkForErrors)
            .catch(e => Observable.throw(e.json().error));
    }

    public post(path: string, data: any): Observable<any> {
        let options = new RequestOptions({headers: this.headers});
        return this.http.post(path, JSON.stringify(data), options)
            .map(RESTService.checkForErrors)
            .catch(e => Observable.throw(e.json().error));
    }

    public put(path: string, data: any): Observable<any> {
        let options = new RequestOptions({headers: this.headers});
        return this.http.put(path, JSON.stringify(data), options)
            .map(RESTService.checkForErrors)
            .catch(e => Observable.throw(e.json().error));
    }

    public patch(path: string, data?: any): Observable<any> {
        let options = new RequestOptions({headers: this.headers});
        return this.http.patch(path, data != null ? JSON.stringify(data) : undefined, options)
            .map(RESTService.checkForErrors)
            .catch(e => Observable.throw(e.json().error));
    }

    public del(path: string): Observable<any> {
        let options = new RequestOptions({headers: this.headers});
        return this.http.delete(path, options)
            .map(RESTService.checkForErrors)
            .catch(e => Observable.throw(e.json().error));
    }

}