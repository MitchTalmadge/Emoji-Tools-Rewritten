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
import * as fs from "fs-extra";
import {Logger} from "../../util/logger";
import * as path from "path";
import {PNGService} from "./png.service";

/**
 * Methods for working with CgBI images, commonly found in iOS Emoji fonts.
 */
@Injectable()
export class CgBIService {

    /**
     * Converts CgBI-format PNG images to RGBA.
     * @param imagesPath The path to the directory containing the images to convert.
     * @returns An Observable that reports progress from 0 to 100.
     */
    public static convertCgBIToRGBA(imagesPath: string): Observable<number> {
        return Observable.create(listener => {
            let fileNames = fs.readdirSync(imagesPath);

            /**
             * Converts each individual file one at a time, recursively (and therefore, serially).
             * @returns True if everything was successful, false if there was an error.
             */
            (function convertFileAtIndex(index: number): boolean {
                // Base case.
                if (index == fileNames.length) {
                    listener.next(100);
                    listener.complete();
                }

                let fileName = fileNames[index];

                // Check the file extension
                if (!fileName.endsWith(".png")) {
                    Logger.logInfo("Found a non-png file while converting. Skipping.", this);
                    return convertFileAtIndex(index + 1);
                }

                // Read the Chunks.
                PNGService.readChunksFromPNG(path.join(imagesPath, fileName))
                    .then(chunks => {
                        // Make sure this is really CgBI (by looking for a CgBI chunk)
                        let CgBIChunkIndex = -1;
                        if (chunks.filter((chunk, index) => {
                                if (chunk.name === 'CgBI') {
                                    CgBIChunkIndex = index;
                                    return true;
                                }
                            }).length != 1) {
                            Logger.logInfo("Found a non-CgBI image while converting. Skipping...", this);
                            return convertFileAtIndex(index + 1);
                        }

                        // Swap pixels in data chunks
                        chunks.filter(chunk => chunk.name === 'IDAT').forEach(dataChunk => {
                            for (let i = 0; i < dataChunk.data.length; i += 4) {
                                let temp = dataChunk.data[i];
                                dataChunk.data[i] = dataChunk.data[i + 2];
                                dataChunk.data[i + 2] = temp;
                            }
                        });

                        // Delete CgBI Chunk
                        delete chunks[CgBIChunkIndex];

                        PNGService.writeChunksToPNG(path.join(imagesPath, fileName), chunks)
                            .then(() => {
                                // Update progress
                                listener.next(((index / fileNames.length) * 100) | 0);

                                return convertFileAtIndex(index + 1);
                            })
                            .catch(err => {
                                Logger.logError("Could not convert PNG from CgBI; failed while saving chunks: " + err, this);
                                listener.error("Failed to save a PNG file after CgBI conversion.");

                                return false;
                            })
                    })
                    .catch(err => {
                        Logger.logError("Could not convert CgBI to RGBA; problem while reading Chunks: " + err, CgBIService);
                        listener.error("Could not read PNG Chunks.");

                        return false;
                    });

            })(0); // Start with index 0, first file.
        });
    }


}