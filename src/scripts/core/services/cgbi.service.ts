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
import {ETCgBIPNGChunks} from "../../models/cgbi/png-chunks.cgbi.model";
import {ETCgBIPNGChunk} from "../../models/cgbi/png-chunk.cgbi.model";
import {ETCgBIPNGChunkName} from "../../models/cgbi/png-chunk-name.cgbi.enum";

/**
 * Methods for working with CgBI images, commonly found in iOS Emoji fonts.
 */
@Injectable()
export class CgBIService {

    /**
     * A Buffer that contains the 8 byte header that should be present on all PNG files.
     */
    private static readonly PNG_HEADER_BUFFER = new Buffer([137, 80, 78, 71, 13, 10, 26, 10]);

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
                    Logger.logError("Found a non-png file while converting. Skipping.", this);
                    return convertFileAtIndex(index + 1);
                }

                // Read the Chunks.
                CgBIService.readChunksFromPNG(path.join(imagesPath, fileName))
                    .then(chunks => {
                        Logger.logInfo("Chunks for " + fileName + ": " + JSON.stringify(chunks), CgBIService);

                        // Update progress
                        listener.next(((index / fileNames.length) * 100) | 0);

                        // Convert next file.
                        return convertFileAtIndex(index + 1);
                    })
                    .catch(err => {
                        Logger.logError("Could not convert CgBI to RGBA; problem while reading Chunks: " + err, CgBIService);
                        listener.error("Could not read PNG Chunks.");

                        return false;
                    });

            })(0); // Start with index 0, first file.
        });
    }

    /**
     * Reads the Chunks from a PNG file.
     * @param pngFilePath The path to the PNG.
     * @returns A Promise that gives the Chunks.
     */
    private static readChunksFromPNG(pngFilePath: string): Promise<ETCgBIPNGChunks> {
        return new Promise<ETCgBIPNGChunks>((resolve, reject) => {
                // File descriptor
                let fd: number;

                try {
                    fd = fs.openSync(pngFilePath, 'r');
                    // The current position within the file.
                    let currentPosition = 0;

                    let chunks: ETCgBIPNGChunks = {};

                    // ---- HEADER ---- //
                    try {
                        let headerBuffer = new Buffer(8);
                        fs.readSync(fd, headerBuffer, 0, headerBuffer.length, currentPosition);
                        currentPosition += headerBuffer.length;

                        // Compare header to expected.
                        if (headerBuffer.compare(CgBIService.PNG_HEADER_BUFFER) != 0) {
                            Logger.logError("The provided file is not a valid PNG file; header does not match.", this);
                            reject("Invalid PNG file.");
                            return;
                        }
                    } catch (errHeader) {
                        Logger.logError("Could not read PNG file header: " + errHeader, this);
                        reject("Could not read PNG file header.");
                        return;
                    }

                    // Read chunks
                    let currentChunk: ETCgBIPNGChunk;
                    do {
                        currentChunk = {};
                        try {
                            // ---- DATA LENGTH ---- //
                            let chunkLengthBuffer = new Buffer(4);
                            fs.readSync(fd, chunkLengthBuffer, 0, chunkLengthBuffer.length, currentPosition);
                            let dataLength = chunkLengthBuffer.readUInt32BE(0);
                            currentPosition += chunkLengthBuffer.length;

                            // ---- NAME ---- //
                            let chunkNameBuffer = new Buffer(4);
                            fs.readSync(fd, chunkNameBuffer, 0, chunkNameBuffer.length, currentPosition);
                            currentPosition += chunkNameBuffer.length;

                            // Assign the name.
                            let chunkName = chunkNameBuffer.toString("ASCII");
                            currentChunk.name = ETCgBIPNGChunkName[chunkName];

                            // Check if the name is known.
                            if (currentChunk.name == null) {
                                Logger.logError("Found a Chunk with an un-recognized name: " + chunkName, this);
                                reject("Un-recognized Chunk found.");
                                return;
                            }

                            // ---- DATA ---- //
                            let chunkDataBuffer = new Buffer(dataLength);
                            fs.readSync(fd, chunkDataBuffer, 0, chunkDataBuffer.length, currentPosition);
                            currentPosition += chunkDataBuffer.length;

                            // Assign the data
                            currentChunk.data = new Uint8Array(chunkDataBuffer);

                            // ---- CRC ---- //
                            let chunkCRCBuffer = new Buffer(4);
                            fs.readSync(fd, chunkCRCBuffer, 0, chunkCRCBuffer.length, currentPosition);
                            currentPosition += chunkCRCBuffer.length;

                            // Assign the CRC
                            currentChunk.crc = new Uint8Array(chunkCRCBuffer);

                            // ---- CLEAN UP ---- //

                            // Put the chunk into the map.
                            chunks[chunkName] = currentChunk;
                        } catch (errChunk) {
                            Logger.logError("Could not read a Chunk: " + errChunk, this);
                            reject("Could not read a Chunk.");
                            return;
                        }
                    } while (currentChunk.name != ETCgBIPNGChunkName.IEND); // Stop once we have read the end chunk.


                    resolve(chunks);
                } catch (err) {
                    Logger.logError("Could not open PNG file for reading: " + err, this);
                    reject("Could not open PNG file.");
                    return;
                } finally {
                    if (fd) {
                        fs.close(fd, err => {
                            if (err) {
                                Logger.logError("Could not close PNG file: " + err, this);
                            }
                        });
                    }
                }
            }
        );
    }

}