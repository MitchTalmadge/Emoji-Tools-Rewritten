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
import {ETGSUBLigatureSets} from "../../../models/tables/gsub/ligature-sets.gsub.model";

@Injectable()
export class GSUBTableService {

    constructor(private fontToolsService: FontToolsService) {
    }

    /**
     * Gets all the Ligature Sets in the table.
     * @param ttxDirPath The path to the ttx directory.
     * @returns A Promise that gives the Ligature Set data.
     */
    public getLigatureSets(ttxDirPath: string): Promise<ETGSUBLigatureSets> {
        return new Promise((resolve, reject) => {
            this.fontToolsService.getTTXPathForTable(ETFontTable.GSUB, ttxDirPath)
                .then(
                    GSUBTable => {

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