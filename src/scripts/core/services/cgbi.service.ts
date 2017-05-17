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
import {ETPNGChunk} from "../../models/png/chunk.png.model";
import * as pako from "pako";

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

                        // The details about the PNG file.
                        let details = PNGService.getDetailsFromChunks(chunks);

                        // A new chunk to hold the combined IDAT data from all IDAT Chunks.
                        let combinedIDATChunk: ETPNGChunk = {
                            name: 'IDAT',
                            data: new Buffer(0)
                        };

                        // Combine IDAT Chunks
                        let seenFirstIDAT = false;
                        chunks.forEach((chunk, index, array) => {
                            if (chunk.name === 'IDAT') {
                                combinedIDATChunk.data = Buffer.concat([combinedIDATChunk.data, chunk.data]);

                                // Check if this is the first IDAT Chunk encountered.
                                if (!seenFirstIDAT) {
                                    // Since it is the first, put the new IDAT here after removing this Chunk.
                                    array.splice(index, 1, combinedIDATChunk);
                                    seenFirstIDAT = true;
                                } else {
                                    // Not the first, so just remove this Chunk.
                                    array.splice(index, 1);
                                }
                            }
                        });

                        // Inflate (Uncompress) IDAT Chunk
                        let rawData = pako.inflateRaw(new Uint8Array(combinedIDATChunk.data));

                        // Swap pixels in combined IDAT Chunk. (CgBI -> RGBA)
                        let i = 0;
                        for (let y = 0; y < details.height; y++) {
                            // Read one byte to skip over the filter type byte.
                            i++;
                            for (let x = 0; x < details.width; x++) {
                                // Swap pixels 0 and 2.
                                let temp = rawData[i];
                                rawData[i] = rawData[i + 2];
                                rawData[i + 2] = temp;

                                // 4 Bytes per x value.
                                i += 4;
                            }
                        }

                        // Deflate (Compress) IDAT Chunk
                        combinedIDATChunk.data = new Buffer(pako.deflate(rawData));

                        // Delete CgBI Chunk
                        delete chunks[CgBIChunkIndex];

                        // Write modified Chunks.
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