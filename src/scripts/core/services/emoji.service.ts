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
const fs = require("fs-extra");

@Injectable()
export class EmojiService {

    constructor(private fontToolsService: FontToolsService) {
    }

    /**
     * Extracts the emojis from the project's font file.
     * @param project The project.
     * @returns An Observable that returns, periodically, the percentage completion (0 to 100), or an error if something goes wrong.
     */
    extractEmojis(project: ETProject): Observable<number> {
        return Observable.create(listener => {
            // 0% Complete
            listener.next(0);

            // Create a path for the new ttx file.
            let ttxPath = path.join(project.dataPath, "font.ttx");

            // Convert the font file to ttx.
            this.fontToolsService.convertTTFtoTTX(project.fontPath, ttxPath)
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

                        // Assign the ttx path to the project.
                        project.ttxPath = ttxPath;

                        try {
                            // Create a directory for extraction.
                            let extractionPath = path.join(project.dataPath, "extraction");
                            if (fs.existsSync(extractionPath))
                                fs.rmdirSync(extractionPath);
                            fs.mkdirSync(extractionPath);

                            // TODO: Extraction

                            project.extractionPath = extractionPath;
                            // Complete
                            listener.next(100);
                            listener.complete();
                        } catch (err) {
                            listener.error(err);
                        }
                    }
                );
        });
    }

}