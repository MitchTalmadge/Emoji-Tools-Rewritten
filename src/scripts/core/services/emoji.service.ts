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
import {FontToolsService} from "./font-tools.service";
import {ETProject} from "../../models/project.model";
import {Observable} from "rxjs/Observable";
import * as path from "path";
import {FontType} from "../../models/font-type.enum";
import {ETConstants} from "../../util/constants";
import * as fs from "fs-extra";
import {FontTable} from "../../models/font-table.enum";

@Injectable()
export class EmojiService {

    constructor(private fontToolsService: FontToolsService) {
    }

    /**
     * Determines the FontType for the font file at the given path.
     * @param fontPath The path to the font file.
     * @returns A Promise that gives the FontType, or rejects if the font is not of a known type (or is corrupted/invalid).
     */
    public determineFontType(fontPath: string): Promise<FontType> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(fontPath)) {
                reject("Font file not found.");
                return;
            }

            this.fontToolsService.getFontTableNames(fontPath)
                .then(tableNames => {
                    // Apple fonts include an sbix table for glyphs.
                    if (tableNames.includes("sbix")) {
                        resolve(FontType.APPLE);
                    }
                    // Google (Android) fonts include CBLC and CBDT tables for glyphs.
                    else if (tableNames.includes("CBLC") && tableNames.includes("CBDT")) {
                        resolve(FontType.ANDROID);
                    }
                    // Unrecognized font.
                    else {
                        reject("This font is unrecognized.");
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    /**
     * Extracts the emojis from the project's font file.
     * @param project The project.
     * @returns An Observable that returns, periodically, the percentage completion (0 to 100), or an error if something goes wrong.
     */
    public extractEmojis(project: ETProject): Observable<number> {
        return Observable.create(listener => {
            if (!fs.existsSync(project.fontPath)) {
                listener.error("The font file could not be found.");
                return;
            }

            // 0% Complete
            listener.next(0);

            // Path for the new ttx files.
            let ttxDirPath = path.join(project.dataPath, ETConstants.PROJECT_TTX_DIR_NAME);

            // Convert the font file to ttx.
            let conversionSubscription = this.fontToolsService.convertTTFtoTTX(project.fontPath, ttxDirPath)
                .subscribe(
                    progress => {
                        listener.next((progress / 100) * 50);
                    },
                    err => {
                        listener.error(err);
                    },
                    () => {
                        // 50% Complete
                        listener.next(50);

                        // Assign the ttx dir path to the project.
                        project.ttxDirPath = ttxDirPath;

                        try {
                            // Create a directory for extraction.
                            let extractionPath = path.join(project.dataPath, ETConstants.PROJECT_EMOJI_EXTRACTION_DIR_NAME);
                            fs.removeSync(extractionPath);
                            fs.ensureDirSync(extractionPath);

                            // Start extracting
                            if(project.fontType === FontType.ANDROID) {
                            }
                            let xmlParser = new DOMParser();


                            project.extractionPath = extractionPath;
                            // Complete
                            listener.next(100);
                            listener.complete();
                        } catch (err) {
                            project.ttxDirPath = null;
                            project.extractionPath = null;
                            listener.error(err);
                        }
                    }
                );

            return () => {
                conversionSubscription.unsubscribe();
            }
        });
    }

}