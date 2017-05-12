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
import {FontToolsService} from "../font-tools.service";
import * as fs from "fs-extra";
import {ETFontTable} from "../../../models/tables/font-table.enum";
import {Observable} from "rxjs/Observable";
import * as readline from "readline";
import {Logger} from "../../../util/logger";
import {ETsbixGlyphData} from "../../../models/tables/sbix/image-data.sbix.model";

@Injectable()
export class sbixTableService {

    private static readonly PNG_GRAPHIC_TYPE_MATCHER = new RegExp(/^<glyph graphicType="png " name="([^"]+)/);
    private static readonly RAW_IMAGE_DATA_MATCHER = new RegExp(/^(([0-9a-f]{2}){1,4} ?)+$/);
    private static readonly RAW_IMAGE_DATA_END_MATCHER = new RegExp(/^<\/hexdata>$/);
    private static readonly HEX_SPLITTER = new RegExp(/.{1,2}/g);

    constructor(private fontToolsService: FontToolsService) {
    }

    /**
     * Determines the number of glyphs with png data in the sbix table.
     * @param ttxDirPath The path to the ttx directory.
     */
    public determineNumberOfGlyphs(ttxDirPath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.fontToolsService.getTTXPathForTable(ETFontTable.sbix, ttxDirPath)
                .then(sbixPath => {
                    // Read table line by line.
                    let sbixReader = readline.createInterface({
                        input: fs.createReadStream(sbixPath, 'utf8')
                    });

                    let numGlyphs = 0;

                    // For each line...
                    sbixReader.on('line', (line: string) => {
                        line = line.trim();

                        // Look for format header
                        let matcher = sbixTableService.PNG_GRAPHIC_TYPE_MATCHER.exec(line);
                        if (matcher != null) {
                            numGlyphs++;
                        }
                    });

                    // Cleanup on close.
                    sbixReader.on('close', () => {
                        resolve(numGlyphs);
                    });
                })
                .catch(err => {
                    Logger.logError("sbix Table not found: " + err, this);
                    reject("Could not determine number of glyphs; sbix Table not found.");
                })
        });
    }

    /**
     * Extracts glyph and image data from the sbix table.
     * @param ttxDirPath The path to the ttx directory.
     * @returns An Observable that gives the data for one glyph at a time.
     */
    public extractGlyphData(ttxDirPath: string): Observable<ETsbixGlyphData> {
        return Observable.create(listener => {
            this.fontToolsService.getTTXPathForTable(ETFontTable.sbix, ttxDirPath)
                .then(sbixPath => {
                    // Read table line by line.
                    let sbixReader = readline.createInterface({
                        input: fs.createReadStream(sbixPath, 'utf8')
                    });

                    let glyphData: ETsbixGlyphData;
                    let imageData: number[];

                    // For each line...
                    sbixReader.on('line', (line: string) => {
                        line = line.trim();

                        // Look for format header
                        let matcher = sbixTableService.PNG_GRAPHIC_TYPE_MATCHER.exec(line);
                        if (matcher != null) {
                            glyphData = {};
                            glyphData.graphicType = "png ";
                            glyphData.name = matcher[1];
                            imageData = [];
                            return;
                        }

                        // Only do these if header was encountered
                        if (glyphData != null) {
                            // Look for data
                            matcher = sbixTableService.RAW_IMAGE_DATA_MATCHER.exec(line);
                            if (matcher != null) {
                                // Remove middle spaces.
                                let data = line.replace(/\s+/g, '');

                                // Split the hex string into chunks of 2.
                                let splitData = data.match(sbixTableService.HEX_SPLITTER);

                                // Convert the hex to binary and put into the data.
                                splitData.forEach(hexByte => imageData.push(parseInt(hexByte, 16)));
                                return;
                            }

                            // Look for the data closing tag.
                            matcher = sbixTableService.RAW_IMAGE_DATA_END_MATCHER.exec(line);
                            if (matcher != null) {
                                glyphData.imageData = new Uint8Array(imageData);

                                // Send whatever we have.
                                listener.next(glyphData);

                                // Reset.
                                glyphData = null;
                                imageData = null;
                                return;
                            }
                        }
                    });

                    // Cleanup on close.
                    sbixReader.on('close', () => {
                        listener.complete();
                    });
                })
                .catch(err => {
                    Logger.logError(err, this);
                    listener.error("Could not extract image data; sbix table not found.");
                })
        });
    }

}