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
import {Subscription} from "rxjs/Subscription";
import * as path from "path";
import {ETConstants} from "../../util/constants";
import {ETFontTable} from "../../models/tables/font-table.enum";
import {ETFontType} from "../../models/font-type.enum";
const child_process = require("child_process");
const fs = require("fs-extra");

@Injectable()
export class FontToolsService {

    private static readonly TTX_FILE_NAME = "font.ttx";

    /**
     * Determines the FontType for the font file at the given path.
     * @param fontPath The path to the font file.
     * @returns A Promise that gives the FontType, or rejects if the font is not of a known type (or is corrupted/invalid).
     */
    public determineFontType(fontPath: string): Promise<ETFontType> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(fontPath)) {
                reject("Font file not found.");
                return;
            }

            this.getFontTableNames(fontPath)
                .then(tableNames => {
                    // Apple fonts include an sbix table for glyphs.
                    if (tableNames.includes("sbix")) {
                        resolve(ETFontType.APPLE);
                    }
                    // Google (Android) fonts include CBLC and CBDT tables for glyphs.
                    else if (tableNames.includes("CBLC") && tableNames.includes("CBDT")) {
                        resolve(ETFontType.ANDROID);
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
                    while ((tableSearch = searchPattern.exec(message)) != null) {
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
     * Gets the ttx file path for the given table.
     * @param table The table to get the path for.
     * @param ttxDirPath The path to the ttx directory containing the ttx files.
     * @returns A Promise that gives the path to the ttx file being sought, or rejects if it could not be found.
     */
    public getTTXPathForTable(table: ETFontTable, ttxDirPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let ttxFilePath = path.join(ttxDirPath, ETConstants.PROJECT_TTX_FILE_NAME);

            if (!fs.existsSync(ttxFilePath)) {
                reject("The TTX file is missing.");
                return;
            }

            let tablePath: string;

            try {
                // Parse the main ttx file
                let xmlParser = new DOMParser();
                let ttxContents = fs.readFileSync(ttxFilePath, 'utf8');
                let ttxDoc = xmlParser.parseFromString(ttxContents, "text/xml");

                // Find the table's entry
                let tableElement = ttxDoc.getElementsByTagName(ETFontTable[table]);
                // There should be only one
                if (tableElement.length == 1) {
                    tablePath = path.join(ttxDirPath, tableElement[0].attributes.getNamedItem('src').value);
                }
            } catch (err) {
                reject(err);
                return;
            }

            if (tablePath == null) {
                reject("The table was not found.");
            } else {
                resolve(tablePath);
            }
        });
    }

    /**
     * Converts a TTF file to a TTX file.
     * @param ttfPath The path to the TTF file.
     * @param ttxPath The path to a directory to store the TTX files in.
     * @returns An Observable that emits progress (0 through 100) or an error.
     */
    public convertTTFtoTTX(ttfPath: string, ttxPath: string): Observable<number> {
        return Observable.create(listener => {

            // Create ttxDirPath.
            fs.ensureDirSync(ttxPath);

            // The subscription that should be un-subscribed from upon cancellation.
            let subscription: Subscription;

            //Step 1: Figure out how many tables there are, so we can keep track of progress while converting.
            this.getFontTableNames(ttfPath)
                .then(tableNames => {
                    // Step 2: Convert, and update listener with progress.
                    Logger.logInfo("Found " + tableNames.length + " tables.", this);

                    // The number of tables that have been dumped to ttx file.
                    let dumpedTablesCount = 0;

                    // Force overwrite flag, split flag, output flag, output path, input path.
                    subscription = FontToolsService.runFontTools(['-f', '-s', '-o', path.join(ttxPath, ETConstants.PROJECT_TTX_FILE_NAME), ttfPath]).subscribe(
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
            Logger.logInfo("Starting Font Tools with command: python fontToolsRunner.py, args: [" + args + "]", this);
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
                    Logger.logError("Font Tools failed due to an error.", this);
                    return;
                }

                listener.next(data.toString());
            });
            // Configure behavior when program finishes.
            child.on('close', exitCode => {
                if (exitCode != 0)
                    listener.error("Font Tools did not complete successfully. Exit code: " + exitCode);
                else
                    Logger.logInfo("Font Tools completed with exit code " + exitCode, this);
                listener.complete();
            });

            return () => {
                child.kill("SIGINT");
            };
        })
    }

    /**
     * Determines if python is available (installed and on the PATH).
     * @returns A Promise that returns a boolean, true if python is available.
     */
    public isPythonAvailable(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // Try to run python.
            let child = child_process.spawn("python", ['--version']);

            // If there's an error, python probably isn't available.
            child.on('error', (err) => {
                // Couldn't run python.
                Logger.logError("Python is not available! " + err, this);
                resolve(false);
            });

            // On close, check the exit code. 0 means it worked fine.
            child.on('close', (exitCode) => {
                resolve(exitCode == 0);
            });
        });
    }

}