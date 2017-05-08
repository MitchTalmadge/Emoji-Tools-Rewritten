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
import {FontToolsService} from "../font-tools.service";
import {ETCBDTGlyphData} from "../../../models/tables/CBDT/image-data.cbdt.model";
import {Observable} from "rxjs/Observable";
import {ETFontTable} from "../../../models/tables/font-table.enum";
import * as fs from "fs-extra";
import * as readline from "readline";
import {Logger} from "../../../util/logger";

@Injectable()
export class CBDTTableService {

    private static readonly FORMAT_17_MATCHER = new RegExp(/^<cbdt_bitmap_format_17 name="([^"]+)">$/);
    private static readonly RAW_IMAGE_DATA_MATCHER = new RegExp(/^(([0-9a-f]{2}){1,4} ?)+$/);
    private static readonly RAW_IMAGE_DATA_END_MATCHER = new RegExp(/^<\/rawimagedata>$/);
    private static readonly HEX_SPLITTER = new RegExp(/.{1,2}/g);

    constructor(private fontToolsService: FontToolsService) {
    }

    /**
     * Determines the number of glyphs in the CBDT table.
     * @param ttxDirPath The path to the ttx directory.
     */
    public determineNumberOfGlyphs(ttxDirPath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.fontToolsService.getTTXPathForTable(ETFontTable.CBDT, ttxDirPath)
                .then(cbdtPath => {
                    // Read table line by line.
                    let cbdtReader = readline.createInterface({
                        input: fs.createReadStream(cbdtPath, 'utf8')
                    });

                    let numGlyphs = 0;

                    // For each line...
                    cbdtReader.on('line', (line: string) => {
                        line = line.trim();

                        // Look for format header
                        let matcher = CBDTTableService.FORMAT_17_MATCHER.exec(line);
                        if (matcher != null) {
                            numGlyphs++;
                        }
                    });

                    // Cleanup on close.
                    cbdtReader.on('close', () => {
                        resolve(numGlyphs);
                    });
                })
                .catch(err => {
                    Logger.logError("CBDT Table not found: " + err, this);
                    reject("Could not determine number of glyphs; CBDT Table not found.");
                })
        });
    }

    /**
     * Extracts glyph and image data from the CBDT table.
     * @param ttxDirPath The path to the ttx directory.
     * @returns An Observable that gives the data for one glyph at a time.
     */
    public extractGlyphData(ttxDirPath: string): Observable<ETCBDTGlyphData> {
        return Observable.create(listener => {
            this.fontToolsService.getTTXPathForTable(ETFontTable.CBDT, ttxDirPath)
                .then(cbdtPath => {
                    // Read table line by line.
                    let cbdtReader = readline.createInterface({
                        input: fs.createReadStream(cbdtPath, 'utf8')
                    });

                    let glyphData: ETCBDTGlyphData;
                    let imageData: number[];

                    // For each line...
                    cbdtReader.on('line', (line: string) => {
                        line = line.trim();

                        // Look for format header
                        let matcher = CBDTTableService.FORMAT_17_MATCHER.exec(line);
                        if (matcher != null) {
                            glyphData = {};
                            glyphData.format = 17;
                            glyphData.name = matcher[1];
                            imageData = [];
                            return;
                        }

                        // Only do these if header was encountered
                        if (glyphData != null) {
                            // Look for data
                            matcher = CBDTTableService.RAW_IMAGE_DATA_MATCHER.exec(line);
                            if (matcher != null) {
                                // Remove middle spaces.
                                let data = line.replace(/\s+/g, '');

                                // Split the hex string into chunks of 2.
                                let splitData = data.match(CBDTTableService.HEX_SPLITTER);

                                // Convert the hex to binary and put into the data.
                                splitData.forEach(hexByte => imageData.push(parseInt(hexByte, 16)));
                                return;
                            }

                            // Look for the data closing tag.
                            matcher = CBDTTableService.RAW_IMAGE_DATA_END_MATCHER.exec(line);
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
                    cbdtReader.on('close', () => {
                        listener.complete();
                    });
                })
                .catch(err => {
                    Logger.logError(err, this);
                    listener.error("Could not extract image data; CBDT table not found.");
                })
        });
    }

}