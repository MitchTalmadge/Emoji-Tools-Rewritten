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
import {ETFontTable} from "../../../models/tables/font-table.enum";
import {Logger} from "../../../util/logger";
import * as fs from "fs-extra";
import {ETGSUBLigatureSet} from "../../../models/tables/gsub/ligature-set.gsub.model";
import {ETGSUBLigature} from "../../../models/tables/gsub/ligature.gsub.model";
import {ETGSUBLigatureSetsAccessor} from "../../../models/tables/gsub/ligature-sets-accessor.gsub.model";

@Injectable()
export class GSUBTableService {

    constructor(private fontToolsService: FontToolsService) {
    }

    /**
     * Extracts all the Ligature Sets in the table.
     * @param ttxDirPath The path to the ttx directory.
     * @returns A Promise that gives the Ligature Sets Accessor.
     */
    public extractLigatureSets(ttxDirPath: string): Promise<ETGSUBLigatureSetsAccessor> {
        return new Promise((resolve, reject) => {
            this.fontToolsService.getTTXPathForTable(ETFontTable.GSUB, ttxDirPath)
                .then(
                    GSUBTable => {

                        // Parse XML
                        let xmlParser = new DOMParser();
                        let GSUBDoc = xmlParser.parseFromString(fs.readFileSync(GSUBTable, 'utf8'), 'text/xml');

                        // Get the Ligature Sets
                        let ligatureSetElements = GSUBDoc.getElementsByTagName("LigatureSet");

                        // Set up the accessor and maps.
                        let ligatureSetsAccessor: ETGSUBLigatureSetsAccessor = {};
                        ligatureSetsAccessor.ligatureSets = [];
                        ligatureSetsAccessor.ligatureSetsMap = {};
                        ligatureSetsAccessor.ligaturesMap = {};

                        // For each Ligature Set
                        for (let i = 0; i < ligatureSetElements.length; i++) {
                            let ligatureSetElement = ligatureSetElements.item(i);
                            let ligatureSet: ETGSUBLigatureSet = {};

                            // Assign the Ligature Set's glyph name.
                            ligatureSet.glyphName = ligatureSetElement.getAttribute("glyph");

                            // Initialize arrays.
                            ligatureSet.ligatures = [];

                            // Get the Ligatures.
                            let ligatureElements = ligatureSetElement.getElementsByTagName("Ligature");

                            // For each Ligature
                            for (let j = 0; j < ligatureElements.length; j++) {
                                let ligatureElement = ligatureElements.item(j);
                                let ligature: ETGSUBLigature = {};

                                // Assign the Ligature Set.
                                ligature.ligatureSet = ligatureSet;

                                // Assign the glyph name.
                                ligature.glyphName = ligatureElement.getAttribute("glyph");

                                // Push to the Ligature Set's array.
                                ligatureSet.ligatures.push(ligature);

                                // Put the Ligature into the accessor's Ligatures Map.
                                ligatureSetsAccessor.ligaturesMap[ligature.glyphName] = ligature;

                                // Split up and assign the components
                                ligature.components = ligatureElement.getAttribute("components").split(',');
                            }

                            // Put the Ligature Set into the accessor's LigatureSets Map.
                            ligatureSetsAccessor.ligatureSetsMap[ligatureSet.glyphName] = ligatureSet;

                            // Push to the accessor's Ligature Sets array.
                            ligatureSetsAccessor.ligatureSets.push(ligatureSet);
                        }

                        resolve(ligatureSetsAccessor);
                    }
                )
                .catch(
                    err => {
                        Logger.logError(err, this);
                        reject("Could not find GSUB Table.");
                    }
                )
        });
    }

}