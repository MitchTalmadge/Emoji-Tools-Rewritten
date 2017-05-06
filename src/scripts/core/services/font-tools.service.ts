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
import {Observable} from "rxjs/Observable";
import {ElectronInfo} from "../../util/electron-info";
import {Logger} from "../../util/logger";
const child_process = require("child_process");

@Injectable()
export class FontToolsService {

    constructor() {

    }

    /**
     * Converts a TTF file to a TTX file.
     * @param ttfPath The path to the TTF.
     * @param ttxPath The path to store the TTX.
     * @returns An Observable that emits progress (0 through 100) or an error.
     */
    convertTTFtoTTX(ttfPath: string, ttxPath: string): Observable<number> {
        return Observable.create(listener => {
            //Step 1: Figure out how many tables there are, so we can keep track of progress while converting.
            let tablesCount = 0;

            // Info flag, input path
            FontToolsService.runFontTools(['-l', ttfPath]).subscribe(
                message => {
                    Logger.logInfo("[TTF to TTX] " + message);
                    let tableSearch = message.match(new RegExp(/^\s+([^\s.]+)\s+0x/gm));
                    if (tableSearch == null)
                        listener.error("Conversion from TTF to TTX failed while parsing Font Tools table info.");
                    tablesCount = tableSearch.length;
                },
                err => {
                    Logger.logError("[TTF to TTX] " + err);
                    listener.error("Conversion from TTF to TTX failed while counting tables.");
                },
                () => {
                    Logger.logInfo("[TTF to TTX] Found " + tablesCount + " tables.");

                    // Step 2: Convert, and update listener with progress.

                    // The number of tables that have been dumped to ttx file.
                    let dumpedTablesCount = 0;

                    // Output flag, output path, input path.
                    FontToolsService.runFontTools(['-o', ttxPath, ttfPath]).subscribe(
                        message => {
                            Logger.logInfo("[TTF to TTX] " + message);
                            if (message.match(/^Dumping '.+' table/g) != null)
                                dumpedTablesCount++;
                            listener.next((dumpedTablesCount / tablesCount) * 100);
                        },
                        err => {
                            Logger.logError("[TTF to TTX] " + err);
                            listener.error("Conversion from TTF to TTX failed while converting tables.");
                        },
                        () => {
                            listener.next(100);
                            listener.complete();
                        }
                    );
                }
            )


        });
    }

    /**
     * Runs FontTools in an Observable.
     * @param args The arguments to pass into ttx.py.
     * @returns An Observable that emits messages from FontTools, or an error upon completion with a non-zero exit code.
     */
    private static runFontTools(args: string[]): Observable<string> {
        // Development and production use different paths to the python scripts.
        let cwd = ElectronInfo.isDevModeEnabled() ? 'build/prod/python' : 'resources/app/python';

        return Observable.create(listener => {
            let child = child_process.spawn("python", ['fontToolsRunner.py', ...args], {cwd: cwd});
            child.stdout.on('data', data => {
                listener.next(data.toString());
            });
            // FIXME: For some reason, FontTools outputs on stderr instead of stdout sometimes. Investigation needed.
            child.stderr.on('data', data => {
                listener.next(data.toString());
            });
            child.on('close', exitCode => {
                if (exitCode != 0)
                    listener.error("Font Tools did not complete successfully. Exit code: " + exitCode);
                else
                    Logger.logInfo("[FontToolsService] Font Tools completed with exit code " + exitCode);
                listener.complete();
            });
        })
    }

}