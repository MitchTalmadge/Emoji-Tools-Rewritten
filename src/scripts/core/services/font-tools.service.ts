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
import {Electron} from "../../util/electron";
import {Logger} from "../../util/logger";
import * as fs from "fs";
import {Subscription} from "rxjs/Subscription";
const child_process = require("child_process");

@Injectable()
export class FontToolsService {

    /**
     * Retrieves the names of the tables within the font file.
     * @param fontPath The path to the font file.
     * @returns A Promise that gives an array containing the table names.
     * The length of the array can be used to determine how many tables exist.
     */
    public getFontTableNames(fontPath: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(fontPath)) {
                reject("There is no file at the given path.");
                return;
            }

            // Info flag, input path
            FontToolsService.runFontTools(['-l', fontPath]).subscribe(
                message => {
                    Logger.logInfo(message, this);

                    // Regex to extract table names from output.
                    let searchPattern = new RegExp(/^\s+([^\s.]+)\s+0x/gm);
                    // The results of the search.
                    let tableSearch: RegExpExecArray;
                    // The array to store names into.
                    let tableNames: string[] = [];

                    // Search for names until the search returns null.
                    while((tableSearch = searchPattern.exec(message)) != null) {
                        // Append the found name.
                        tableNames.push(tableSearch[1]);
                    }

                    // Check if any names were found.
                    if (tableNames.length == 0) {
                        // No names found. Maybe output was wrong?
                        reject("Table information could not be found.");
                    } else {
                        // Names found.
                        resolve(tableNames);
                    }
                },
                err => {
                    reject(err);
                }
            );
        });
    }

    /**
     * Converts a TTF file to a TTX file.
     * @param ttfPath The path to the TTF.
     * @param ttxPath The path to store the TTX.
     * @returns An Observable that emits progress (0 through 100) or an error.
     */
    public convertTTFtoTTX(ttfPath: string, ttxPath: string): Observable<number> {
        return Observable.create(listener => {

            // The subscription that should be un-subscribed from upon cancellation.
            let subscription: Subscription;

            //Step 1: Figure out how many tables there are, so we can keep track of progress while converting.
            this.getFontTableNames(ttfPath)
                .then(tableNames => {
                    Logger.logInfo("Found " + tableNames.length + " tables.", this);

                    // Step 2: Convert, and update listener with progress.

                    // The number of tables that have been dumped to ttx file.
                    let dumpedTablesCount = 0;

                    // Output flag, output path, input path.
                    subscription = FontToolsService.runFontTools(['-o', ttxPath, ttfPath]).subscribe(
                        message => {
                            Logger.logInfo(message, this);
                            if (message.match(/^Dumping '.+' table/g) != null)
                                dumpedTablesCount++;
                            listener.next((dumpedTablesCount / tableNames.length) * 100);
                        },
                        err => {
                            Logger.logError(err, this);
                            listener.error("Conversion from TTF to TTX failed while converting tables.");
                        },
                        () => {
                            listener.next(100);
                            listener.complete();
                        }
                    );
                })
                .catch(err => {
                    listener.error("Conversion from TTF to TTX failed while reading table info.");
                    Logger.logError(err, this);
                });

            return () => {
                subscription.unsubscribe();
            }
        });
    }

    /**
     * Runs FontTools in an Observable.
     * @param args The arguments to pass into ttx.py.
     * @returns An Observable that emits messages from FontTools, or an error upon completion with a non-zero exit code.
     */
    private static runFontTools(args: string[]): Observable<string> {
        // Development and production use different paths to the python scripts.
        let cwd = Electron.isDevModeEnabled() ? 'build/prod/python' : 'resources/app/python';

        return Observable.create(listener => {
            Logger.logInfo("[FontToolsService] Starting Font Tools with command: python fontToolsRunner.py, args: [" + args + "]");
            // Run Python
            let child = child_process.spawn("python", ['fontToolsRunner.py', '-e', ...args], {cwd: cwd});
            // Configure stdout
            child.stdout.on('data', data => {
                listener.next(data.toString());
            });
            // Configure stderr
            // Python likes to log all messages (even info) on stderr.
            child.stderr.on('data', data => {
                // Check for error prefix
                if (data.toString().includes("ERROR: Unhandled exception")) {
                    // Error found. Tell the listener.
                    listener.error(data.toString());
                    // Kill the process
                    child.kill("SIGINT");
                    // Log failure.
                    Logger.logError("[FontToolsService] Font Tools failed due to an error.");
                    return;
                }

                listener.next(data.toString());
            });
            // Configure behavior when program finishes.
            child.on('close', exitCode => {
                if (exitCode != 0)
                    listener.error("Font Tools did not complete successfully. Exit code: " + exitCode);
                else
                    Logger.logInfo("[FontToolsService] Font Tools completed with exit code " + exitCode);
                listener.complete();
            });

            return () => {
                child.kill("SIGINT");
            };
        })
    }

}