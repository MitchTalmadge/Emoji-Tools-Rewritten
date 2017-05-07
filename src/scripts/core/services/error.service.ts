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

import {Injectable} from '@angular/core';
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Router} from "@angular/router";

@Injectable()
export class ErrorService {

    private error = new ReplaySubject<string>(1);

    constructor(private router: Router) {
    }

    public displayError(error: string) {
        this.error.next(error);
        this.router.navigate(['error']);
    }

    public getError(): ReplaySubject<string> {
        return this.error;
    }

}