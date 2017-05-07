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
import {ETcmapSubtable} from "../../../models/tables/cmap/subtable.cmap.model";
import {ETFontTable} from "../../../models/tables/font-table.enum";
import {Logger} from "../../../util/logger";
import * as fs from "fs-extra";

@Injectable()
export class cmapTableService {

    constructor(private fontToolsService: FontToolsService) {
    }

    /**
     * Finds a single subtable in the cmap table by its format number.
     * In the case of multiple existing subtables by the format, the first encountered will be chosen.
     * @param ttxDirPath The path to the ttx directory.
     * @param format The format to find.
     * @returns A Promise that gives the requested subtable if found, or rejects if not found.
     */
    findSubtable(ttxDirPath: string, format: number): Promise<ETcmapSubtable> {
        return new Promise((resolve, reject) => {
            this.fontToolsService.getTTXPathForTable(ETFontTable.cmap, ttxDirPath)
                .then(cmapPath => {
                    // Parse the table as XML
                    let xmlParser = new DOMParser();
                    let cmapContents = fs.readFileSync(cmapPath, 'utf8');
                    let cmapDoc = xmlParser.parseFromString(cmapContents, "text/xml");

                    // Find the cmap_format_XX element.
                    let subtableElements = cmapDoc.getElementsByTagName("cmap_format_" + format);

                    // Check if the element exists.
                    if (subtableElements.length == 0) {
                        reject("No subtable found with format " + format);
                        return;
                    }

                    // Fill out subtable interface.
                    let subtable: ETcmapSubtable = {};
                    let subtableElement = subtableElements[0];

                    subtable.format = format;
                    subtable.codes = [];
                    subtable.names = [];
                    subtable.platformID = +subtableElement.attributes.getNamedItem('platformID').value;
                    subtable.platformEncodingID = +subtableElement.attributes.getNamedItem('platEncID').value;

                    // Get all map entries for this subtable, and add their codes and names to the interface.
                    let mapElements = subtableElement.getElementsByTagName("map");
                    for (let i = 0; i < mapElements.length; i++) {
                        subtable.codes[i] = mapElements[i].attributes.getNamedItem('code').value;
                        subtable.names[i] = mapElements[i].attributes.getNamedItem('name').value;
                    }

                    // Finished.
                    resolve(subtable);
                })
                .catch(err => {
                    Logger.logError("Could not find cmap table path: " + err, this);
                    reject("Could not find cmap table.");
                });
        });
    }

}