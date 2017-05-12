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
import {Observable} from "rxjs/Observable";
import * as fs from "fs-extra";
import {Logger} from "../../util/logger";
import * as path from "path";
import * as pngExtractor from "png-chunks-extract";
import * as pngEncoder from "png-chunks-encode";
import {ETCgBIPNGChunks} from "../../models/cgbi/png-chunks.cgbi.model";

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
            let fileNames = fs.readdirSync(imagesPath);
            fileNames.forEach(fileName => {
                if(!fileName.endsWith(".png")) {
                    Logger.logError("Found a non-png file while converting. Skipping.", this);
                } else {
                    // Read the PNG File
                    fs.readFile(path.join(imagesPath, fileName), (err, data) => {
                        // Check for errors
                        if(err) {
                            Logger.logError("Could not read PNG File: "+err, this);
                        } else {
                            let chunks = pngExtractor(data);
                            console.log(chunks);
                        }
                    });
                }
            });
        });
    }

    /**
     * Reads the Chunks from a PNG file.
     * @param pngFilePath The path to the PNG.
     * @returns A Promise that gives the Chunks.
     */
    private readChunksFromPNG(pngFilePath: string): Promise<ETCgBIPNGChunks> {
        return new Promise<ETCgBIPNGChunks>((resolve, reject) => {

        });
    }

}