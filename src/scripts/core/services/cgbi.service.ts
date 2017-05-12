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

import { Injectable } from '@angular/core';
import * as fs from "fs-extra";
import {Observable} from "rxjs/Observable";

/**
 * Methods for working with CgBI images, commonly found in iOS Emoji fonts.
 */
@Injectable()
export class CgBIService {

    constructor() { }

    /**
     * Converts CgBI-format PNG images to RGBA.
     * @param imagesPath The path to the directory containing the images to convert.
     * @returns An Observable that reports progress from 0 to 100.
     */
    public convertCgBIToRGBA(imagesPath: string): Observable<number> {
        return Observable.create(listener => {

        });
    }

}